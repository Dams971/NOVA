# NOVA RDV Operations Guide v2

## Overview

This guide covers the operational aspects of the enhanced NOVA RDV chatbot system with comprehensive features including welcome UI, out-of-scope detection, human handoff, and strict traceability.

## Environment Configuration

### Required Environment Variables

```bash
# Core API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-... # Claude 3.7 Sonnet API key (required)

# Clinic Contact Information
CLINIC_PHONE_E164=+213555000000    # Clinic phone in E.164 format
CLINIC_EMAIL=contact@nova-rdv.dz   # Clinic email for handoff
CLINIC_ADDRESS="Cité 109, Daboussy El Achour, Alger"  # Fixed clinic address

# Database Configuration
DATABASE_URL=postgresql://...       # PostgreSQL connection string
REDIS_URL=redis://...              # Redis for session storage (optional)

# System Configuration
NODE_ENV=production                # Environment mode
LOG_LEVEL=info                     # Logging level (debug, info, warn, error)
SESSION_MAX_AGE=1800               # Session timeout in seconds (30 minutes)
MAX_CONCURRENT_SESSIONS=1000       # Maximum concurrent sessions

# Security Configuration
RATE_LIMIT_MAX=100                 # Max requests per window
RATE_LIMIT_WINDOW=3600             # Rate limit window in seconds
CORS_ORIGINS=https://nova-rdv.dz   # Allowed CORS origins

# Monitoring & Analytics
SENTRY_DSN=https://...             # Error tracking (optional)
ANALYTICS_API_KEY=...              # Analytics service key (optional)
```

### Environment Validation

The system validates all required environment variables on startup:

