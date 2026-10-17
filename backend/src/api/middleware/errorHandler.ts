/**
 * Middleware: the single application error handler.
 *
 * Every route funnels its failures here via `next(error)`. This is the only
 * error handler mounted on the app — previously there were two: this one
 * (which forwards `details`) was never mounted, while an inline handler in
 * app.ts served requests and silently dropped `details`, so the documented
 * `error: { code, message, details }` contract did not actually hold.
 *
 * Rules:
 * - An `AppError` carries the status, code and optional field-level `details`
 *   the API promises. Its message is safe to show because we wrote it.
 * - Anything else is a 500. Its message can contain driver/library internals,
 *   so it is only exposed outside production.
 * - Stack traces are logged, never returned to clients.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types';
import logger from '../../utils/logger';

/** Errors raised by middleware such as body-parser carry a status, not a code. */
interface HttpishError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Request error', error);

  const candidate = error as HttpishError;
  const isAppError = error instanceof AppError;
  const statusCode = candidate.statusCode || candidate.status || 500;

  // Read at request time rather than from the frozen config so the behaviour is
  // observable in tests.
  const isProduction = process.env.NODE_ENV === 'production';

  // Field-level details are part of the contract; only forward them for errors
  // we raised deliberately.
  const details = isAppError ? (error as AppError).details : undefined;

  const message =
    statusCode >= 500 && !isAppError && isProduction
      ? 'Internal Server Error'
      : candidate.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: isAppError
        ? (error as AppError).code
        : candidate.code || 'INTERNAL_SERVER_ERROR',
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date(),
    requestId: (res as unknown as { locals?: { requestId?: string } }).locals
      ?.requestId,
  });
}

export default errorHandler;
