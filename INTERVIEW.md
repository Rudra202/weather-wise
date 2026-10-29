# WeatherWise interview preparation

These answers are based on the code in this repository. Keep them conversational and use the file references only when the interviewer wants detail.

## 1. Give me a short overview of WeatherWise.

WeatherWise is a full-stack weather dashboard built with React, TypeScript, Vite, Tailwind, and an Express/Mongoose API. Users can search any place worldwide, see current conditions, hourly detail, and a 7-day forecast they can open day by day, switch between Celsius and Fahrenheit, and optionally create an account to save favorite locations.

The public weather experience does not require an account. The server calls Open-Meteo, normalizes the response, and exposes a stable API. Accounts support email/password, Google, GitHub, and password reset by email, all ending in the same JWT in an HttpOnly cookie. Auth and favorites use MongoDB.

**Code anchors:** `client/src/pages/Home.tsx`, `server/src/services/weatherService.ts`, `server/src/controllers/authController.ts`, `server/src/controllers/oauthController.ts`, `server/src/controllers/otpController.ts`.

## 2. Why did you choose this architecture?

I used an npm workspace so the client and server can be developed and built independently but share one install and root commands. The server follows a route → middleware → controller → service/model split. Weather and auth logic stay out of Express route definitions, which makes each piece easier to test and replace.

The client is a single-page React app with a small service layer around `fetch`. It does not call Open-Meteo directly; it only talks to my API. That keeps provider-specific code, validation, caching, and error mapping on the server.

**Code anchors:** `package.json`, `server/src/app.ts`, `client/src/services/api.ts`.

## 3. Why proxy Open-Meteo instead of calling it from the browser?

Four reasons:

1. **One stable contract.** Open-Meteo returns snake_case fields, WMO codes, and nullable/partial arrays. The server normalizes them to camelCase, Celsius, km/h, hPa, and explicit condition labels.
2. **Caching and limits.** I can cache merged place-search results for 10 minutes and forecasts for 5 minutes, and apply my own rate limits, rather than letting every browser hit the provider.
3. **Error handling.** The API maps upstream timeouts and bad responses to consistent `502`/`504` errors instead of exposing raw provider failures.
4. **Provider isolation.** If I changed weather providers, the client contract would stay the same.

Open-Meteo does not require an API key, but that is not a reason to couple the browser to its response format.

**Code anchors:** `server/src/services/weatherService.ts`, `server/src/controllers/weatherController.ts`, `client/src/services/weatherService.ts`.

## 4. How does the search experience work, including race conditions?

The search input waits 350 ms after the last keystroke and requires at least two characters. It shows a loading state while the request is in flight and handles empty results, errors, and retries.

For stale responses I use two defenses: an `AbortController` cancels the previous request, and a monotonically increasing `requestId` ensures that even a response that arrives late cannot overwrite newer results. Selection is accessible: the input is a combobox, the suggestion list is a listbox, and ArrowUp/ArrowDown/Enter/Escape work without a mouse.

The server queries Open-Meteo, Photon (OpenStreetMap), and Esri/ArcGIS in parallel, then merges, ranks, and deduplicates the results. Open-Meteo is city-focused, so queries such as Mayur Vihar, Nihal Vihar, and Meerabagh in Delhi returned zero results until I added the fallbacks. Photon supplies OpenStreetMap neighbourhoods, but some places have no OSM place node, so ArcGIS supplies the exact locality (Nihal Vihar is the clearest example). Exact and prefix name matches outrank fuzzy matches, and each provider is best-effort: if one fails, the API still returns the others.

**Code anchors:** `client/src/components/SearchBar.tsx`, `client/src/components/LocationSuggestions.tsx`.

## 5. How do Celsius and Fahrenheit work?

The server stores and returns weather in Celsius, km/h, hPa, and mm. The client converts only for display in `utils/temperature.ts`. Changing the unit does not trigger another API request.

The selected unit is saved in `localStorage` and restored on reload. The same is true for the last searched location. I keep those as browser preferences rather than account settings because they work for anonymous visitors too.

**Code anchors:** `client/src/utils/temperature.ts`, `client/src/pages/Home.tsx`, `client/src/utils/storage.ts`.

## 6. How do you handle unreliable upstream weather data?

I treat the upstream response as untrusted. `isObject`, `numberOrNull`, `stringOrNull`, and `booleanFromNumber` defensively narrow values, and malformed records are dropped. If the current/daily/hourly containers are missing, the server returns `502 UPSTREAM_INVALID` rather than rendering half-broken data.

WMO weather codes are mapped to consistent labels. Missing values become `null` in the contract and render as an em dash. Forecast requests have a 9-second timeout. The server never passes raw upstream error text to the browser.

**Code anchors:** `server/src/services/weatherService.ts`, `server/src/utils/weatherCodes.ts`.

