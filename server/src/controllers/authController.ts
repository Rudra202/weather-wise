import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { User, toPublicUser, type UserDocument } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { clearSessionCookie, setSessionCookie } from '../utils/session.js';
import { normalizeEmail, requiredString, validatePassword } from '../utils/validation.js';

const BCRYPT_ROUNDS = 12;

export async function register(req: Request, res: Response): Promise<void> {
  const name = requiredString(req.body?.name, 'Name', { min: 2, max: 80 });
  const email = normalizeEmail(req.body?.email);
  const password = validatePassword(req.body?.password);

  const existing = await User.exists({ email });
  if (existing) {
    throw new HttpError(409, 'An account with that email already exists.', 'EMAIL_IN_USE');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });

  setSessionCookie(res, String(user._id));
  res.status(201).json({
    success: true,
    data: { user: toPublicUser(user as UserDocument) },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length === 0) {
    throw new HttpError(400, 'Password is required.');
  }

  // passwordHash is select:false on the model, so it must be requested explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash) {
    throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  setSessionCookie(res, String(user._id));
  res.json({
    success: true,
    data: { user: toPublicUser(user as UserDocument) },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'Authentication is required.', 'UNAUTHENTICATED');
  const user = await User.findById(req.auth.userId);
  if (!user) {
    throw new HttpError(401, 'This account no longer exists.', 'UNAUTHENTICATED');
  }
  res.json({ success: true, data: { user: toPublicUser(user as UserDocument) } });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.json({ success: true, data: { message: 'Logged out.' } });
}
