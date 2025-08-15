import { NextResponse } from 'next/server';

/**
 * RFC 7807 Problem Details for HTTP APIs
 * Standardized error responses for NOVA platform
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: any; // Additional problem-specific fields
}

export class HttpProblem extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly extensions: Record<string, any>;

  constructor(
    status: number,
    title: string,
    detail?: string,
    type: string = 'about:blank',
    instance?: string,
    extensions?: Record<string, any>
  ) {
    super(title);
    this.name = 'HttpProblem';
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
    this.instance = instance;
    this.extensions = extensions || {};
  }

  toJSON(): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      ...(this.detail && { detail: this.detail }),
      ...(this.instance && { instance: this.instance }),
      ...this.extensions,
    };
  }

  toResponse(): NextResponse {
    return NextResponse.json(this.toJSON(), {
      status: this.status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    });
  }
}

/**
 * Predefined problem types for NOVA platform
 */
export class Problems {
  // Authentication & Authorization
  static unauthorized(detail?: string): HttpProblem {
    return new HttpProblem(
      401,
      'Unauthorized',
      detail || 'Authentication credentials are missing or invalid',
      'https://nova-dental.fr/problems/unauthorized'
    );
  }

  static forbidden(detail?: string): HttpProblem {
    return new HttpProblem(
      403,
      'Forbidden',
      detail || 'You do not have permission to access this resource',
      'https://nova-dental.fr/problems/forbidden'
    );
  }

  static invalidCredentials(): HttpProblem {
    return new HttpProblem(
      401,
      'Invalid Credentials',
      'The provided email or password is incorrect',
      'https://nova-dental.fr/problems/invalid-credentials'
    );
  }

  static mfaRequired(tempToken?: string): HttpProblem {
    return new HttpProblem(
      401,
      'Multi-Factor Authentication Required',
      'Please provide your MFA verification code',
      'https://nova-dental.fr/problems/mfa-required',
      undefined,
      { tempToken }
    );
  }

  static invalidMfaToken(): HttpProblem {
    return new HttpProblem(
      400,
      'Invalid MFA Token',
      'The provided MFA verification code is incorrect or expired',
      'https://nova-dental.fr/problems/invalid-mfa-token'
    );
  }

  static tokenExpired(): HttpProblem {
    return new HttpProblem(
      401,
      'Token Expired',
      'Your session has expired. Please log in again',
      'https://nova-dental.fr/problems/token-expired'
    );
  }

  static tokenRevoked(): HttpProblem {
    return new HttpProblem(
      401,
      'Token Revoked',
      'Your session has been revoked. Please log in again',
      'https://nova-dental.fr/problems/token-revoked'
    );
  }

  // Rate Limiting
  static rateLimitExceeded(resetTime?: Date, limit?: number): HttpProblem {
    const extensions: Record<string, any> = {};
    if (resetTime) extensions.resetTime = resetTime.toISOString();
    if (limit) extensions.limit = limit;

    return new HttpProblem(
      429,
      'Rate Limit Exceeded',
      'You have exceeded the request rate limit. Please try again later',
      'https://nova-dental.fr/problems/rate-limit-exceeded',
      undefined,
      extensions
    );
  }

  // Validation Errors
  static validationError(errors: Array<{ field: string; message: string }>): HttpProblem {
    return new HttpProblem(
      400,
      'Validation Error',
      'One or more fields have invalid values',
      'https://nova-dental.fr/problems/validation-error',
      undefined,
      { errors }
    );
  }

  static requiredField(field: string): HttpProblem {
    return new HttpProblem(
      400,
      'Required Field Missing',
      `The field '${field}' is required`,
      'https://nova-dental.fr/problems/required-field-missing',
      undefined,
      { field }
    );
  }

  static invalidFormat(field: string, expectedFormat: string): HttpProblem {
    return new HttpProblem(
      400,
      'Invalid Format',
      `The field '${field}' has an invalid format. Expected: ${expectedFormat}`,
      'https://nova-dental.fr/problems/invalid-format',
      undefined,
      { field, expectedFormat }
    );
  }

