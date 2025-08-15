export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RoleDefinition {
  name: UserRole;
  description: string;
  permissions: Permission[];
  inherits?: UserRole[];
}

// Define all available permissions
export const PERMISSIONS = {
  // Cabinet management
  CABINET_CREATE: { resource: 'cabinet', action: 'create' },
  CABINET_READ: { resource: 'cabinet', action: 'read' },
  CABINET_UPDATE: { resource: 'cabinet', action: 'update' },
  CABINET_DELETE: { resource: 'cabinet', action: 'delete' },
  CABINET_DEPLOY: { resource: 'cabinet', action: 'deploy' },
  
  // User management
  USER_CREATE: { resource: 'user', action: 'create' },
  USER_READ: { resource: 'user', action: 'read' },
  USER_UPDATE: { resource: 'user', action: 'update' },
  USER_DELETE: { resource: 'user', action: 'delete' },
  USER_ASSIGN_CABINET: { resource: 'user', action: 'assign_cabinet' },
  
  // Patient management
  PATIENT_CREATE: { resource: 'patient', action: 'create' },
  PATIENT_READ: { resource: 'patient', action: 'read' },
  PATIENT_UPDATE: { resource: 'patient', action: 'update' },
  PATIENT_DELETE: { resource: 'patient', action: 'delete' },
  
  // Appointment management
  APPOINTMENT_CREATE: { resource: 'appointment', action: 'create' },
  APPOINTMENT_READ: { resource: 'appointment', action: 'read' },
  APPOINTMENT_UPDATE: { resource: 'appointment', action: 'update' },
  APPOINTMENT_DELETE: { resource: 'appointment', action: 'delete' },
  
  // Analytics and reporting
  ANALYTICS_READ: { resource: 'analytics', action: 'read' },
  ANALYTICS_EXPORT: { resource: 'analytics', action: 'export' },
  ANALYTICS_COMPARE: { resource: 'analytics', action: 'compare' },
  
  // System configuration
  SYSTEM_CONFIG_READ: { resource: 'system_config', action: 'read' },
  SYSTEM_CONFIG_UPDATE: { resource: 'system_config', action: 'update' },
  
  // AI booking service
  AI_BOOKING_READ: { resource: 'ai_booking', action: 'read' },
  AI_BOOKING_CONFIGURE: { resource: 'ai_booking', action: 'configure' },
} as const;

// Define role hierarchy and permissions
export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    name: 'super_admin',
    description: 'Super administrator with full system access',
    permissions: [
      // Full access to everything
      PERMISSIONS.CABINET_CREATE,
      PERMISSIONS.CABINET_READ,
      PERMISSIONS.CABINET_UPDATE,
      PERMISSIONS.CABINET_DELETE,
      PERMISSIONS.CABINET_DEPLOY,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.USER_ASSIGN_CABINET,
      PERMISSIONS.PATIENT_CREATE,
      PERMISSIONS.PATIENT_READ,
      PERMISSIONS.PATIENT_UPDATE,
      PERMISSIONS.PATIENT_DELETE,
      PERMISSIONS.APPOINTMENT_CREATE,
      PERMISSIONS.APPOINTMENT_READ,
      PERMISSIONS.APPOINTMENT_UPDATE,
      PERMISSIONS.APPOINTMENT_DELETE,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.ANALYTICS_COMPARE,
      PERMISSIONS.SYSTEM_CONFIG_READ,
      PERMISSIONS.SYSTEM_CONFIG_UPDATE,
      PERMISSIONS.AI_BOOKING_READ,
      PERMISSIONS.AI_BOOKING_CONFIGURE,
    ],
  },
  
  admin: {
    name: 'admin',
    description: 'Administrator with cabinet management access',
    permissions: [
      PERMISSIONS.CABINET_READ,
      PERMISSIONS.CABINET_UPDATE,
      PERMISSIONS.CABINET_DEPLOY,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_ASSIGN_CABINET,
      PERMISSIONS.PATIENT_READ,
      PERMISSIONS.APPOINTMENT_READ,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.ANALYTICS_COMPARE,
      PERMISSIONS.SYSTEM_CONFIG_READ,
      PERMISSIONS.AI_BOOKING_READ,
      PERMISSIONS.AI_BOOKING_CONFIGURE,
    ],
  },
  
  manager: {
    name: 'manager',
    description: 'Cabinet manager with cabinet-scoped access',
    permissions: [
      // Cabinet-scoped permissions
      { resource: 'cabinet', action: 'read', conditions: { scope: 'assigned' } },
      { resource: 'patient', action: 'create', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'patient', action: 'read', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'patient', action: 'update', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'appointment', action: 'create', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'appointment', action: 'read', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'appointment', action: 'update', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'analytics', action: 'read', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'analytics', action: 'export', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'ai_booking', action: 'read', conditions: { scope: 'assigned_cabinet' } },
    ],
  },
  
  staff: {
    name: 'staff',
    description: 'Staff member with limited cabinet access',
    permissions: [
      // Limited cabinet-scoped permissions
      { resource: 'patient', action: 'read', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'patient', action: 'update', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'appointment', action: 'read', conditions: { scope: 'assigned_cabinet' } },
      { resource: 'appointment', action: 'update', conditions: { scope: 'assigned_cabinet' } },
    ],
  },
};

