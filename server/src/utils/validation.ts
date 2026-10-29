import { badRequest } from './httpError.js';

export function requiredString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): string {
  const { min = 1, max = 200 } = options;
  if (typeof value !== 'string') throw badRequest(`${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw badRequest(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max) throw badRequest(`${field} must be at most ${max} characters.`);
  return trimmed;
}

export function optionalString(
  value: unknown,
  field: string,
  options: { max?: number } = {},
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw badRequest(`${field} must be text.`);
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const max = options.max ?? 200;
  if (trimmed.length > max) throw badRequest(`${field} must be at most ${max} characters.`);
  return trimmed;
}

export function numberInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const candidate =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    throw badRequest(`${field} must be a valid number.`);
  }
  if (candidate < min || candidate > max) {
    throw badRequest(`${field} must be between ${min} and ${max}.`);
  }
  return candidate;
}

export function normalizeEmail(value: unknown): string {
  const email = requiredString(value, 'Email', { min: 3, max: 254 }).toLowerCase();
  // Deliberately simple but safe: reject whitespace and require a dot in the domain.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest('Please provide a valid email address.');
  }
  return email;
}

export function validatePassword(value: unknown): string {
  if (typeof value !== 'string') throw badRequest('Password is required.');
  if (value.length < 8) throw badRequest('Password must be at least 8 characters.');
  // bcrypt only uses the first 72 bytes; reject longer input rather than silently truncating.
  if (Buffer.byteLength(value, 'utf8') > 72) {
    throw badRequest('Password must be at most 72 bytes.');
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw badRequest('Password must contain at least one letter and one number.');
  }
  return value;
}
