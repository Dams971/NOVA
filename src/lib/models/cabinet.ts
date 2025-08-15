import { v4 as uuidv4 } from 'uuid';

// Enums for type safety
export enum CabinetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPLOYING = 'deploying',
  MAINTENANCE = 'maintenance'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

// Core interfaces
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface CabinetSettings {
  timezone: string;
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      isOpen: boolean;
    };
  };
  bookingRules: {
    advanceBookingDays: number;
    cancellationHours: number;
    defaultAppointmentDuration: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    reminderHours: number[];
  };
  branding: {
    primaryColor: string;
    logo?: string;
    customMessage?: string;
  };
}

export interface Cabinet {
  id: string;
  name: string;
  slug: string;
  address: Address;
  phone: string;
  email: string;
  timezone: string;
  status: CabinetStatus;
  databaseName: string;
  settings?: CabinetSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CabinetConfig {
  configKey: string;
  configValue: any;
  cabinetId: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCabinetAssignment {
  id: string;
  userId: string;
  cabinetId: string;
  permissions: string[];
  assignedAt: Date;
}

// Data Transfer Objects for API
export interface CreateCabinetRequest {
  name: string;
  slug: string;
  address: Address;
  phone: string;
  email: string;
  timezone?: string;
  settings?: Partial<CabinetSettings>;
}

export interface UpdateCabinetRequest {
  name?: string;
  address?: Partial<Address>;
  phone?: string;
  email?: string;
  timezone?: string;
  status?: CabinetStatus;
  settings?: Partial<CabinetSettings>;
}

export interface CabinetFilters {
  status?: CabinetStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

// Factory functions
export function createCabinet(data: CreateCabinetRequest): Cabinet {
  const now = new Date();
  const defaultSettings: CabinetSettings = {
    timezone: data.timezone || 'Europe/Paris',
    workingHours: {
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '09:00', end: '13:00', isOpen: false },
      sunday: { start: '09:00', end: '13:00', isOpen: false }
    },
    bookingRules: {
      advanceBookingDays: 30,
      cancellationHours: 24,
      defaultAppointmentDuration: 30
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      reminderHours: [24, 2]
    },
    branding: {
      primaryColor: '#3B82F6'
    }
  };

  return {
    id: uuidv4(),
    name: data.name,
    slug: data.slug,
    address: data.address,
    phone: data.phone,
    email: data.email,
    timezone: data.timezone || 'Europe/Paris',
    status: CabinetStatus.DEPLOYING,
    databaseName: `nova_cabinet_${data.slug}`,
    settings: { ...defaultSettings, ...data.settings },
    createdAt: now,
    updatedAt: now
  };
}

export function createUser(data: {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}): User {
  const now = new Date();
  
  return {
    id: uuidv4(),
    email: data.email,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
}