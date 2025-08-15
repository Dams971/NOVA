# NOVA RDV Tool Schema v3 - Authentication & Email Enhanced

## Overview

This document defines the enhanced JSON Schema for the `rdv_json` tool used by the NOVA RDV chatbot system with full authentication and email summary capabilities. The schema includes patient account management, OTP authentication, GDPR consent tracking, and transactional email features.

## Schema Definition

```json
{
  "name": "rdv_json",
  "description": "Structured RDV assistant response with authentication, email summaries, and enhanced patient account management",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "AUTH_STATUS",
          "SIGN_IN", 
          "SIGN_UP",
          "SEND_EMAIL_SUMMARY",
          "SHOW_WELCOME",
          "NEED_INFO",
          "FIND_SLOTS",
          "CREATE",
          "RESCHEDULE", 
          "CANCEL",
          "CONFIRMATION",
          "ROUTE_TO_HUMAN"
        ],
        "description": "Primary action to execute based on conversation context"
      },
      "clinic_address": {
        "type": "string",
        "const": "Cité 109, Daboussy El Achour, Alger",
        "description": "Fixed clinic address for traceability (immutable)"
      },
      "timezone": {
        "type": "string", 
        "const": "Africa/Algiers",
        "description": "Fixed timezone for date/time handling (UTC+01, no DST)"
      },
      "patient": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 2,
            "maxLength": 100,
            "pattern": "^[A-Za-zÀ-ÿ\\s\\-\\.]{2,100}$",
            "description": "Patient full name (letters, spaces, hyphens, dots only)"
          },
          "phone_e164": {
            "type": "string",
            "pattern": "^\\+213[567]\\d{8}$",
            "description": "Algerian mobile number in E.164 format (+213XXXXXXXXX)"
          },
          "email": {
            "type": "string",
            "format": "email",
            "description": "Patient email address for account and communications"
          },
          "patient_id": {
            "type": "string",
            "description": "Existing patient ID if known"
          }
        },
        "description": "Patient information collected during slot-filling and authentication"
      },
      "auth": {
        "type": "object",
        "properties": {
          "has_account": {
            "type": "boolean",
            "description": "Whether patient already has an account in the system"
          },
          "method": {
            "type": "string",
            "enum": ["email_otp", "password"],
            "description": "Authentication method selected by patient"
          },
          "status": {
            "type": "string", 
            "enum": ["REQUIRED", "IN_PROGRESS", "VERIFIED"],
            "description": "Current authentication status"
          },
          "otp_sent_to": {
            "type": "string",
            "format": "email",
            "description": "Email address where OTP was sent"
          },
          "session_id": {
            "type": "string",
            "description": "Authenticated session identifier"
          },
          "verification_token": {
            "type": "string", 
            "description": "Token for email verification flow"
          }
        },
        "description": "Authentication state and configuration"
      },
      "email_summary": {
        "type": "object",
        "properties": {
          "consent_given": {
            "type": "boolean",
            "description": "Whether patient has consented to email summary"
          },
          "send_to": {
            "type": "string",
            "format": "email",
            "description": "Email address to send summary to"
          },
          "include_sections": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "appointment_details",
                "conversation_summary", 
                "next_steps",
                "cancellation_link",
                "clinic_contact",
                "gdpr_notice"
              ]
            },
            "description": "Sections to include in email summary"
          },
          "patient_timezone": {
            "type": "string",
            "description": "Patient's preferred timezone for appointment times"
          },
          "language": {
            "type": "string",
            "enum": ["fr", "ar", "en"],
            "default": "fr",
            "description": "Language for email content"
          }
        },
        "description": "Email summary configuration and consent tracking"
      },
      "slot": {
        "type": "object",
        "properties": {
          "start_iso": {
            "type": "string",
            "format": "date-time",
            "description": "Appointment start time in ISO 8601 format with Africa/Algiers timezone"
          },
          "end_iso": {
            "type": "string",
            "format": "date-time",
            "description": "Appointment end time in ISO 8601 format with Africa/Algiers timezone"
          },
          "duration_minutes": {
            "type": "number",
            "minimum": 15,
            "maximum": 180,
            "description": "Appointment duration in minutes"
          },
          "practitioner": {
            "type": "string",
            "description": "Assigned practitioner name"
          },
          "care_type": {
            "type": "string",
            "enum": [
              "consultation",
              "urgence",
              "detartrage", 
              "soin",
              "extraction",
              "prothese",
              "orthodontie",
              "chirurgie",
              "controle",
              "autre"
            ],
            "description": "Type of dental care for this slot"
          }
        },
        "description": "Selected appointment time slot with details"
      },
      "reason": {
        "type": "string",
        "maxLength": 200,
        "description": "Brief appointment reason/description"
      },
      "missing_fields": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "patient.name",
            "patient.phone_e164",
            "patient.email",
            "auth.method",
            "slot.start_iso",
            "slot.end_iso",
            "reason"
          ]
        },
        "description": "List of required fields still missing for appointment booking",
        "uniqueItems": true
      },
      "clinic_contact": {
        "type": "object", 
        "properties": {
          "phone_e164": {
            "type": "string",
            "pattern": "^\\+213\\d{9}$",
            "description": "Clinic phone number in E.164 format"
          },
          "email": {
            "type": "string",
            "format": "email",
            "description": "Clinic email address"
          },
          "contact_available": {
            "type": "boolean",
            "description": "Whether clinic contact information is available for handoff"
          },
          "business_hours": {
            "type": "string",
            "description": "Human-readable business hours information"
          }
        },
        "description": "Clinic contact information for human handoff scenarios"
      },
      "disposition": {
        "type": "object",
        "properties": {
          "category": {
            "type": "string",
            "enum": [
              "IN_SCOPE",
              "OUT_OF_SCOPE",
              "SENSITIVE_HEALTH",
              "PERSONAL_DATA",
              "PRICING_UNCERTAIN", 
              "POLICY_OR_LEGAL",
              "JAILBREAK_OR_SECURITY"
            ],
            "description": "Classification of user request for routing decisions"
          },
          "reason": {
            "type": "string",
            "maxLength": 500,
            "description": "Detailed reason for the disposition classification"
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Confidence score for the disposition classification (0-1)"
          },
          "detected_patterns": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Specific patterns that triggered out-of-scope detection"
          }
        },
        "required": ["category"],
        "description": "Request disposition and routing information"
      },
      "ui_elements": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "button",
                "calendar", 
                "text",
                "link",
                "info_card",
                "contact_card",
                "auth_form",
                "otp_input",
                "consent_checkbox"
              ],
              "description": "Type of UI element to render"
            },
            "label": {
              "type": "string",
              "maxLength": 100,
              "description": "Display text for the UI element"
            },
            "action": {
              "type": "string",
              "description": "Action identifier for frontend handling"
            },
            "data": {
              "type": "object",
              "description": "Additional data payload for the UI element"
            },
            "style": {
              "type": "string",
              "enum": ["primary", "secondary", "urgent", "info", "warning", "success"],
              "description": "Visual style variant for the element"
            },
            "accessibility": {
              "type": "object",
              "properties": {
                "aria_label": {
                  "type": "string",
                  "description": "ARIA label for screen readers"
                },
                "role": {
                  "type": "string",
                  "description": "ARIA role for the element"
                }
              },
              "description": "Accessibility attributes for the UI element"
            }
          },
          "required": ["type", "label"],
          "description": "UI element configuration"
        },
        "description": "Array of UI elements to render in the chatbot interface"
      },
      "message": {
        "type": "string",
        "maxLength": 1000,
        "description": "Human-readable message to display to the user"
      },
      "session_context": {
        "type": "object",
        "properties": {
          "attempt_count": {
            "type": "number",
            "minimum": 0,
            "description": "Number of interaction attempts in current session"
          },
          "last_bot_message": {
            "type": "string",
            "description": "Previous bot message to avoid repetition"
          },
          "collected_info": {
            "type": "object",
            "properties": {
              "has_name": {
                "type": "boolean",
                "description": "Whether patient name has been collected"
              },
              "has_phone": {
                "type": "boolean",
                "description": "Whether valid phone number has been collected"
              },
              "has_email": {
                "type": "boolean", 
                "description": "Whether valid email has been collected"
              },
              "is_authenticated": {
                "type": "boolean",
                "description": "Whether patient is authenticated"
              },
              "phone_attempt_count": {
                "type": "number",
                "minimum": 0,
                "description": "Number of phone collection attempts"
              },
              "name_attempt_count": {
                "type": "number",
                "minimum": 0,
                "description": "Number of name collection attempts"
              },
              "email_attempt_count": {
                "type": "number",
                "minimum": 0,
                "description": "Number of email collection attempts"
              },
              "auth_attempt_count": {
                "type": "number",
                "minimum": 0,
                "description": "Number of authentication attempts"
              }
            },
            "description": "Status of information collection progress"
          },
          "conversation_stage": {
            "type": "string",
            "enum": [
              "welcome",
              "auth_check",
              "sign_in", 
              "sign_up",
              "info_collection",
              "slot_selection",
              "confirmation",
              "email_summary",
              "completed"
            ],
            "description": "Current stage in the conversation flow"
          },
          "gdpr_consent": {
            "type": "object",
            "properties": {
              "data_processing": {
                "type": "boolean",
                "description": "Consent for data processing"
              },
              "marketing_emails": {
                "type": "boolean", 
                "description": "Consent for marketing communications"
              },
              "transactional_emails": {
                "type": "boolean",
                "description": "Consent for transactional emails"
              },
              "consent_timestamp": {
                "type": "string",
                "format": "date-time",
                "description": "When consent was given"
              }
            },
            "description": "GDPR consent tracking information"
          }
        },
        "description": "Session state and progress tracking information"
      },
      "metadata": {
        "type": "object",
        "properties": {
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Response generation timestamp"
          },
          "model_version": {
            "type": "string",
            "description": "AI model version used for response generation"
          },
          "response_id": {
            "type": "string",
            "description": "Unique identifier for this response"
          },
          "correlation_id": {
            "type": "string",
            "description": "Correlation ID for tracking across services"
          }
        },
        "description": "Response metadata for tracking and debugging"
      }
    },
    "required": [
      "action",
      "clinic_address",
      "timezone"
    ],
    "additionalProperties": false
  }
}
```