```typescript
// Example validation check
const requiredEnvVars = [
  'ANTHROPIC_API_KEY',
  'CLINIC_PHONE_E164', 
  'CLINIC_EMAIL',
  'DATABASE_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## System Rules & Constraints

### Core Rules

1. **JSON-Only Responses**: All AI responses MUST use the `rdv_json` tool exclusively
2. **No Medical Advice**: System NEVER provides personalized medical advice
3. **Maximum 1 Clarification**: Ask only ONE targeted question per response
4. **E.164 Phone Validation**: All phone numbers MUST be in +213XXXXXXXXX format
5. **Mandatory Traceability**: Every response MUST include `clinic_address` and `timezone`

### Out-of-Scope Handling

When detecting out-of-scope requests, immediately route to human with appropriate context:

- **Sensitive Health**: Medical advice, symptoms, diagnoses
- **Personal Data**: SSN, payment info, passwords
- **Pricing Uncertain**: Complex pricing, insurance, detailed quotes
- **Security/Jailbreak**: System bypass attempts, prompt injection
- **Policy/Legal**: Terms, conditions, complaints, legal matters

### Phone Number Rules

- **Format**: E.164 with Algeria country code (+213)
- **Valid Prefixes**: 5xx, 6xx, 7xx (Algerian mobile operators)
- **Auto-Normalization**: 0555123456 → +213555123456
- **Validation**: Strict pattern matching with libphonenumber-js
- **Error Messages**: Clear format examples provided

## Timezone Handling

### Africa/Algiers Timezone Rules

```typescript
const CLINIC_TIMEZONE = 'Africa/Algiers';
const TIMEZONE_OFFSET = '+01:00';  // UTC+1, no DST
const BUSINESS_HOURS = {
  start: '08:00',
  end: '18:00',
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
};
```

### Time Formatting

- **Input**: Accept various local time formats
- **Storage**: Always convert to ISO 8601 with timezone
- **Display**: Format in local clinic time
- **Validation**: Ensure appointments within business hours

## Session Management

### Session Lifecycle

1. **Creation**: Generated on first user interaction
2. **Welcome**: Show welcome screen with action buttons
3. **Info Collection**: Progressive slot-filling without repetition
4. **Slot Selection**: Display available appointment times
5. **Confirmation**: Final appointment confirmation
6. **Completion**: Session marked as completed
7. **Cleanup**: Automatic cleanup after 30 minutes

### Session Storage

```typescript
interface SessionState {
  sessionId: string;
  patientName?: string;
  phoneE164?: string;
  conversationStage: 'welcome' | 'info_collection' | 'slot_selection' | 'confirmation' | 'completed';
  attemptCounts: { name: number; phone: number; total: number };
  outOfScopeAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Monitoring & Logging

### Key Metrics to Monitor

1. **Response Accuracy**:
   - Successful slot-filling completion rate
   - Out-of-scope detection accuracy
   - Phone validation success rate

2. **Performance Metrics**:
   - Average response time (target: <2s)
   - API call success rate (target: >99%)
   - Session completion rate

3. **User Experience**:
   - Welcome screen interaction rate
   - Handoff trigger frequency
   - Session abandonment rate

### Log Levels

```typescript
// Error: System errors, API failures
logger.error('API call failed', { sessionId, error });

// Warn: Out-of-scope attempts, validation failures
logger.warn('Out-of-scope detected', { category, confidence });

// Info: Session events, successful completions
logger.info('Session completed', { sessionId, duration });

// Debug: Detailed request/response data
logger.debug('AI response', { input, output });
```

### Health Checks

- **API Health**: Verify Anthropic API connectivity
- **Database Health**: Check PostgreSQL connection
- **Session Store**: Validate session storage functionality
- **Environment**: Confirm all required variables present

## Deployment Configuration

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### Production Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  nova-rdv:
    image: nova-rdv:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - CLINIC_PHONE_E164=${CLINIC_PHONE_E164}
      - CLINIC_EMAIL=${CLINIC_EMAIL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

## Error Handling

### Common Error Scenarios

1. **API Rate Limits**:
   - Implement exponential backoff
   - Cache successful responses when possible
   - Graceful degradation to manual contact info

2. **Invalid Phone Numbers**:
   - Clear error messages with examples
   - Support for multiple format inputs
   - Automatic normalization attempts

3. **Out-of-Scope Requests**:
   - Immediate handoff to human agent
   - Preserve conversation context
   - Provide clinic contact information

4. **Session Timeouts**:
   - Clear timeout warnings
   - Option to restart session
   - Preserve partial information when possible

### Error Response Format

```typescript
interface ErrorResponse {
  action: "ROUTE_TO_HUMAN";
  clinic_address: "Cité 109, Daboussy El Achour, Alger";
  timezone: "Africa/Algiers";
  disposition: {
    category: "OUT_OF_SCOPE";
    reason: string;
  };
  clinic_contact: {
    phone_e164: string;
    email: string;
    contact_available: boolean;
  };
  message: string;
}
```

## Security Considerations

### Input Validation

- **Sanitization**: All user inputs sanitized before processing
- **Pattern Detection**: Jailbreak and injection attempt detection
- **Rate Limiting**: Per-session and per-IP rate limits
- **Content Filtering**: Inappropriate content detection

### Data Protection

- **No Persistence**: Sensitive data not stored long-term
- **Encryption**: All API communications encrypted (HTTPS/TLS)
- **Access Logs**: Minimal logging of personal information
- **GDPR Compliance**: Right to deletion and data portability

### Security Headers

```typescript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Backup & Recovery

### Session Backup Strategy

- **Redis Persistence**: Configure Redis with RDB + AOF
- **Database Backups**: Daily PostgreSQL backups
- **Configuration Backup**: Environment variable backup
- **Code Deployment**: Git-based deployment with rollback capability

### Recovery Procedures

1. **API Outage**: Switch to manual contact information display
2. **Database Failure**: Restore from latest backup
3. **Session Loss**: Graceful session restart with apology message
4. **Complete System Failure**: Emergency contact information page

## Performance Optimization

### Caching Strategy

- **Session Caching**: Redis for active sessions
- **Response Caching**: Cache common responses (welcome, errors)
- **API Response Caching**: Cache stable API responses
- **Static Asset Caching**: CDN for static content

### Scalability Considerations

- **Horizontal Scaling**: Stateless application design
- **Load Balancing**: Session affinity not required
- **Database Scaling**: Read replicas for reporting
- **API Rate Management**: Distributed rate limiting

## Maintenance Procedures

### Daily Tasks

- Monitor error rates and response times
- Review out-of-scope detection accuracy
- Check session completion rates
- Validate API quota usage

### Weekly Tasks

- Analyze conversation patterns
- Review handoff reasons and frequency
- Update phone validation patterns if needed
- Performance optimization review

### Monthly Tasks

- Full system security audit
- Backup restoration testing
- Update AI model if new version available
- Review and update documentation

## Troubleshooting Guide

### Common Issues

**High Response Times**:
- Check Anthropic API status
- Monitor database connection pool
- Review server resource utilization

**Phone Validation Failures**:
- Verify libphonenumber-js version
- Check Algerian mobile operator updates
- Review validation pattern accuracy

**Excessive Handoffs**:
- Analyze out-of-scope detection patterns
- Review user conversation patterns
- Adjust detection sensitivity if needed

**Session Timeouts**:
- Monitor session storage performance
- Check Redis memory usage
- Review cleanup job frequency

### Emergency Contacts

- **System Administrator**: admin@nova-rdv.dz
- **API Support**: support@anthropic.com
- **Database Admin**: db-admin@nova-rdv.dz
- **Security Team**: security@nova-rdv.dz

---

**Document Version**: 2.0  
**Last Updated**: 2025-08-15  
**Next Review**: 2025-09-15  
**Maintained By**: NOVA RDV Operations Team