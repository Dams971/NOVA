# NOVA RDV Type Hardening Guide

## Overview

This document outlines the type hardening strategy for the NOVA RDV project, focusing on eliminating the **211 `any` types** identified during lint validation and establishing robust TypeScript conventions.

## Current State Analysis

### Type Safety Metrics
- **Total `any` types**: 211
- **Files affected**: 78
- **Critical areas**: API routes, event handlers, WebSocket, UI components
- **Risk level**: Medium-High

### Distribution by File Type
| File Type | Any Count | Priority | Risk |
|-----------|-----------|----------|------|
| **API Routes** | 47 | Critical | High |
| **React Components** | 89 | High | Medium |
| **Service Files** | 31 | High | High |
| **Hook Files** | 23 | Medium | Medium |
| **Utility Files** | 21 | Low | Low |

## Type Hardening Strategy

### Phase 1: Critical Path Hardening (Week 1-2)
Focus on business-critical areas where type safety is essential.

#### 1.1 Authentication & Authorization
```typescript
// ❌ Current - Unsafe typing
const handleLogin = (credentials: any) => {
  // Implementation
};

// ✅ Target - Proper typing
interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface AuthResponse {
  token: string;
  user: UserProfile;
  expires: number;
}

const handleLogin = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  // Implementation
};
```

#### 1.2 API Responses
```typescript
// ❌ Current - Any response
const fetchAppointments = async (): Promise<any> => {
  const response = await fetch('/api/appointments');
  return response.json();
};

// ✅ Target - Typed responses
interface Appointment {
  id: string;
  patientId: string;
  cabinetId: string;
  datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  type: AppointmentType;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
  };
}

const fetchAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  const response = await fetch('/api/appointments');
  return response.json();
};
```

#### 1.3 Event Handlers
```typescript
// ❌ Current - Any events
const handleClick = (event: any) => {
  event.preventDefault();
};

const handleFormSubmit = (data: any) => {
  // Submit logic
};

// ✅ Target - Proper event typing
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

const handleFormSubmit = (data: AppointmentFormData) => {
  // Submit logic with proper validation
};
```

### Phase 2: Component Props & State (Week 3-4)

#### 2.1 Component Props
```typescript
// ❌ Current - Unsafe props
interface ComponentProps {
  data: any;
  onSelect: (item: any) => void;
  config?: any;
}

// ✅ Target - Strict typing
interface Cabinet {
  id: string;
  name: string;
  address: string;
  specialty: Specialty[];
}

interface ComponentProps {
  data: Cabinet[];
  onSelect: (cabinet: Cabinet) => void;
  config?: {
    showMap: boolean;
    maxDistance: number;
  };
}
```

#### 2.2 State Management
```typescript
// ❌ Current - Any state
const [data, setData] = useState<any>(null);
const [filters, setFilters] = useState<any>({});

// ✅ Target - Typed state
interface AppState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  status: AppointmentStatus[];
  cabinetId?: string;
}

const [appState, setAppState] = useState<AppState>({
  appointments: [],
  loading: false,
  error: null
});

const [filters, setFilters] = useState<FilterState>({
  dateRange: {
    start: new Date(),
    end: addDays(new Date(), 30)
  },
  status: ['pending', 'confirmed']
});
```

### Phase 3: Service Layer & WebSocket (Week 5-6)

#### 3.1 Service Interfaces
```typescript
// ❌ Current - Untyped services
class AppointmentService {
  async create(data: any): Promise<any> {
    // Implementation
  }
  
  async update(id: string, data: any): Promise<any> {
    // Implementation
  }
}

// ✅ Target - Fully typed services
interface CreateAppointmentRequest {
  patientInfo: {
    name: string;
    email: string;
    phone: string;
  };
  cabinetId: string;
  preferredDate: string;
  type: AppointmentType;
  notes?: string;
}

interface UpdateAppointmentRequest {
  datetime?: string;
  status?: AppointmentStatus;
  notes?: string;
}

class AppointmentService {
  async create(
    data: CreateAppointmentRequest
  ): Promise<ServiceResponse<Appointment>> {
    // Implementation with validation
  }
  
  async update(
    id: string, 
    data: UpdateAppointmentRequest
  ): Promise<ServiceResponse<Appointment>> {
    // Implementation with validation
  }
}
```

#### 3.2 WebSocket Types
```typescript
// ❌ Current - Any messages
interface WebSocketMessage {
  type: string;
  data: any;
}

// ✅ Target - Discriminated union types
type WebSocketMessage = 
  | {
      type: 'APPOINTMENT_CREATED';
      data: {
        appointment: Appointment;
        notification: NotificationData;
      };
    }
  | {
      type: 'APPOINTMENT_UPDATED';
      data: {
        appointmentId: string;
        changes: Partial<Appointment>;
      };
    }
  | {
      type: 'CHAT_MESSAGE';
      data: {
        sessionId: string;
        message: ChatMessage;
        sender: 'user' | 'bot';
      };
    };
```

### Phase 4: Advanced Types (Week 7-8)

#### 4.1 Generic Utilities
```typescript
// Create reusable generic types
type WithLoading<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type ApiEndpoint<TRequest, TResponse> = (
  request: TRequest
) => Promise<ServiceResponse<TResponse>>;

type FormHandler<T> = (data: T) => Promise<void> | void;

// Usage examples
const useAppointments = (): WithLoading<Appointment[]> => {
  // Hook implementation
};

const createAppointment: ApiEndpoint<
  CreateAppointmentRequest,
  Appointment
> = async (request) => {
  // Implementation
};
```

