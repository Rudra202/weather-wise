# WeatherWise

WeatherWise is a full-stack, worldwide weather dashboard. It uses live [Open-Meteo](https://open-meteo.com/) forecast data and combines Open-Meteo, [Photon](https://photon.komoot.io/) (OpenStreetMap), and [Esri/ArcGIS](https://developers.arcgis.com/rest/geocode/) for place search, then adds optional MongoDB-backed accounts so users can save favorite locations.

The project is a TypeScript npm workspace with a React/Vite client and an Express API. Weather search is public. Accounts support email/password, Google, GitHub, and password reset by email, all backed by the same HttpOnly JWT session cookie.

## Demo

A screen recording of the running app is available locally at `preview/preview.mp4`. GitHub does not render local video files directly in a README, so to display it on the repo page upload the video to a **GitHub Release** (or YouTube/Loom) and replace the link below:

[▶ Watch the demo video](https://github.com/Rudra202/weather-wise/releases)

<!-- Once hosted, you can embed it with:
<video src="YOUR_VIDEO_URL" controls width="100%"></video>
-->

## What it does

- Search for cities, neighbourhoods, small localities, regions, and countries worldwide with debounced autocomplete.
- Show current temperature, feels-like temperature, humidity, wind, pressure, precipitation, condition, and weather icon.
- Show the next 24 hours and a 7-day forecast in the location's local time.
- Click any day in the 7-day forecast to open that day's detail: hour-by-hour conditions, high/low, rain chance and total, maximum wind, maximum UV, sunrise, and sunset.
- Toggle between Celsius and Fahrenheit without making a new weather request.
- Remember the last searched location and temperature unit in `localStorage`.
- Register or sign in with email and password, Google, GitHub, or a six-digit code sent by email.
- Restore a session and log out from any sign-in method.
- Save, list, and delete favorite locations, scoped to the signed-in user.
- Handle loading, empty, malformed, unauthorized, network, upstream, and database-unavailable states.
- Use a responsive dark UI with visible focus styles, reduced-motion support, combobox semantics, and labeled status/alert messages.

The application displays an explicit warning when Open-Meteo returns a country-level result. A country result is a country-center coordinate, not a countrywide forecast.

## Stack

| Layer | Technology |
| --- | --- |
| Client | React 19, TypeScript, Vite, React Router DOM, Tailwind CSS 4, Lucide React, Fetch API |
| Server | Node.js 20+, Express 5, TypeScript (ESM/NodeNext), Mongoose, dotenv, cors |
| Auth | bcryptjs, JSON Web Tokens, `cookie-parser`, HttpOnly cookie; Google and GitHub OAuth 2.0; `nodemailer` for password reset email |
| Weather | Open-Meteo Geocoding and Forecast APIs plus Photon (OpenStreetMap) and Esri/ArcGIS for small localities, server-side integration; ArcGIS key is optional |
| Database | MongoDB (MongoDB Atlas or a local MongoDB instance) |
| Tests | A custom 62-check API integration suite using `mongodb-memory-server` |

Additional server hardening uses `helmet`, `express-rate-limit`, request validation, and an Origin check for state-changing requests.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB for authentication and favorites (optional for public weather in development)
- Internet access for Open-Meteo, Photon, and ArcGIS

## Quick start

```bash
npm install
```

Create the server environment file:

```bash
copy server\.env.example server\.env
```

On macOS/Linux:

```bash
cp server/.env.example server/.env
```

Set `MONGODB_URI` and `JWT_SECRET` in `server/.env`. For a local MongoDB instance:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:5000
MONGODB_URI=mongodb://127.0.0.1:27017/weatherwise
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
# Optional; keyless works for low-volume use.
ARCGIS_API_KEY=
```

Google, GitHub, and email OTP are optional. Their variables and callback URLs are listed in [Environment variables](#environment-variables) and `server/.env.example`. Without SMTP credentials, development prints the OTP in the API console instead of sending email.

The client defaults to `http://localhost:5000/api`. To point it elsewhere, create `client/.env` from `client/.env.example`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Run both applications:

```bash
npm run dev
```

- Client: <http://localhost:5173>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

`npm run dev` uses `concurrently` to start the server and client together.

### Development without MongoDB

Public weather works without a database. The server logs a warning and keeps running; auth and favorites return `503 DATABASE_UNAVAILABLE`. This is deliberate for local development, not a production configuration.

Production startup is stricter: the server exits unless it can connect to MongoDB, `CLIENT_URL` is an `https://` URL, and `JWT_SECRET` is at least 32 characters long.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install workspace dependencies |
| `npm run dev` | Run API and client in development |
| `npm run dev:server` | Run only the API with `tsx watch` |
| `npm run dev:client` | Run only the Vite client |
| `npm run build` | Build the server and client |
| `npm run typecheck` | Type-check both workspaces |
| `npm start` | Start the compiled server from `server/dist` |
| `npm run preview -w client` | Preview the production client build |
| `npm run test:integration -w server` | Run the disposable-database API integration suite |

The integration test uses live Open-Meteo, Photon, and ArcGIS endpoints for its checks, so it needs network access. It does not use the database configured in `server/.env`.

## Environment variables

### Server

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | API listening port |
| `NODE_ENV` | No | `development` | `production` enables secure cookies, proxy trust, and fail-closed production config checks |
| `CLIENT_URL` | In production | `http://localhost:5173` in development | Allowed browser origin and CORS origin; must be `https://` in production |
| `API_PUBLIC_URL` | For OAuth | `http://localhost:5000` | Public API URL used to build OAuth callback URLs; must be `https://` in production when OAuth is enabled |
| `MONGODB_URI` | For auth/favorites; in production | empty | MongoDB connection string |
| `JWT_SECRET` | In production | development fallback | Secret used to sign and verify JWTs; at least 32 characters in production |
| `RESET_SECRET` | No | `JWT_SECRET` | Secret used to HMAC password reset tokens; use a separate 32+ character value in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | empty | Enable Google sign-in when both are set |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | No | empty | Enable GitHub sign-in when both are set |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | For email OTP in production | port `587`, otherwise empty | SMTP delivery for email OTP. Brevo uses `smtp-relay.brevo.com`. Development logs the code when these are empty |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime; must match the cookie's 7-day lifetime |
| `ARCGIS_API_KEY` | No | empty | Optional Esri/ArcGIS geocoding token; keyless requests work at low volume |

### Client

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL of the API |

Never commit `server/.env`. It is ignored by `.gitignore`; `.env.example` documents the expected values.

### OAuth and email setup

Create a Google OAuth client and a GitHub OAuth App, then add their IDs and secrets to `server/.env`. Register these callback URLs:

```text
Local Google: http://localhost:5000/api/auth/oauth/google/callback
Local GitHub: http://localhost:5000/api/auth/oauth/github/callback
Production Google: https://api.example.com/api/auth/oauth/google/callback
Production GitHub: https://api.example.com/api/auth/oauth/github/callback
```

Google uses the authorization-code flow with PKCE and requests only `openid email profile`. While the Google consent screen is in Testing mode, only added test users can sign in; publishing the app for basic scopes is free. GitHub requests `read:user user:email` and reads the primary verified email.

For email OTP, create a free Brevo account and use `smtp-relay.brevo.com`, port `587`, with the SMTP login and key from Brevo. Set `MAIL_FROM` to a verified sender. Brevo's free plan currently allows 300 emails/day (~9,000/month). A verified sending domain is required to reliably deliver to arbitrary recipients; without a domain, use the development console fallback or send only to a verified test address.

The server never returns an OTP in production. In development and tests, when SMTP is not configured, the code is printed in the API console and returned as `devCode` so the flow can be exercised without email credentials.

## Architecture

```text
WeatherWise/
├── client/
│   ├── public/
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/       Search, current weather, details, hourly, weekly, nav, states
│   │   ├── context/          AuthContext
│   │   ├── hooks/            useAuth, useWeather
│   │   ├── pages/            Home, Login, Register, Favorites, NotFound
│   │   ├── services/         Typed fetch wrapper and API services
│   │   ├── types/            Shared client-side contracts
│   │   ├── utils/            Formatting, temperature conversion, storage, WMO visuals
│   │   ├── App.tsx           Routes
│   │   └── main.tsx          AuthProvider and router setup
│   └── vite.config.ts
├── server/
│   ├── scripts/
│   │   └── integration-test.ts
│   ├── src/
│   │   ├── config/           Environment parsing and MongoDB connection
│   │   ├── controllers/      Auth, favorites, weather handlers
│   │   ├── middleware/       JWT auth, DB readiness, Origin guard, errors, rate limits
│   │   ├── models/           User and Favorite Mongoose models
│   │   ├── routes/           Auth, favorites, weather routers
│   │   ├── services/         Weather, Photon, and ArcGIS integration and normalization
│   │   ├── utils/            Cache, HTTP errors, validation, WMO conditions
│   │   ├── app.ts            Express application
│   │   └── server.ts         Startup, graceful shutdown
│   └── tsconfig.json
├── .gitignore
└── package.json
```

### Request flow

1. The client calls its own API, never a geocoder or weather provider directly. This keeps the provider integration, validation, caching, and error normalization on the server.
2. The server validates query/body input, checks rate limits, and calls Open-Meteo with a 9-second timeout. Search also calls Photon and ArcGIS with 4-second and 3.5-second timeouts.
3. Open-Meteo values are normalized into a stable contract: Celsius, km/h, hPa, mm, explicit nulls, and WMO condition labels. Search results from all three providers are normalized into one location shape.
4. The client converts Celsius to Fahrenheit only for display. No unit-specific weather request is made.
5. A single `useWeather` request owns forecast state for the active location, so the current, hourly, and weekly sections render from one payload.

## API

All JSON success responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Public endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Server status, environment, and database state |
| `GET` | `/api/weather/search?q=Mayur%20Vihar` | Up to 10 worldwide location matches (cities, regions, countries, and neighbourhoods) |
| `GET` | `/api/weather?lat=28.6139&lon=77.209` | Current weather, 24 upcoming hours, and 7 daily items; each daily item contains its own 24 hourly entries |

Optional `GET /api/weather` query fields: `name`, `country`, `admin1`, `countryCode`, and `timezone`. They are display metadata for the response; the forecast itself is derived from `lat`/`lon`.

Example forecast shape:

```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Delhi",
      "country": "India",
      "admin1": "Delhi",
      "countryCode": "IN",
      "latitude": 28.6139,
      "longitude": 77.209,
      "timezone": "Asia/Kolkata",
      "timezoneAbbreviation": "IST",
      "elevation": 216
    },
    "current": {
      "time": "2026-10-29T11:30",
      "temperature": 29.4,
      "feelsLike": 31.1,
      "humidity": 55,
      "windSpeed": 8.2,
      "windDirection": 90,
      "pressure": 1012.4,
      "precipitation": 0,
      "weatherCode": 1,
      "isDay": true,
      "condition": "Mainly clear"
    },
    "daily": [
      {
        "date": "2026-10-29",
        "weatherCode": 1,
        "condition": "Mainly clear",
        "tempMax": 31.2,
        "tempMin": 21.4,
        "sunrise": "2026-10-29T06:29",
        "sunset": "2026-10-29T17:40",
        "precipitationProbabilityMax": 12,
        "precipitationSum": 0,
        "windSpeedMax": 14.8,
        "uvIndexMax": 5.9,
        "hourly": [
          {
            "time": "2026-10-29T00:00",
            "temperature": 22.1,
            "weatherCode": 1,
            "condition": "Mainly clear",
            "precipitationProbability": 2,
            "isDay": false
          }
        ]
      }
    ],
    "hourly": [],
    "updatedAt": "2026-10-29T06:00:00.000Z",
    "attribution": {
      "text": "Weather data by Open-Meteo.com",
      "url": "https://open-meteo.com/"
    }
  }
}
```

Weather values in the payload use Celsius, km/h, hPa, and mm. Time strings from Open-Meteo are local wall-clock values without an offset; the client formats them as local time instead of parsing them as browser-local dates.

### Auth endpoints

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account, return the public user, set the session cookie |
| `POST` | `/api/auth/login` | Public | Verify credentials, return the public user, set the session cookie |
| `GET` | `/api/auth/me` | Cookie | Return the current user |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie |
| `POST` | `/api/auth/forgot-password` | Public | Send a password reset link if the address can receive email |
| `POST` | `/api/auth/reset-password` | Public | Verify the reset token and set a new password |
| `GET` | `/api/auth/oauth/google` | Public | Start Google sign-in with state and PKCE |
| `GET` | `/api/auth/oauth/github` | Public | Start GitHub sign-in with state |
| `GET` | `/api/auth/oauth/providers` | Public | Report which social providers are configured |
| `GET` | `/api/auth/oauth/:provider/callback` | Public | Exchange the provider code, link or create the user, and set the session cookie |

Register body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Weather123"
}
```

Login body:

```json
{
  "email": "ada@example.com",
  "password": "Weather123"
}
```

Passwords must be 8–72 bytes and contain at least one letter and one number. Emails are trimmed and lowercased. The response never includes `passwordHash`.

Password reset request body:

```json
{
  "email": "ada@example.com"
}
```

The response is intentionally generic: `{"message":"If that address can receive email, a password reset link has been sent."}`. It is the same for new, existing, and recently requested addresses. In development only, the response also contains `devResetUrl` when SMTP is not configured.

Password reset body:

```json
{
  "token": "64-character-reset-token",
  "password": "NewPassword1"
}
```

Reset links expire after one hour and are single-use. A successful reset updates the password hash and signs the user in. Tokens are stored as HMAC-SHA256 hashes, not plaintext, and expired records are removed by a MongoDB TTL index. A 60-second per-email cooldown limits repeated requests.

OAuth links a provider to an existing account only when the provider confirms the email address. Google must return `email_verified: true`; GitHub must return a verified address from `/user/emails`. If no account exists, one is created with `emailVerified: true`. Provider-specific ids are stored in sparse unique `googleId` and `githubId` fields.

### Favorite endpoints

All favorite routes require a valid session cookie and an available database.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/favorites` | List the current user's favorites, newest first, up to 100 |
| `POST` | `/api/favorites` | Add a location for the current user |
| `DELETE` | `/api/favorites/:id` | Delete one of the current user's favorites |

Create body:

```json
{
  "name": "Delhi",
  "country": "India",
  "admin1": "Delhi",
  "countryCode": "IN",
  "latitude": 28.6139,
  "longitude": 77.209,
  "timezone": "Asia/Kolkata"
}
```

Coordinates are required and range-checked. A favorite is unique per user at three-decimal coordinate precision. Deleting another user's favorite returns `404`, not `403`, so the API does not reveal whether someone else's record exists.

### Error codes

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | Invalid or missing request input |
| `400` | `INVALID_ID` | Malformed MongoDB object id |
| `400` | `INVALID_JSON` | Request body is not valid JSON |
| `400` | `INVALID_RESET_TOKEN` | Password reset token is invalid or expired |
| `400` | `UNSUPPORTED_PROVIDER` | OAuth provider is not Google or GitHub |
| `401` | `UNAUTHENTICATED` | Missing session cookie |
| `401` | `INVALID_SESSION` | Invalid or expired JWT |
| `401` | `INVALID_CREDENTIALS` | Incorrect email or password |
| `403` | `INVALID_ORIGIN` | Browser origin is not allowed |
| `404` | `NOT_FOUND` | Unknown route |
| `404` | `FAVORITE_NOT_FOUND` | Favorite does not exist for this user |
| `409` | `EMAIL_IN_USE` | Email already registered |
| `409` | `ALREADY_FAVORITED` | Location already saved by this user |
| `429` | `RATE_LIMITED` | Rate limit exceeded |
| `502` | `UPSTREAM_ERROR` / `UPSTREAM_INVALID` / `UPSTREAM_UNREACHABLE` | Open-Meteo error or invalid response |
| `502` | `EMAIL_SEND_FAILED` | SMTP delivery failed |
| `503` | `DATABASE_UNAVAILABLE` | Auth/favorites requested without a database |
| `503` | `EMAIL_NOT_CONFIGURED` | Email OTP requested without SMTP configuration in production |
| `503` | `OAUTH_NOT_CONFIGURED` | OAuth provider credentials are not set |
| `504` | `UPSTREAM_TIMEOUT` | Open-Meteo did not respond in time |
| `500` | `INTERNAL_ERROR` | Unexpected server failure |

## Authentication and security

- Passwords are hashed with bcryptjs using 12 rounds. `passwordHash` is `select: false` and is removed by the model's JSON transform.
- The JWT contains the user id in `sub` and is signed with `HS256`, issuer `weatherwise`, and audience `weatherwise-web`. Verification pins `algorithms: ['HS256']` so a token cannot downgrade to another algorithm.
- The token is sent in the `ww_token` cookie: `HttpOnly`, `SameSite=Lax`, `Path=/`, 7-day `Max-Age`, and `Secure` when `NODE_ENV=production`.
- The client does not read or store the JWT in JavaScript-accessible storage. `credentials: 'include'` is used for API requests.
- Login and registration are rate-limited to 30 attempts per 15 minutes per IP. Search, forecast, and favorite endpoints are limited to 60, 120, and 120 requests per minute respectively. Password reset requests are limited to 5 per 15 minutes, reset attempts to 20 per 15 minutes, and OAuth starts/callbacks to 30 per 15 minutes.
- Password reset links expire after one hour, are single-use, and are stored only as HMAC-SHA256 hashes. A 60-second per-email cooldown limits repeated requests. The request response is identical for new, existing, and recently requested addresses.
- OAuth uses a 10-minute signed HttpOnly state cookie. Google uses PKCE with `S256`; GitHub uses state validation. The state cookie is pinned to the provider and audience, so a callback cannot be replayed against another provider.
- OAuth links to an existing account only when the provider confirms a verified email. Google must return `email_verified: true`; GitHub must return a verified address. Unverified emails are never auto-linked.
- Mutating requests pass an Origin guard in addition to `SameSite=Lax`. Requests without an `Origin` header are allowed for non-browser clients; the browser-facing CSRF defense is the cookie policy plus the origin check.
- In development, CORS and the Origin guard accept `CLIENT_URL`, `http://localhost:5173`, and `http://127.0.0.1:5173`. In production, only the configured `CLIENT_URL` is accepted; localhost entries are dropped.
- Auth and favorite responses send `Cache-Control: no-store` and `Pragma: no-cache`, so per-user data is not retained by browsers or shared proxies.
- `helmet`, a 16 kB JSON body limit, centralized errors, and production-only proxy trust are configured in `server/src/app.ts`.
- Protected queries include `userId` in the database filter. Ownership is never read from a request body.
- MongoDB disconnect, reconnect, and error events are logged so an operator can distinguish a database outage from an application error. Mongoose reconnects automatically; protected routes return `503` until the connection returns.

This is a solid baseline, not a complete production identity system. See the limitations for token revocation, password reset, and email verification gaps.

## Production checklist

The repository is secure by default for local development, but deployment needs operator configuration:

1. **Database user and network access.** In MongoDB Atlas, create a dedicated application user with `readWrite` on the `weatherwise` database only — not an organization owner or admin user. Restrict the IP allowlist to the API host's egress addresses, or use private endpoint/VPC peering. Do not leave `0.0.0.0/0` once the host is known.
2. **Secrets.** Store `MONGODB_URI`, a random 32+ character `JWT_SECRET`, `RESET_SECRET`, OAuth client secrets, and the Brevo SMTP key in the hosting provider's secret manager, never in the repository. Rotate the Atlas password if it has ever appeared in chat, logs, or a screenshot, then restart the API.
3. **Environment.** Set `NODE_ENV=production`, `CLIENT_URL=https://your-client-domain`, `API_PUBLIC_URL=https://api.your-domain`, and `MONGODB_URI`. The API refuses to start if required values are missing, if `CLIENT_URL` is not HTTPS, or if OAuth is enabled without an HTTPS `API_PUBLIC_URL`.
4. **HTTPS and cookie scope.** Terminate TLS at the proxy or platform and forward `X-Forwarded-Proto`; `trust proxy` is enabled in production. Keep the client and API on the same registered domain (for example `app.example.com` and `api.example.com`) so the `SameSite=Lax` cookie works. If they must be cross-site, switch the cookie to `SameSite=None; Secure` and add CSRF tokens.
5. **Provider quota.** Set `ARCGIS_API_KEY` for production traffic, and review Open-Meteo's commercial terms and limits before launch. The free Open-Meteo tier is non-commercial.
6. **Backups and monitoring.** Enable Atlas continuous backups or scheduled snapshots, test a restore, and configure alerts for connection count, CPU, disk, and slow queries. Send API logs and `/api/health` checks to your monitoring system.
7. **Scaling.** The in-process rate limits and caches are per API instance. Before running more than one instance, move both to Redis (or another shared store) so limits and cache invalidation are consistent.
8. **Account lifecycle.** Before public launch, add account deletion and a JWT revocation strategy. Password reset already exists. The current 7-day token cannot be revoked before expiry.
9. **OAuth and email.** Register the production callbacks (`/api/auth/oauth/google/callback` and `/api/auth/oauth/github/callback`), publish the Google consent screen when leaving Testing mode, and verify a sending domain with Brevo. Brevo's free tier currently allows 300 emails/day; Google and GitHub OAuth have no per-login charge.

## Weather and place-search integration

Forecasts use Open-Meteo:

- Forecast: `https://api.open-meteo.com/v1/forecast`

Place search combines three providers:

- Open-Meteo Geocoding: `https://geocoding-api.open-meteo.com/v1/search` for cities, regions, and countries with population-aware ranking.
- [Photon](https://photon.komoot.io/) / OpenStreetMap: `https://photon.komoot.io/api/` for neighbourhoods and localities that Open-Meteo's city-focused gazetteer does not include, such as Mayur Vihar, Nihal Vihar, and Meerabagh in Delhi.
- [Esri/ArcGIS World Geocoding](https://developers.arcgis.com/rest/geocode/): `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` for small worldwide localities that OpenStreetMap lacks a place node for. This is what makes a query like Nihal Vihar resolve to the exact locality rather than only the nearby park.

All three providers are queried in parallel and merged. Open-Meteo results stay first. Exact and prefix name matches are lifted above fuzzy matches, then results are ordered by type: ArcGIS locality, Photon place, ArcGIS city, Photon boundary, ArcGIS district, Photon landuse, ArcGIS POI, Photon leisure. Duplicate names in the same region or within about 0.2° are removed, and a single name is capped at four results so one provider cannot fill the list with same-name places in different states. The merged list is capped at 10.

Photon and ArcGIS are both best-effort. If either times out or fails, search still returns the other providers' results. Photon matches are limited to settlement-like features (`place`, administrative `boundary`, residential `landuse`, and named parks or open spaces), so railway stations, buildings, and streets do not flood the suggestions. ArcGIS matches are limited to `Locality`, `Neighborhood`, `PostalLocality`, `City`, `Municipality`, `Subregion`, `District`, and `POI` results with a score of at least 70 and a known country. A nearby park is used as a last resort when OpenStreetMap has no place node for a neighbourhood.

Requested forecast fields are current temperature, apparent temperature, humidity, wind speed/direction, sea-level pressure, precipitation, weather code, and day/night flag; daily min/max, sunrise/sunset, precipitation probability and total, maximum wind, and maximum UV; and hourly temperature, weather code, precipitation probability, and day/night flag. Forecast data uses `timezone=auto`, `forecast_days=7`, Celsius, km/h, and mm. Hourly entries are grouped by local date and attached to each daily item, while the top-level `hourly` array remains the next 24 hours from now.

The integration:

- Normalizes upstream values and drops malformed records safely.
- Converts WMO weather interpretation codes into consistent condition labels.
- Adds a 9-second Open-Meteo timeout, a 4-second Photon timeout, and a 3.5-second ArcGIS timeout.
- Pauses ArcGIS for 5 minutes after a `403` or `429` instead of retrying it on every search.
- Maps provider timeouts to `504`, unreachable/invalid responses to `502`, and never exposes raw upstream errors. Photon and ArcGIS failures are non-fatal for search.
- Caches merged search results for 10 minutes and forecasts for 5 minutes in-process.
- Caps the caches at 500 search and 250 forecast entries.
- Returns Open-Meteo attribution in the API payload and shows weather and place-search attribution in the UI.

The caches are per server process. A multi-instance deployment should use a shared cache such as Redis.

### Country-center behavior

Open-Meteo may return a country as a geocoding result (`feature_code` starting with `PCLI`). WeatherWise labels that result “Country center” in suggestions and displays a warning in the current-weather panel. The forecast is for that coordinate only. The UI tells the user to search for a city or neighbourhood for local conditions.

## Frontend behavior

- `SearchBar.tsx` waits 350 ms after the last keystroke, requires at least two characters, cancels stale requests with `AbortController`, and also tracks a monotonic request id.
- Suggestions support `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, and an accessible combobox/listbox relationship.
- Clicking outside the search closes the suggestions.
- The last location is validated before being restored from `localStorage`; malformed stored data falls back to New Delhi.
- Temperature conversion happens in `client/src/utils/temperature.ts`. The unit is persisted separately from the location.
- `useWeather` owns the single forecast request and exposes `retry()`.
- The 7-day forecast cards are buttons. Selecting one updates a shared day-detail panel with that day's 24 hourly entries, rain chance and total, maximum wind, maximum UV, sunrise, and sunset. Today is open by default, and the panel falls back to today when the selected date is not present in a new location's forecast.
- The Home page shows a skeleton while loading, a retryable error state on failure, and the weather sections only when data is present.
- Login redirects back to the route that requested it (for example, `/favorites`). Protected pages render a loading state while the session is restored.
- The visual theme changes by weather condition and day/night state. Reduced-motion preferences disable animations.
- The UI uses semantic landmarks, labeled controls, visible focus styles, and `aria-live` status/alert messages where appropriate.

## Data models

### User

| Field | Notes |
| --- | --- |
| `name` | Required, trimmed, 2–80 characters |
| `email` | Required, unique, lowercase, indexed, maximum 254 characters |
| `passwordHash` | Optional, excluded from queries by default, never returned; absent for OTP/OAuth-only accounts |
| `emailVerified` | Set when OTP or a verified OAuth email proves ownership |
| `googleId`, `githubId` | Sparse unique provider ids; absent unless that provider is linked |
| `createdAt`, `updatedAt` | Mongoose timestamps |

### PasswordResetToken

| Field | Notes |
| --- | --- |
| `email` | Normalized lowercase address, indexed |
| `tokenHash` | HMAC-SHA256 of the reset token with `RESET_SECRET`; never returned |
| `expiresAt` | One hour after creation; TTL index removes expired records |
| `consumedAt` | Set on successful reset; consumed tokens cannot be reused |
| `createdAt`, `updatedAt` | Mongoose timestamps |

### Favorite

| Field | Notes |
| --- | --- |
| `userId` | Required `ObjectId` reference to User, indexed |
| `name`, `country` | Required location labels |
| `admin1`, `countryCode`, `timezone` | Optional metadata |
| `latitude`, `longitude` | Required and range-validated |
| `locationKey` | Three-decimal coordinate key used for duplicate detection |
| `createdAt`, `updatedAt` | Mongoose timestamps |

A compound unique index on `{ userId, locationKey }` enforces one saved location per user at that precision.

## Verification performed

The following was run in this workspace:

```text
npm run typecheck -w server    passed
npm run typecheck -w client    passed
npm run build -w server         passed
npm run build -w client         passed
npm run test:integration -w server
```

Integration result:

```text
61 checks passed, 0 failed.
```

The integration suite covers:

- Health endpoint and database status.
- Geocoding, input validation, small-locality and neighbourhood search, live forecast normalization, 7 daily items, 24 upcoming hourly items, 24 hourly entries per day, daily rain/wind/UV metrics, and timezone data.
- Registration, lowercase email normalization, bcrypt storage, duplicate email handling, hidden password hashes, and cookie issuance.
- Login success/failure, invalid-credential message parity, cookie rotation, `/me`, unauthenticated `/me`, and logout cookie clearing.
- Password reset: request, development link delivery, account non-enumeration, wrong-token rejection, successful password change, login with the new password, old password rejection, and single-use enforcement.
- OAuth configuration errors: an unconfigured provider returns `503`, an unknown provider is rejected, and the availability endpoint reports both providers as disabled in the test environment.
- Favorite creation, duplicate rejection, coordinate validation, per-user isolation, owner deletion, missing favorite deletion, and unauthenticated access.
- Cross-origin login rejection.

Production configuration was checked separately: a non-HTTPS `CLIENT_URL` and a short `JWT_SECRET` stop startup, a valid production config accepts only the configured HTTPS origin (localhost is rejected), and auth/favorite responses include `Cache-Control: no-store`.

Manual browser verification covered search debounce and keyboard selection, neighbourhood searches (Mayur Vihar, Nihal Vihar, Meerabagh), opening different days in the 7-day forecast, live weather rendering, Celsius/Fahrenheit conversion, persisted unit and location after reload, malformed search/empty state, country-center warning, API-down error and retry, protected-route redirect, registration/login/logout, saving a favorite, listing it, deleting it, and the empty state.

Lighthouse was run against the local home page with the in-app Chromium browser:

```text
Accessibility: 100
Best Practices: 100
SEO: 100
```

Lighthouse's browser integration does not run a performance benchmark, so no performance score is claimed here.

## Attribution, licensing, and operating limits

Forecast data is provided by [Open-Meteo.com](https://open-meteo.com/). Place search uses the Open-Meteo Geocoding API, [Photon](https://photon.komoot.io/), and [Esri/ArcGIS World Geocoding](https://developers.arcgis.com/rest/geocode/). Neighbourhood data from Photon is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License (ODbL). ArcGIS results should carry Esri attribution and are subject to the [ArcGIS geocoding terms](https://developers.arcgis.com/rest/geocode/). The app shows “Weather data by Open-Meteo.com” in the footer, labels the search caption “Geocoding by Open-Meteo, Photon (OpenStreetMap), and Esri”, and includes Open-Meteo attribution in forecast responses.

Open-Meteo's free API is for non-commercial use, requires attribution under CC BY 4.0, and is subject to limits of 10,000 calls/day, 5,000 calls/hour, and 600 calls/minute. The free tier does not guarantee availability or accuracy. Commercial use, higher volume, or additional guarantees require an Open-Meteo subscription. See [Open-Meteo Terms](https://open-meteo.com/en/terms) and the [Open-Meteo licence page](https://open-meteo.com/en/license) for the authoritative terms.

Photon's public service is free to use but has no SLA and asks clients not to overload it. WeatherWise debounces search, caches merged results for 10 minutes, and only calls Photon for user-initiated searches.

The keyless ArcGIS geocoder is usable at low volume but has no production SLA. Set `ARCGIS_API_KEY` for a stable quota, and review Esri's terms before commercial deployment. If ArcGIS returns `403` or `429`, the server pauses that provider for 5 minutes and search continues with Open-Meteo and Photon.

This project's server-side cache and rate limits reduce upstream traffic, but they are not a substitute for a commercial Open-Meteo plan in a commercial deployment.

## Limitations

- The app depends on Open-Meteo for forecasts and on Open-Meteo, Photon, and ArcGIS for search. Provider outages, model changes, and rate limits directly affect the product.
- Neighbourhood coverage depends on OpenStreetMap and Esri data. Some localities are missing a place node and resolve to a nearby named park, some names are ambiguous across regions, and either fallback can be unavailable. Both are best-effort and fall back silently to the remaining providers.
- ArcGIS returns ISO3 country codes, while the suggestion badge uses ISO2. ArcGIS results therefore omit the country badge; the country name is still shown.
- The keyless ArcGIS endpoint is not intended for production-scale traffic. Set `ARCGIS_API_KEY` and confirm Esri licensing before launch.
- Country-level results are represented by one center coordinate and are explicitly labeled; they are not countrywide forecasts.
- The account system has no account deletion, email-change flow, or “set a password” flow for OAuth-only accounts.
- Password reset depends on an SMTP provider. Free tiers have daily caps, and reliable delivery to arbitrary recipients needs a verified sending domain. Without SMTP, only development console links work.
- Google sign-in in Testing mode is limited to added test users until the consent screen is published. GitHub OAuth has no per-login charge but still depends on GitHub availability.
- JWTs cannot be revoked before expiry. Logout clears the cookie, but a copied token would remain valid until its 7-day expiry.
- The JWT is stored in a cookie, not a refresh-token rotation scheme. There is no token rotation or reuse detection.
- CSRF protection relies on `SameSite=Lax` and the Origin guard. Non-browser clients without an `Origin` header are intentionally allowed, so a stricter deployment may add double-submit tokens.
- Rate limiting and caches are in-process. Multiple API instances would have independent state; use Redis or a comparable shared store.
- There is no background refresh, weather alert system, geolocation prompt, air quality, radar, or historical weather.
- Temperature unit and last location are browser-local. They are not stored on the user account.
- The integration test uses live upstream weather and an in-memory MongoDB binary; it is not a fully hermetic test suite and is not a browser end-to-end test.
- There is no CI pipeline, Docker image, or production deployment configuration in the repository.
- The server does not serve the built client. Deploy the client and API separately, or add static hosting/compression/TLS termination.

## Future work

- Add password reset (done), email-change, account deletion, a “set password” flow for OAuth-only accounts, and session/device management.
- Move JWT handling to short-lived access tokens plus rotating refresh tokens in HttpOnly cookies, with server-side revocation.
- Add integration and component tests for the client, including accessibility checks in CI.
- Add Redis-backed caching and rate limiting for multi-instance deployments.
- Persist user preferences (unit, default location) in MongoDB.
- Add geolocation, weather alerts, air quality, saved-location reordering, and shareable forecast URLs.
- Add structured logging, metrics, tracing, and graceful degraded-mode UI for database outages.
- Add Docker, CI/CD, security headers at the edge, and a documented deployment topology.

## Troubleshooting

### Auth or favorites return 503

Start MongoDB and set `MONGODB_URI`. In development the public weather page should still work. Check `GET /api/health` to confirm `database` is `connected`.

### `JWT_SECRET` warning or production startup failure

Set a long random value in `server/.env`. Production requires it; development uses a clearly labeled insecure fallback for local convenience only.

### Weather requests fail but the server is running

Check network access to `api.open-meteo.com`, `geocoding-api.open-meteo.com`, `photon.komoot.io`, and `geocode.arcgis.com`. Open-Meteo failures map to `502`/`504` and the UI offers a retry. Photon and ArcGIS failures are non-fatal because search still returns the other providers' results.

### Client calls the wrong API

Set `VITE_API_URL` in `client/.env` and restart Vite. For production, put the API behind HTTPS and set the client's API URL at build time.

### Integration test cannot start MongoDB

`mongodb-memory-server` downloads a test MongoDB binary on first use. The suite uses a 60-second launch timeout for Windows. The runtime application does not depend on this package.

### Password reset email is not arriving

In development, leave the SMTP variables empty and read the reset link from the API console or the `devResetUrl` response. For real delivery, set all five SMTP variables, confirm the Brevo sender/domain is verified, and check the API log for `EMAIL_SEND_FAILED`. Free plans have daily caps. Reset links expire after one hour.

### OAuth redirects back with an error

Check that `API_PUBLIC_URL` matches the public API origin exactly and that the provider callback URL includes `/api/auth/oauth/<provider>/callback`. Google requires the same redirect URI that was registered. GitHub requires the OAuth App to be configured for the callback. Both client and API must be on the same site for the `SameSite=Lax` cookie.

### Google or GitHub sign-in is disabled

The login and registration pages ask `GET /api/auth/oauth/providers`; a provider without both environment values is shown disabled with an explanatory note. Set both the client id and client secret for that provider and restart the API. The app refuses to start with only one half of a provider pair, and a direct request to an unconfigured start route returns `503`. An unsupported provider name returns `400`.