## Enhanced Action Types Reference

### Authentication Actions

#### `AUTH_STATUS`
- **Purpose**: Check if user has an existing account
- **Required Fields**: `clinic_address`, `timezone`, `patient.email`
- **Flow**: Check email in system → return has_account status
- **Next Step**: Route to SIGN_IN or SIGN_UP

**Example Response:**
```json
{
  "action": "AUTH_STATUS",
  "clinic_address": "Cité 109, Daboussy El Achour, Alger",
  "timezone": "Africa/Algiers",
  "auth": {
    "has_account": true,
    "status": "REQUIRED"
  },
  "message": "Un compte existe avec cette adresse email."
}
```

#### `SIGN_IN`
- **Purpose**: Authenticate existing user
- **Required Fields**: `clinic_address`, `timezone`, `auth`
- **Methods**: Email OTP or password
- **UI Elements**: Auth form, OTP input
- **Next Step**: Authentication verification

**Example Response:**
```json
{
  "action": "SIGN_IN", 
  "clinic_address": "Cité 109, Daboussy El Achour, Alger",
  "timezone": "Africa/Algiers",
  "auth": {
    "method": "email_otp",
    "status": "IN_PROGRESS",
    "otp_sent_to": "patient@example.com"
  },
  "message": "Code de vérification envoyé à votre email.",
  "ui_elements": [{
    "type": "otp_input",
    "label": "Code de vérification",
    "action": "verify_otp",
    "data": { "email": "patient@example.com" }
  }]
}
```

