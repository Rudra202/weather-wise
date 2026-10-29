import type { NextFunction, Request, Response } from 'express';

/**
 * Marks a response as per-user and non-cacheable. Applied to auth and favorite
 * routes so proxies, shared caches, and browsers cannot replay account data.
 */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}
