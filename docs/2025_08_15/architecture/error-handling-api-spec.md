# NOVA RDV - API Specification for Error Handling & Type Safety

## Overview

This document defines the standardized API patterns, error handling contracts, and type-safe response structures for the NOVA RDV build stabilization project. All patterns prioritize backward compatibility while improving internal type safety.

---

## Core API Patterns

### Standard Response Types

```typescript
// Core response interfaces
export interface SuccessResponse<T = unknown> {
  success: true
  message: string
  data: T
  timestamp?: string
  requestId?: string
}

export interface ErrorResponse {
  success: false
  message: string
  error: string
  details?: Record<string, unknown>
  timestamp?: string
  requestId?: string
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse
```

### HTTP Status Code Mapping

| Status Code | Usage | Error Type | Example |
|------------|-------|------------|---------|
| 200 | Successful operation | N/A | Data retrieved successfully |
| 201 | Resource created | N/A | Appointment created |
| 400 | Bad request/validation | `VALIDATION_ERROR` | Invalid phone format |
| 401 | Authentication required | `AUTH_REQUIRED` | Missing JWT token |
| 403 | Authorization failed | `ACCESS_DENIED` | Insufficient permissions |
| 404 | Resource not found | `NOT_FOUND` | Appointment not found |
| 409 | Business logic conflict | `CONFLICT` | Time slot unavailable |
| 422 | Unprocessable entity | `BUSINESS_RULE_VIOLATION` | Outside working hours |
| 500 | Internal server error | `INTERNAL_ERROR` | Database connection failed |

---

## Appointment API Specification

### POST /api/appointments/create

#### Request Schema
```typescript
interface CreateAppointmentRequest {
  patient_name: string          // 2-100 characters, letters/spaces/hyphens only
  patient_phone_e164: string    // +213[567]XXXXXXXX format
  patient_email?: string | null // Valid email format if provided
  reason?: string | null        // 0-500 characters
  start_at: string             // ISO 8601 datetime
  end_at: string               // ISO 8601 datetime
  duration_minutes?: number     // 15-180 minutes, default 30
  send_confirmation_email?: boolean // Default true
}

// Zod validation schema
const CreateAppointmentSchema = z.object({
  patient_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Name contains invalid characters"),
  
  patient_phone_e164: z.string()
    .regex(/^\+213[567]\d{8}$/, "Invalid Algerian phone number format"),
  
  patient_email: z.string()
    .email("Invalid email format")
    .optional()
    .nullable(),
  
  reason: z.string()
    .max(500, "Reason must not exceed 500 characters")
    .optional()
    .nullable(),
  
  start_at: z.string()
    .datetime("Invalid start time format"),
  
  end_at: z.string()
    .datetime("Invalid end time format"),
  
  duration_minutes: z.number()
    .int()
    .min(15, "Minimum duration is 15 minutes")
    .max(180, "Maximum duration is 180 minutes")
    .default(30),
  
  send_confirmation_email: z.boolean()
    .default(true)
})
```

#### Success Response (201)
```typescript
interface CreateAppointmentSuccessResponse {
  success: true
  message: string // "Appointment created successfully" or with email status
  data: {
    appointment: {
      id: string
      user_id: string
      patient_name: string
      patient_phone_e164: string
      patient_email: string | null
      reason: string | null
      start_at: string           // ISO 8601
      end_at: string            // ISO 8601
      status: 'PENDING'
      clinic_address: string
      duration_minutes: number
      start_at_local: string    // French formatted for Algeria timezone
      end_at_local: string      // French formatted for Algeria timezone
    }
    email_sent: boolean
  }
  timestamp: string
  requestId: string
}
```

#### Error Responses