#### `SIGN_UP`
- **Purpose**: Create new patient account
- **Required Fields**: `clinic_address`, `timezone`, `patient`
- **GDPR**: Require explicit consent
- **UI Elements**: Registration form, consent checkboxes
- **Next Step**: Account creation confirmation

**Example Response:**
```json
{
  "action": "SIGN_UP",
  "clinic_address": "Cité 109, Daboussy El Achour, Alger", 
  "timezone": "Africa/Algiers",
  "patient": {
    "name": "Jean Dupont",
    "phone_e164": "+213555123456",
    "email": "jean@example.com"
  },
  "message": "Création de votre compte...",
  "ui_elements": [{
    "type": "consent_checkbox",
    "label": "J'accepte le traitement de mes données personnelles",
    "action": "gdpr_consent",
    "data": { "consent_type": "data_processing" }
  }]
}
```

#### `SEND_EMAIL_SUMMARY`
- **Purpose**: Send appointment summary via email
- **Required Fields**: `clinic_address`, `timezone`, `email_summary`
- **Consent**: Explicit consent required
- **Content**: Appointment details, conversation summary, clinic info
- **Next Step**: Confirmation of email sent

**Example Response:**
```json
{
  "action": "SEND_EMAIL_SUMMARY",
  "clinic_address": "Cité 109, Daboussy El Achour, Alger",
  "timezone": "Africa/Algiers",
  "email_summary": {
    "consent_given": true,
    "send_to": "patient@example.com",
    "include_sections": [
      "appointment_details",
      "conversation_summary", 
      "cancellation_link",
      "clinic_contact"
    ],
    "language": "fr"
  },
  "message": "Récapitulatif envoyé par email."
}
```

## Authentication Flow Patterns

### New User Flow
1. `AUTH_STATUS` → has_account: false
2. `SIGN_UP` → Collect patient info + GDPR consent
3. `FIND_SLOTS` → Continue with booking
4. `SEND_EMAIL_SUMMARY` → Send confirmation email

### Existing User Flow  
1. `AUTH_STATUS` → has_account: true
2. `SIGN_IN` → OTP verification
3. `FIND_SLOTS` → Continue with booking  
4. `SEND_EMAIL_SUMMARY` → Send confirmation email

### Email OTP Flow
1. User provides email
2. `AUTH_STATUS` → Check account existence
3. `SIGN_IN` → Send OTP via email
4. UI shows OTP input field
5. User enters OTP → verification
6. Success → proceed to booking

