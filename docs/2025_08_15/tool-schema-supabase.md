# Tool Schema - Supabase Integration for NOVA RDV+

## Overview
Complete JSON Schema for the `rdv_json` tool with Supabase authentication and IONOS SMTP integration. This tool provides secure, schema-compliant responses for the NOVA dental appointment system.

## Core Principles
- **Security First**: Supabase RLS ensures data isolation
- **JSON-Only Responses**: All AI responses via `rdv_json` tool
- **Algeria-Specific**: Phone validation (+213), timezone (Africa/Algiers)
- **Email Integration**: IONOS SMTP for transactional emails

## Schema Definition

```json
{
  "name": "rdv_json",
  "description": "Handle all dental appointment booking operations with Supabase backend",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "AUTH_STATUS",
          "SIGN_IN_OTP", 
          "SIGN_UP",
          "VERIFY_OTP",
          "GET_SLOTS",
          "BOOK_APPOINTMENT",
          "CONFIRM_APPOINTMENT",
          "GET_USER_APPOINTMENTS",
          "CANCEL_APPOINTMENT",
          "SEND_EMAIL_SUMMARY",
          "RECORD_CONSENT",
          "VALIDATE_PHONE",
          "VALIDATE_EMAIL",
          "HANDOFF_HUMAN",
          "ERROR_RESPONSE"
        ],
        "description": "The operation to perform"
      },
      "data": {
        "type": "object",
        "description": "Action-specific data payload",
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "description": "User's email address"
          },
          "phone_e164": {
            "type": "string",
            "pattern": "^\\+213[567]\\d{8}$",
            "description": "Algerian phone number in E.164 format"
          },
          "patient_name": {
            "type": "string",
            "minLength": 2,
            "maxLength": 100,
            "description": "Full name of the patient"
          },
          "appointment_reason": {
            "type": "string",
            "maxLength": 500,
            "description": "Reason for the appointment"
          },
          "preferred_date": {
            "type": "string",
            "format": "date",
            "description": "Preferred appointment date (YYYY-MM-DD)"
          },
          "preferred_time": {
            "type": "string",
            "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
            "description": "Preferred time in HH:MM format (24h)"
          },
          "start_at": {
            "type": "string",
            "format": "date-time",
            "description": "Appointment start time in ISO 8601 format"
          },
          "end_at": {
            "type": "string",
            "format": "date-time", 
            "description": "Appointment end time in ISO 8601 format"
          },
          "duration_minutes": {
            "type": "integer",
            "minimum": 15,
            "maximum": 120,
            "default": 30,
            "description": "Appointment duration in minutes"
          },
          "appointment_id": {
            "type": "string",
            "format": "uuid",
            "description": "UUID of the appointment"
          },
          "consent_type": {
            "type": "string",
            "enum": ["email_marketing", "data_processing", "appointment_reminders"],
            "description": "Type of consent being recorded"
          },
          "consent_accepted": {
            "type": "boolean",
            "description": "Whether consent was accepted"
          },
          "otp_token": {
            "type": "string",
            "minLength": 6,
            "maxLength": 6,
            "pattern": "^\\d{6}$",
            "description": "6-digit OTP verification code"
          },
          "send_email": {
            "type": "boolean",
            "default": true,
            "description": "Whether to send confirmation email"
          },
          "message": {
            "type": "string",
            "description": "User message or additional context"
          },
          "error_context": {
            "type": "string",
            "description": "Context information for error responses"
          }
        }
      },
      "response": {
        "type": "object",
        "required": ["success", "action", "message"],
        "properties": {
          "success": {
            "type": "boolean",
            "description": "Whether the operation was successful"
          },
          "action": {
            "type": "string",
            "description": "The action that was performed"
          },
          "message": {
            "type": "string",
            "description": "Human-readable message in French"
          },
          "data": {
            "type": "object",
            "description": "Response data specific to the action",
            "properties": {
              "user_id": {
                "type": "string",
                "format": "uuid",
                "description": "Supabase user UUID"
              },
              "auth_status": {
                "type": "string",
                "enum": ["authenticated", "unauthenticated", "pending_verification"],
                "description": "Current authentication status"
              },
              "user_email": {
                "type": "string",
                "format": "email",
                "description": "Authenticated user's email"
              },
              "profile": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "phone_e164": {"type": "string"},
                  "email": {"type": "string"}
                }
              },
              "slots": {
                "type": "array",
                "description": "Available appointment slots",
                "items": {
                  "type": "object",
                  "properties": {
                    "start_iso": {"type": "string", "format": "date-time"},
                    "end_iso": {"type": "string", "format": "date-time"},
                    "available": {"type": "boolean"},
                    "display_time": {"type": "string"},
                    "display_date": {"type": "string"}
                  }
                }
              },
              "appointment": {
                "type": "object",
                "properties": {
                  "id": {"type": "string", "format": "uuid"},
                  "patient_name": {"type": "string"},
                  "patient_phone_e164": {"type": "string"},
                  "patient_email": {"type": "string"},
                  "reason": {"type": "string"},
                  "start_at": {"type": "string", "format": "date-time"},
                  "end_at": {"type": "string", "format": "date-time"},
                  "status": {
                    "type": "string",
                    "enum": ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
                  },
                  "clinic_address": {"type": "string"},
                  "created_at": {"type": "string", "format": "date-time"}
                }
              },
              "appointments": {
                "type": "array",
                "description": "List of user's appointments",
                "items": {"$ref": "#/properties/response/properties/data/properties/appointment"}
              },
              "email_sent": {
                "type": "boolean",
                "description": "Whether confirmation email was sent"
              },
              "validation_result": {
                "type": "object",
                "properties": {
                  "valid": {"type": "boolean"},
                  "formatted": {"type": "string"},
                  "error": {"type": "string"}
                }
              },
              "timezone": {
                "type": "string",
                "default": "Africa/Algiers",
                "description": "Clinic timezone"
              },
              "clinic_address": {
                "type": "string",
                "default": "Cité 109, Daboussy El Achour, Alger",
                "description": "Clinic address"
              }
            }
          },
          "next_action": {
            "type": "string",
            "description": "Suggested next action for the user"
          },
          "error": {
            "type": "object",
            "properties": {
              "code": {"type": "string"},
              "message": {"type": "string"},
              "details": {"type": "string"}
            }
          }
        }
      }
    },
    "required": ["action"],
    "additionalProperties": false
  }
}
```