export class RBACService {
  private static instance: RBACService;

  private constructor() {}

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  /**
   * Check if a user has a specific permission
   */
  public hasPermission(
    userRole: UserRole,
    resource: string,
    action: string,
    context?: {
      userId?: string;
      cabinetId?: string;
      assignedCabinets?: string[];
      [key: string]: any;
    }
  ): boolean {
    const roleDefinition = ROLE_DEFINITIONS[userRole];
    if (!roleDefinition) {
      return false;
    }

    // Super admin has access to everything
    if (userRole === 'super_admin') {
      return true;
    }

    // Check if the role has the required permission
    const permission = roleDefinition.permissions.find(
      p => p.resource === resource && p.action === action
    );

    if (!permission) {
      return false;
    }

    // If no conditions, permission is granted
    if (!permission.conditions) {
      return true;
    }

    // Check conditions
    return this.checkConditions(permission.conditions, context);
  }

  /**
   * Check if conditions are met for a permission
   */
  private checkConditions(
    conditions: Record<string, any>,
    context?: Record<string, any>
  ): boolean {
    if (!context) {
      return false;
    }

    // Check scope conditions
    if (conditions.scope) {
      switch (conditions.scope) {
        case 'assigned':
        case 'assigned_cabinet':
          // User must have access to the cabinet in context
          if (context.cabinetId && context.assignedCabinets) {
            return context.assignedCabinets.includes(context.cabinetId);
          }
          return false;
        
        case 'own':
          // User can only access their own resources
          return context.userId === context.resourceOwnerId;
        
        default:
          return false;
      }
    }

    return true;
  }

  /**
   * Get all permissions for a role
   */
  public getRolePermissions(userRole: UserRole): Permission[] {
    const roleDefinition = ROLE_DEFINITIONS[userRole];
    return roleDefinition ? roleDefinition.permissions : [];
  }

  /**
   * Check if a role can access a specific cabinet
   */
  public canAccessCabinet(
    userRole: UserRole,
    cabinetId: string,
    assignedCabinets: string[]
  ): boolean {
    // Super admin can access any cabinet
    if (userRole === 'super_admin') {
      return true;
    }

    // Admin can access any cabinet
    if (userRole === 'admin') {
      return true;
    }

    // Manager and staff can only access assigned cabinets
    return assignedCabinets.includes(cabinetId);
  }

  /**
   * Get accessible cabinets for a user
   */
  public getAccessibleCabinets(
    userRole: UserRole,
    assignedCabinets: string[],
    allCabinets: string[]
  ): string[] {
    // Super admin and admin can access all cabinets
    if (userRole === 'super_admin' || userRole === 'admin') {
      return allCabinets;
    }

    // Manager and staff can only access assigned cabinets
    return assignedCabinets;
  }

  /**
   * Check if a user can perform an action on a resource within a cabinet
   */
  public canPerformAction(
    userRole: UserRole,
    resource: string,
    action: string,
    cabinetId: string,
    assignedCabinets: string[]
  ): boolean {
    // First check if user can access the cabinet
    if (!this.canAccessCabinet(userRole, cabinetId, assignedCabinets)) {
      return false;
    }

    // Then check if user has permission for the action
    return this.hasPermission(userRole, resource, action, {
      cabinetId,
      assignedCabinets,
    });
  }

  /**
   * Validate role hierarchy - check if a user can manage another user
   */
  public canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      staff: 1,
      manager: 2,
      admin: 3,
      super_admin: 4,
    };

    return roleHierarchy[managerRole] > roleHierarchy[targetRole];
  }

  /**
   * Get available roles that a user can assign
   */
  public getAssignableRoles(userRole: UserRole): UserRole[] {
    switch (userRole) {
      case 'super_admin':
        return ['super_admin', 'admin', 'manager', 'staff'];
      case 'admin':
        return ['manager', 'staff'];
      case 'manager':
        return ['staff'];
      default:
        return [];
    }
  }
}