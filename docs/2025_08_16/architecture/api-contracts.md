# NOVA RDV - Contrats d'API Frontend

## Vue d'ensemble

Les contrats d'API frontend définissent les interfaces entre les composants React et les services backend, garantissant la type safety, la gestion d'erreurs robuste et l'optimisation des performances. Cette architecture supporte le multi-tenant, les WebSocket temps réel et la conformité RGPD.

**Principes Architecturaux:**
- **Type Safety** : Interfaces TypeScript strictes pour tous les échanges
- **Error Handling** : Gestion centralisée avec retry automatique
- **Performance** : Cache optimisé, lazy loading et pagination
- **Real-time** : WebSocket pour dashboard manager et notifications
- **Offline** : Support hors ligne avec synchronisation automatique

## Architecture des Services

### Structure des Services

```
src/services/
├── core/                   # Services de base
│   ├── api-client.ts      # Client HTTP configuré
│   ├── websocket-client.ts # Client WebSocket
│   ├── cache-manager.ts   # Gestion du cache
│   ├── error-handler.ts   # Gestion centralisée des erreurs
│   └── types.ts           # Types partagés
├── auth/                  # Authentification
│   ├── auth.service.ts
│   ├── types.ts
│   └── hooks.ts
├── appointments/          # Gestion RDV
│   ├── appointments.service.ts
│   ├── types.ts
│   └── hooks.ts
├── patients/             # Gestion patients
│   ├── patients.service.ts
│   ├── types.ts
│   └── hooks.ts
├── cabinets/            # Gestion cabinets
│   ├── cabinets.service.ts
│   ├── types.ts
│   └── hooks.ts
├── notifications/       # Notifications temps réel
│   ├── notifications.service.ts
│   ├── types.ts
│   └── hooks.ts
└── analytics/          # Analytics et métriques
    ├── analytics.service.ts
    ├── types.ts
    └── hooks.ts
```

### Client API Base

```typescript
// src/services/core/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ErrorDetails, PaginatedResponse } from './types';

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  
  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor - JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('nova_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Tenant ID pour multi-tenant
        const tenantId = localStorage.getItem('nova_tenant_id');
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor - Error handling et token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('nova_refresh_token');
            const response = await this.refreshToken(refreshToken);
            
            localStorage.setItem('nova_access_token', response.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(this.normalizeError(error));
      }
    );
  }
  
  private async refreshToken(refreshToken: string) {
    return this.client.post('/auth/refresh', { refreshToken });
  }
  
  private normalizeError(error: any): ErrorDetails {
    if (error.response) {
      return {
        code: error.response.data?.code || 'API_ERROR',
        message: error.response.data?.message || 'Une erreur est survenue',
        status: error.response.status,
        details: error.response.data?.details
      };
    }
    
    if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion réseau',
        status: 0
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
      status: 0
    };
  }
  
  // Méthodes HTTP avec retry automatique
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.withRetry(() => this.client.get(url, config));
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.withRetry(() => this.client.post(url, data, config));
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.withRetry(() => this.client.put(url, data, config));
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.withRetry(() => this.client.delete(url, config));
  }
  
  private async withRetry<T>(
    operation: () => Promise<any>,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const response = await operation();
      return {
        success: true,
        data: response.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers['x-request-id']
        }
      };
    } catch (error) {
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.withRetry(operation, attempt + 1);
      }
      throw error;
    }
  }
  
  private shouldRetry(error: any): boolean {
    return error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instance globale configurée
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});
```

### Types Core