## Action Specifications

### 1. AUTH_STATUS
Check current authentication status.

**Request:**
```json
{
  "action": "AUTH_STATUS"
}
```

**Response:**
```json
{
  "success": true,
  "action": "AUTH_STATUS",
  "message": "Statut d'authentification vérifié",
  "data": {
    "auth_status": "authenticated|unauthenticated|pending_verification",
    "user_id": "uuid-string",
    "user_email": "user@example.com",
    "profile": {
      "name": "Jean Dupont",
      "phone_e164": "+213567123456",
      "email": "jean@example.com"
    }
  }
}
```

### 2. SIGN_IN_OTP
Send OTP for existing user or initiate account creation.

**Request:**
```json
{
  "action": "SIGN_IN_OTP",
  "data": {
    "email": "user@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "SIGN_IN_OTP",
  "message": "Code de vérification envoyé à votre adresse email",
  "data": {
    "auth_status": "pending_verification",
    "email_sent": true
  },
  "next_action": "VERIFY_OTP"
}
```

### 3. SIGN_UP
Create new user account with profile information.

**Request:**
```json
{
  "action": "SIGN_UP",
  "data": {
    "email": "nouveau@example.com",
    "patient_name": "Marie Dubois",
    "phone_e164": "+213567123456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "SIGN_UP",
  "message": "Compte créé avec succès. Vérifiez votre email.",
  "data": {
    "user_id": "uuid-string",
    "auth_status": "pending_verification",
    "profile": {
      "name": "Marie Dubois",
      "phone_e164": "+213567123456",
      "email": "nouveau@example.com"
    }
  },
  "next_action": "VERIFY_OTP"
}
```

### 4. VERIFY_OTP
Verify OTP code from email.

**Request:**
```json
{
  "action": "VERIFY_OTP",
  "data": {
    "email": "user@example.com",
    "otp_token": "123456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "VERIFY_OTP",
  "message": "Authentification réussie",
  "data": {
    "auth_status": "authenticated",
    "user_id": "uuid-string",
    "user_email": "user@example.com"
  },
  "next_action": "GET_SLOTS"
}
```

### 5. GET_SLOTS
Retrieve available appointment slots for a specific date.

**Request:**
```json
{
  "action": "GET_SLOTS",
  "data": {
    "preferred_date": "2025-08-20",
    "duration_minutes": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "GET_SLOTS",
  "message": "12 créneaux disponibles trouvés",
  "data": {
    "slots": [
      {
        "start_iso": "2025-08-20T08:00:00.000Z",
        "end_iso": "2025-08-20T08:30:00.000Z",
        "available": true,
        "display_time": "09:00",
        "display_date": "mercredi 20 août 2025"
      }
    ],
    "timezone": "Africa/Algiers",
    "clinic_address": "Cité 109, Daboussy El Achour, Alger"
  },
  "next_action": "BOOK_APPOINTMENT"
}
```

### 6. BOOK_APPOINTMENT
Create a new appointment booking.

