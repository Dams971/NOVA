# NOVA Database Setup Guide

## Overview

NOVA has been configured to use **PostgreSQL** as its primary database. This document outlines the complete setup process and what has been implemented.

## What's Been Completed ✅

### 1. Database Schema & Architecture
- **Complete PostgreSQL schema** with all required tables
- **Multi-tenant architecture** support  
- **Email queue system** for reliable notifications
- **Audit logging** for compliance
- **Full-text search** capabilities
- **Performance indexes** for optimal queries

### 2. Database Connection Layer
- **PostgreSQL connection manager** with connection pooling
- **Environment configuration** for different environments
- **Transaction support** with automatic rollback
- **Connection testing** utilities

### 3. Initial Data & Test Users
- **Sample cabinet**: "Cabinet Dentaire Centre-Ville"
- **Test practitioners**: Dr. Martin (general dentistry), Dr. Lefebvre (orthodontist)
- **Test services**: Consultations, cleanings, fillings, emergency care
- **Test patient**: patient.test@example.com
- **Admin user**: admin@cabinet-dentaire-cv.fr

### 4. Email System
- **Email service** with SMTP integration (nodemailer)
- **Email templates** in French for appointments
- **Email queue** with retry logic and scheduling
- **Multi-tenant email** configuration

### 5. AI Chat System
- **NLP service** for French medical appointments
- **Chat orchestrator** with conversation management
- **Appointment booking tools** 
- **Animated chat widget** with sound notifications
- **Comprehensive testing** suite

## Database Setup Instructions

### Prerequisites
1. **PostgreSQL 12+** installed and running
2. **Node.js 18+** and npm
3. **Environment variables** configured

### Step 1: Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)  
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Run Database Setup
```bash
# From the project root
npm run setup-postgresql
```

This will:
- Create the `nova_user` and `nova_db`
- Set up the complete database schema
- Insert seed data with test users
- Verify the connection

### Step 3: Test Connection
```bash
# Test database connectivity
npm run db:test

# Or connect manually
psql -U nova_user -d nova_db -h localhost
```

### Step 4: Start the Application
```bash
# Start development server
npm run dev

# Visit http://localhost:3000
```

## Database Schema Overview

### Core Tables
- **`users`** - Authentication and basic user info
- **`cabinets`** - Dental practice information
- **`practitioners`** - Doctor profiles and specialties
- **`patients`** - Patient records and preferences
- **`appointments`** - Booking management
- **`services`** - Treatment types and pricing

### System Tables
- **`email_queue`** - Email delivery system
- **`chat_sessions`** - AI conversation tracking
- **`chat_messages`** - Message history
- **`audit_logs`** - Security and compliance logging

### Key Features
- **UUID primary keys** for better security
- **JSONB columns** for flexible metadata
- **Full-text search** with PostgreSQL's built-in capabilities
- **Automatic timestamps** with triggers
- **Foreign key constraints** for data integrity

## Environment Configuration

### Required Variables (.env.local)
```bash
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=nova_user
DB_PASSWORD=nova_password_2024
DB_NAME=nova_db
DB_SSL=false

# JWT Authentication
JWT_ACCESS_SECRET=your-secret-key-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-key-32-chars-minimum

# Email Configuration (provide SMTP credentials)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Feature Flags
ENABLE_AI_CHATBOT=true
ENABLE_REALTIME_UPDATES=true
```

## Test Users & Login Credentials

### Cabinet Admin
- **Email**: admin@cabinet-dentaire-cv.fr
- **Password**: password123
- **Role**: Cabinet administrator

### Practitioners
- **Email**: dr.martin@cabinet-dentaire-cv.fr
- **Password**: password123
- **Specialty**: General dentistry

- **Email**: dr.lefebvre@cabinet-dentaire-cv.fr  
- **Password**: password123
- **Specialty**: Orthodontist

### Test Patient
- **Email**: patient.test@example.com
- **Password**: password123
- **Role**: Patient

## Next Steps (TODO)

### Immediate Tasks
1. **Update remaining services** to use PostgreSQL instead of MySQL
2. **Provide SMTP credentials** for email functionality
3. **Setup WebSocket server** for real-time chat
4. **Run comprehensive tests** with real database

### Production Deployment
1. **Configure production PostgreSQL** server
2. **Set up SSL/TLS** connections
3. **Configure backup strategy**
4. **Set up monitoring** and logging
5. **Performance optimization** and indexing

### Advanced Features
1. **Redis integration** for caching and sessions
2. **File storage** integration (S3/MinIO)
3. **Multi-language support**
4. **Mobile app** development
5. **API documentation** with OpenAPI/Swagger

## Troubleshooting

### Common Issues

**PostgreSQL not starting**:
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql

# Windows
net start postgresql-x64-13
```

**Connection refused**:
- Check if PostgreSQL is running on port 5432
- Verify `pg_hba.conf` allows local connections
- Ensure user exists and has correct permissions

**Permission denied**:
```sql
-- Connect as postgres superuser
psql -U postgres

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE nova_db TO nova_user;
ALTER USER nova_user CREATEDB;
```

**Schema not found**:
- Run `npm run setup-postgresql` again
- Check if `setup-postgresql.sql` file exists
- Verify database connection in logs

## Database Maintenance

### Backup
```bash
# Full database backup
pg_dump -U nova_user -h localhost -d nova_db > nova_backup.sql

# Restore from backup
psql -U nova_user -h localhost -d nova_db < nova_backup.sql
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('nova_db'));

-- Check table sizes
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename = 'appointments';
```

## Support & Documentation

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Node.js pg Driver**: https://node-postgres.com/
- **Environment Config**: See `src/config/env.ts`
- **Database Schema**: See `setup-postgresql.sql`

---

🎉 **Database setup complete!** The NOVA system is ready for development and testing with a full PostgreSQL backend.