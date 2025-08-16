# Système de Types - NOVA RDV

## Vue d'ensemble

Ce document définit le système de types strict pour NOVA RDV, remplaçant tous les types `any` et `unknown` par des interfaces TypeScript robustes et des schémas de validation Zod.

## Objectifs du Système de Types

### 1. Élimination Complète des Types Any

- **Objectif**: 0 occurrence de `any` non justifié
- **Statut actuel**: 65+ occurrences identifiées
- **Stratégie**: Remplacement progressif par types stricts

### 2. Gestion Stricte des Types Unknown

- **Objectif**: Types unknown correctement gérés avec validation
- **Statut actuel**: 25+ occurrences mal gérées
- **Stratégie**: Validation runtime avec Zod

### 3. Type Safety au Niveau API

- **Objectif**: Toutes les API typées de bout en bout
- **Bénéfices**: Détection précoce des erreurs, meilleure DX

## Architecture du Système de Types

### Structure des Types

```
src/types/
├── core/               # Types de base
│   ├── api.ts         # Types API génériques
│   ├── common.ts      # Types communs
│   └── errors.ts      # Types d'erreur
├── entities/          # Types entités métier
│   ├── patient.ts     # Types patient
│   ├── appointment.ts # Types rendez-vous
│   ├── cabinet.ts     # Types cabinet
│   └── practitioner.ts # Types praticien
├── validation/        # Schémas Zod
│   ├── schemas.ts     # Schémas principaux
│   ├── api.ts         # Validation API
│   └── forms.ts       # Validation formulaires
├── external/          # Types APIs externes
│   ├── supabase.ts    # Types Supabase
│   ├── websocket.ts   # Types WebSocket
│   └── email.ts       # Types email
└── generated/         # Types générés
    ├── api-client.ts  # Client API typé
    └── database.ts    # Types base de données
```

## Types de Base

### 1. Types API Génériques

```typescript
// src/types/core/api.ts

export interface ApiResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<TData = unknown> extends ApiResponse<TData[]> {
  metadata: ResponseMetadata & {
    pagination: PaginationMeta;
  };
}

// Types pour les requêtes
export interface ListRequest {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sort?: SortOptions;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CreateRequest<TData = unknown> {
  data: TData;
  options?: RequestOptions;
}

export interface UpdateRequest<TData = unknown> {
  id: string;
  data: Partial<TData>;
  options?: RequestOptions;
}

export interface DeleteRequest {
  id: string;
  options?: RequestOptions;
}

export interface RequestOptions {
  skipValidation?: boolean;
  forceUpdate?: boolean;
  cascade?: boolean;
}
```

### 2. Types Communs

```typescript
// src/types/core/common.ts

export type UUID = string;
export type Email = string;
export type PhoneNumber = string;
export type DateTimeString = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = Array<JSONValue>;

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  wilaya?: string; // Spécifique à l'Algérie
}

export interface ContactInfo {
  email: Email;
  phone: PhoneNumber;
  address?: Address;
}

export interface TimeSlot {
  start: DateTimeString;
  end: DateTimeString;
}

export interface BusinessHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

// Types pour les états d'entité
export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface BaseEntity {
  id: UUID;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  status: EntityStatus;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: UUID;
  updatedBy: UUID;
  version: number;
}
```

## Types Entités Métier

### 1. Patient

```typescript
// src/types/entities/patient.ts

export interface Patient extends BaseEntity {
  firstName: string;
  lastName: string;
  email: Email;
  phone: PhoneNumber;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: PatientPreferences;
  cabinetId: UUID;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: PhoneNumber;
  email?: Email;
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes?: string;
  bloodType?: BloodType;
  insuranceInfo?: InsuranceInfo;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expiryDate?: string;
}

export interface PatientPreferences {
  language: 'fr' | 'ar' | 'en';
  communicationMethod: 'email' | 'sms' | 'phone';
  reminderSettings: ReminderSettings;
}

export interface ReminderSettings {
  enabled: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
  reminderTiming: number; // heures avant RDV
}

// Types pour les opérations sur les patients
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: Email;
  phone: PhoneNumber;
  cabinetId: UUID;
  dateOfBirth?: string;
  gender?: Patient['gender'];
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: Partial<MedicalInfo>;
  preferences?: Partial<PatientPreferences>;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: Email;
  phone?: PhoneNumber;
  dateOfBirth?: string;
  gender?: Patient['gender'];
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalInfo?: Partial<MedicalInfo>;
  preferences?: Partial<PatientPreferences>;
}

export interface PatientSearchFilters {
  name?: string;
  email?: string;
  phone?: string;
  cabinetId?: UUID;
  status?: EntityStatus;
  createdFrom?: string;
  createdTo?: string;
  hasAppointments?: boolean;
}
```

### 2. Rendez-vous

