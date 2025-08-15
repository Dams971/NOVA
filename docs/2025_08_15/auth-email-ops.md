# NOVA RDV+ Authentication & Email Operations Guide

## Overview

This document provides comprehensive instructions for setting up, configuring, and monitoring the authentication and email systems in NOVA RDV+. It covers environment setup, email provider configuration, SPF/DKIM/DMARC setup, GDPR compliance, and operational monitoring.

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Email Provider Setup](#email-provider-setup)
3. [SPF/DKIM/DMARC Configuration](#spfdkimdmarc-configuration)
4. [Authentication System Setup](#authentication-system-setup)
5. [GDPR Compliance Checklist](#gdpr-compliance-checklist)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Disaster Recovery](#disaster-recovery)

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```bash
# Application Settings
NODE_ENV=production
JWT_SECRET=your-256-bit-secret-key-here
SESSION_DURATION=86400000  # 24 hours in milliseconds

# Clinic Information
CLINIC_NAME="Cabinet Dentaire NOVA"
CLINIC_PHONE_E164="+213555000000"
CLINIC_EMAIL="contact@nova-rdv.dz"
CLINIC_ADDRESS="Cité 109, Daboussy El Achour, Alger"

# Email Providers (Configure at least one)
## SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

## AWS SES
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

## Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
MAILGUN_API_URL=https://api.mailgun.net/v3

# SMTP Settings (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM_EMAIL=noreply@nova-rdv.dz
SMTP_FROM_NAME="NOVA RDV"
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Security Settings
BCRYPT_ROUNDS=12
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=3
RATE_LIMIT_WINDOW=60000  # 1 minute

# Database (if using persistent storage)
DATABASE_URL=postgresql://username:password@localhost:5432/nova_rdv

# Redis (for session storage)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Environment Variable Security

1. **Never commit `.env` files to version control**
2. Use different secrets for each environment (dev, staging, production)
3. Rotate secrets regularly (quarterly recommended)
4. Use a secrets management service in production (AWS Secrets Manager, Azure Key Vault, etc.)

### Validation Script

Create `scripts/validate-env.js`:

```javascript
const requiredVars = [
  'JWT_SECRET',
  'CLINIC_NAME',
  'CLINIC_PHONE_E164',
  'CLINIC_EMAIL'
];

const optionalProviders = [
  ['SENDGRID_API_KEY'],
  ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
  ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']
];

// Validate required variables
const missing = requiredVars.filter(varName => !process.env[varName]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

// Validate at least one email provider
const hasProvider = optionalProviders.some(provider => 
  provider.every(varName => process.env[varName])
);

if (!hasProvider) {
  console.error('At least one email provider must be configured');
  process.exit(1);
}

console.log('✅ Environment configuration is valid');
```

## Email Provider Setup

### SendGrid Configuration

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com/
   - Verify your sender identity
   - Create API key with full access

2. **Domain Authentication**
   ```bash
   # Add these DNS records
   CNAME sg._domainkey.nova-rdv.dz -> sg._domainkey.sendgrid.net
   CNAME em1234.nova-rdv.dz -> u1234.wl.sendgrid.net
   ```

3. **Template Setup**
   ```javascript
   // Create dynamic templates in SendGrid dashboard
   const templates = {
     otp_verification: 'd-1234567890abcdef1234567890abcdef',
     appointment_summary: 'd-abcdef1234567890abcdef1234567890'
   };
   ```

### AWS SES Configuration

1. **Setup SES**
   ```bash
   aws ses verify-email-identity --email-address noreply@nova-rdv.dz
   aws ses verify-domain-identity --domain nova-rdv.dz
   ```

2. **IAM Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail",
           "ses:GetSendQuota",
           "ses:GetSendStatistics"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Request Production Access**
   - Submit request to move out of sandbox
   - Provide use case and volume estimates
   - Implement bounce and complaint handling

### Mailgun Configuration

1. **Domain Setup**
   ```bash
   # Add these DNS records
   TXT mg.nova-rdv.dz -> "v=spf1 include:mailgun.org ~all"
   TXT k1._domainkey.mg.nova-rdv.dz -> "k=rsa; p=YOUR_PUBLIC_KEY"
   CNAME email.mg.nova-rdv.dz -> mailgun.org
   ```

2. **Webhook Configuration**
   ```javascript
   // Configure webhooks for bounce/complaint handling
   const webhooks = {
     bounce: 'https://nova-rdv.dz/api/webhooks/mailgun/bounce',
     complaint: 'https://nova-rdv.dz/api/webhooks/mailgun/complaint',
     delivery: 'https://nova-rdv.dz/api/webhooks/mailgun/delivery'
   };
   ```

## SPF/DKIM/DMARC Configuration

### SPF Record

Add to your DNS:

```dns
TXT nova-rdv.dz "v=spf1 include:sendgrid.net include:mailgun.org include:amazonses.com -all"
```

### DKIM Records

For each provider, add the provided DKIM records:

```dns
# SendGrid
CNAME s1._domainkey.nova-rdv.dz -> s1.domainkey.u12345.wl.sendgrid.net
CNAME s2._domainkey.nova-rdv.dz -> s2.domainkey.u12345.wl.sendgrid.net

# Mailgun
TXT k1._domainkey.nova-rdv.dz -> "k=rsa; p=YOUR_MAILGUN_PUBLIC_KEY"

# AWS SES
TXT selector._domainkey.nova-rdv.dz -> "k=rsa; p=YOUR_SES_PUBLIC_KEY"
```

### DMARC Policy

Start with monitoring mode, then gradually increase strictness:

```dns
# Phase 1: Monitoring (Week 1-2)
TXT _dmarc.nova-rdv.dz "v=DMARC1; p=none; rua=mailto:dmarc@nova-rdv.dz; ruf=mailto:dmarc@nova-rdv.dz; fo=1"

# Phase 2: Quarantine (Week 3-4)
TXT _dmarc.nova-rdv.dz "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@nova-rdv.dz; ruf=mailto:dmarc@nova-rdv.dz; fo=1"

# Phase 3: Reject (After Week 4)
TXT _dmarc.nova-rdv.dz "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@nova-rdv.dz; ruf=mailto:dmarc@nova-rdv.dz; fo=1"
```

### Verification Commands

```bash
# Check SPF
dig TXT nova-rdv.dz | grep spf

# Check DKIM
dig TXT selector._domainkey.nova-rdv.dz

# Check DMARC
dig TXT _dmarc.nova-rdv.dz

# Test email authentication
echo "Test email" | mail -s "SPF/DKIM/DMARC Test" test@gmail.com
```

## Authentication System Setup

### Database Schema

```sql
-- Create tables for production use
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    phone_e164 VARCHAR(15) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE otp_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    purpose VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE gdpr_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    data_processing_consent BOOLEAN NOT NULL,
    data_processing_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_processing_ip INET,
    marketing_emails_consent BOOLEAN DEFAULT FALSE,
    marketing_emails_timestamp TIMESTAMP WITH TIME ZONE,
    transactional_emails_consent BOOLEAN DEFAULT FALSE,
    transactional_emails_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_auth_sessions_patient_id ON auth_sessions(patient_id);
CREATE INDEX idx_auth_sessions_token_hash ON auth_sessions(token_hash);
CREATE INDEX idx_otp_records_email ON otp_records(email);
CREATE INDEX idx_otp_records_expires_at ON otp_records(expires_at);
CREATE INDEX idx_gdpr_consents_patient_id ON gdpr_consents(patient_id);
```

### Migration Script

```javascript
// scripts/migrate-auth.js
const { Pool } = require('pg');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Read and execute migration files
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('migrations/auth-schema.sql', 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Authentication schema migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

### Redis Configuration

```bash
# Redis configuration for session storage
redis-cli config set maxmemory 256mb
redis-cli config set maxmemory-policy allkeys-lru

# Create Redis configuration file
cat > /etc/redis/redis.conf << EOF
bind 127.0.0.1
port 6379
timeout 300
keepalive 60
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF
```

## GDPR Compliance Checklist

### Data Processing Requirements

- [ ] **Legal Basis**: Consent obtained for data processing
- [ ] **Purpose Limitation**: Data used only for stated purposes
- [ ] **Data Minimization**: Only necessary data collected
- [ ] **Accuracy**: Data kept accurate and up-to-date
- [ ] **Storage Limitation**: Data retained only as long as necessary
- [ ] **Security**: Appropriate technical and organizational measures
- [ ] **Accountability**: Ability to demonstrate compliance

### Implementation Checklist

#### Consent Management
- [ ] Granular consent options (processing, marketing, transactional)
- [ ] Clear consent language in French
- [ ] Easy withdrawal mechanism
- [ ] Consent timestamp and IP tracking
- [ ] Consent renewal process

#### Data Subject Rights
- [ ] Right to access (data export)
- [ ] Right to rectification (data correction)
- [ ] Right to erasure (data deletion)
- [ ] Right to portability (data export in structured format)
- [ ] Right to object (opt-out of marketing)

#### Privacy by Design
- [ ] Data protection impact assessment completed
- [ ] Privacy-preserving defaults
- [ ] Pseudonymization where possible
- [ ] Data encryption at rest and in transit
- [ ] Regular security assessments

### Privacy Policy Template

```markdown
# Politique de Confidentialité - NOVA RDV

## Responsable de traitement
Cabinet Dentaire NOVA
Cité 109, Daboussy El Achour, Alger
Email: privacy@nova-rdv.dz

## Données collectées
- Nom et prénom (nécessaire pour l'identification)
- Adresse email (pour les confirmations et communications)
- Numéro de téléphone (pour les rappels et urgences)
- Données de navigation (pour l'amélioration du service)

## Finalités du traitement
- Gestion des rendez-vous médicaux
- Communication avec les patients
- Amélioration de nos services
- Respect des obligations légales

## Base légale
- Consentement de la personne concernée
- Exécution d'un contrat
- Intérêt légitime du responsable

## Conservation des données
- Données patients: 20 ans (obligation légale médicale)
- Données de navigation: 13 mois maximum
- Consentements: 3 ans après retrait

## Vos droits
- Droit d'accès: privacy@nova-rdv.dz
- Droit de rectification: contact@nova-rdv.dz
- Droit à l'effacement: privacy@nova-rdv.dz
- Droit à la portabilité: privacy@nova-rdv.dz

## Contact DPO
Email: dpo@nova-rdv.dz
Téléphone: +213555000000
```

## Monitoring and Logging

### Application Metrics

```javascript
// metrics/auth-metrics.js
const prometheus = require('prom-client');

// Define metrics
const authMetrics = {
  otpGenerated: new prometheus.Counter({
    name: 'otp_generated_total',
    help: 'Total number of OTPs generated',
    labelNames: ['purpose']
  }),
  
  otpValidated: new prometheus.Counter({
    name: 'otp_validated_total',
    help: 'Total number of OTP validations',
    labelNames: ['result']
  }),
  
  authSessions: new prometheus.Gauge({
    name: 'active_auth_sessions',
    help: 'Number of active authentication sessions'
  }),
  
  emailsSent: new prometheus.Counter({
    name: 'emails_sent_total',
    help: 'Total emails sent',
    labelNames: ['provider', 'template', 'result']
  }),
  
  emailDeliveryTime: new prometheus.Histogram({
    name: 'email_delivery_duration_seconds',
    help: 'Email delivery time in seconds',
    labelNames: ['provider'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  })
};

module.exports = authMetrics;
```

### Health Check Endpoints

```javascript
// api/health/auth.js
app.get('/api/health/auth', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    email_providers: {},
    otp_service: false
  };

  try {
    // Database check
    await pool.query('SELECT 1');
    checks.database = true;

    // Redis check
    await redis.ping();
    checks.redis = true;

    // Email provider checks
    const emailService = getEmailService();
    const providerStatus = await emailService.getServiceStatus();
    checks.email_providers = providerStatus.provider_status;

    // OTP service check
    const otpService = new OTPService();
    const stats = otpService.getOTPStats();
    checks.otp_service = stats.active_otps >= 0;

    const allHealthy = checks.database && checks.redis && 
                     Object.values(checks.email_providers).some(p => p.available);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      checks,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Log Configuration

```javascript
// config/logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nova-rdv-auth' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security event logging
logger.addSecurityEvent = (event, details) => {
  logger.warn('SECURITY_EVENT', {
    event,
    details,
    timestamp: new Date().toISOString(),
    severity: 'HIGH'
  });
};

module.exports = logger;
```

### Alerting Rules

```yaml
# alerting/auth-alerts.yml
groups:
  - name: auth-alerts
    rules:
      - alert: HighOTPFailureRate
        expr: rate(otp_validated_total{result="failed"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High OTP failure rate detected"
          
      - alert: EmailProviderDown
        expr: up{job="email-provider"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Email provider is down"
          
      - alert: DatabaseConnections
        expr: auth_database_connections > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connection usage"
```

## Troubleshooting Guide

### Common Issues

#### Email Delivery Problems

**Problem**: Emails not being delivered

**Diagnosis**:
```bash
# Check email service status
curl http://localhost:3000/api/health/email

# Check provider configurations
node -e "
const emailService = require('./src/services/email.service');
emailService.testEmailDelivery('test@example.com').then(console.log);
"

# Check DNS records
dig TXT nova-rdv.dz | grep spf
dig TXT _dmarc.nova-rdv.dz
```

**Solutions**:
1. Verify DNS records are propagated
2. Check provider API keys and quotas
3. Review bounce/complaint rates
4. Ensure sender reputation is good

#### OTP Not Working

**Problem**: OTP codes not validating

**Diagnosis**:
```bash
# Check OTP service stats
curl http://localhost:3000/api/health/auth

# Check system time synchronization
timedatectl status

# Review OTP logs
grep "OTP" logs/combined.log | tail -20
```

**Solutions**:
1. Verify system time is correct
2. Check OTP expiration settings
3. Review rate limiting configuration
4. Clear expired OTP records

#### Authentication Failures

**Problem**: Users cannot sign in

**Diagnosis**:
```bash
# Check session storage
redis-cli keys "session:*" | wc -l

# Check database connectivity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM patients;"

# Review auth logs
grep "AUTH_FAILURE" logs/security.log
```

**Solutions**:
1. Restart Redis if sessions are missing
2. Check database connection pool
3. Verify JWT secret configuration
4. Review failed login patterns

### Performance Issues

#### Slow Email Delivery

**Problem**: Email delivery is slow

**Diagnosis**:
```bash
# Check email delivery metrics
curl http://localhost:3000/metrics | grep email_delivery_duration

# Test provider response times
time curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Solutions**:
1. Enable email queue processing
2. Add more email providers
3. Optimize email templates
4. Consider using CDN for images

#### High Memory Usage

**Problem**: Authentication service using too much memory

**Diagnosis**:
```bash
# Check Node.js memory usage
node -e "console.log(process.memoryUsage())"

# Check Redis memory usage
redis-cli info memory

# Profile application
npm install clinic
clinic doctor -- node app.js
```

**Solutions**:
1. Implement session cleanup
2. Optimize OTP storage
3. Add memory limits to containers
4. Scale horizontally

## Security Considerations

### Security Best Practices

#### OTP Security
- Use cryptographically secure random number generation
- Implement constant-time comparison to prevent timing attacks
- Rate limit OTP requests per email/IP
- Set reasonable expiration times (5 minutes recommended)
- Log all OTP generation and validation attempts

#### Session Management
- Use secure HTTP-only cookies for session tokens
- Implement CSRF protection
- Rotate session tokens on privilege escalation
- Set appropriate session timeouts
- Clear sessions on logout

#### Data Protection
- Encrypt sensitive data at rest
- Use TLS 1.3 for data in transit
- Implement proper key management
- Regular security audits and penetration testing
- Follow OWASP guidelines

### Security Monitoring

```javascript
// security/monitoring.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Audit logging
function auditLog(action, userId, details) {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
}
```

## Performance Optimization

### Caching Strategy

```javascript
// cache/auth-cache.js
const Redis = require('redis');
const redis = Redis.createClient(process.env.REDIS_URL);

class AuthCache {
  // Cache patient data
  async cachePatient(patientId, patientData, ttl = 3600) {
    await redis.setex(`patient:${patientId}`, ttl, JSON.stringify(patientData));
  }

  async getPatient(patientId) {
    const cached = await redis.get(`patient:${patientId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache email verification status
  async cacheEmailVerification(email, isVerified, ttl = 300) {
    await redis.setex(`email_verified:${email}`, ttl, isVerified ? '1' : '0');
  }

  // Rate limiting
  async checkRateLimit(key, limit, window) {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, window);
    }
    return current <= limit;
  }
}
```

### Database Optimization

```sql
-- Optimized queries for authentication
-- Use prepared statements and proper indexing

-- Efficient patient lookup
PREPARE get_patient_by_email AS
SELECT id, name, email, phone_e164, email_verified, account_status
FROM patients 
WHERE email = $1;

-- Efficient session validation
PREPARE validate_session AS
SELECT s.id, s.patient_id, s.expires_at, p.account_status
FROM auth_sessions s
JOIN patients p ON s.patient_id = p.id
WHERE s.token_hash = $1 
  AND s.is_active = true 
  AND s.expires_at > NOW();

-- Cleanup expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_records WHERE expires_at < NOW() - INTERVAL '1 hour';
  DELETE FROM auth_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup
SELECT cron.schedule('cleanup-auth', '0 */6 * * *', 'SELECT cleanup_expired_records();');
```

### Email Queue Optimization

```javascript
// queue/email-queue.js
const Bull = require('bull');
const emailQueue = new Bull('email queue', process.env.REDIS_URL);

// Process emails with retry logic
emailQueue.process(async (job) => {
  const { type, recipient, data } = job.data;
  
  try {
    if (type === 'otp') {
      await emailService.sendOTPEmail(recipient, data.code, data.expires);
    } else if (type === 'appointment_summary') {
      await emailService.sendAppointmentSummary(recipient, data);
    }
  } catch (error) {
    if (job.attemptsMade < 3) {
      throw error; // Will retry
    }
    // Log failure and continue
    logger.error('Email delivery failed permanently', { recipient, error });
  }
});

// Add email to queue
function queueEmail(type, recipient, data, options = {}) {
  return emailQueue.add({ type, recipient, data }, {
    attempts: 3,
    backoff: 'exponential',
    delay: options.delay || 0,
    ...options
  });
}
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup/auth-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/auth/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump $DATABASE_URL > $BACKUP_DIR/postgres_backup.sql

# Backup Redis
redis-cli --rdb $BACKUP_DIR/redis_backup.rdb

# Backup configuration
cp .env $BACKUP_DIR/env_backup
cp -r config/ $BACKUP_DIR/config_backup/

# Encrypt backup
gpg --cipher-algo AES256 --compress-algo 2 --symmetric \
    --output $BACKUP_DIR.gpg $BACKUP_DIR

# Upload to cloud storage
aws s3 cp $BACKUP_DIR.gpg s3://nova-rdv-backups/auth/

# Cleanup local backup
rm -rf $BACKUP_DIR $BACKUP_DIR.gpg

echo "Backup completed: $DATE"
```

### Recovery Procedures

```bash
#!/bin/bash
# recovery/auth-recovery.sh

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
  echo "Usage: $0 <backup_date>"
  exit 1
fi

# Download backup
aws s3 cp s3://nova-rdv-backups/auth/$BACKUP_DATE.gpg ./

# Decrypt backup
gpg --decrypt $BACKUP_DATE.gpg | tar -xzf -

# Restore PostgreSQL
psql $DATABASE_URL < $BACKUP_DATE/postgres_backup.sql

# Restore Redis
redis-cli --rdb $BACKUP_DATE/redis_backup.rdb

# Restore configuration
cp $BACKUP_DATE/env_backup .env
cp -r $BACKUP_DATE/config_backup/* config/

echo "Recovery completed for backup: $BACKUP_DATE"
```

### High Availability Setup

```yaml
# docker-compose.ha.yml
version: '3.8'
services:
  auth-service-1:
    image: nova-rdv-auth:latest
    environment:
      - NODE_ID=auth-1
    depends_on:
      - postgres
      - redis
    
  auth-service-2:
    image: nova-rdv-auth:latest
    environment:
      - NODE_ID=auth-2
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: nova_rdv
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - auth-service-1
      - auth-service-2

volumes:
  postgres_data:
  redis_data:
```

## Conclusion

This operations guide provides a comprehensive foundation for deploying and maintaining the NOVA RDV+ authentication and email systems. Regular review and updates of these procedures are essential as the system evolves and new security threats emerge.

### Next Steps

1. **Initial Deployment**: Follow the environment setup and provider configuration
2. **Monitoring Setup**: Implement metrics collection and alerting
3. **Security Audit**: Conduct regular security assessments
4. **Performance Testing**: Load test the authentication flows
5. **Documentation Updates**: Keep this guide current with system changes

### Support Contacts

- **Technical Issues**: tech-support@nova-rdv.dz
- **Security Incidents**: security@nova-rdv.dz
- **GDPR Questions**: privacy@nova-rdv.dz
- **Emergency Contact**: +213555000000

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-15  
**Review Date**: 2025-11-15