## 7. Walk me through authentication end to end.

Registration validates the name, email, and password, checks for an existing email, hashes the password with bcrypt at 12 rounds, creates the user, signs an `HS256` JWT, and sets the `ww_token` cookie. The JWT puts the user id in `sub` and signs/verifies issuer `weatherwise` and audience `weatherwise-web`. Verification also pins `algorithms: ['HS256']`, so a token cannot switch algorithms. Auth responses are marked `Cache-Control: no-store` so a proxy cannot cache per-user data.

On page load, the React `AuthProvider` calls `/auth/me` with credentials included. If it succeeds, the user is authenticated; a 401 means guest. Login follows the same cookie flow. Logout clears the cookie and resets client state.

**Code anchors:** `server/src/controllers/authController.ts`, `client/src/context/AuthContext.tsx`, `server/src/middleware/auth.ts`.

## 8. How do Google and GitHub sign-in work?

I use the server-side authorization-code flow, not the implicit flow, so the client secret and provider tokens never touch the browser.

`GET /api/auth/oauth/:provider` generates a 32-byte `state` and a 48-byte PKCE verifier, signs them into a 10-minute JWT, and sets that as the `ww_oauth` HttpOnly cookie scoped to `/api/auth/oauth`. It then redirects to the provider. Google gets `state` plus a PKCE `S256` challenge, scope `openid email profile`, and `prompt=select_account`. GitHub gets `state` and scope `read:user user:email`; GitHub does not support PKCE, so state validation is the protection there.

The callback verifies the cookie with HS256, the `weatherwise` issuer, the `weatherwise-oauth` audience, the provider name, and a timing-safe `state` comparison. It then exchanges the code server-side with the client secret, fetches the profile, and requires a provider-verified email: Google must return `email_verified: true`, and GitHub must return a verified address from `/user/emails` (preferring the primary one). Only then does it link to an existing account or create a new one, and it finishes by issuing the normal `ww_token` session cookie and redirecting to `/auth/callback` on the client.

Linking only on a verified email is the key security rule. Without it, someone could create a provider account with an email they do not control and take over an existing password account. The create/link path also handles the duplicate-key race when two callbacks arrive together by re-querying the provider id or email. The `next` parameter is restricted to a same-site path, so the flow cannot be used as an open redirect. Errors redirect with a generic `status=error`, and details stay in the server log.

An unconfigured provider returns `503 OAUTH_NOT_CONFIGURED`; an unknown provider returns `400`. Configuration fails closed: the server will not start with only half of an id/secret pair, and production requires an HTTPS `API_PUBLIC_URL` when OAuth is enabled so callbacks are not registered over plain HTTP.

**Code anchors:** `server/src/controllers/oauthController.ts`, `server/src/services/oauthService.ts`, `server/src/utils/session.ts`, `client/src/pages/AuthCallback.tsx`, `client/src/components/SocialAuthButtons.tsx`.

## 9. How does password reset work?

Forgot password takes an email, and if an account exists it creates a single-use reset token that expires after one hour. The token is a 32-byte random value stored only as an HMAC-SHA256 hash. The reset link is emailed; without SMTP in development it is logged to the console and returned as `devResetUrl`.

Verification compares the submitted token hash, checks expiry and single-use, updates the password with bcrypt, and signs the user in. The request response is identical for existing and nonexistent addresses, and a 60-second per-email cooldown limits repeated sends. Reset attempts are rate-limited per IP.

**Code anchors:** `server/src/controllers/resetController.ts`, `server/src/models/PasswordResetToken.ts`, `server/src/services/emailService.ts`, `client/src/pages/ForgotPassword.tsx`, `client/src/pages/ResetPassword.tsx`.

## 10. Why use an HttpOnly JWT cookie instead of localStorage?

HttpOnly means JavaScript cannot read the token, which reduces the impact of XSS token theft. The cookie is also `SameSite=Lax`, `Secure` in production, and scoped to `/`. I pair that with an Origin check on state-changing requests and a restrictive CORS policy. In production only the configured HTTPS `CLIENT_URL` is trusted; localhost origins are accepted only in development.

The tradeoff is CSRF exposure, which is why I do not rely on the cookie alone. `SameSite=Lax` blocks most cross-site form/fetch cases, and the Origin guard rejects browser mutations from unknown origins. Requests without an Origin header are allowed for non-browser clients; a stricter system could add double-submit CSRF tokens.

**Code anchors:** `server/src/controllers/authController.ts`, `server/src/middleware/auth.ts`, `server/src/app.ts`.

## 11. How do you prevent users from seeing or deleting each other's favorites?

The JWT is verified by `requireAuth`, and the user id comes from `req.auth`, never from the request body or URL. Every favorite query includes `userId`. Deletion uses `findOneAndDelete({ _id: id, userId })`, so another user's id simply returns `404`.

