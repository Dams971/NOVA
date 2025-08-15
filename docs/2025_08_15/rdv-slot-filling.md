# NOVA RDV Intelligent Slot-Filling System

**Date**: 2025-08-15  
**Version**: 3.0  
**Status**: Production Ready

## Overview

The NOVA RDV chatbot now features an intelligent slot-filling system that prevents question repetition and implements smart session state tracking. This system eliminates the frustrating experience where users provide partial information (e.g., name but not phone) and the bot repeats the entire initial question.

## Key Features

### 🧠 Intelligent Anti-Repetition
- **Session Memory**: Remembers what information has already been provided
- **Progressive Questioning**: Only asks for missing information
- **Question Variation**: Uses different phrasings to avoid repetitive interactions
- **Context Awareness**: Understands partial information across multiple messages

### 📱 Enhanced Phone Validation
- **Algerian E.164 Format**: Strict validation for `+213XXXXXXXXX` format
- **Smart Normalization**: Converts various input formats to E.164
- **Pattern Recognition**: Extracts phone numbers from natural language
- **Validation Feedback**: Provides specific error messages for corrections

### 👤 Smart Name Extraction
- **Natural Language Processing**: Recognizes names in various contexts
- **Pattern Matching**: Handles formal introductions and casual mentions
- **Normalization**: Converts names to proper Title Case format
- **Filtering**: Excludes common non-name words

## Architecture

### Core Components

```
src/lib/llm/appointments-v2.ts          # Enhanced Anthropic wrapper
src/lib/chat/dialogManager.ts           # Dialog state management
src/app/api/rdv/route.ts                # Enhanced API endpoint
src/tests/slot-filling.test.ts          # Comprehensive test suite
```

### Data Flow

```
User Message → DialogManager → Field Extraction → Validation → Response Generation
     ↓              ↓               ↓              ↓              ↓
Session State → Pattern Match → Phone/Name → Missing Fields → Targeted Question
```

## Environment Configuration

### Required Environment Variables

```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Development Mode (enables debug logging)
NODE_ENV=development

# Optional: Session Management
SESSION_TIMEOUT_MINUTES=30
MAX_SESSIONS=1000
```

### Environment Setup

1. **Development Environment**:
   ```bash
   cp .env.example .env
   echo "ANTHROPIC_API_KEY=your_key_here" >> .env
   npm run dev
   ```

2. **Production Environment**:
   ```bash
   # Set environment variables through your hosting platform
   # Ensure ANTHROPIC_API_KEY is set securely
   npm run build && npm start
   ```

## API Usage

### Chat Endpoint

**POST** `/api/rdv`

#### Request Format

```json
{
  "action": "ai",
  "message": "Je m'appelle Damien Gane",
  "sessionId": "optional-session-id"
}
```

#### Response Format

```json
{
  "success": true,
  "sessionId": "session-uuid",
  "aiResponse": {
    "action": "NEED_INFO",
    "clinic_address": "Cité 109, Daboussy El Achour, Alger",
    "timezone": "Africa/Algiers",
    "status": "NEED_INFO",
    "missing_fields": ["phone_e164"],
    "clarification_question": "Il me faut également votre numéro de téléphone au format +213XXXXXXXXX.",
    "patient": {
      "name": "Damien Gane"
    }
  },
  "metadata": {
    "sessionInfo": {
      "attemptCounts": { "name": 1, "phone": 0, "total": 1 },
      "collectedFields": ["name"]
    }
  }
}
```

### Slot Selection Response

When all required information is collected:

```json
{
  "success": true,
  "sessionId": "session-uuid",
  "aiResponse": {
    "action": "FIND_SLOTS",
    "clinic_address": "Cité 109, Daboussy El Achour, Alger",
    "timezone": "Africa/Algiers",
    "status": "CONFIRMED",
    "patient": {
      "name": "Damien Gane",
      "phone_e164": "+213555123456"
    },
    "available_slots": [
      {
        "start_iso": "2025-08-16T09:00:00.000Z",
        "end_iso": "2025-08-16T09:30:00.000Z",
        "available": true
      }
    ],
    "clarification_question": "Voici les créneaux disponibles pour Damien Gane. Quel créneau vous convient ?"
  }
}
```

