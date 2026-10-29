export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'REQUEST_FAILED', details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, code = 'VALIDATION_ERROR', details?: unknown): HttpError {
  return new HttpError(400, message, code, details);
}