**Request:**
```json
{
  "action": "BOOK_APPOINTMENT",
  "data": {
    "patient_name": "Jean Dupont",
    "phone_e164": "+213567123456",
    "patient_email": "jean@example.com",
    "appointment_reason": "Consultation de routine",
    "start_at": "2025-08-20T08:00:00.000Z",
    "end_at": "2025-08-20T08:30:00.000Z",
    "send_email": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "BOOK_APPOINTMENT",
  "message": "Rendez-vous confirmé et email de confirmation envoyé",
  "data": {
    "appointment": {
      "id": "uuid-string",
      "patient_name": "Jean Dupont",
      "patient_phone_e164": "+213567123456",
      "patient_email": "jean@example.com",
      "reason": "Consultation de routine",
      "start_at": "2025-08-20T08:00:00.000Z",
      "end_at": "2025-08-20T08:30:00.000Z",
      "status": "PENDING",
      "clinic_address": "Cité 109, Daboussy El Achour, Alger"
    },
    "email_sent": true,
    "timezone": "Africa/Algiers"
  },
  "next_action": "CONFIRM_APPOINTMENT"
}
```

### 7. GET_USER_APPOINTMENTS
Retrieve user's existing appointments.

**Request:**
```json
{
  "action": "GET_USER_APPOINTMENTS"
}
```

**Response:**
```json
{
  "success": true,
  "action": "GET_USER_APPOINTMENTS",
  "message": "3 rendez-vous trouvés",
  "data": {
    "appointments": [
      {
        "id": "uuid-1",
        "patient_name": "Jean Dupont",
        "start_at": "2025-08-20T08:00:00.000Z",
        "status": "CONFIRMED"
      }
    ],
    "timezone": "Africa/Algiers"
  }
}
```

### 8. VALIDATE_PHONE
Validate and format Algerian phone number.

**Request:**
```json
{
  "action": "VALIDATE_PHONE",
  "data": {
    "phone_e164": "0567123456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "VALIDATE_PHONE",
  "message": "Numéro de téléphone valide",
  "data": {
    "validation_result": {
      "valid": true,
      "formatted": "+213567123456",
      "error": null
    }
  }
}
```

### 9. ERROR_RESPONSE
Handle error situations.

**Response:**
```json
{
  "success": false,
  "action": "ERROR_RESPONSE",
  "message": "Une erreur s'est produite",
  "error": {
    "code": "SLOT_NOT_AVAILABLE",
    "message": "Le créneau sélectionné n'est plus disponible",
    "details": "Conflict detected during booking"
  },
  "next_action": "GET_SLOTS"
}
```

### 10. HANDOFF_HUMAN
Transfer to human agent for complex requests.

**Request:**
```json
{
  "action": "HANDOFF_HUMAN",
  "data": {
    "message": "Je voudrais modifier plusieurs rendez-vous",
    "error_context": "complex_scheduling_request"
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "HANDOFF_HUMAN",
  "message": "Je vous mets en relation avec un de nos conseillers",
  "data": {
    "handoff_reason": "complex_scheduling_request",
    "estimated_wait_time": "2-3 minutes"
  }
}
```

## Integration Points

### Supabase Authentication Flow
1. **AUTH_STATUS** → Check if user is logged in
2. **SIGN_IN_OTP** → Send magic link email
3. **VERIFY_OTP** → Complete authentication
4. **Profile Creation** → Automatic via RLS policies

### Appointment Booking Flow
1. **GET_SLOTS** → Show available times
2. **BOOK_APPOINTMENT** → Create appointment with validation
3. **SEND_EMAIL_SUMMARY** → Confirmation via IONOS SMTP
4. **RECORD_CONSENT** → Store email consent

### Error Handling
- **Validation Errors**: Schema validation with specific error codes
- **Business Logic Errors**: Slot conflicts, double-booking prevention
- **System Errors**: Database connectivity, email delivery failures
- **User Errors**: Invalid phone format, past dates, out of hours

### Security Features
- **RLS Policies**: Users can only access their own data
- **Phone Validation**: Algeria-specific format (+213[567]XXXXXXXX)
- **Email Validation**: RFC compliant email checking
- **Rate Limiting**: Prevent abuse of OTP endpoints
- **CORS**: Restricted to authorized domains

## Environment Requirements

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qajlzltfdtrshcncvncg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IONOS SMTP Configuration  
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=587
SMTP_USER=contact@skillnest.fr
SMTP_PASSWORD=pV6sagtiPW0AY8XkyyTn
SMTP_FROM=contact@skillnest.fr
SMTP_SECURE=false
```

## API Endpoints

- `POST /api/auth/sign-in-otp` - Send OTP email
- `GET /api/auth/callback` - Handle OTP verification callback
- `POST /api/appointments/create` - Create new appointment
- `POST /api/appointments/slots` - Get available slots
- `PUT /api/appointments/slots` - Check specific slot availability

## Testing Strategy

### Unit Tests
- Schema validation for all actions
- Phone number formatting and validation
- Email format validation
- Date/time validation

### Integration Tests
- Supabase authentication flow
- RLS policy enforcement
- Email delivery via IONOS
- Appointment booking with conflict detection

### End-to-End Tests
- Complete user journey from sign-up to booking
- Email verification workflow
- Appointment confirmation process
- Error handling scenarios

This schema ensures 100% tool-based responses while maintaining security, usability, and compliance with Algeria-specific requirements.