```typescript
// src/services/core/types.ts

// Response wrapper générique
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  meta?: ResponseMeta;
}

// Métadonnées de réponse
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
  cached?: boolean;
}

// Détails d'erreur
export interface ErrorDetails {
  code: string;
  message: string;
  status?: number;
  field?: string;
  details?: any;
  retryable?: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Paramètres de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// États de chargement
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: ErrorDetails;
  isRefetching?: boolean;
  isValidating?: boolean;
}

// Cache configuration
export interface CacheConfig {
  ttl?: number;           // Time to live en ms
  staleTime?: number;     // Temps avant considéré comme obsolète
  cacheKey?: string;      // Clé de cache personnalisée
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

// WebSocket events
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
  cabinetId?: string;
}

// Notification temps réel
export interface RealtimeNotification {
  id: string;
  type: 'appointment' | 'patient' | 'system' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}
```

## Services d'Authentification

### Auth Service

```typescript
// src/services/auth/types.ts
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginOTPRequest {
  email: string;
  otp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'practitioner' | 'admin' | 'manager';
  cabinetId?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'fr' | 'en';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  permissions: string[];
  lastLoginAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: ErrorDetails | null;
}

// src/services/auth/auth.service.ts
class AuthService {
  private storageKey = 'nova_auth_state';
  
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser & AuthTokens>> {
    const response = await apiClient.post<AuthUser & AuthTokens>('/auth/login', credentials);
    
    if (response.success && response.data) {
      this.storeAuthData(response.data);
    }
    
    return response;
  }
  
  async loginWithOTP(request: LoginOTPRequest): Promise<ApiResponse<AuthUser & AuthTokens>> {
    const response = await apiClient.post<AuthUser & AuthTokens>('/auth/login-otp', request);
    
    if (response.success && response.data) {
      this.storeAuthData(response.data);
    }
    
    return response;
  }
  
  async logout(): Promise<ApiResponse<void>> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
    
    return { success: true };
  }
  
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    return apiClient.get<AuthUser>('/auth/me');
  }
  
  async updateProfile(data: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> {
    return apiClient.put<AuthUser>('/auth/profile', data);
  }
  
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.put('/auth/change-password', data);
  }
  
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/password-reset-request', { email });
  }
  
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/password-reset', { token, newPassword });
  }
  
  private storeAuthData(data: AuthUser & AuthTokens) {
    const { accessToken, refreshToken, expiresIn, tokenType, ...user } = data;
    
    localStorage.setItem('nova_access_token', accessToken);
    localStorage.setItem('nova_refresh_token', refreshToken);
    localStorage.setItem('nova_user', JSON.stringify(user));
    
    if (user.cabinetId) {
      localStorage.setItem('nova_tenant_id', user.cabinetId);
    }
  }
  
  private clearAuthData() {
    localStorage.removeItem('nova_access_token');
    localStorage.removeItem('nova_refresh_token');
    localStorage.removeItem('nova_user');
    localStorage.removeItem('nova_tenant_id');
  }
  
  getStoredUser(): AuthUser | null {
    try {
      const user = localStorage.getItem('nova_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('nova_access_token');
  }
}

export const authService = new AuthService();

// src/services/auth/hooks.ts
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: authService.isAuthenticated(),
    user: authService.getStoredUser(),
    tokens: null,
    isLoading: false,
    error: null
  });
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setAuthState({
          isAuthenticated: true,
          user: response.data,
          tokens: {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            expiresIn: response.data.expiresIn,
            tokenType: response.data.tokenType
          },
          isLoading: false,
          error: null
        });
      }
      
      return response;
    } catch (error) {
      const authError = error as ErrorDetails;
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: authError 
      }));
      throw error;
    }
  }, []);
  
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error as ErrorDetails 
      }));
    }
  }, []);
  
  return {
    ...authState,
    login,
    logout,
    updateProfile: authService.updateProfile.bind(authService),
    changePassword: authService.changePassword.bind(authService)
  };
};
```

## Services de Rendez-vous

### Appointments Service