#### 4.2 Type Guards and Validation
```typescript
// Type guards for runtime validation
function isAppointment(obj: unknown): obj is Appointment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'patientId' in obj &&
    'cabinetId' in obj &&
    'datetime' in obj
  );
}

function isValidAppointmentStatus(
  status: string
): status is AppointmentStatus {
  return ['pending', 'confirmed', 'cancelled'].includes(status);
}

// Usage in API validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (!isAppointment(body)) {
    return NextResponse.json(
      { error: 'Invalid appointment data' }, 
      { status: 400 }
    );
  }
  
  // Safe to use body as Appointment
}
```

## Implementation Plan

### Week 1: Foundation Types
1. **Define Core Interfaces**
   - User, Patient, Cabinet, Appointment
   - API response wrappers
   - Common utility types

2. **Create Type Library**
   ```typescript
   // src/types/core.ts
   export interface User {
     id: string;
     email: string;
     role: UserRole;
     profile: UserProfile;
   }
   
   // src/types/api.ts
   export interface ApiResponse<T> {
     data: T;
     success: boolean;
     error?: ApiError;
   }
   ```

### Week 2: API Route Hardening
1. **Type all API routes**
2. **Add request/response validation**
3. **Implement proper error types**

### Week 3-4: Component Migration
1. **Update component props**
2. **Type component state**
3. **Fix event handlers**

### Week 5-6: Service Layer
1. **Type all service methods**
2. **Add WebSocket message types**
3. **Implement type guards**

### Week 7-8: Advanced Features
1. **Generic type utilities**
2. **Runtime validation**
3. **Type testing utilities**

## File-by-File Action Plan

### High Priority Files (Week 1)
```
src/app/api/auth/login/route.ts - 3 any types
src/app/api/appointments/create/route.ts - 4 any types  
src/app/api/chat/route.ts - 8 any types
src/lib/auth/auth-service.ts - 5 any types
src/services/appointment.service.ts - 6 any types
```

### Medium Priority Files (Week 2-3)
```
src/app/rdv/page.tsx - 9 any types
src/components/chat/chat-widget.tsx - 7 any types
src/components/admin/CabinetDetailView.tsx - 1 any type
src/components/admin/CabinetOverviewGrid.tsx - 4 any types
```

### Low Priority Files (Week 4-6)
```
src/components/auth/*.tsx - Various any types
src/hooks/*.ts - Hook parameter types
Test files and utilities
```

## Tools and Utilities

### Type Generation Scripts
```typescript
// scripts/generate-types.ts
import { generateApi } from 'swagger-typescript-api';

generateApi({
  name: 'api-types.ts',
  output: './src/types/',
  url: 'http://localhost:3000/api/swagger.json'
});
```

### Validation Libraries
```typescript
// Using Zod for runtime validation
import { z } from 'zod';

const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  cabinetId: z.string(),
  datetime: z.string().datetime(),
  status: z.enum(['pending', 'confirmed', 'cancelled'])
});

type Appointment = z.infer<typeof AppointmentSchema>;
```

### Type Testing
```typescript
// src/types/__tests__/type-tests.ts
import { expectType } from 'tsd';
import { Appointment, CreateAppointmentRequest } from '../core';

// Compile-time type tests
expectType<string>(appointment.id);
expectType<AppointmentStatus>(appointment.status);
```

## Quality Metrics

### Success Criteria
- **Zero `any` types** in critical paths (auth, API, payments)
- **<10 `any` types** in total codebase
- **100% type coverage** for public API
- **All event handlers properly typed**

### Monitoring
```bash
# Count remaining any types
grep -r "any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Generate type coverage report
npx type-coverage --detail
```

### ESLint Configuration
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn"
  }
}
```

## Migration Checklist

### For Each File
- [ ] Identify all `any` types
- [ ] Define proper interfaces
- [ ] Add type guards where needed
- [ ] Update function signatures
- [ ] Add JSDoc comments
- [ ] Test type safety
- [ ] Update tests

### For Each Component
- [ ] Type all props
- [ ] Type all state
- [ ] Type all event handlers
- [ ] Type all context values
- [ ] Add prop validation
- [ ] Update stories/docs

### For Each API Route
- [ ] Type request body
- [ ] Type response data
- [ ] Add input validation
- [ ] Type error responses
- [ ] Add API documentation
- [ ] Update tests

## Best Practices

### Type Definition Guidelines
1. **Prefer interfaces over types** for object shapes
2. **Use union types** for discriminated unions
3. **Create utility types** for common patterns
4. **Avoid deep nesting** in type definitions
5. **Use generic constraints** appropriately

### Error Handling
```typescript
// Typed error handling
interface ApiError {
  code: string;
  message: string;
  field?: string;
}

type Result<T, E = ApiError> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

### Type Organization
```
src/types/
├── core.ts          # Basic entities
├── api.ts           # API types
├── components.ts    # Component props
├── services.ts      # Service interfaces
├── websocket.ts     # WebSocket messages
└── utilities.ts     # Generic utilities
```

---
**Last Updated**: 2025-08-16  
**Version**: 1.0  
**Target Completion**: 8 weeks  
**Priority**: High (Type Safety)