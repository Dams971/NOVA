# NOVA RDV - Email Integration Guide

## Overview
This guide documents the server-only email integration with IONOS SMTP for the NOVA RDV system.

## Architecture

### Server-Only Design
- Email service is marked with `import 'server-only'`
- Cannot be imported in Client Components
- All routes using email must specify `runtime = 'nodejs'`

### IONOS SMTP Configuration
```env
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=587
SMTP_SECURE=false  # Use STARTTLS, not implicit TLS
```

### Security Requirements
- TLS minimum version: 1.2
- No `rejectUnauthorized: false`
- Strong cipher suites only
- Connection pooling for performance

## Configuration

### Environment Variables
```env
# Required SMTP settings
SMTP_HOST=smtp.ionos.fr
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@domain.com

# Clinic contact (never hardcode in templates)
CLINIC_PHONE=+213555123456
CLINIC_EMAIL=contact@nova-dental.dz
```

### Next.js Runtime Configuration
Any route importing the email service MUST declare Node runtime:
```typescript
export const runtime = 'nodejs';
```

## API Endpoints

### Send Appointment Confirmation
`POST /api/email/appointment-confirmation`
```json
{
  "data": {
    "patient_name": "Jean Dupont",
    "patient_email": "jean@example.com",
    "patient_phone": "+213555123456",
    "appointment_date": "2025-01-15T14:00:00Z",
    "appointment_time": "14:00",
    "care_type": "Consultation",
    "appointment_id": "APT-123"
  },
  "userId": "user-uuid"
}
```

### Send OTP
`POST /api/email/otp`
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Verify Connection (DEV only)
`GET /api/debug/email/verify`

## Date/Time Formatting
All dates are formatted using `Intl.DateTimeFormat` with:
- Locale: `fr-FR`
- TimeZone: `Africa/Algiers`
- Full date format for appointments
- Short time format (HH:mm)

## Email Templates

### Appointment Confirmation
- HTML version with responsive design
- Plain text fallback
- Dynamic clinic contact from ENV
- Appointment reference number
- Clear call-to-action

### OTP Email
- Large, clear OTP display
- 10-minute expiration notice
- Security reminder

## Database Logging
All emails are logged to `email_logs` table:
- Success/failure status
- Message ID from SMTP
- Template used
- Metadata (appointment ID, etc.)
- RLS policies for user access

## Error Handling
- Graceful fallback on send failure
- Detailed error logging
- User-friendly error messages
- No sensitive data in logs

## Testing

### Unit Tests
```bash
npm run test:email
```

### Integration Tests
```bash
npm run test:api
```

### Manual Testing (Development)
1. Set up SMTP credentials in `.env.local`
2. Run development server: `npm run dev`
3. Test connection: `curl http://localhost:3000/api/debug/email/verify`
4. Send test email via UI or API

## Troubleshooting

### "Module not found" in Edge Runtime
**Solution**: Add `export const runtime = 'nodejs'` to the route file.

### "ionos-email.service.ts can only be used on the server"
**Solution**: The component trying to import is a Client Component. Move email logic to API route.

### SMTP Connection Timeout
**Solutions**:
1. Check firewall allows port 587
2. Verify SMTP credentials
3. Ensure TLS 1.2+ is supported
4. Check IONOS service status

### Build Errors
Run build verification:
```bash
npm run verify:build
```

## Security Checklist
- [x] No hardcoded credentials
- [x] TLS 1.2+ enforced
- [x] Server-only module
- [x] Input validation with Zod
- [x] Rate limiting on routes
- [x] Audit logging
- [x] No sensitive data in templates

## Performance Optimization
- Connection pooling (3 connections max)
- Message batching (50 messages per connection)
- Async/await for non-blocking
- Lazy service instantiation

## Deployment Checklist
1. Set all required ENV variables
2. Run database migrations
3. Verify SMTP connectivity
4. Test email delivery
5. Monitor email logs table
6. Set up alerts for failures

## Support
For IONOS SMTP issues:
- Port: 587 (STARTTLS)
- Security: TLS 1.2+
- Authentication: Plain
- Support: https://www.ionos.fr/assistance/email/

For Next.js runtime issues:
- Documentation: https://nextjs.org/docs/app/api-reference/edge
- Node.js runtime: Required for Nodemailer