## Email Summary Features

### Content Sections
- **appointment_details**: Date, time, practitioner, care type
- **conversation_summary**: Key points from chatbot interaction  
- **next_steps**: Preparation instructions, what to bring
- **cancellation_link**: Secure link to cancel/reschedule
- **clinic_contact**: Phone, email, address, hours
- **gdpr_notice**: Data protection information

### Timezone Handling
- Appointment times shown in both clinic timezone (Africa/Algiers) and patient's preferred timezone
- Clear timezone labeling: "14:00 (heure d'Alger) / 15:00 (heure de Paris)"

### Language Support
- French (primary): Full template support
- Arabic: RTL layout, cultural adaptations
- English: International patients

## GDPR Compliance Features

### Consent Types
- **data_processing**: Required for account creation
- **marketing_emails**: Optional promotional communications
- **transactional_emails**: Appointment confirmations, reminders

### Consent UI Elements
```json
{
  "type": "consent_checkbox",
  "label": "J'accepte le traitement de mes données personnelles conformément au RGPD",
  "action": "gdpr_consent",
  "data": {
    "consent_type": "data_processing",
    "required": true,
    "privacy_policy_url": "https://nova-rdv.dz/privacy"
  },
  "accessibility": {
    "aria_label": "Consentement RGPD requis pour la création de compte"
  }
}
```

### Data Retention
- Session data: 30 minutes after inactivity
- Authentication tokens: 24 hours
- Appointment data: Per clinic data retention policy
- Marketing consent: Until withdrawn

## Enhanced UI Elements

### Authentication Form
```json
{
  "type": "auth_form",
  "label": "Connexion",
  "action": "authenticate",
  "data": {
    "method": "email_otp",
    "email": "patient@example.com"
  },
  "style": "primary"
}
```

### OTP Input
```json
{
  "type": "otp_input", 
  "label": "Code de vérification (6 chiffres)",
  "action": "verify_otp",
  "data": {
    "length": 6,
    "auto_submit": true,
    "resend_available": true
  },
  "accessibility": {
    "aria_label": "Saisir le code de vérification à 6 chiffres"
  }
}
```

### Consent Checkbox
```json
{
  "type": "consent_checkbox",
  "label": "J'accepte de recevoir le récapitulatif par email",
  "action": "email_consent", 
  "data": {
    "consent_type": "transactional_emails",
    "required": false
  },
  "style": "info"
}
```

## Validation Rules

### Email Validation
- **Format**: RFC5322 compliant
- **Domain**: Check MX records for deliverability
- **Normalization**: Lowercase, trim whitespace
- **Blocklist**: Temporary email providers

### OTP Validation  
- **Length**: 6 digits
- **Expiry**: 5 minutes
- **Attempts**: Maximum 3 tries
- **Rate Limiting**: 1 OTP per minute per email

### GDPR Consent
- **Explicit**: Clear affirmative action required
- **Granular**: Separate consent for different purposes
- **Withdrawable**: Easy opt-out mechanism
- **Recorded**: Timestamp, IP, consent details

## Error Handling

### Authentication Errors
```json
{
  "action": "SIGN_IN",
  "auth": {
    "status": "REQUIRED", 
    "error": "Code de vérification expiré"
  },
  "message": "Le code a expiré. Nouveau code envoyé.",
  "ui_elements": [{
    "type": "otp_input",
    "label": "Nouveau code de vérification"
  }]
}
```

### Email Delivery Errors
```json
{
  "action": "SEND_EMAIL_SUMMARY",
  "email_summary": {
    "consent_given": true,
    "send_to": "invalid@domain.invalid",
    "error": "Email delivery failed"
  },
  "message": "Erreur d'envoi email. Vérifiez l'adresse.",
  "ui_elements": [{
    "type": "text",
    "label": "Corriger l'adresse email",
    "action": "update_email"
  }]
}
```

## Implementation Security Notes

1. **OTP Security**: 
   - Cryptographically secure random generation
   - Constant-time comparison
   - Rate limiting and attempt throttling

2. **Session Management**:
   - Secure HTTP-only cookies
   - CSRF protection
   - Session invalidation on suspicious activity

3. **Email Security**:
   - SPF/DKIM/DMARC authentication
   - TLS encryption for SMTP
   - Content Security Policy headers

4. **GDPR Compliance**:
   - Pseudonymization of personal data
   - Right to erasure implementation
   - Data portability features
   - Privacy by design principles

## Version History

- **v3.0**: Full authentication, email summaries, GDPR compliance
- **v2.0**: Enhanced schema with welcome UI, out-of-scope detection 
- **v1.0**: Basic appointment booking with slot-filling

---

**Last Updated**: 2025-08-15  
**Schema Version**: 3.0  
**Compatibility**: Claude 3.7 Sonnet, NOVA RDV+ Platform