  // Resource Management
  static resourceNotFound(resourceType: string, identifier?: string): HttpProblem {
    const detail = identifier 
      ? `${resourceType} with identifier '${identifier}' was not found`
      : `${resourceType} was not found`;

    return new HttpProblem(
      404,
      'Resource Not Found',
      detail,
      'https://nova-dental.fr/problems/resource-not-found',
      undefined,
      { resourceType, identifier }
    );
  }

  static resourceConflict(resourceType: string, conflictReason?: string): HttpProblem {
    return new HttpProblem(
      409,
      'Resource Conflict',
      conflictReason || `The ${resourceType} conflicts with existing data`,
      'https://nova-dental.fr/problems/resource-conflict',
      undefined,
      { resourceType, conflictReason }
    );
  }

  static resourceGone(resourceType: string): HttpProblem {
    return new HttpProblem(
      410,
      'Resource Gone',
      `The ${resourceType} is no longer available`,
      'https://nova-dental.fr/problems/resource-gone',
      undefined,
      { resourceType }
    );
  }

  // Appointment-specific Problems
  static appointmentConflict(conflicts: Array<{ id: string; startTime: string; endTime: string }>): HttpProblem {
    return new HttpProblem(
      409,
      'Appointment Conflict',
      'The requested time slot conflicts with existing appointments',
      'https://nova-dental.fr/problems/appointment-conflict',
      undefined,
      { conflicts }
    );
  }

  static appointmentSlotUnavailable(requestedTime: string): HttpProblem {
    return new HttpProblem(
      422,
      'Appointment Slot Unavailable',
      'The requested appointment slot is no longer available',
      'https://nova-dental.fr/problems/appointment-slot-unavailable',
      undefined,
      { requestedTime }
    );
  }

  static appointmentTooSoon(): HttpProblem {
    return new HttpProblem(
      422,
      'Appointment Too Soon',
      'Appointments must be scheduled at least 2 hours in advance',
      'https://nova-dental.fr/problems/appointment-too-soon'
    );
  }

  static appointmentOutsideHours(): HttpProblem {
    return new HttpProblem(
      422,
      'Appointment Outside Business Hours',
      'Appointments can only be scheduled during business hours',
      'https://nova-dental.fr/problems/appointment-outside-hours'
    );
  }

  static appointmentCancellationTooLate(): HttpProblem {
    return new HttpProblem(
      422,
      'Cancellation Too Late',
      'Appointments cannot be cancelled less than 24 hours before the scheduled time',
      'https://nova-dental.fr/problems/appointment-cancellation-too-late'
    );
  }

  // Tenant/Cabinet-specific Problems
  static cabinetAccessDenied(cabinetId: string): HttpProblem {
    return new HttpProblem(
      403,
      'Cabinet Access Denied',
      `You do not have access to cabinet '${cabinetId}'`,
      'https://nova-dental.fr/problems/cabinet-access-denied',
      undefined,
      { cabinetId }
    );
  }

  static cabinetInactive(cabinetId: string): HttpProblem {
    return new HttpProblem(
      422,
      'Cabinet Inactive',
      `Cabinet '${cabinetId}' is currently inactive`,
      'https://nova-dental.fr/problems/cabinet-inactive',
      undefined,
      { cabinetId }
    );
  }

  static cabinetMaintenanceMode(cabinetId: string, estimatedEndTime?: Date): HttpProblem {
    const extensions: Record<string, any> = { cabinetId };
    if (estimatedEndTime) extensions.estimatedEndTime = estimatedEndTime.toISOString();

    return new HttpProblem(
      503,
      'Cabinet Under Maintenance',
      `Cabinet '${cabinetId}' is currently under maintenance`,
      'https://nova-dental.fr/problems/cabinet-maintenance',
      undefined,
      extensions
    );
  }

  // Patient-specific Problems
  static patientAlreadyExists(email: string): HttpProblem {
    return new HttpProblem(
      409,
      'Patient Already Exists',
      `A patient with email '${email}' already exists in this cabinet`,
      'https://nova-dental.fr/problems/patient-already-exists',
      undefined,
      { email }
    );
  }

  static patientInactive(patientId: string): HttpProblem {
    return new HttpProblem(
      422,
      'Patient Inactive',
      'Cannot perform operations on an inactive patient',
      'https://nova-dental.fr/problems/patient-inactive',
      undefined,
      { patientId }
    );
  }