##### Validation Error (400)
```typescript
interface ValidationErrorResponse {
  success: false
  message: "Invalid request data"
  error: "VALIDATION_ERROR"
  details: {
    field: string        // Field that failed validation
    code: string         // Specific validation error code
    expected: string     // Expected format/value
    received: unknown    // What was actually received
  }[]
  timestamp: string
  requestId: string
}

// Example validation errors
{
  "success": false,
  "message": "Invalid request data",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "patient_phone_e164",
      "code": "INVALID_FORMAT",
      "expected": "+213[567]XXXXXXXX",
      "received": "+33123456789"
    }
  ]
}
```

##### Business Logic Errors (409/422)
```typescript
// Time slot conflict (409)
{
  "success": false,
  "message": "The selected time slot is no longer available",
  "error": "SLOT_CONFLICT",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "requestId": "req_abc123"
}

// Outside working hours (422)
{
  "success": false,
  "message": "Appointments are only available between 8:00 AM and 6:00 PM (Algeria time)",
  "error": "OUTSIDE_WORKING_HOURS",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "requestId": "req_abc123"
}

// Duplicate appointment (409)
{
  "success": false,
  "message": "A patient can only have one appointment per day",
  "error": "DUPLICATE_APPOINTMENT",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "requestId": "req_abc123"
}
```

##### Internal Server Error (500)
```typescript
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "requestId": "req_abc123"
}
```

---

## Error Handling Patterns

### Safe Error Processing
```typescript
// Type-safe error message extraction utility
export function getErrorMessage(error: unknown): string {
  // Handle Error instances
  if (error instanceof Error) {
    return error.message
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error
  }
  
  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred'
}

// Database error type narrowing
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error !== null &&
         typeof error === 'object' &&
         'message' in error &&
         typeof (error as { message: unknown }).message === 'string' &&
         ('code' in error || 'constraint' in error)
}

// Specific database error handling
export function handleDatabaseError(error: unknown): ErrorResponse {
  if (!isDatabaseError(error)) {
    return {
      success: false,
      message: 'Database operation failed',
      error: 'DATABASE_ERROR'
    }
  }

  // Handle specific database constraints
  if (error.message.includes('overlapping')) {
    return {
      success: false,
      message: 'The selected time slot is no longer available',
      error: 'SLOT_CONFLICT'
    }
  }

  if (error.message.includes('duplicate key')) {
    return {
      success: false,
      message: 'This appointment already exists',
      error: 'DUPLICATE_APPOINTMENT'
    }
  }

  // Generic database error
  return {
    success: false,
    message: 'Database operation failed',
    error: 'DATABASE_ERROR'
  }
}
```

### API Route Handler Template
```typescript
// Standard error-safe API route pattern
export async function POST(request: Request): Promise<NextResponse<ApiResponse<AppointmentData>>> {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()

  try {
    // 1. Request parsing with error handling
    let body: unknown
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON in request body',
          error: 'INVALID_JSON',
          timestamp,
          requestId
        },
        { status: 400 }
      )
    }

    // 2. Input validation
    const validationResult = CreateAppointmentSchema.safeParse(body)
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        code: err.code,
        expected: err.message,
        received: err.input
      }))

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          error: 'VALIDATION_ERROR',
          details: validationErrors,
          timestamp,
          requestId
        },
        { status: 400 }
      )
    }

    // 3. Business logic with proper error handling
    const appointmentData = validationResult.data
    
    try {
      const result = await createAppointmentService(appointmentData)
      
      return NextResponse.json(
        {
          success: true,
          message: 'Appointment created successfully',
          data: result,
          timestamp,
          requestId
        },
        { status: 201 }
      )
    } catch (businessError) {
      // Handle specific business logic errors
      if (isDatabaseError(businessError)) {
        const dbErrorResponse = handleDatabaseError(businessError)
        return NextResponse.json(
          {
            ...dbErrorResponse,
            timestamp,
            requestId
          },
          { status: 409 }
        )
      }

      // Handle other business errors
      const errorMessage = getErrorMessage(businessError)
      if (errorMessage.includes('outside working hours')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Appointments are only available between 8:00 AM and 6:00 PM (Algeria time)',
            error: 'OUTSIDE_WORKING_HOURS',
            timestamp,
            requestId
          },
          { status: 422 }
        )
      }

      // Generic business error
      return NextResponse.json(
        {
          success: false,
          message: 'Business logic error occurred',
          error: 'BUSINESS_ERROR',
          timestamp,
          requestId
        },
        { status: 422 }
      )
    }

  } catch (error) {
    // 4. Global error handler
    console.error('API Route Error:', {
      requestId,
      timestamp,
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp,
        requestId
      },
      { status: 500 }
    )
  }
}

// Helper function for request ID generation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

---

## Validation Schemas

### Phone Number Validation
```typescript
// Algerian phone number validation with detailed errors
export const AlgerianPhoneSchema = z.string()
  .refine(
    (phone) => /^\+213[567]\d{8}$/.test(phone),
    {
      message: "Phone number must be Algerian format: +213 followed by 9 digits starting with 5, 6, or 7",
      path: ["patient_phone_e164"]
    }
  )

