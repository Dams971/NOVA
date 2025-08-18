/**
 * API types for NOVA RDV platform
 * Comprehensive type definitions for request/response payloads
 */

import { Appointment, AppointmentStatus } from './appointment';
import { User } from './auth';
import { Cabinet, CabinetHealth } from './cabinet';
import { Patient } from './patient';

// Base API Response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'user' | 'manager' | 'admin';
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface OTPRequest {
  email: string;
  purpose: 'login' | 'registration' | 'password_reset';
}

export interface OTPVerifyRequest {
  email: string;
  code: string;
  purpose: 'login' | 'registration' | 'password_reset';
}

// Appointment API types
export interface CreateAppointmentRequest {
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  cabinetId: string;
  dateTime: string;
  duration?: number;
  type?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  dateTime?: string;
  duration?: number;
  status?: AppointmentStatus;
  notes?: string;
}

export interface AppointmentSlotsRequest {
  cabinetId: string;
  date: string;
  duration?: number;
}

export interface AppointmentSlot {
  start: string;
  end: string;
  available: boolean;
  cabinetId: string;
}

export interface AppointmentSlotsResponse {
  date: string;
  slots: AppointmentSlot[];
}

// Patient API types
export interface CreatePatientRequest {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  cabinetId: string;
}

export interface UpdatePatientRequest {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
}

export interface PatientSearchRequest {
  query: string;
  cabinetId?: string;
  filters?: {
    hasUpcomingAppointments?: boolean;
    lastVisitBefore?: string;
    lastVisitAfter?: string;
  };
}

// Cabinet API types
export interface CreateCabinetRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  specialties?: string[];
  workingHours?: WorkingHours;
  managerId?: string;
}

export interface UpdateCabinetRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  specialties?: string[];
  workingHours?: WorkingHours;
  isActive?: boolean;
}

export interface WorkingHours {
  [day: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface CabinetMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  revenue: number;
  patientCount: number;
  averageRating: number;
  period: {
    start: string;
    end: string;
  };
}

// Chat API types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: ChatContext;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  action?: ChatAction;
  suggestions?: string[];
  data?: Record<string, unknown>;
}

export interface ChatContext {
  userId?: string;
  cabinetId?: string;
  currentFlow?: string;
  collectedData?: Record<string, unknown>;
}

export interface ChatAction {
  type: 'book_appointment' | 'show_calendar' | 'collect_info' | 'redirect' | 'end_conversation';
  payload?: Record<string, unknown>;
}

// Analytics API types
export interface AnalyticsRequest {
  cabinetId?: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month';
}

export interface AnalyticsResponse {
  metrics: {
    appointments: AnalyticsMetric;
    revenue: AnalyticsMetric;
    patients: AnalyticsMetric;
    satisfaction: AnalyticsMetric;
  };
  trends: AnalyticsTrend[];
  comparisons?: AnalyticsComparison[];
}

export interface AnalyticsMetric {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface AnalyticsTrend {
  date: string;
  value: number;
  metric: string;
}

export interface AnalyticsComparison {
  cabinetId: string;
  cabinetName: string;
  metrics: Record<string, number>;
}

// Health monitoring types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    email: ServiceHealth;
    storage: ServiceHealth;
    websocket: ServiceHealth;
  };
  timestamp: string;
  version: string;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  sessionId?: string;
}

export interface WebSocketNotification {
  type: 'appointment_reminder' | 'appointment_cancelled' | 'new_message' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// File upload types
export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

// Email types
export interface EmailRequest {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, unknown>;
  html?: string;
  text?: string;
}

export interface EmailResponse {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
}

// Error types for specific domains
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DatabaseError {
  code: string;
  message: string;
  query?: string;
  table?: string;
}

export interface AuthenticationError {
  code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED' | 'FORBIDDEN';
  message: string;
  expiresAt?: string;
}

// Rate limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Search and filtering
export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Batch operations
export interface BatchRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
}

export interface BatchResponse<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}