```typescript
// src/services/appointments/types.ts
export interface Appointment {
  id: string;
  patientId: string;
  practitionerId: string;
  cabinetId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  createdAt: string;
  updatedAt: string;
  
  // Relations populées
  patient?: Patient;
  practitioner?: Practitioner;
  cabinet?: Cabinet;
}

export type AppointmentType = 
  | 'consultation'
  | 'controle'
  | 'soin'
  | 'detartrage'
  | 'extraction'
  | 'implant'
  | 'orthodontie'
  | 'urgence';

export type AppointmentStatus = 
  | 'pending'      // En attente de confirmation
  | 'confirmed'    // Confirmé
  | 'cancelled'    // Annulé
  | 'completed'    // Terminé
  | 'no_show'      // Absence non justifiée
  | 'rescheduled'; // Reprogrammé

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  practitionerId?: string;
  duration: number;
  type?: AppointmentType;
}

export interface CreateAppointmentRequest {
  patientId?: string;  // Si null, créer nouveau patient
  patientData?: {      // Données nouveau patient
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  practitionerId: string;
  type: AppointmentType;
  startTime: string;
  duration: number;
  notes?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

export interface UpdateAppointmentRequest {
  startTime?: string;
  duration?: number;
  status?: AppointmentStatus;
  notes?: string;
  practitionerId?: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  practitionerId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

// src/services/appointments/appointments.service.ts
class AppointmentsService {
  async getAppointments(
    params: PaginationParams & AppointmentFilters
  ): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
    
    return apiClient.get<PaginatedResponse<Appointment>>(
      `/appointments?${searchParams.toString()}`
    );
  }
  
  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return apiClient.get<Appointment>(`/appointments/${id}`);
  }
  
  async createAppointment(
    data: CreateAppointmentRequest
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.post<Appointment>('/appointments', data);
  }
  
  async updateAppointment(
    id: string,
    data: UpdateAppointmentRequest
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.put<Appointment>(`/appointments/${id}`, data);
  }
  
  async cancelAppointment(
    id: string,
    reason?: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.put<Appointment>(`/appointments/${id}/cancel`, { reason });
  }
  
  async confirmAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return apiClient.put<Appointment>(`/appointments/${id}/confirm`);
  }
  
  async getAvailableSlots(
    practitionerId: string,
    dateFrom: string,
    dateTo: string,
    duration: number = 30
  ): Promise<ApiResponse<AppointmentSlot[]>> {
    return apiClient.get<AppointmentSlot[]>('/appointments/slots', {
      params: { practitionerId, dateFrom, dateTo, duration }
    });
  }
  
  async rescheduleAppointment(
    id: string,
    newStartTime: string
  ): Promise<ApiResponse<Appointment>> {
    return apiClient.put<Appointment>(`/appointments/${id}/reschedule`, {
      startTime: newStartTime
    });
  }
  
  async getPatientAppointments(
    patientId: string,
    params?: PaginationParams & { includeHistory?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<PaginatedResponse<Appointment>>(
      `/patients/${patientId}/appointments?${searchParams.toString()}`
    );
  }
}

export const appointmentsService = new AppointmentsService();

// src/services/appointments/hooks.ts
export const useAppointments = (
  params: PaginationParams & AppointmentFilters = {},
  options: CacheConfig = {}
) => {
  const [state, setState] = useState<{
    data: PaginatedResponse<Appointment> | null;
    loading: LoadingState;
  }>({
    data: null,
    loading: { isLoading: true, isError: false }
  });
  
  const fetchAppointments = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loading: { 
        ...prev.loading, 
        isLoading: true, 
        isError: false, 
        error: undefined 
      } 
    }));
    
    try {
      const response = await appointmentsService.getAppointments(params);
      
      if (response.success) {
        setState({
          data: response.data!,
          loading: { isLoading: false, isError: false }
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: { 
            isLoading: false, 
            isError: true, 
            error: response.error 
          }
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: { 
          isLoading: false, 
          isError: true, 
          error: error as ErrorDetails 
        }
      }));
    }
  }, [params]);
  
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  const refetch = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  return {
    appointments: state.data?.items || [],
    pagination: state.data?.pagination,
    ...state.loading,
    refetch
  };
};

export const useCreateAppointment = () => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: ErrorDetails | null;
  }>({
    isLoading: false,
    error: null
  });
  
  const createAppointment = useCallback(async (data: CreateAppointmentRequest) => {
    setState({ isLoading: true, error: null });
    
    try {
      const response = await appointmentsService.createAppointment(data);
      setState({ isLoading: false, error: null });
      return response;
    } catch (error) {
      const apiError = error as ErrorDetails;
      setState({ isLoading: false, error: apiError });
      throw error;
    }
  }, []);
  
  return {
    createAppointment,
    ...state
  };
};

export const useAvailableSlots = (
  practitionerId: string,
  dateFrom: string,
  dateTo: string,
  duration: number = 30
) => {
  const [state, setState] = useState<{
    slots: AppointmentSlot[];
    loading: LoadingState;
  }>({
    slots: [],
    loading: { isLoading: true, isError: false }
  });
  
  useEffect(() => {
    if (!practitionerId || !dateFrom || !dateTo) return;
    
    const fetchSlots = async () => {
      setState(prev => ({ 
        ...prev, 
        loading: { isLoading: true, isError: false, error: undefined } 
      }));
      
      try {
        const response = await appointmentsService.getAvailableSlots(
          practitionerId,
          dateFrom,
          dateTo,
          duration
        );
        
        if (response.success) {
          setState({
            slots: response.data || [],
            loading: { isLoading: false, isError: false }
          });
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: { 
            isLoading: false, 
            isError: true, 
            error: error as ErrorDetails 
          }
        }));
      }
    };
    
    fetchSlots();
  }, [practitionerId, dateFrom, dateTo, duration]);
  
  return state;
};
```

