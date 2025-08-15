// Authentication models and types

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'patient' | 'practitioner' | 'manager' | 'admin';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Permission system
export type Permission = 
  | 'read' 
  | 'create' 
  | 'update' 
  | 'delete'
  | 'manage_users'
  | 'manage_cabinets'
  | 'view_reports'
  | 'manage_appointments'
  | 'access_medical_records';

export interface UserPermissions {
  userId: string;
  role: UserRole;
  permissions: Permission[];
  assignedCabinets: string[];
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  patient: ['read'],
  practitioner: ['read', 'create', 'update', 'access_medical_records', 'manage_appointments'],
  manager: ['read', 'create', 'update', 'delete', 'manage_appointments', 'view_reports'],
  admin: ['read', 'create', 'update', 'delete', 'manage_users', 'manage_cabinets', 'view_reports', 'manage_appointments', 'access_medical_records']
};

export const hasPermission = (userPermissions: UserPermissions, permission: Permission): boolean => {
  return userPermissions.permissions.includes(permission);
};

export const canAccessCabinet = (userPermissions: UserPermissions, cabinetId: string): boolean => {
  return userPermissions.role === 'admin' || userPermissions.assignedCabinets.includes(cabinetId);
};