```typescript
// src/types/entities/appointment.ts

export interface Appointment extends AuditableEntity {
  patientId: UUID;
  practitionerId: UUID;
  cabinetId: UUID;
  startTime: DateTimeString;
  endTime: DateTimeString;
  type: AppointmentType;
  status: AppointmentStatus;
  title?: string;
  description?: string;
  notes?: string;
  duration: number; // en minutes
  price?: number;
  paid?: boolean;
  reminders?: AppointmentReminder[];
  metadata?: AppointmentMetadata;
}

export type AppointmentType = 
  | 'consultation'
  | 'cleaning'
  | 'filling'
  | 'extraction'
  | 'root_canal'
  | 'crown'
  | 'implant'
  | 'orthodontics'
  | 'emergency'
  | 'checkup'
  | 'other';

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface AppointmentReminder {
  type: 'email' | 'sms' | 'phone';
  scheduledAt: DateTimeString;
  sentAt?: DateTimeString;
  status: 'pending' | 'sent' | 'failed';
}

export interface AppointmentMetadata {
  source: 'online' | 'phone' | 'walk_in' | 'recurring';
  recurringId?: UUID;
  parentAppointmentId?: UUID;
  cancellationReason?: string;
  rescheduleHistory?: RescheduleEvent[];
  checkinTime?: DateTimeString;
  checkoutTime?: DateTimeString;
}

export interface RescheduleEvent {
  originalStartTime: DateTimeString;
  newStartTime: DateTimeString;
  reason?: string;
  rescheduledAt: DateTimeString;
  rescheduledBy: UUID;
}

// Types pour les opérations sur les rendez-vous
export interface CreateAppointmentRequest {
  patientId: UUID;
  practitionerId: UUID;
  cabinetId: UUID;
  startTime: DateTimeString;
  duration: number;
  type: AppointmentType;
  title?: string;
  description?: string;
  notes?: string;
  price?: number;
}

export interface UpdateAppointmentRequest {
  startTime?: DateTimeString;
  duration?: number;
  type?: AppointmentType;
  status?: AppointmentStatus;
  title?: string;
  description?: string;
  notes?: string;
  price?: number;
  paid?: boolean;
}

export interface AppointmentSearchFilters {
  patientId?: UUID;
  practitionerId?: UUID;
  cabinetId?: UUID;
  status?: AppointmentStatus;
  type?: AppointmentType;
  startDate?: string;
  endDate?: string;
  dateRange?: 'today' | 'tomorrow' | 'week' | 'month';
}

export interface AvailableSlot {
  startTime: DateTimeString;
  endTime: DateTimeString;
  practitionerId: UUID;
  cabinetId: UUID;
  duration: number;
  available: boolean;
}

export interface SlotSearchRequest {
  cabinetId: UUID;
  practitionerId?: UUID;
  date?: string;
  duration: number;
  startDate?: string;
  endDate?: string;
}
```

## Schémas de Validation Zod

### 1. Schémas de Base

```typescript
// src/types/validation/schemas.ts
import { z } from 'zod';

// Schémas de base
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+213[567]\d{8}$/, {
  message: "Format de téléphone invalide. Utilisez +213XXXXXXXXX"
});
export const DateTimeSchema = z.string().datetime();

// Schéma d'adresse
export const AddressSchema = z.object({
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  postalCode: z.string().min(5).max(10),
  country: z.string().min(2).max(100),
  wilaya: z.string().optional()
});

// Schéma de patient
export const PatientSchema = z.object({
  id: UUIDSchema,
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: EmailSchema,
  phone: PhoneSchema,
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: AddressSchema.optional(),
  cabinetId: UUIDSchema,
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
});

export const CreatePatientSchema = PatientSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
}).extend({
  gdprConsent: z.boolean().refine(val => val === true, {
    message: "Le consentement RGPD est obligatoire"
  })
});

export const UpdatePatientSchema = CreatePatientSchema.partial().omit({
  gdprConsent: true
});

// Schéma de rendez-vous
export const AppointmentSchema = z.object({
  id: UUIDSchema,
  patientId: UUIDSchema,
  practitionerId: UUIDSchema,
  cabinetId: UUIDSchema,
  startTime: DateTimeSchema,
  endTime: DateTimeSchema,
  type: z.enum([
    'consultation', 'cleaning', 'filling', 'extraction',
    'root_canal', 'crown', 'implant', 'orthodontics',
    'emergency', 'checkup', 'other'
  ]),
  status: z.enum([
    'scheduled', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ]),
  duration: z.number().min(15).max(480),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  paid: z.boolean().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  createdBy: UUIDSchema,
  updatedBy: UUIDSchema,
  version: z.number()
});

export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  endTime: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  version: true,
  paid: true
}).extend({
  // Validation métier
  startTime: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    { message: "Le rendez-vous doit être dans le futur" }
  ),
  duration: z.number().min(15).max(480).refine(
    (duration) => duration % 15 === 0,
    { message: "La durée doit être un multiple de 15 minutes" }
  )
});
```

### 2. Validation API