## WebSocket Service

### Real-time Notifications

```typescript
// src/services/websocket/websocket-client.ts
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventHandlers = new Map<string, Set<(data: any) => void>>();
  
  constructor(url: string) {
    this.url = url;
  }
  
  connect(token: string, cabinetId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = new URL(this.url);
      wsUrl.searchParams.set('token', token);
      if (cabinetId) {
        wsUrl.searchParams.set('cabinetId', cabinetId);
      }
      
      this.ws = new WebSocket(wsUrl.toString());
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.stopHeartbeat();
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token, cabinetId);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }
  
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
  
  private scheduleReconnect(token: string, cabinetId?: string) {
    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect(token, cabinetId).catch(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token, cabinetId);
        }
      });
    }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts));
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, 30000); // 30 seconds
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private handleMessage(message: WebSocketEvent) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }
  
  on(eventType: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }
  
  off(eventType: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  send(type: string, data?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

// Instance globale
export const wsClient = new WebSocketClient(
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080'
);

// src/services/notifications/hooks.ts
export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const connect = async () => {
      try {
        const token = localStorage.getItem('nova_access_token');
        if (token) {
          await wsClient.connect(token, user.cabinetId);
          setConnected(true);
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnected(false);
      }
    };
    
    connect();
    
    // Event handlers
    const handleNotification = (notification: RealtimeNotification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast.custom(() => (
        <div className={cn(
          "bg-white border rounded-lg shadow-lg p-4 max-w-sm",
          notification.priority === 'critical' && "border-error-500 bg-error-50"
        )}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'emergency' && 
                <AlertTriangle className="h-5 w-5 text-error-600" />
              }
              {notification.type === 'appointment' && 
                <Calendar className="h-5 w-5 text-primary-600" />
              }
              {notification.type === 'patient' && 
                <User className="h-5 w-5 text-success-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="text-sm text-gray-500">
                {notification.message}
              </p>
              {notification.actions && (
                <div className="mt-2 flex gap-2">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        action.style === 'primary' && "bg-primary-600 text-white",
                        action.style === 'danger' && "bg-error-600 text-white"
                      )}
                      onClick={() => handleNotificationAction(notification.id, action.action)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ), {
        duration: notification.priority === 'critical' ? Infinity : 5000
      });
    };
    
    const handleAppointmentUpdate = (data: any) => {
      // Handle appointment updates
      console.log('Appointment updated:', data);
    };
    
    wsClient.on('notification', handleNotification);
    wsClient.on('appointment_updated', handleAppointmentUpdate);
    
    return () => {
      wsClient.off('notification', handleNotification);
      wsClient.off('appointment_updated', handleAppointmentUpdate);
      wsClient.disconnect();
      setConnected(false);
    };
  }, [user]);
  
  const handleNotificationAction = async (notificationId: string, action: string) => {
    // Implement notification action handling
    console.log('Notification action:', notificationId, action);
  };
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };
  
  const clearAll = () => {
    setNotifications([]);
  };
  
  return {
    notifications,
    connected,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
};
```