  // Medical/Healthcare-specific Problems
  static medicalRecordRequired(): HttpProblem {
    return new HttpProblem(
      422,
      'Medical Record Required',
      'A medical record or consent form is required for this operation',
      'https://nova-dental.fr/problems/medical-record-required'
    );
  }

  static allergyContraindication(allergies: string[]): HttpProblem {
    return new HttpProblem(
      422,
      'Allergy Contraindication',
      'The selected treatment conflicts with patient allergies',
      'https://nova-dental.fr/problems/allergy-contraindication',
      undefined,
      { allergies }
    );
  }

  static consentRequired(consentType: string): HttpProblem {
    return new HttpProblem(
      422,
      'Patient Consent Required',
      `Patient consent is required for ${consentType}`,
      'https://nova-dental.fr/problems/consent-required',
      undefined,
      { consentType }
    );
  }

  // System Problems
  static internalServerError(detail?: string): HttpProblem {
    return new HttpProblem(
      500,
      'Internal Server Error',
      detail || 'An unexpected error occurred',
      'https://nova-dental.fr/problems/internal-server-error'
    );
  }

  static serviceUnavailable(service?: string, estimatedRecovery?: Date): HttpProblem {
    const extensions: Record<string, any> = {};
    if (service) extensions.service = service;
    if (estimatedRecovery) extensions.estimatedRecovery = estimatedRecovery.toISOString();

    return new HttpProblem(
      503,
      'Service Unavailable',
      service ? `The ${service} service is currently unavailable` : 'The service is currently unavailable',
      'https://nova-dental.fr/problems/service-unavailable',
      undefined,
      extensions
    );
  }

  static maintenanceMode(estimatedEndTime?: Date): HttpProblem {
    const extensions: Record<string, any> = {};
    if (estimatedEndTime) extensions.estimatedEndTime = estimatedEndTime.toISOString();

    return new HttpProblem(
      503,
      'System Under Maintenance',
      'The system is currently under maintenance',
      'https://nova-dental.fr/problems/maintenance-mode',
      undefined,
      extensions
    );
  }

  static databaseError(): HttpProblem {
    return new HttpProblem(
      503,
      'Database Unavailable',
      'Database connection is temporarily unavailable',
      'https://nova-dental.fr/problems/database-error'
    );
  }

  // File/Upload Problems
  static fileTooLarge(maxSize: number): HttpProblem {
    return new HttpProblem(
      413,
      'File Too Large',
      `File size exceeds the maximum limit of ${maxSize} bytes`,
      'https://nova-dental.fr/problems/file-too-large',
      undefined,
      { maxSize }
    );
  }

  static unsupportedFileType(allowedTypes: string[]): HttpProblem {
    return new HttpProblem(
      422,
      'Unsupported File Type',
      `File type is not supported. Allowed types: ${allowedTypes.join(', ')}`,
      'https://nova-dental.fr/problems/unsupported-file-type',
      undefined,
      { allowedTypes }
    );
  }

  static fileNotFound(filename: string): HttpProblem {
    return new HttpProblem(
      404,
      'File Not Found',
      `File '${filename}' was not found`,
      'https://nova-dental.fr/problems/file-not-found',
      undefined,
      { filename }
    );
  }
}

/**
 * Utility functions for problem responses
 */
export function createProblemResponse(problem: HttpProblem): NextResponse {
  return problem.toResponse();
}

export function isProblemResponse(response: any): response is ProblemDetails {
  return (
    typeof response === 'object' &&
    response !== null &&
    'type' in response &&
    'title' in response &&
    'status' in response
  );
}

/**
 * Error handler middleware for converting errors to problem responses
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof HttpProblem) {
    return error.toResponse();
  }

  if (error instanceof Error) {
    // Map common errors to problems
    if (error.name === 'ValidationError') {
      return Problems.validationError([{ field: 'unknown', message: error.message }]).toResponse();
    }

    if (error.name === 'CastError') {
      return Problems.invalidFormat('id', 'valid identifier').toResponse();
    }

    if (error.name === 'MongoError' || error.name === 'DatabaseError') {
      return Problems.databaseError().toResponse();
    }
  }

  // Default to internal server error
  return Problems.internalServerError().toResponse();
}

export type { ProblemDetails };