// Phone number normalization utility
export function normalizeAlgerianPhone(phone: string): string {
  // Remove spaces and format variations
  const cleaned = phone.replace(/\s/g, '')
  
  // Convert local format to E164
  if (/^0[567]\d{8}$/.test(cleaned)) {
    return `+213${cleaned.slice(1)}`
  }
  
  // Convert international format without +
  if (/^213[567]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`
  }
  
  // Return as-is if already in correct format
  return cleaned
}
```

### Date/Time Validation
```typescript
// Algeria timezone-aware datetime validation
export const AlgeriaDateTimeSchema = z.string()
  .datetime()
  .refine(
    (dateStr) => {
      const date = new Date(dateStr)
      const now = new Date()
      return date > now
    },
    {
      message: "Appointment time must be in the future"
    }
  )
  .refine(
    (dateStr) => {
      const date = new Date(dateStr)
      const algeriaHour = date.getUTCHours() + 1 // UTC+1 for Algeria
      return algeriaHour >= 8 && algeriaHour < 18 && algeriaHour !== 12
    },
    {
      message: "Appointments only available 8AM-6PM Algeria time, excluding lunch (12PM-1PM)"
    }
  )
```

### French Text Validation
```typescript
// French text validation with proper character support
export const FrenchTextSchema = z.string()
  .min(1, "Text cannot be empty")
  .max(500, "Text too long")
  .refine(
    (text) => /^[a-zA-ZÀ-ÿ\s\-'.,!?]+$/.test(text),
    {
      message: "Text contains invalid characters"
    }
  )
```

---

## Response Formatting

### Success Response Builder
```typescript
export function createSuccessResponse<T>(
  data: T,
  message: string,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId })
  }
}
```

### Error Response Builder
```typescript
export function createErrorResponse(
  error: string,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(requestId && { requestId })
  }
}
```

### French Language Support
```typescript
// French error messages for patient-facing responses
export const FrenchErrorMessages = {
  VALIDATION_ERROR: "Les informations fournies ne sont pas valides",
  SLOT_CONFLICT: "Ce créneau horaire n'est plus disponible",
  OUTSIDE_WORKING_HOURS: "Les rendez-vous sont disponibles de 8h à 18h (heure d'Algérie)",
  DUPLICATE_APPOINTMENT: "Un seul rendez-vous par jour est autorisé par patient",
  INTERNAL_ERROR: "Une erreur technique s'est produite. Veuillez réessayer.",
  INVALID_PHONE_FORMAT: "Format de téléphone invalide. Utilisez +213XXXXXXXXX",
  INVALID_EMAIL_FORMAT: "Format d'email invalide",
  PAST_APPOINTMENT_TIME: "L'heure du rendez-vous doit être dans le futur",
  LUNCH_BREAK: "Pause déjeuner : rendez-vous indisponibles entre 12h et 13h"
} as const

// Utility to get French error message
export function getFrenchErrorMessage(errorCode: string): string {
  return FrenchErrorMessages[errorCode as keyof typeof FrenchErrorMessages] || 
         "Une erreur s'est produite"
}
```

---

## Integration Patterns

### Database Service Integration
```typescript
// Type-safe database service wrapper
export class AppointmentService {
  async create(data: CreateAppointmentRequest): Promise<Result<Appointment, AppError>> {
    try {
      const appointment = await this.repository.create(data)
      return { success: true, data: appointment }
    } catch (error) {
      if (isDatabaseError(error)) {
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: this.mapDatabaseError(error),
            statusCode: 409
          }
        }
      }
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: getErrorMessage(error),
          statusCode: 500
        }
      }
    }
  }
  
  private mapDatabaseError(error: DatabaseError): string {
    if (error.message.includes('overlapping')) {
      return 'The selected time slot is no longer available'
    }
    if (error.message.includes('duplicate')) {
      return 'This appointment already exists'
    }
    return 'Database operation failed'
  }
}
```

### Email Service Integration
```typescript
// Safe email service wrapper
export class EmailServiceWrapper {
  async sendConfirmation(
    email: string, 
    appointment: Appointment
  ): Promise<Result<boolean, AppError>> {
    try {
      await this.emailService.sendAppointmentConfirmation(email, appointment)
      return { success: true, data: true }
    } catch (error) {
      // Email failures should not break appointment creation
      console.error('Email sending failed:', getErrorMessage(error))
      return { 
        success: false, 
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: 'Failed to send confirmation email',
          statusCode: 200 // Don't fail the request
        }
      }
    }
  }
}
```

---

## Testing Contracts

### API Response Testing
```typescript
// Test utilities for API responses
export function assertSuccessResponse<T>(
  response: ApiResponse<T>
): asserts response is SuccessResponse<T> {
  expect(response.success).toBe(true)
  expect(response.message).toBeDefined()
  expect(response.data).toBeDefined()
  expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
}

export function assertErrorResponse(
  response: ApiResponse<unknown>,
  expectedError: string
): asserts response is ErrorResponse {
  expect(response.success).toBe(false)
  expect(response.error).toBe(expectedError)
  expect(response.message).toBeDefined()
  expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
}
```

### Contract Testing Examples
```typescript
describe('POST /api/appointments/create', () => {
  it('should create appointment with valid data', async () => {
    const validRequest: CreateAppointmentRequest = {
      patient_name: 'Ahmed Benali',
      patient_phone_e164: '+213555123456',
      patient_email: 'ahmed@example.com',
      start_at: '2025-08-16T09:00:00.000Z',
      end_at: '2025-08-16T09:30:00.000Z'
    }
    
    const response = await POST(new Request('/', { 
      method: 'POST', 
      body: JSON.stringify(validRequest) 
    }))
    
    const data = await response.json()
    assertSuccessResponse(data)
    expect(data.data.appointment.patient_name).toBe('Ahmed Benali')
  })
  
  it('should return validation error for invalid phone', async () => {
    const invalidRequest = {
      patient_name: 'Ahmed Benali',
      patient_phone_e164: '+33123456789', // French number instead of Algerian
      start_at: '2025-08-16T09:00:00.000Z',
      end_at: '2025-08-16T09:30:00.000Z'
    }
    
    const response = await POST(new Request('/', { 
      method: 'POST', 
      body: JSON.stringify(invalidRequest) 
    }))
    
    expect(response.status).toBe(400)
    const data = await response.json()
    assertErrorResponse(data, 'VALIDATION_ERROR')
    expect(data.details[0].field).toBe('patient_phone_e164')
  })
})
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-15  
**Status**: Ready for implementation  
**Dependencies**: Error handling utilities, type system architecture