## Cache et Performance

### Cache Manager

```typescript
// src/services/core/cache-manager.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key
    };
    
    this.cache.set(key, entry);
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Cleanup toutes les 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);
```

### Hook avec Cache Intelligent

```typescript
// src/services/core/hooks.ts
export const useApiQuery = <T>(
  queryKey: string | string[],
  queryFn: () => Promise<ApiResponse<T>>,
  options: CacheConfig & {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: ErrorDetails) => void;
  } = {}
) => {
  const cacheKey = Array.isArray(queryKey) ? queryKey.join(':') : queryKey;
  const [state, setState] = useState<{
    data: T | null;
    loading: LoadingState;
  }>({
    data: cacheManager.get<T>(cacheKey),
    loading: { isLoading: !cacheManager.has(cacheKey), isError: false }
  });
  
  const {
    enabled = true,
    ttl = 5 * 60 * 1000,
    staleTime = 30 * 1000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refetchInterval,
    onSuccess,
    onError
  } = options;
  
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) return;
    
    const cachedData = cacheManager.get<T>(cacheKey);
    const now = Date.now();
    
    // Use cached data if not stale
    if (cachedData && !isRefetch) {
      const entry = cacheManager['cache'].get(cacheKey);
      const isStale = entry && (now - entry.timestamp) > staleTime;
      
      if (!isStale) {
        setState({
          data: cachedData,
          loading: { isLoading: false, isError: false }
        });
        return;
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      loading: { 
        ...prev.loading,
        isLoading: !cachedData,
        isRefetching: !!cachedData,
        isError: false,
        error: undefined
      } 
    }));
    
    try {
      const response = await queryFn();
      
      if (response.success && response.data) {
        cacheManager.set(cacheKey, response.data, ttl);
        setState({
          data: response.data,
          loading: { isLoading: false, isError: false }
        });
        onSuccess?.(response.data);
      } else if (response.error) {
        setState(prev => ({
          ...prev,
          loading: { 
            isLoading: false, 
            isError: true, 
            error: response.error 
          }
        }));
        onError?.(response.error);
      }
    } catch (error) {
      const apiError = error as ErrorDetails;
      setState(prev => ({
        ...prev,
        loading: { 
          isLoading: false, 
          isError: true, 
          error: apiError 
        }
      }));
      onError?.(apiError);
    }
  }, [enabled, cacheKey, queryFn, ttl, staleTime, onSuccess, onError]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => fetchData(true), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);
  
  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);
  
  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;
    
    const handleOnline = () => fetchData(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);
  
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  const invalidate = useCallback(() => {
    cacheManager.delete(cacheKey);
  }, [cacheKey]);
  
  return {
    data: state.data,
    ...state.loading,
    refetch,
    invalidate
  };
};
```

Cette architecture de contrats d'API frontend offre une base robuste et évolutive pour NOVA RDV, garantissant la type safety, les performances optimales et une excellente expérience développeur.