```typescript
// src/types/validation/api.ts
import { z } from 'zod';

// Schémas de réponse API
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
      details: z.record(z.unknown()).optional()
    }).optional(),
    metadata: z.object({
      timestamp: z.string(),
      requestId: z.string(),
      version: z.string()
    }).optional()
  });

// Schémas de pagination
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional()
});

// Validation des paramètres de route
export const RouteParamsSchema = z.object({
  id: UUIDSchema
});

export const CabinetRouteParamsSchema = z.object({
  cabinetId: UUIDSchema
});

export const PatientRouteParamsSchema = z.object({
  patientId: UUIDSchema
});

// Validation des query parameters
export const AppointmentQuerySchema = z.object({
  patientId: UUIDSchema.optional(),
  practitionerId: UUIDSchema.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.enum([
    'scheduled', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ]).optional(),
  type: z.enum([
    'consultation', 'cleaning', 'filling', 'extraction',
    'root_canal', 'crown', 'implant', 'orthodontics',
    'emergency', 'checkup', 'other'
  ]).optional()
}).merge(PaginationSchema);
```

## Utilitaires de Type

### 1. Type Guards

```typescript
// src/types/core/guards.ts

export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return EmailSchema.safeParse(value).success;
}

export function isPhoneNumber(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return PhoneSchema.safeParse(value).success;
}

export function isPatient(value: unknown): value is Patient {
  return PatientSchema.safeParse(value).success;
}

export function isAppointment(value: unknown): value is Appointment {
  return AppointmentSchema.safeParse(value).success;
}

export function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  if (typeof obj.success !== 'boolean') return false;
  
  if (obj.data !== undefined && !dataGuard(obj.data)) return false;
  
  return true;
}
```

### 2. Transformateurs de Type

```typescript
// src/types/core/transformers.ts

export function normalizePhone(phone: string): string {
  // Transforme 0555123456 en +213555123456
  if (phone.startsWith('0')) {
    return '+213' + phone.slice(1);
  }
  if (phone.startsWith('213')) {
    return '+' + phone;
  }
  if (!phone.startsWith('+')) {
    return '+213' + phone;
  }
  return phone;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toISOString();
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function transformPatientInput(input: unknown): CreatePatientRequest {
  const data = CreatePatientSchema.parse(input);
  
  return {
    ...data,
    firstName: sanitizeString(data.firstName),
    lastName: sanitizeString(data.lastName),
    phone: normalizePhone(data.phone),
    email: data.email.toLowerCase()
  };
}

export function transformAppointmentInput(input: unknown): CreateAppointmentRequest {
  const data = CreateAppointmentSchema.parse(input);
  
  return {
    ...data,
    startTime: formatDate(data.startTime)
  };
}
```

## Migration Strategy

### 1. Phase 1: Types de Base (Semaine 1)

```typescript
// Remplacer les any dans les types de base
// Avant:
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: any;
}

// Après:
interface ApiResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: ApiError;
  metadata?: ResponseMetadata;
}
```

### 2. Phase 2: Entités Métier (Semaine 2)

- Migration Patient types
- Migration Appointment types
- Migration Cabinet types
- Tests de validation

### 3. Phase 3: API Types (Semaine 3)

- Types pour toutes les routes API
- Validation Zod complète
- Error handling typé

### 4. Phase 4: Types Externes (Semaine 4)

- Types Supabase
- Types WebSocket
- Types services externes

## Standards de Qualité

### 1. Règles de Nommage

- **Interfaces**: PascalCase (`Patient`, `Appointment`)
- **Types**: PascalCase (`AppointmentStatus`)
- **Schémas Zod**: PascalCase + "Schema" (`PatientSchema`)
- **Type Guards**: camelCase + "is" prefix (`isPatient`)

### 2. Documentation TypeScript

```typescript
/**
 * Représente un patient dans le système NOVA
 * 
 * @example
 * ```typescript
 * const patient: Patient = {
 *   id: "uuid",
 *   firstName: "Jean",
 *   lastName: "Dupont",
 *   email: "jean.dupont@email.com",
 *   phone: "+213555123456",
 *   cabinetId: "cabinet-uuid",
 *   status: "active",
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export interface Patient extends BaseEntity {
  firstName: string;
  lastName: string;
  // ... autres propriétés
}
```

### 3. Tests de Types

```typescript
// src/types/__tests__/patient.test.ts
import { describe, it, expect } from 'vitest';
import { PatientSchema, isPatient } from '../entities/patient';

describe('Patient Types', () => {
  it('should validate correct patient data', () => {
    const validPatient = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com',
      phone: '+213555123456',
      cabinetId: '123e4567-e89b-12d3-a456-426614174001',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    
    expect(PatientSchema.safeParse(validPatient).success).toBe(true);
    expect(isPatient(validPatient)).toBe(true);
  });
  
  it('should reject invalid phone format', () => {
    const invalidPatient = {
      // ... autres champs valides
      phone: '0555123456' // Format algérien local, doit être +213555123456
    };
    
    expect(PatientSchema.safeParse(invalidPatient).success).toBe(false);
  });
});
```

Ce système de types fournit une base solide pour éliminer tous les types `any` et `unknown` non gérés, tout en offrant une validation runtime robuste et une excellente expérience développeur.