import type { User } from '../types/auth';
import { apiRequest } from './api';

export function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function loginUser(email: string, password: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logoutUser(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' });
}

export function getCurrentUser(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}

export interface ForgotPasswordResult {
  message: string;
  devResetUrl?: string;
}

export function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  return apiRequest<ForgotPasswordResult>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function resetPassword(
  token: string,
  password: string,
): Promise<{ user: User; message: string }> {
  return apiRequest<{ user: User; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}
