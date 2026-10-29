import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function readPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const port = readPort(process.env.PORT, 5000);

const clientUrl = (
  process.env.CLIENT_URL ?? (isProduction ? '' : 'http://localhost:5173')
).replace(/\/$/, '');
const mongoUri = process.env.MONGODB_URI?.trim() ?? '';
const jwtSecretValue = process.env.JWT_SECRET ?? '';
const resetSecretValue = process.env.RESET_SECRET?.trim() ?? '';

export const config = {
  nodeEnv,
  isProduction,
  port,
  clientUrl,
  apiPublicUrl: (process.env.API_PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, ''),
  mongoUri,
  jwtSecret: jwtSecretValue,
  resetSecret: resetSecretValue,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  arcgisApiKey: process.env.ARCGIS_API_KEY?.trim() ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '',
  githubClientId: process.env.GITHUB_CLIENT_ID?.trim() ?? '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET?.trim() ?? '',
  smtpHost: process.env.SMTP_HOST?.trim() ?? '',
  smtpPort: readPort(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER?.trim() ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM?.trim() ?? '',
  cookieName: 'ww_token',
  oauthCookieName: 'ww_oauth',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  oauthStateMaxAgeMs: 10 * 60 * 1000,
  resetTtlMs: 60 * 60 * 1000,
  resetCooldownMs: 60 * 1000,
  upstreamTimeoutMs: 9000,
  weatherCacheTtlMs: 5 * 60 * 1000,
  geocodeCacheTtlMs: 10 * 60 * 1000,
} as const;

const googleEnabled = Boolean(config.googleClientId && config.googleClientSecret);
const githubEnabled = Boolean(config.githubClientId && config.githubClientSecret);
const smtpConfigured = Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);

export const oauthProviders = {
  google: googleEnabled,
  github: githubEnabled,
} as const;

export const emailConfigured = smtpConfigured;

if (Boolean(config.googleClientId) !== Boolean(config.googleClientSecret)) {
  throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together.');
}
if (Boolean(config.githubClientId) !== Boolean(config.githubClientSecret)) {
  throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set together.');
}
if ((config.smtpHost || config.smtpUser || config.smtpPass || config.mailFrom) && !smtpConfigured) {
  throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM must be set together.');
}

// Production must fail closed: no implicit localhost client, no database-less
// startup, and no short signing key. Development stays permissive on purpose.
if (isProduction) {
  const problems: string[] = [];
  if (!config.clientUrl) {
    problems.push('CLIENT_URL must be set');
  } else if (!config.clientUrl.startsWith('https://')) {
    problems.push('CLIENT_URL must use https://');
  }
  if (!config.apiPublicUrl.startsWith('https://') && (googleEnabled || githubEnabled)) {
    problems.push('API_PUBLIC_URL must use https:// when OAuth is enabled');
  }
  if (!config.mongoUri) problems.push('MONGODB_URI must be set');
  if (jwtSecretValue.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters');
  }
  if (resetSecretValue && resetSecretValue.length < 32) {
    problems.push('RESET_SECRET must be at least 32 characters when set');
  }
  if (problems.length > 0) {
    throw new Error(`Invalid production configuration: ${problems.join('; ')}.`);
  }
  if (!smtpConfigured) {
    console.warn('[config] SMTP is not configured. Email OTP sign-in will return 503.');
  }
}

if (!jwtSecretValue) {
  console.warn('[config] JWT_SECRET is not set. Using a development-only fallback secret.');
}

export const jwtSecret = jwtSecretValue || 'development-only-insecure-secret-change-me';
export const resetSecret = resetSecretValue || jwtSecret;

/**
 * Localhost origins are development conveniences. Production only trusts the
 * single configured CLIENT_URL, so an accidentally shipped localhost entry
 * cannot widen the CORS or CSRF surface.
 */
const allowedOrigins = new Set<string>(
  [config.clientUrl, ...(isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'])].filter(
    (origin): origin is string => origin.length > 0,
  ),
);

export function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin);
}

export function allowedOriginList(): string[] {
  return [...allowedOrigins];
}
