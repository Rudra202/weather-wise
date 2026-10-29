/**
 * End-to-end API smoke test. This runs against a disposable in-memory MongoDB
 * instance, so it never touches your Atlas data or requires credentials.
 *
 * Run with: npm run test:integration -w server
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Server } from 'node:http';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret-not-for-production';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.PORT = '0';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.MAIL_FROM = '';
process.env.GOOGLE_CLIENT_ID = '';
process.env.GOOGLE_CLIENT_SECRET = '';
process.env.GITHUB_CLIENT_ID = '';
process.env.GITHUB_CLIENT_SECRET = '';

const failures: string[] = [];
let passed = 0;

function check(name: string, condition: boolean, details = ''): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${details ? ` — ${details}` : ''}`);
    console.error(`  FAIL  ${name}${details ? ` — ${details}` : ''}`);
  }
}

interface ApiResult {
  status: number;
  body: Record<string, unknown>;
  setCookie: string[];
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60_000 },
  });
  process.env.MONGODB_URI = mongo.getUri();

  const { connectToDatabase, disconnectFromDatabase } = await import('../src/config/db.js');
  const { app } = await import('../src/app.js');
  const { User } = await import('../src/models/User.js');

  const connected = await connectToDatabase();
  if (!connected) throw new Error('Test database failed to connect.');

  let server: Server | undefined;
  let cookie = '';

  try {
    server = app.listen(0);
    await new Promise<void>((resolve) => server?.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Could not determine test port.');
    const base = `http://127.0.0.1:${address.port}/api`;

    const request = async (
      path: string,
      options: {
        method?: string;
        body?: unknown;
        origin?: string;
        withCookie?: boolean;
      } = {},
    ): Promise<ApiResult> => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (options.body !== undefined) headers['Content-Type'] = 'application/json';
      if (options.origin) headers.Origin = options.origin;
      if (options.withCookie !== false && cookie) headers.Cookie = cookie;

      const response = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const setCookie = response.headers.getSetCookie();
      const sessionCookie = setCookie.find((value) => value.startsWith('ww_token='));
      if (sessionCookie) {
        if (/Max-Age=0/i.test(sessionCookie)) {
          cookie = '';
        } else {
          cookie = sessionCookie.split(';')[0] ?? '';
        }
      }

      let body: Record<string, unknown> = {};
      try {
        body = (await response.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { status: response.status, body, setCookie };
    };

    console.log('\nPublic weather');
    const health = await request('/health');
    check('GET /api/health returns 200', health.status === 200);
    check(
      'health reports database connected',
      (health.body.data as { database?: string } | undefined)?.database === 'connected',
    );

    const badSearch = await request('/weather/search');
    check('search without query returns 400', badSearch.status === 400);

    const search = await request('/weather/search?q=Delhi');
    const locations = (search.body.data as { locations?: Array<{ latitude: number }> } | undefined)
      ?.locations;
    check('search returns 200', search.status === 200);
    check('search returns location results', Array.isArray(locations) && locations.length > 0);

    const localitySearch = await request('/weather/search?q=Nihal%20Vihar');
    const localityLocations = (
      localitySearch.body.data as { locations?: Array<{ name?: string }> } | undefined
    )?.locations;
    check(
      'search covers small localities',
      localityLocations?.some(
        (location) => typeof location.name === 'string' && /nihal vihar/i.test(location.name),
      ) === true,
    );

    const neighbourhoodSearch = await request('/weather/search?q=Mayur%20Vihar');
    const neighbourhoodLocations = (
      neighbourhoodSearch.body.data as { locations?: unknown[] } | undefined
    )?.locations;
    check(
      'search returns multiple neighbourhood matches',
      Array.isArray(neighbourhoodLocations) && neighbourhoodLocations.length >= 3,
    );

    const badWeather = await request('/weather?lat=999&lon=77');
    check('weather rejects invalid latitude', badWeather.status === 400);

    const forecast = await request('/weather?lat=28.6139&lon=77.209&name=Delhi&country=India');
    const forecastData = forecast.body.data as
      | {
          current?: { temperature?: number | null; condition?: string };
          daily?: Array<{
            hourly?: unknown[];
            precipitationSum?: number | null;
            windSpeedMax?: number | null;
            uvIndexMax?: number | null;
          }>;
          hourly?: unknown[];
          location?: { timezone?: string };
        }
      | undefined;
    check('forecast returns 200', forecast.status === 200);
    check('forecast has current temperature', typeof forecastData?.current?.temperature === 'number');
    check('forecast has a condition label', typeof forecastData?.current?.condition === 'string');
    check('forecast has 7 daily items', forecastData?.daily?.length === 7);
    check('forecast has 24 hourly items', forecastData?.hourly?.length === 24);
    check(
      'each daily item has 24 hourly entries',
      forecastData?.daily?.every((day) => day.hourly?.length === 24) === true,
    );
    check(
      'daily items include rain, wind, and UV metrics',
      typeof forecastData?.daily?.[0]?.precipitationSum === 'number' &&
        typeof forecastData?.daily?.[0]?.windSpeedMax === 'number' &&
        typeof forecastData?.daily?.[0]?.uvIndexMax === 'number',
    );
    check('forecast has a timezone', typeof forecastData?.location?.timezone === 'string');

    console.log('\nAuthentication');
    const shortPassword = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Alice', email: 'alice@example.com', password: 'short' },
    });
    check('short password rejected with 400', shortPassword.status === 400);

    const register = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Alice Example', email: 'Alice@Example.com', password: 'Password123' },
    });
    const registerUser = (register.body.data as { user?: { email?: string; id?: string } } | undefined)
      ?.user;
    check('registration returns 201', register.status === 201);
    check('email is normalized to lowercase', registerUser?.email === 'alice@example.com');
    check('registration sets an auth cookie', cookie.startsWith('ww_token='));
    check(
      'passwordHash is not exposed',
      !JSON.stringify(register.body).toLowerCase().includes('passwordhash'),
    );
    const aliceCookie = cookie;
    const aliceId = registerUser?.id;

    const storedUser = await User.findOne({ email: 'alice@example.com' }).select('+passwordHash');
    check('password is stored as a bcrypt hash', Boolean(storedUser?.passwordHash.startsWith('$2')));
    check('stored hash differs from plaintext', storedUser?.passwordHash !== 'Password123');

    const duplicate = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Alice Two', email: 'alice@example.com', password: 'Password123' },
    });
    check('duplicate email returns 409', duplicate.status === 409);

    const wrongPassword = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.com', password: 'WrongPassword1' },
    });
    check('invalid credentials return 401', wrongPassword.status === 401);
    check(
      'invalid login does not reveal account existence',
      (wrongPassword.body.error as { message?: string } | undefined)?.message ===
        'Invalid email or password.',
    );

    const badOrigin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.com', password: 'Password123' },
      origin: 'https://evil.example',
    });
    check('cross-origin login is blocked', badOrigin.status === 403);

    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alice@example.com', password: 'Password123' },
    });
    check('valid login returns 200', login.status === 200);
    check('login rotates the session cookie', cookie.startsWith('ww_token='));

    const me = await request('/auth/me');
    check('GET /auth/me returns the current user', me.status === 200);
    check(
      'current user id matches registration',
      (me.body.data as { user?: { id?: string } } | undefined)?.user?.id === aliceId,
    );

    const unauthorizedMe = await request('/auth/me', { withCookie: false });
    check('GET /auth/me without cookie returns 401', unauthorizedMe.status === 401);

    console.log('\nPassword reset');
    const resetEmail = 'reset.user@example.com';
    await User.create({
      name: 'Reset User',
      email: resetEmail,
      passwordHash: await (async () => {
        const bcrypt = await import('bcryptjs');
        return bcrypt.hash('OldPassword1', 12);
      })(),
    });

    const forgot = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: resetEmail },
      withCookie: false,
    });
    const forgotData = forgot.body.data as
      | { message?: string; devResetUrl?: string }
      | undefined;
    check('forgot password returns 200', forgot.status === 200);
    check(
      'forgot password returns a development reset link when SMTP is not configured',
      typeof forgotData?.devResetUrl === 'string' &&
        forgotData.devResetUrl.includes('token='),
    );

    const resetToken = new URL(
      forgotData?.devResetUrl ?? 'http://localhost/reset-password?token=x',
    ).searchParams.get('token') as string;
    const reset = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: 'NewPassword1' },
      withCookie: false,
    });
    check('reset password returns 200', reset.status === 200);
    check('reset password sets a session cookie', cookie.startsWith('ww_token='));

    const resetMe = await request('/auth/me');
    check(
      'reset password logs the user in',
      (resetMe.body.data as { user?: { email?: string } } | undefined)?.user?.email ===
        resetEmail,
    );

    const oldLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: resetEmail, password: 'OldPassword1' },
      withCookie: false,
    });
    check('old password no longer works', oldLogin.status === 401);

    const newLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: resetEmail, password: 'NewPassword1' },
      withCookie: false,
    });
    check('new password works', newLogin.status === 200);

    const resetReuse = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: 'AnotherPassword1' },
      withCookie: false,
    });
    check('reset token cannot be reused', resetReuse.status === 400);

    const unknownReset = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: 'nobody@example.com' },
      withCookie: false,
    });
    check(
      'forgot password does not reveal whether an account exists',
      unknownReset.status === 200 &&
        (unknownReset.body.data as { message?: string } | undefined)?.message ===
          forgotData?.message,
    );

    cookie = aliceCookie;

    const missingOAuth = await request('/auth/oauth/google', { withCookie: false });
    check('unconfigured OAuth provider returns 503', missingOAuth.status === 503);
    const badOAuthProvider = await request('/auth/oauth/facebook', { withCookie: false });
    check('unknown OAuth provider is rejected', badOAuthProvider.status === 400);
    const providers = await request('/auth/oauth/providers', { withCookie: false });
    const providersData = providers.body.data as
      | { google?: boolean; github?: boolean }
      | undefined;
    check(
      'OAuth availability reports unconfigured providers',
      providers.status === 200 && providersData?.google === false && providersData?.github === false,
    );

    cookie = aliceCookie;

    console.log('\nFavorites and authorization');
    const emptyFavorites = await request('/favorites');
    check('new user has no favorites', emptyFavorites.status === 200);
    check(
      'favorites list is empty',
      (emptyFavorites.body.data as { favorites?: unknown[] } | undefined)?.favorites?.length === 0,
    );

    const createFirst = await request('/favorites', {
      method: 'POST',
      body: {
        name: 'Delhi',
        country: 'India',
        admin1: 'Delhi',
        countryCode: 'IN',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 'Asia/Kolkata',
      },
    });
    const firstFavoriteId = (
      createFirst.body.data as { favorite?: { id?: string } } | undefined
    )?.favorite?.id;
    check('favorite creation returns 201', createFirst.status === 201);
    check('favorite has an id', typeof firstFavoriteId === 'string');

    const duplicateFavorite = await request('/favorites', {
      method: 'POST',
      body: { name: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
    });
    check('duplicate favorite returns 409', duplicateFavorite.status === 409);

    const invalidFavorite = await request('/favorites', {
      method: 'POST',
      body: { name: 'Nowhere', country: 'Nowhere', latitude: 500, longitude: 0 },
    });
    check('favorite coordinates are validated', invalidFavorite.status === 400);

    const createSecond = await request('/favorites', {
      method: 'POST',
      body: {
        name: 'Springfield',
        country: 'United States',
        admin1: 'Illinois',
        latitude: 39.80172,
        longitude: -89.64371,
      },
    });
    check('second favorite is created', createSecond.status === 201);

    await request('/auth/register', {
      method: 'POST',
      body: { name: 'Bob Example', email: 'bob@example.com', password: 'Password123' },
    });
    const bobCookie = cookie;
    check('second user registered', bobCookie.startsWith('ww_token='));

    const bobFavorites = await request('/favorites');
    check(
      'second user cannot see first user favorites',
      (bobFavorites.body.data as { favorites?: unknown[] } | undefined)?.favorites?.length === 0,
    );

    const bobDelete = await request(`/favorites/${firstFavoriteId ?? 'missing'}`, {
      method: 'DELETE',
    });
    check('second user cannot delete another user favorite', bobDelete.status === 404);

    cookie = aliceCookie;
    const aliceFavorites = await request('/favorites');
    check(
      'first user still has both favorites',
      (aliceFavorites.body.data as { favorites?: unknown[] } | undefined)?.favorites?.length === 2,
    );

    const deleteFirst = await request(`/favorites/${firstFavoriteId ?? 'missing'}`, {
      method: 'DELETE',
    });
    check('owner can delete favorite', deleteFirst.status === 200);

    const deleteAgain = await request(`/favorites/${firstFavoriteId ?? 'missing'}`, {
      method: 'DELETE',
    });
    check('deleting a missing favorite returns 404', deleteAgain.status === 404);

    const unauthorizedFavorites = await request('/favorites', { withCookie: false });
    check('favorites require authentication', unauthorizedFavorites.status === 401);

    const logout = await request('/auth/logout', { method: 'POST' });
    check('logout returns 200', logout.status === 200);
    check(
      'logout clears the cookie',
      logout.setCookie.some(
        (value) =>
          value.startsWith('ww_token=') &&
          (/Max-Age=0/i.test(value) || /Expires=Thu, 01 Jan 1970/i.test(value)),
      ),
    );

    const meAfterLogout = await request('/auth/me');
    check('session is gone after logout', meAfterLogout.status === 401);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
    }
    await disconnectFromDatabase();
    await mongo.stop();
  }

  console.log(`\n${passed} checks passed, ${failures.length} failed.`);
  if (failures.length > 0) {
    console.error('\nFailures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error('Integration test crashed:', error);
  process.exitCode = 1;
});