I also enforce a compound unique index on `{ userId, locationKey }`, where `locationKey` is the coordinate pair rounded to three decimals. That prevents duplicate saves even if the request races past the explicit duplicate check.

**Code anchors:** `server/src/controllers/favoriteController.ts`, `server/src/models/Favorite.ts`.

## 12. How is input validation handled, and how do errors stay consistent?

I centralize validation helpers for required strings, optional strings, numeric ranges, email normalization, and password rules. Controllers call them before touching the database or provider. The JSON body limit is 16 kB.

All expected failures are `HttpError`s. The error middleware handles those, Mongoose validation/cast errors, duplicate-key errors, invalid JSON, and a generic fallback. In production the generic message is deliberately vague; raw error details stay in server logs. This gives the client predictable `{ success: false, error: { code, message } }` responses.

**Code anchors:** `server/src/utils/validation.ts`, `server/src/middleware/errorHandler.ts`, `server/src/utils/httpError.ts`.

## 13. What happens if MongoDB is unavailable?

The public weather feature is independent of MongoDB, so development does not dead-end if the database is not running. The server logs a warning and keeps serving weather. Auth and favorite routes pass through `requireDatabase` and return `503 DATABASE_UNAVAILABLE`.

In production, the server refuses to start if the database cannot be reached, if `CLIENT_URL` is missing or not HTTPS, or if `JWT_SECRET` is missing or shorter than 32 characters. It also refuses a half-configured OAuth or SMTP setup, and requires an HTTPS `API_PUBLIC_URL` when OAuth is enabled. Configuration fails closed instead of silently deploying an account system with a development origin or weak key. Shutdown also closes the HTTP server, disconnects Mongoose, and has a timeout. Mongo disconnect/reconnect events are logged for operators.

**Code anchors:** `server/src/config/db.ts`, `server/src/server.ts`, `server/src/middleware/auth.ts`.

## 14. What caching and scalability choices did you make?

I added small in-process TTL caches for place search and forecasts. Search results are cached for 10 minutes and forecasts for 5, with entry caps to avoid unbounded memory growth. The point is to reduce repeated provider calls and make repeated searches cheap.

Rate limits are separate: 30 auth attempts per 15 minutes, 60 searches per minute, 120 forecast requests per minute, 120 favorite changes per minute, 5 OTP requests and 20 OTP verifications per 15 minutes, and 30 OAuth starts/callbacks per 15 minutes. These are per IP and in-process. That is fine for a single instance, but in a multi-instance deployment each instance would keep its own cache and counters. The next step is Redis for both, plus a shared rate-limit store.

**Code anchors:** `server/src/utils/cache.ts`, `server/src/middleware/rateLimit.ts`.

## 15. How did you test it?

I used several layers rather than claiming unit coverage I do not have:

- TypeScript checks for both workspaces.
- Production builds for both workspaces.
- A 62-check API integration suite against an in-memory MongoDB and live Open-Meteo, Photon, and ArcGIS endpoints.
- Manual browser verification of search (including neighbourhoods), day-by-day forecast details, keyboard navigation, unit conversion, persistence, states, auth, favorites, and protected routes.
- A Lighthouse audit of the local home page: 100 accessibility, 100 best practices, 100 SEO.

The integration suite covers auth hashing, duplicate handling, ownership isolation, cookie logout, origin rejection, input validation, normalized public weather, per-day hourly arrays, password reset, non-enumeration, old/new password behavior, single-use tokens, OAuth availability reporting, and OAuth configuration errors. It is intentionally an API/integration test, not a browser E2E or a fully hermetic unit suite. Live provider sign-in is not in the suite because that needs real Google/GitHub credentials and a human consent step.

**Code anchors:** `server/scripts/integration-test.ts`, `README.md`.

## 16. What was a tricky bug or design issue you dealt with?

Three good examples:

**Local time parsing.** Open-Meteo returns local wall-clock strings such as `2026-10-29T14:00` without a timezone offset. `new Date(value)` would shift that into the browser's timezone. I split the components with a regex and format the wall-clock value directly, so sunrise, hourly labels, and daily dates stay in the location's local time.

**Stale search results.** Debouncing alone is not enough: an older request can still resolve after a newer one. I combined `AbortController` with a request id so late responses cannot overwrite current suggestions.

**Missing neighbourhoods.** Open-Meteo's geocoder is city-focused: queries like “Mayur Vihar”, “Nihal Vihar”, and “Meerabagh” in Delhi returned zero results. I confirmed that against the upstream API, then added two best-effort parallel sources. Photon/OpenStreetMap fills most neighbourhoods; Esri/ArcGIS fills small localities where OSM has no place node. The merge ranks Open-Meteo first, lifts exact and prefix name matches above fuzzy ones, orders by result type, deduplicates nearby same-name places, and caps any one name at four results so a provider cannot flood the list. If either fallback is unavailable, search still returns the remaining results. For a place with no OSM node, such as Nihal Vihar, ArcGIS now returns the exact locality, with the nearby park as an extra suggestion.

