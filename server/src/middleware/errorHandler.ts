import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found.`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'One or more fields are invalid.' },
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'The supplied identifier is invalid.' },
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE', message: 'That record already exists.' },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
    });
    return;
  }

  console.error('[error] Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction
        ? 'Something went wrong. Please try again later.'
        : error instanceof Error
          ? error.message
          : 'Something went wrong.',
    },
  });
};
