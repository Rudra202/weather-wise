import type { ApiEnvelope, ApiErrorBody } from '../types/auth';

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 0, code = 'NETWORK_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  return typeof value.error.message === 'string';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: signal ?? AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('The request timed out. Please try again.', 0, 'TIMEOUT');
    }
    throw new ApiError(
      'Unable to reach the server. Check that both servers are running.',
      0,
      'NETWORK_ERROR',
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError('The server returned an invalid response.', response.status, 'BAD_RESPONSE');
    }
  }

  if (!response.ok) {
    const message = isErrorBody(payload)
      ? payload.error.message
      : 'The request could not be completed.';
    const code = isErrorBody(payload) ? payload.error.code : 'REQUEST_FAILED';
    throw new ApiError(message, response.status, code);
  }

  if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
    throw new ApiError('The server returned an unexpected response.', response.status, 'BAD_RESPONSE');
  }

  return (payload as unknown as ApiEnvelope<T>).data;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