## JSON-Only Guardrails

### Strict Tool Usage

The system enforces JSON-only responses through:

1. **Tool Choice Enforcement**: `tool_choice: { type: "tool", name: "rdv_json" }`
2. **Schema Validation**: Strict JSON schema with required fields
3. **Constant Validation**: Ensures clinic address and timezone remain constant
4. **No Free Text**: All responses go through the structured JSON tool

### Tool Schema

```typescript
{
  action: "FIND_SLOTS" | "CREATE" | "RESCHEDULE" | "CANCEL" | "CONFIRMATION" | "NEED_INFO",
  clinic_address: "Cité 109, Daboussy El Achour, Alger", // Constant
  timezone: "Africa/Algiers", // Constant
  patient?: {
    name: string,
    phone_e164: string // Pattern: /^\+213[567]\d{8}$/
  },
  slot?: {
    start_iso: string, // RFC3339 format
    end_iso: string
  },
  missing_fields?: string[],
  clarification_question?: string // Max 1 question per response
}
```

## Medical Advice Policy

### Strict Guidelines

- **No Medical Advice**: System only handles appointment booking
- **No Health Assessments**: Cannot provide medical opinions or diagnoses
- **No Treatment Recommendations**: Cannot suggest specific treatments
- **Referral Only**: Directs medical questions to healthcare professionals

### Implementation

```typescript
// In system prompt
"ZÉRO texte libre, pas de conseils médicaux"
"Si question médicale → rediriger vers consultation"
```

## Timezone Handling

### Africa/Algiers Configuration

- **UTC Offset**: +01:00 (no DST)
- **Appointment Slots**: 9:00 AM - 6:00 PM local time
- **Lunch Break**: 12:00 PM - 1:00 PM excluded
- **ISO Format**: All times stored in ISO 8601 format
- **Display**: Converted to local Algeria time for user display

### Slot Generation

```typescript
function generateTimeBasedSlots(date?: string) {
  const baseDate = date ? new Date(date) : new Date();
  baseDate.setHours(baseDate.getHours() + 1); // UTC+1 for Algeria
  
  // Generate 30-minute slots from 9h to 18h
  for (let hour = 9; hour < 18; hour++) {
    if (hour === 12) continue; // Lunch break
    // ... slot generation logic
  }
}
```

## Session Management

### In-Memory Storage (Development)

```typescript
// Current implementation for development/testing
const sessionStore = new Map<string, SessionState>();
```

### Production Recommendations

1. **Redis Integration**:
   ```typescript
   import Redis from 'ioredis';
   const redis = new Redis(process.env.REDIS_URL);
   
   // Store session state in Redis with TTL
   await redis.setex(`session:${sessionId}`, 1800, JSON.stringify(sessionState));
   ```

2. **Database Storage**:
   ```sql
   CREATE TABLE chat_sessions (
     session_id UUID PRIMARY KEY,
     patient_name VARCHAR(120),
     phone_e164 VARCHAR(15),
     session_data JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Session Cleanup

```typescript
// Automatic cleanup every 30 minutes
setInterval(() => {
  const dialogManager = getSharedDialogManager();
  const cleaned = dialogManager.cleanupSessions(30);
  console.log(`Cleaned ${cleaned} old sessions`);
}, 30 * 60 * 1000);
```

## Testing

### Running Tests

```bash
# Run all slot-filling tests
npm test src/tests/slot-filling.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode for development
npm test -- --watch
```

### Test Categories

1. **Phone Validation Tests**
   - E.164 format validation
   - Algerian number patterns
   - Normalization accuracy
   - Error message validation

2. **Name Extraction Tests**
   - Pattern recognition
   - Natural language processing
   - Filtering and normalization
   - Edge case handling

3. **Dialog Flow Tests**
   - Progressive information gathering
   - Anti-repetition logic
   - Question variation
   - Session state management

4. **Integration Tests**
   - End-to-end flow validation
   - API endpoint testing
   - Error handling
   - Session persistence

### Example Test Cases

```typescript
describe('Anti-Repetition Logic', () => {
  it('should not repeat name question when name is already provided', async () => {
    const sessionId = 'test-session';
    
    // First interaction - provide name
    await dialogManager.processMessage("Je m'appelle Alice Benali", sessionId);
    
    // Second interaction - should only ask for phone
    const result = await dialogManager.processMessage("Je veux un rdv", sessionId);
    
    expect(result.response.clarification_question).not.toContain('nom');
    expect(result.response.clarification_question).toContain('téléphone');
  });
});
```

## Error Handling

### Graceful Degradation

1. **API Failures**: Fallback to structured error responses
2. **Invalid Input**: Clear validation messages
3. **Session Corruption**: Automatic session reset
4. **Rate Limiting**: Backoff and retry mechanisms

### Error Response Format

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Numéro invalide. Utilisez un numéro mobile algérien (ex: +213555123456)",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "sessionId": "session-uuid"
}
```

