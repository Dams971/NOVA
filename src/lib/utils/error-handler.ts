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
    return JSON.stringify(error);
  } catch {
    return String(error);
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
    isErrorWithMessage(error) &&
    (
      isErrorWithCode(error) ||
      'constraint' in (error as Record<string, unknown>)
    )
  );
};

/**
 * Safely extracts error code from unknown error types
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (isErrorWithCode(error)) {
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
    error: error ? getErrorMessage(error) : undefined,
    code: code || getErrorCode(error),
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
  const message = getErrorMessage(error).toLowerCase();
  return patterns.some(pattern => message.includes(pattern.toLowerCase()));
};

/**
 * Database-specific error handling
 */
export const handleDatabaseError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(error);
  
  // Check for common database constraint violations
  if (errorContains(error, ['unique', 'duplicate', 'already exists'])) {
    return createErrorResponse(
      'This record already exists', error,
      'DUPLICATE_RECORD'
    );
  }
  
  if (errorContains(error, ['foreign key', 'constraint', 'violates'])) {
    return createErrorResponse(
      'Related record not found', error,
      'CONSTRAINT_VIOLATION'
    );
  }
  
  if (errorContains(error, ['overlapping', 'conflict'])) {
    return createErrorResponse(
      'Schedule conflict detected', error,
      'SCHEDULE_CONFLICT'
    );
  }
  
  if (errorContains(error, ['timeout', 'connection'])) {
    return createErrorResponse(
      'Database connection timeout', error,
      'DATABASE_TIMEOUT'
    );
  }
  
  // Generic database error
  return createErrorResponse(
    'Database operation failed', error,
    'DATABASE_ERROR'
  );
};

/**
 * Authentication-specific error handling
 */
export const handleAuthError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(error);
  
  if (errorContains(error, ['invalid email', 'email format'])) {
    return createErrorResponse(
      'Invalid email format', error,
      'INVALID_EMAIL'
    );
  }
  
  if (errorContains(error, ['rate limit', 'too many'])) {
    return createErrorResponse(
      'Too many requests. Please try again later.', error,
      'RATE_LIMIT_EXCEEDED'
    );
  }
  
  if (errorContains(error, ['user not found', 'not exist'])) {
    return createErrorResponse(
      'User not found', error,
      'USER_NOT_FOUND'
    );
  }
  
  if (errorContains(error, ['unauthorized', 'permission denied'])) {
    return createErrorResponse(
      'Unauthorized access', error,
      'UNAUTHORIZED'
    );
  }
  
  // Generic auth error
  return createErrorResponse(
    'Authentication failed', error,
    'AUTH_ERROR'
  );
};

/**
 * Validation-specific error handling
 */
export const handleValidationError = (error: unknown): ErrorResponse => {
  const message = getErrorMessage(error);
  
  if (errorContains(error, ['required', 'missing'])) {
    return createErrorResponse(
      'Required fields are missing', error,
      'MISSING_REQUIRED_FIELDS'
    );
  }
  
  if (errorContains(error, ['invalid format', 'format'])) {
    return createErrorResponse(
      'Invalid data format', error,
      'INVALID_FORMAT'
    );
  }
  
  if (errorContains(error, ['phone', 'telephone'])) {
    return createErrorResponse(
      'Invalid phone number format', error,
      'INVALID_PHONE'
    );
  }
  
  // Generic validation error
  return createErrorResponse(
    'Validation failed', error,
    'VALIDATION_ERROR'
  );
};

/**
 * Comprehensive error handler that categorizes errors and provides appropriate responses
 */
export const handleError = (error: unknown, context?: string): ErrorResponse => {
  const message = getErrorMessage(error);
  
  // Database errors
  if (isDatabaseError(error) || errorContains(error, ['database', 'sql', 'constraint'])) {
    return handleDatabaseError(error);
  }
  
  // Authentication errors
  if (errorContains(error, ['auth', 'login', 'token', 'session'])) {
    return handleAuthError(error);
  }
  
  // Validation errors
  if (errorContains(error, ['validation', 'invalid', 'required', 'format'])) {
    return handleValidationError(error);
  }
  
  // Network errors
  if (errorContains(error, ['network', 'fetch', 'connection', 'timeout'])) {
    return createErrorResponse(
      'Network connection error', error,
      'NETWORK_ERROR'
    );
  }
  
  // Generic error
  return createErrorResponse(
    'An unexpected error occurred', error,
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
  const errorInfo: Record<string, unknown> = {
    message: getErrorMessage(error),
    code: getErrorCode(error),
    context,
    timestamp: new Date().toISOString(),
    ...additional,
  };
  
  if (error instanceof Error) {
    errorInfo.stack = error.stack;
  }
  
  console.error('[ERROR]', errorInfo);
};