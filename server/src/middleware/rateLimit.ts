import { rateLimit } from 'express-rate-limit';

function jsonLimitMessage(message: string) {
  return {
    success: false,
    error: { code: 'RATE_LIMITED', message },
  };
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many authentication attempts. Please try again later.'),
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many searches. Please slow down and try again.'),
});

export const forecastLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many weather requests. Please slow down and try again.'),
});

export const favoritesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many favorite changes. Please slow down and try again.'),
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many password reset requests. Please try again later.'),
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many password reset attempts. Please try again later.'),
});

export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: jsonLimitMessage('Too many sign-in attempts. Please try again later.'),
});
