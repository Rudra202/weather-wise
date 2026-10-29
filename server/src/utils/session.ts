import type { CookieOptions, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config, jwtSecret } from '../config/env.js';

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: config.cookieMaxAgeMs,
  };
}

export function oauthStateCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/api/auth/oauth',
    maxAge: config.oauthStateMaxAgeMs,
  };
}

export function signSessionToken(userId: string): string {
  return jwt.sign({}, jwtSecret, {
    algorithm: 'HS256',
    subject: userId,
    issuer: 'weatherwise',
    audience: 'weatherwise-web',
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

export function setSessionCookie(res: Response, userId: string): void {
  res.cookie(config.cookieName, signSessionToken(userId), sessionCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
