import { config } from '../config/env.js';

export type OAuthProvider = 'google' | 'github';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name: string;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'github';
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  return provider === 'google'
    ? Boolean(config.googleClientId && config.googleClientSecret)
    : Boolean(config.githubClientId && config.githubClientSecret);
}

function providerCredentials(provider: OAuthProvider) {
  return provider === 'google'
    ? { clientId: config.googleClientId, clientSecret: config.googleClientSecret }
    : { clientId: config.githubClientId, clientSecret: config.githubClientSecret };
}

export function callbackUrl(provider: OAuthProvider): string {
  return `${config.apiPublicUrl}/api/auth/oauth/${provider}/callback`;
}

export function buildAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge: string,
): string {
  const { clientId } = providerCredentials(provider);
  const redirectUri = callbackUrl(provider);

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('OAuth provider returned an invalid response.');
  }
  if (!response.ok || typeof payload !== 'object' || payload === null) {
    throw new Error(`OAuth provider returned HTTP ${response.status}.`);
  }
  return payload as Record<string, unknown>;
}

export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<string> {
  const { clientId, clientSecret } = providerCredentials(provider);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl(provider),
    grant_type: 'authorization_code',
  });
  if (provider === 'google') body.set('code_verifier', codeVerifier);

  const response = await fetch(
    provider === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'WeatherWise',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(9_000),
    },
  );

  const payload = await parseJson(response);
  if (typeof payload.access_token !== 'string' || payload.access_token.length === 0) {
    throw new Error('OAuth provider did not return an access token.');
  }
  return payload.access_token;
}

export async function fetchOAuthProfile(
  provider: OAuthProvider,
  accessToken: string,
): Promise<OAuthProfile> {
  if (provider === 'google') {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'WeatherWise' },
      signal: AbortSignal.timeout(9_000),
    });
    const profile = await parseJson(response);
    if (
      profile.email_verified !== true ||
      typeof profile.sub !== 'string' ||
      typeof profile.email !== 'string'
    ) {
      throw new Error('Google account has no verified email address.');
    }
    return {
      provider,
      providerId: profile.sub,
      email: profile.email.toLowerCase(),
      name:
        typeof profile.name === 'string' && profile.name.trim().length >= 2
          ? profile.name.trim().slice(0, 80)
          : 'WeatherWise User',
    };
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'WeatherWise',
  };
  const [userResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers, signal: AbortSignal.timeout(9_000) }),
    fetch('https://api.github.com/user/emails', { headers, signal: AbortSignal.timeout(9_000) }),
  ]);
  const user = await parseJson(userResponse);
  const emails = await parseJson(emailsResponse);

  if (typeof user.id !== 'number' && typeof user.id !== 'string') {
    throw new Error('GitHub account has no stable id.');
  }

  const emailList = Array.isArray(emails) ? emails : [];
  const verified = emailList.filter(
    (entry): entry is { email: string; primary?: boolean; verified?: boolean } =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { email?: unknown }).email === 'string' &&
      (entry as { verified?: unknown }).verified === true,
  );
  const chosen = verified.find((entry) => entry.primary === true) ?? verified[0];
  if (!chosen) throw new Error('GitHub account has no verified email address.');

  const login = typeof user.login === 'string' ? user.login : '';
  const name =
    typeof user.name === 'string' && user.name.trim().length >= 2
      ? user.name.trim().slice(0, 80)
      : login.slice(0, 80) || 'WeatherWise User';

  return {
    provider,
    providerId: String(user.id),
    email: chosen.email.toLowerCase(),
    name,
  };
}
