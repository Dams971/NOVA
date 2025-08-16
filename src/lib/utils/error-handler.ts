/**
 * NOVA - Error Handling Utilities
 * 
 * Comprehensive error handling utilities for type-safe error processing
 * and standardized error responses across the application.
 */

export interface AppError extends Error {
  code?: string;
  status?: number;
  context?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  context?: Record<string, unknown>;
}

/**
 * Safely extracts error message from unknown error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  try {
    return JSON.stringify(_error);
  } catch {
    return String(_error);
  }
};

/**
 * Type guard to check if error has message property
 */
export const isErrorWithMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

/**
 * Type guard to check if error has code property
 */
export const isErrorWithCode = (error: unknown): error is { code: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
};

/**
 * Type guard to check if error is a database error with constraint info
 */
export const isDatabaseError = (error: unknown): error is { 
  message: string; 
  code?: string;
  constraint?: string;
} => {
  return (
    isErrorWithMessage(_error) &&
    (
      isErrorWithCode(_error) ||
      'constraint' in (error as Record<string, unknown>)
    )
  );
};

/**
 * Safely extracts error code from unknown error types
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (isErrorWithCode(_error)) {
    return error.code;
  }
  
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === 'string') {
      return code;
    }
    if (typeof code === 'number') {
      return String(code);
    }
  }
  
  return undefined;
};

/**
 * Creates a standardized error response object
 */
export const createErrorResponse = (
  message: string,
  error?: unknown,
  code?: string,
  context?: Record<string, unknown>
): ErrorResponse => {
  return {
    success: false,
    message,
    error: error ? getErrorMessage(_error) : undefined,
    code: code || getErrorCode(_error),
    context,
  };
};

/**
 * Creates an AppError from unknown error types
 */
export const createAppError = (
  message: string,
  originalError?: unknown,
  code?: string,
  status?: number,
  context?: Record<string, unknown>
): AppError => {
  const error = new Error(message) as AppError;
  error.code = code || getErrorCode(originalError);
  error.status = status;
  error.context = context;
  
  // Preserve original stack trace if available
  if (originalError instanceof Error && originalError.stack) {
    error.stack = originalError.stack;
  }
  
  return error;
};

/**
 * Checks if error message contains specific patterns
 */
export const errorContains = (error: unknown, patterns: string[]): boolean => {
  const message = getErrorMessage(_error).toLowerCase();
  return patterns.some(pattern => message.includes(pattern.toLowerCase()));
};

/**
 * Database-specific error handling
 */
export const handleDatabaseError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(_error);
  
  // Check for common database constraint violations
  if (errorContains(_error, ['unique', 'duplicate', 'already exists'])) {
    return createErrorResponse(
      'This record already exists', _error,
      'DUPLICATE_RECORD'
    );
  }
  
  if (errorContains(_error, ['foreign key', 'constraint', 'violates'])) {
    return createErrorResponse(
      'Related record not found', _error,
      'CONSTRAINT_VIOLATION'
    );
  }
  
  if (errorContains(_error, ['overlapping', 'conflict'])) {
    return createErrorResponse(
      'Schedule conflict detected', _error,
      'SCHEDULE_CONFLICT'
    );
  }
  
  if (errorContains(_error, ['timeout', 'connection'])) {
    return createErrorResponse(
      'Database connection timeout', _error,
      'DATABASE_TIMEOUT'
    );
  }
  
  // Generic database error
  return createErrorResponse(
    'Database operation failed', _error,
    'DATABASE_ERROR'
  );
};

/**
 * Authentication-specific error handling
 */
export const handleAuthError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(_error);
  
  if (errorContains(_error, ['invalid email', 'email format'])) {
    return createErrorResponse(
      'Invalid email format', _error,
      'INVALID_EMAIL'
    );
  }
  
  if (errorContains(_error, ['rate limit', 'too many'])) {
    return createErrorResponse(
      'Too many requests. Please try again later.', _error,
      'RATE_LIMIT_EXCEEDED'
    );
  }
  
  if (errorContains(_error, ['user not found', 'not exist'])) {
    return createErrorResponse(
      'User not found', _error,
      'USER_NOT_FOUND'
    );
  }
  
  if (errorContains(_error, ['unauthorized', 'permission denied'])) {
    return createErrorResponse(
      'Unauthorized access', _error,
      'UNAUTHORIZED'
    );
  }
  
  // Generic auth error
  return createErrorResponse(
    'Authentication failed', _error,
    'AUTH_ERROR'
  );
};

/**
 * Validation-specific error handling
 */
export const handleValidationError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(_error);
  
  if (errorContains(_error, ['required', 'missing'])) {
    return createErrorResponse(
      'Required fields are missing', _error,
      'MISSING_REQUIRED_FIELDS'
    );
  }
  
  if (errorContains(_error, ['invalid format', 'format'])) {
    return createErrorResponse(
      'Invalid data format', _error,
      'INVALID_FORMAT'
    );
  }
  
  if (errorContains(_error, ['phone', 'telephone'])) {
    return createErrorResponse(
      'Invalid phone number format', _error,
      'INVALID_PHONE'
    );
  }
  
  // Generic validation error
  return createErrorResponse(
    'Validation failed', _error,
    'VALIDATION_ERROR'
  );
};

/**
 * Comprehensive error handler that categorizes errors and provides appropriate responses
 */
export const handleError = (error: unknown, context?: string): ErrorResponse => {
  const message = getErrorMessage(_error);
  
  // Database errors
  if (isDatabaseError(_error) || errorContains(_error, ['database', 'sql', 'constraint'])) {
    return handleDatabaseError(_error);
  }
  
  // Authentication errors
  if (errorContains(_error, ['auth', 'login', 'token', 'session'])) {
    return handleAuthError(_error);
  }
  
  // Validation errors
  if (errorContains(_error, ['validation', 'invalid', 'required', 'format'])) {
    return handleValidationError(_error);
  }
  
  // Network errors
  if (errorContains(_error, ['network', 'fetch', 'connection', 'timeout'])) {
    return createErrorResponse(
      'Network connection error', _error,
      'NETWORK_ERROR'
    );
  }
  
  // Generic error
  return createErrorResponse(
    'An unexpected error occurred', _error,
    'INTERNAL_ERROR',
    context ? { context } : undefined
  );
};

/**
 * Logs error with structured format
 */
export const logError = (
  error: unknown,
  context?: string,
  additional?: Record<string, unknown>
): void => {
  const errorInfo = {
    message: getErrorMessage(_error),
    code: getErrorCode(_error),
    context,
    timestamp: new Date().toISOString(),
    ...additional,
  };
  
  if (error instanceof Error) {
    errorInfo.stack = error.stack;
  }
  
  console.error('[ERROR]', errorInfo);
};