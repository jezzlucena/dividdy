import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export const errorHandler: ErrorRequestHandler = (err: ApiError, _req, res, _next) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(error.message);
    });

    res.status(400).json({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Handle custom API errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    message,
    code,
    ...(err.details && { details: err.details }),
  });
};

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, string[]>) {
    super(message, 400, 'BAD_REQUEST');
    this.details = details;
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

