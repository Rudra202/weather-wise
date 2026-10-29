import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { forgotPassword, resetPassword } from '../controllers/resetController.js';
import { oauthCallback, oauthProviderStatus, startOAuth } from '../controllers/oauthController.js';
import { requireAuth, requireDatabase, verifyOrigin } from '../middleware/auth.js';
import { noStore } from '../middleware/noStore.js';
import {
  authLimiter,
  forgotPasswordLimiter,
  oauthLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.use(noStore, verifyOrigin);

authRouter.post('/register', authLimiter, requireDatabase, register);
authRouter.post('/login', authLimiter, requireDatabase, login);
authRouter.get('/me', requireAuth, requireDatabase, me);
authRouter.post('/logout', logout);

authRouter.post('/forgot-password', forgotPasswordLimiter, requireDatabase, forgotPassword);
authRouter.post('/reset-password', resetPasswordLimiter, requireDatabase, resetPassword);

authRouter.get('/oauth/providers', oauthProviderStatus);
authRouter.get('/oauth/:provider', oauthLimiter, startOAuth);
authRouter.get('/oauth/:provider/callback', oauthLimiter, oauthCallback);
