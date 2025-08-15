# NOVA RDV Tool Schema v2 - Enhanced Chatbot Response Schema

## Overview

This document defines the complete JSON Schema for the `rdv_json` tool used by the NOVA RDV chatbot system. The schema ensures structured, consistent responses with comprehensive features including welcome UI, out-of-scope detection, human handoff, and strict traceability.

## Schema Definition

```json
{
  "name": "rdv_json",
  "description": "Structured RDV assistant response with enhanced features for welcome UI, out-of-scope detection, and human handoff",
  "input_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": [
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
          "patient_id": {
            "type": "string",
            "description": "Existing patient ID if known"
          }
        },
        "description": "Patient information collected during slot-filling process"
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
          }
        },
        "description": "Selected appointment time slot"
      },
      "reason": {
        "type": "string",
        "maxLength": 200,
        "description": "Brief appointment reason/description"
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
        "description": "Type of dental care requested"
      },
      "missing_fields": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "patient.name",
            "patient.phone_e164", 
            "slot.start_iso",
            "slot.end_iso",
            "reason",
            "care_type"
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
              "enum": ["button", "calendar", "text", "link", "info_card", "contact_card"],
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
              "enum": ["primary", "secondary", "urgent", "info", "warning"],
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
              "phone_attempt_count": {
                "type": "number",
                "minimum": 0,
                "description": "Number of phone collection attempts"
              },
              "name_attempt_count": {
                "type": "number", 
                "minimum": 0,
                "description": "Number of name collection attempts"
              }
            },
            "description": "Status of information collection progress"
          },
          "conversation_stage": {
            "type": "string",
            "enum": ["welcome", "info_collection", "slot_selection", "confirmation", "completed"],
            "description": "Current stage in the conversation flow"
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

## Action Types Reference

### Core Actions

#### `SHOW_WELCOME`
- **Purpose**: Display welcome screen with action buttons
- **Required Fields**: `clinic_address`, `timezone`, `ui_elements`
- **UI Elements**: Welcome buttons (Prendre RDV, Urgence, Voir calendrier, Informations)
- **Next Step**: User selects an action to proceed

#### `NEED_INFO`
- **Purpose**: Request missing patient information
- **Required Fields**: `clinic_address`, `timezone`, `missing_fields`, `message`
- **Optional Fields**: `patient` (partial), `session_context`
- **Behavior**: Smart slot-filling without repetition

#### `FIND_SLOTS`
- **Purpose**: Search and display available appointment slots
- **Required Fields**: `clinic_address`, `timezone`, `patient` (complete)
- **UI Elements**: Calendar or time slot buttons
- **Next Step**: User selects preferred slot

#### `CREATE` 
- **Purpose**: Create new appointment with confirmed details
- **Required Fields**: `clinic_address`, `timezone`, `patient`, `slot`
- **Optional Fields**: `reason`, `care_type`
- **Result**: Appointment booking confirmation

#### `RESCHEDULE`
- **Purpose**: Modify existing appointment
- **Required Fields**: `clinic_address`, `timezone`, `appointment_id`
- **Flow**: Similar to CREATE but updates existing booking

#### `CANCEL`
- **Purpose**: Cancel existing appointment
- **Required Fields**: `clinic_address`, `timezone`, `appointment_id`
- **Result**: Cancellation confirmation

#### `CONFIRMATION`
- **Purpose**: Final confirmation of appointment details
- **Required Fields**: `clinic_address`, `timezone`, `patient`, `slot`
- **UI Elements**: Confirmation details and final action buttons

#### `ROUTE_TO_HUMAN` 
- **Purpose**: Transfer conversation to human agent
- **Required Fields**: `clinic_address`, `timezone`, `disposition`, `clinic_contact`
- **Triggers**: Out-of-scope requests, sensitive health data, security issues
- **UI Elements**: Contact information or transfer button

## Out-of-Scope Detection

### Sensitive Health (`SENSITIVE_HEALTH`)
**Patterns:**
- Mentions of serious conditions: cancer, tumeur, maladie grave
- Emergency symptoms: douleur intense, saignement, infection
- Medical advice requests beyond appointment booking

**Response:** Route to human with medical disclaimer

### Personal Data (`PERSONAL_DATA`)
**Patterns:**
- Requests for sensitive information: SSN, payment details
- Privacy-related concerns
- Data sharing questions

**Response:** Route to human with privacy policy reference

### Pricing Uncertain (`PRICING_UNCERTAIN`)
**Patterns:**
- Complex pricing questions: devis détaillé, remboursement
- Insurance coverage questions
- Detailed cost breakdowns

**Response:** Route to human with pricing consultation offer

### Security/Jailbreak (`JAILBREAK_OR_SECURITY`)
**Patterns:**
- Attempts to bypass system rules
- Requests to ignore instructions
- Developer mode activation attempts

**Response:** Route to human with security flag

## UI Elements Configuration

### Welcome Buttons
```json
{
  "type": "button",
  "label": "Prendre RDV",
  "action": "start_booking",
  "style": "primary",
  "accessibility": {
    "aria_label": "Démarrer la prise de rendez-vous",
    "role": "button"
  }
}
```

### Emergency Button
```json
{
  "type": "button", 
  "label": "Urgence",
  "action": "emergency",
  "style": "urgent",
  "data": {
    "priority": "high",
    "immediate_routing": true
  }
}
```

### Contact Card
```json
{
  "type": "contact_card",
  "label": "Contacter le cabinet",
  "data": {
    "phone": "+213XXXXXXXXX",
    "email": "contact@cabinet.dz",
    "hours": "08:00-18:00, Dim-Jeu"
  }
}
```

## Validation Rules

### Phone Number Validation
- **Format**: E.164 with Algeria country code (+213)
- **Pattern**: `^\\+213[567]\\d{8}$`
- **Mobile Prefixes**: 5xx, 6xx, 7xx (Algerian mobile operators)
- **Length**: Exactly 13 characters including country code

### Name Validation
- **Characters**: Letters, spaces, hyphens, dots only
- **Length**: 2-100 characters
- **Pattern**: `^[A-Za-zÀ-ÿ\\s\\-\\.]{2,100}$`
- **Normalization**: Title case with proper hyphen handling

### Date/Time Validation
- **Format**: ISO 8601 with timezone
- **Timezone**: Africa/Algiers (UTC+01, no DST)
- **Business Hours**: Typically 08:00-18:00, Sunday-Thursday
- **Minimum Duration**: 15 minutes
- **Maximum Duration**: 3 hours

## Error Handling

### Invalid Phone Format
```json
{
  "action": "NEED_INFO",
  "missing_fields": ["patient.phone_e164"],
  "message": "Format de téléphone incorrect. Utilisez +213XXXXXXXXX",
  "disposition": {
    "category": "IN_SCOPE",
    "reason": "Phone format validation failed"
  }
}
```

### Out-of-Scope Request
```json
{
  "action": "ROUTE_TO_HUMAN",
  "disposition": {
    "category": "SENSITIVE_HEALTH",
    "reason": "User requesting medical advice beyond appointment booking",
    "detected_patterns": ["douleur intense", "conseil médical"]
  },
  "clinic_contact": {
    "contact_available": true,
    "phone_e164": "+213XXXXXXXXX"
  }
}
```

## Implementation Notes

1. **Immutable Fields**: `clinic_address` and `timezone` must always be present with exact values
2. **Session Management**: Use `session_context` to prevent question repetition
3. **UI Responsiveness**: All UI elements include accessibility attributes
4. **Error Recovery**: Graceful handling of validation failures
5. **Traceability**: Every response includes clinic identification
6. **Security**: Out-of-scope detection prevents misuse

## Version History

- **v2.0**: Enhanced schema with welcome UI, out-of-scope detection, human handoff
- **v1.0**: Basic appointment booking with slot-filling

---

**Last Updated**: 2025-08-15  
**Schema Version**: 2.0  
**Compatibility**: Claude 3.7 Sonnet, NOVA RDV Platform