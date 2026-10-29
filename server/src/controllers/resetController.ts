import { createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { config, resetSecret } from '../config/env.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { User, toPublicUser, type UserDocument } from '../models/User.js';
import { sendResetEmail } from '../services/emailService.js';
import { HttpError } from '../utils/httpError.js';
import { setSessionCookie } from '../utils/session.js';
import { normalizeEmail, requiredString, validatePassword } from '../utils/validation.js';

const BCRYPT_ROUNDS = 12;
const GENERIC_MESSAGE = 'If that address can receive email, a password reset link has been sent.';

function hashToken(token: string): string {
  return createHmac('sha256', resetSecret).update(token).digest('hex');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const email = normalizeEmail(req.body?.email);

  const recent = await PasswordResetToken.findOne({
    email,
    consumedAt: null,
    createdAt: { $gt: new Date(Date.now() - config.resetCooldownMs) },
  })
    .select('_id')
    .lean();

  if (recent) {
    res.json({ success: true, data: { message: GENERIC_MESSAGE } });
    return;
  }

  const token = randomBytes(32).toString('hex');
  await PasswordResetToken.deleteMany({ email, consumedAt: null });
  const record = await PasswordResetToken.create({
    email,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + config.resetTtlMs),
  });

  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

  try {
    const delivered = await sendResetEmail(email, resetUrl);
    res.json({
      success: true,
      data: {
        message: GENERIC_MESSAGE,
        ...(!config.isProduction && !delivered ? { devResetUrl: resetUrl } : {}),
      },
    });
  } catch (error) {
    await PasswordResetToken.deleteOne({ _id: record._id });
    throw error;
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const token = requiredString(req.body?.token, 'Token', { min: 32, max: 128 });
  const password = validatePassword(req.body?.password);

  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).select('+tokenHash');

  if (!record) {
    throw new HttpError(400, 'That reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
  }

  const user = await User.findOne({ email: record.email }).select('+passwordHash');
  if (!user) {
    record.consumedAt = new Date();
    await record.save();
    throw new HttpError(400, 'That reset link is invalid or has expired.', 'INVALID_RESET_TOKEN');
  }

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await user.save();

  record.consumedAt = new Date();
  await record.save();

  setSessionCookie(res, String(user._id));
  res.json({
    success: true,
    data: { user: toPublicUser(user as UserDocument), message: 'Password updated.' },
  });
}
