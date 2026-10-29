import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config, jwtSecret, oauthProviders } from '../config/env.js';
import { isDatabaseReady } from '../config/db.js';
import { User, type UserDocument } from '../models/User.js';
import {
  buildAuthorizationUrl,
  exchangeCode,
  fetchOAuthProfile,
  isOAuthProvider,
  isProviderConfigured,
  type OAuthProfile,
  type OAuthProvider,
} from '../services/oauthService.js';
import { HttpError } from '../utils/httpError.js';
import { oauthStateCookieOptions, setSessionCookie } from '../utils/session.js';

interface OAuthStatePayload {
  state: string;
  verifier: string;
  provider: OAuthProvider;
  next: string;
}

function safeNext(value: unknown): string {
  if (typeof value !== 'string') return '/';
  const trimmed = value.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.length > 200
  ) {
    return '/';
  }
  return trimmed;
}

function statesMatch(expected: string, received: string): boolean {
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
}

function clearOAuthCookie(res: Response): void {
  res.clearCookie(config.oauthCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/auth/oauth',
  });
}

function errorRedirect(res: Response, reason: 'oauth_failed' | 'access_denied'): void {
  res.redirect(
    302,
    `${config.clientUrl}/auth/callback?status=error&reason=${encodeURIComponent(reason)}`,
  );
}

async function findOrCreateOAuthUser(profile: OAuthProfile): Promise<UserDocument> {
  const field = profile.provider === 'google' ? 'googleId' : 'githubId';
  let user = await User.findOne({ [field]: profile.providerId });

  if (!user) {
    user = await User.findOne({ email: profile.email });
    if (user) {
      // The provider has already proven control of this email address, so
      // linking is safe even for an existing password account.
      if (profile.provider === 'google') user.googleId = profile.providerId;
      else user.githubId = profile.providerId;
      user.emailVerified = true;
      await user.save();
      return user as UserDocument;
    }
  }

  if (user) return user as UserDocument;

  try {
    return (await User.create({
      name: profile.name,
      email: profile.email,
      emailVerified: true,
      ...(profile.provider === 'google'
        ? { googleId: profile.providerId }
        : { githubId: profile.providerId }),
    })) as UserDocument;
  } catch (error) {
    // A concurrent callback may have created or linked the same identity.
    user =
      (await User.findOne({ [field]: profile.providerId })) ??
      (await User.findOne({ email: profile.email }));
    if (user) return user as UserDocument;
    throw error;
  }
}

export function oauthProviderStatus(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: { google: oauthProviders.google, github: oauthProviders.github },
  });
}

export function startOAuth(req: Request, res: Response): void {
  const rawProvider = req.params.provider;
  const providerParam = typeof rawProvider === 'string' ? rawProvider : '';
  if (!isOAuthProvider(providerParam)) {
    throw new HttpError(400, 'Unsupported sign-in provider.', 'UNSUPPORTED_PROVIDER');
  }
  if (!isProviderConfigured(providerParam)) {
    throw new HttpError(
      503,
      'That sign-in provider is not configured on this server.',
      'OAUTH_NOT_CONFIGURED',
    );
  }

  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const payload: OAuthStatePayload = {
    state,
    verifier,
    provider: providerParam,
    next: safeNext(req.query.next),
  };

  const token = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    issuer: 'weatherwise',
    audience: 'weatherwise-oauth',
    expiresIn: '10m',
  });

  res.cookie(config.oauthCookieName, token, oauthStateCookieOptions());
  res.redirect(302, buildAuthorizationUrl(providerParam, state, challenge));
}

export async function oauthCallback(req: Request, res: Response): Promise<void> {
  const rawProvider = req.params.provider;
  const providerParam = typeof rawProvider === 'string' ? rawProvider : '';

  try {
    if (!isOAuthProvider(providerParam)) {
      throw new Error('Unsupported OAuth provider.');
    }
    if (typeof req.query.error === 'string') {
      errorRedirect(res, 'access_denied');
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
    const cookie = req.cookies?.[config.oauthCookieName];
    if (!code || !returnedState || typeof cookie !== 'string') {
      throw new Error('Missing OAuth callback parameters.');
    }

    const payload = jwt.verify(cookie, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'weatherwise',
      audience: 'weatherwise-oauth',
    }) as Partial<OAuthStatePayload>;

    if (
      payload.provider !== providerParam ||
      typeof payload.state !== 'string' ||
      typeof payload.verifier !== 'string' ||
      !statesMatch(payload.state, returnedState)
    ) {
      throw new Error('OAuth state validation failed.');
    }

    clearOAuthCookie(res);
    if (!isDatabaseReady()) {
      throw new Error('Database is unavailable during OAuth callback.');
    }

    const accessToken = await exchangeCode(providerParam, code, payload.verifier);
    const profile = await fetchOAuthProfile(providerParam, accessToken);
    const user = await findOrCreateOAuthUser(profile);

    setSessionCookie(res, String(user._id));
    const next = safeNext(payload.next);
    res.redirect(
      302,
      `${config.clientUrl}/auth/callback?status=success&next=${encodeURIComponent(next)}`,
    );
  } catch (error) {
    clearOAuthCookie(res);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[oauth] ${providerParam} sign-in failed: ${message}`);
    errorRedirect(res, 'oauth_failed');
  }
}
