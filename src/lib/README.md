# Nova Platform Core Infrastructure

This directory contains the core infrastructure components for the Nova Internal Platform.

## Architecture Overview

The Nova Platform is built with a multi-tenant architecture supporting multiple dental cabinets with isolated data and shared administration.

### Core Components

#### 1. Database Layer (`/database`)
- **Multi-tenant database schema** with cabinet isolation
- **Connection management** for main platform and cabinet-specific databases
- **Automatic cabinet database provisioning**

#### 2. Authentication & Authorization (`/auth`, `/middleware`)
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control (RBAC)** with cabinet-scoped permissions
- **API Gateway** with authentication middleware
- **Rate limiting** and CORS support

#### 3. Configuration Management (`/config`)
- **Environment-specific settings** with validation
- **Secrets management** for production deployment
- **Feature flags** for controlled rollouts

#### 4. Logging & Monitoring (`/logging`, `/monitoring`)
- **Structured logging** with multiple levels and contexts
- **Metrics collection** for performance monitoring
- **Health checks** for system and cabinet-level monitoring
- **Audit logging** for compliance

#### 5. API Gateway (`/api`)
- **Centralized request handling** with middleware composition
- **Error handling** with consistent response formats
- **Request validation** and response formatting

#### 6. Core Bootstrap (`/core`)
- **System initialization** with dependency management
- **Graceful shutdown** handling
- **System readiness validation**

## Database Schema

### Main Database (`nova_main`)
- `cabinets` - Cabinet registry and metadata
- `users` - Global user management
- `user_cabinet_assignments` - Access control mappings
- `global_settings` - Platform-wide configuration
- `cabinet_configurations` - Cabinet-specific settings
- `audit_logs` - Security and compliance logging

### Cabinet Databases (`nova_cabinet_{id}`)
Each cabinet has its own isolated database with:
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `practitioners` - Staff and practitioners
- `services` - Available services
- `ai_conversations` - AI booking interactions

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password

# JWT Secrets (change in production!)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Other configurations...
```

## API Endpoints

### System Endpoints
- `GET /api/health` - System health check
- `GET /api/system/status` - Detailed system status

### Authentication (to be implemented)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Cabinet Management (to be implemented)
- `GET /api/cabinets` - List cabinets (admin only)
- `POST /api/cabinets` - Create new cabinet (admin only)
- `GET /api/cabinets/{id}` - Get cabinet details

## Usage

### Initialization
The system auto-initializes when the server starts:

```typescript
import { getInitializationPromise } from '@/lib/core/init';

// Ensure system is ready before handling requests
await getInitializationPromise();
```

### Creating API Routes
Use the API Gateway for consistent middleware:

```typescript
import APIGateway from '@/lib/api/gateway';

const gateway = new APIGateway({
  auth: { required: true },
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});

async function handler(req: NextRequest): Promise<NextResponse> {
  // Your handler logic
  return APIGateway.createResponse(data);
}

export const GET = gateway.createHandler(handler);
```

### Logging
Use the centralized logger:

```typescript
import Logger from '@/lib/logging/logger';

const logger = Logger.getInstance();
logger.info('Operation completed', { userId, cabinetId });
logger.error('Operation failed', error, { context });
```

### Metrics
Record business metrics:

```typescript
import MetricsCollector from '@/lib/monitoring/metrics';

const metrics = MetricsCollector.getInstance();
metrics.recordAPIRequest('GET', '/api/cabinets', duration, 200, cabinetId);
metrics.recordAuthEvent('login', true, userId);
```

## Security Considerations

1. **Multi-tenant Isolation**: Each cabinet's data is stored in a separate database
2. **Access Control**: Users can only access assigned cabinets
3. **Audit Logging**: All data access is logged for compliance
4. **Token Security**: JWT tokens with short expiry and refresh mechanism
5. **Rate Limiting**: API endpoints are protected against abuse

## Monitoring

The system provides comprehensive monitoring:

- **Health Checks**: Database, memory, disk, and API response times
- **Metrics**: Business and technical metrics collection
- **Logging**: Structured logs with context and audit trails
- **Alerts**: Configurable alerting for critical issues

## Next Steps

This infrastructure provides the foundation for:
1. User authentication and authorization system
2. Cabinet management and provisioning
3. AI booking service integration
4. Admin and manager dashboards
5. Analytics and reporting features