import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config, isAllowedOrigin, jwtSecret } from '../config/env.js';
import { isDatabaseReady } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: unknown = req.cookies?.[config.cookieName];
  if (typeof token !== 'string' || token.length === 0) {
    throw new HttpError(401, 'Authentication is required.', 'UNAUTHENTICATED');
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'weatherwise',
      audience: 'weatherwise-web',
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Invalid token payload.');
    }
    req.auth = { userId: payload.sub };
    next();
  } catch {
    throw new HttpError(401, 'Your session is invalid or has expired.', 'INVALID_SESSION');
  }
}

export function requireDatabase(_req: Request, _res: Response, next: NextFunction): void {
  if (!isDatabaseReady()) {
    throw new HttpError(
      503,
      'The account database is not available. Configure MONGODB_URI and try again.',
      'DATABASE_UNAVAILABLE',
    );
  }
  next();
}

/**
 * SameSite cookies plus an Origin check make cross-site state-changing requests
 * harder. Non-browser clients without an Origin header are still allowed.
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');
  if (!origin) {
    next();
    return;
  }

  if (!isAllowedOrigin(origin)) {
    throw new HttpError(403, 'Request origin is not allowed.', 'INVALID_ORIGIN');
  }
  next();
}