## Performance Optimization

### Caching Strategy

1. **Session State**: In-memory with Redis fallback
2. **Phone Validation**: Compiled regex patterns
3. **Name Extraction**: Cached compiled patterns
4. **Slot Generation**: Pre-computed available slots

### Memory Management

```typescript
// Automatic cleanup to prevent memory leaks
export class DialogManager {
  private readonly maxSessionAge = 30 * 60 * 1000; // 30 minutes
  
  cleanupSessions(): number {
    const cutoff = new Date(Date.now() - this.maxSessionAge);
    // ... cleanup logic
  }
}
```

## Security Considerations

### Data Protection

- **No PII Storage**: Minimal patient data retention
- **Session Encryption**: Encrypt sensitive session data
- **Access Control**: API rate limiting and authentication
- **Data Cleanup**: Automatic purging of old sessions

### Input Validation

```typescript
// Sanitize user input
function sanitizeInput(message: string): string {
  return message
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 500); // Limit length
}
```

## Monitoring and Analytics

### Key Metrics

1. **Session Success Rate**: % of sessions completing appointment booking
2. **Avg Questions Asked**: Efficiency of information gathering
3. **Phone Validation Accuracy**: % of valid phone extractions
4. **Session Duration**: Time to complete booking
5. **Error Rates**: Frequency of different error types

### Logging

```typescript
// Structured logging for monitoring
logger.info('Session completed', {
  sessionId,
  totalQuestions: attemptCounts.total,
  successfulExtraction: true,
  timeToComplete: Date.now() - session.createdAt.getTime()
});
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied (if using persistent storage)
- [ ] Redis instance configured (for production)
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

### Post-Deployment

- [ ] API health checks passing
- [ ] Session management working
- [ ] Phone validation accuracy verified
- [ ] Performance metrics within targets
- [ ] Error rates acceptable

## Troubleshooting

### Common Issues

1. **Anthropic API Errors**
   ```
   Error: ANTHROPIC_API_KEY manquante
   Solution: Set ANTHROPIC_API_KEY environment variable
   ```

2. **Session Not Persisting**
   ```
   Issue: Session state lost between requests
   Solution: Check sessionId header and storage configuration
   ```

3. **Phone Validation Failing**
   ```
   Issue: Valid Algerian numbers rejected
   Solution: Check regex pattern and E.164 normalization
   ```

4. **High Memory Usage**
   ```
   Issue: Session store growing indefinitely
   Solution: Enable automatic cleanup and set session TTL
   ```

## Future Enhancements

### Planned Features

1. **Multi-Language Support**: Arabic and Berber language support
2. **Voice Integration**: Voice-to-text appointment booking
3. **Calendar Integration**: Real-time calendar availability
4. **SMS Confirmations**: Automated appointment reminders
5. **Analytics Dashboard**: Usage metrics and optimization insights

### Technical Improvements

1. **Database Integration**: Persistent storage for sessions
2. **Microservices**: Split into dedicated services
3. **Load Balancing**: Multi-instance deployment
4. **Advanced NLP**: Improved intent recognition
5. **Machine Learning**: Predictive slot recommendations

## Contact & Support

For technical issues or questions about this implementation:

- **Documentation**: This file
- **Test Suite**: `src/tests/slot-filling.test.ts`
- **API Reference**: `/api/rdv` endpoint documentation
- **Code Examples**: Test cases and integration examples

---

*Generated by NOVA RDV Intelligent Slot-Filling System v3.0*  
*Last Updated: 2025-08-15*