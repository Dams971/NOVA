/**
 * Authentication types for NOVA RDV platform
 */

// User role definitions
export type UserRole = 'patient' | 'manager' | 'admin' | 'super_admin';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  assignedCabinets: string[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// User preferences
export interface UserPreferences {
  language: 'fr' | 'ar' | 'en';
  timezone: string;
  notificationsEnabled: boolean;
  emailNotifications: {
    appointments: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  smsNotifications: {
    appointments: boolean;
    reminders: boolean;
  };
}

// JWT token payload
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: UserRole;
  assignedCabinets: string[];
  iat: number; // Issued at
  exp: number; // Expires at
  jti: string; // JWT ID
  family: string; // Token family for refresh tracking
  type: 'access' | 'refresh';
  sessionId?: string;
}

// Authentication context
export interface AuthContext {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  sessionId: string;
  permissions: Permission[];
  hasRole: (role: UserRole) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  hasCabinetAccess: (cabinetId: string) => boolean;
}

// Permission structure
export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
}

// Session information
export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

// Device information
export interface DeviceInfo {
  type: 'web' | 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  isTrusted: boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: Partial<DeviceInfo>;
}

// Registration data
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingConsent?: boolean;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Password reset confirmation
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

// OTP (One-Time Password) related types
export interface OTPRequest {
  email: string;
  purpose: 'login' | 'registration' | 'password_reset' | 'email_verification';
}

export interface OTPVerification {
  email: string;
  code: string;
  purpose: 'login' | 'registration' | 'password_reset' | 'email_verification';
}

// Multi-factor authentication
export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerification {
  code: string;
  backupCode?: string;
}

// Authentication response types
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  session?: Session;
  error?: string;
  requiresMFA?: boolean;
  requires2FA?: boolean;
}

// Token validation result
export interface TokenValidation {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
  isExpired?: boolean;
  isRevoked?: boolean;
}

// Access control types
export interface AccessControl {
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
  cabinetId?: string;
}

// Role-based access control
export interface RolePermissions {
  [role: string]: {
    permissions: Permission[];
    inherit?: string[];
  };
}

// Cabinet access
export interface CabinetAccess {
  cabinetId: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  grantedAt: Date;
  grantedBy: string;
}

// Security events
export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'mfa_enabled' | 'mfa_disabled';
  userId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Account verification
export interface AccountVerification {
  type: 'email' | 'phone';
  token: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

// API key for service-to-service authentication
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: Permission[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
}

// Authentication middleware configuration
export interface AuthMiddlewareConfig {
  requireAuth: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: AccessControl[];
  allowedCabinets?: string[];
  rateLimitByUser?: boolean;
  sessionRequired?: boolean;
}

// Password policy
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays?: number;
}

// Account lockout policy
export interface LockoutPolicy {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  resetOnSuccess: boolean;
}

// GDPR consent tracking
export interface GDPRConsent {
  userId: string;
  dataProcessing: boolean;
  marketingEmails: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
  consentVersion: string;
  timestamp: Date;
  ipAddress: string;
  withdrawnAt?: Date;
}

// Social authentication providers
export interface SocialProvider {
  provider: 'google' | 'facebook' | 'apple' | 'microsoft';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}