I also ran into a cookie test mismatch: `res.clearCookie` emitted an `Expires` epoch rather than `Max-Age=0`, so the test accepts either valid clearing mechanism.

**Code anchors:** `client/src/utils/format.ts`, `client/src/components/SearchBar.tsx`, `server/src/services/weatherService.ts`, `server/scripts/integration-test.ts`.

## 17. What are the biggest limitations, and what would you do next?

The biggest gaps are identity, email delivery, and production operations.

- Add password reset, email change, account deletion, a "set password" flow for OTP/OAuth-only accounts, and session/device management. There is currently no way for a passwordless user to add a password.
- Get reliable OTP delivery: Brevo's free tier needs a verified sending domain for arbitrary recipients. Without one, only the development console works.
- Publish the Google consent screen before leaving Testing mode; GitHub OAuth needs no review.
- Move to short-lived access tokens plus rotating refresh tokens with server-side revocation, because the current 7-day JWT cannot be revoked before expiry.
- Replace in-process caches and rate limits with Redis for multi-instance deployments.
- Add client component/E2E tests and CI, including accessibility checks.
- Persist unit and default-location preferences in MongoDB.
- Add structured logging, metrics, and deployment configuration (Docker/CI/CD/TLS).
- Depend on Open-Meteo carefully: it is free for non-commercial use, needs attribution under CC BY 4.0, has call limits, and requires a paid plan for commercial use.
- Treat neighbourhood coverage as best-effort: Photon/OpenStreetMap and the keyless ArcGIS endpoint have no SLA, and some localities resolve to a nearby park or are missing entirely.

If I had one more week, I would prioritize token revocation and tests first, then the shared cache/rate-limit layer, because those are the changes that most affect whether the app is safe and operable beyond a single instance.

**Code anchors:** `server/src/controllers/authController.ts`, `server/src/utils/cache.ts`, `README.md`.

## Quick numbers to remember

- 62 integration checks, 0 failures.
- bcrypt: 12 rounds.
- JWT: 7-day cookie, issuer `weatherwise`, audience `weatherwise-web`.
- OAuth state: 10-minute signed HttpOnly cookie, audience `weatherwise-oauth`; Google adds PKCE `S256`.
- Password reset: 32-byte token, one-hour expiry, single-use, HMAC-SHA256 storage, 60-second per-email cooldown.
- Search: 350 ms debounce, 2-character minimum, up to 10 results, Open-Meteo + Photon + ArcGIS.
- Forecast: 7 daily items, 24 upcoming hourly items, 24 hourly items per day, 9-second Open-Meteo timeout.
- Photon: best-effort fallback with a 4-second timeout.
- ArcGIS: best-effort fallback with a 3.5-second timeout, score >= 70, paused for 5 minutes after a 403/429.
- Caches: 5 minutes forecast, 10 minutes merged search results.
- Rate limits: 30 auth/15 min, 60 searches/min, 120 forecasts/min, 120 favorites/min, 5 password reset requests/15 min, 20 reset attempts/15 min, 30 OAuth/15 min.
- Units at the API boundary: Celsius, km/h, hPa, mm.
- MongoDB is optional for public weather in development, required for auth/favorites.
- Lighthouse: 100 accessibility, 100 best practices, 100 SEO on the audited home page.

## What not to overclaim

- This is not a complete production identity system.
- The JWT cannot be revoked before it expires.
- Password reset depends on an SMTP provider. Free tiers have daily caps, and reliable delivery to arbitrary recipients needs a verified sending domain. Without SMTP, only the development console link works.
- Google and GitHub sign-in have not completed a live provider round trip because no human consent step is automated; the unconfigured paths, state design, PKCE, and code are tested.
- OAuth accounts may have no password until one is set through password reset, and there is no account-deletion or session-management flow yet.
- The app has no browser E2E suite or unit-test suite yet.
- The caches and rate limits are per process, not shared.
- The integration suite uses live Open-Meteo, Photon, and ArcGIS data, so it is not fully hermetic.
- Country results are center-coordinate forecasts, not countrywide forecasts.
- Neighbourhood search depends on OpenStreetMap and Esri coverage; some places resolve to a nearby park, and same-name places can be ambiguous.
- The keyless ArcGIS endpoint is low-volume; production should set `ARCGIS_API_KEY` and review Esri terms.
- ArcGIS returns ISO3 country codes, so those suggestions omit the ISO2 country badge.
- Open-Meteo's free tier is non-commercial and has limits; commercial use needs a paid plan.
