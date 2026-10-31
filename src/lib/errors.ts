export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INVALID_INPUT'
  | 'SERVER';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    options: { code?: AppErrorCode; status?: number; fieldErrors?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code ?? 'SERVER';
    this.status = options.status ?? 500;
    this.fieldErrors = options.fieldErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Please sign in to continue.') {
    super(message, { code: 'UNAUTHENTICATED', status: 401 });
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, { code: 'FORBIDDEN', status: 403 });
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested item was not found.') {
    super(message, { code: 'NOT_FOUND', status: 404 });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Please check the submitted information.', fieldErrors?: Record<string, string>) {
    super(message, { code: 'VALIDATION', status: 400, fieldErrors });
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'This change conflicts with an existing record.') {
    super(message, { code: 'CONFLICT', status: 409 });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many attempts. Please wait and try again.') {
    super(message, { code: 'RATE_LIMITED', status: 429 });
    this.name = 'RateLimitError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toActionError(error: unknown): {
  ok: false;
  code: AppErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
} {
  if (isAppError(error)) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  if (error instanceof Error) {
    console.error('[action-error]', error.message);
  } else {
    console.error('[action-error]', error);
  }
  return {
    ok: false,
    code: 'SERVER',
    message: 'Something went wrong. Please try again.',
  };
}
