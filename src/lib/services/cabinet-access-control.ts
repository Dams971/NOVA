/**
 * Cabinet Access Control Service
 * Ensures proper data isolation between cabinets as per Requirement 3.2
 */

export interface UserContext {
  userId: string;
  role: 'admin' | 'manager' | 'practitioner' | 'assistant';
  assignedCabinets: string[];
  permissions: string[];
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
}

export class CabinetAccessControl {
  private static instance: CabinetAccessControl;

  private constructor() {}

  static getInstance(): CabinetAccessControl {
    if (!CabinetAccessControl.instance) {
      CabinetAccessControl.instance = new CabinetAccessControl();
    }
    return CabinetAccessControl.instance;
  }

  /**
   * Check if user can access a specific cabinet
   */
  canAccessCabinet(userContext: UserContext, cabinetId: string): AccessControlResult {
    // Admin users can access all cabinets
    if (userContext.role === 'admin') {
      return { allowed: true };
    }

    // Other users can only access their assigned cabinets
    if (userContext.assignedCabinets.includes(cabinetId)) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: `User ${userContext.userId} is not authorized to access cabinet ${cabinetId}` 
    };
  }

  /**
   * Filter appointments to only include those from accessible cabinets
   */
  filterAppointmentsByCabinet<T extends { cabinetId: string }>(
    userContext: UserContext, 
    appointments: T[]
  ): T[] {
    // Admin users can see all appointments
    if (userContext.role === 'admin') {
      return appointments;
    }

    // Filter to only assigned cabinets
    return appointments.filter(appointment => 
      userContext.assignedCabinets.includes(appointment.cabinetId)
    );
  }

  /**
   * Validate that an appointment operation is allowed
   */
  validateAppointmentOperation(
    userContext: UserContext, 
    cabinetId: string, 
    operation: 'create' | 'read' | 'update' | 'delete'
  ): AccessControlResult {
    // Check cabinet access first
    const cabinetAccess = this.canAccessCabinet(userContext, cabinetId);
    if (!cabinetAccess.allowed) {
      return cabinetAccess;
    }

    // Check operation-specific permissions
    switch (operation) {
      case 'create':
        if (this.hasPermission(userContext, 'appointments:create')) {
          return { allowed: true };
        }
        break;
      case 'read':
        if (this.hasPermission(userContext, 'appointments:read')) {
          return { allowed: true };
        }
        break;
      case 'update':
        if (this.hasPermission(userContext, 'appointments:update')) {
          return { allowed: true };
        }
        break;
      case 'delete':
        if (this.hasPermission(userContext, 'appointments:delete')) {
          return { allowed: true };
        }
        break;
    }

    return { 
      allowed: false, 
      reason: `User ${userContext.userId} does not have permission for ${operation} operation` 
    };
  }

  /**
   * Validate that a patient belongs to an accessible cabinet
   */
  validatePatientAccess(
    userContext: UserContext, 
    patientCabinetId: string
  ): AccessControlResult {
    return this.canAccessCabinet(userContext, patientCabinetId);
  }

  /**
   * Get list of cabinet IDs that the user can access
   */
  getAccessibleCabinets(userContext: UserContext): string[] {
    if (userContext.role === 'admin') {
      // Admin can access all cabinets - in a real implementation, 
      // this would fetch all cabinet IDs from the database
      return ['*']; // Wildcard indicating all cabinets
    }

    return userContext.assignedCabinets;
  }

  /**
   * Sanitize appointment filters to ensure cabinet isolation
   */
  sanitizeAppointmentFilters(
    userContext: UserContext, 
    filters: any
  ): any {
    const sanitizedFilters = { ...filters };

    // If user is not admin, enforce cabinet filtering
    if (userContext.role !== 'admin') {
      // If no cabinet filter is specified, add user's assigned cabinets
      if (!sanitizedFilters.cabinetId) {
        // For non-admin users, we need to restrict to their cabinets
        if (userContext.assignedCabinets.length === 1) {
          sanitizedFilters.cabinetId = userContext.assignedCabinets[0];
        } else {
          // Multiple cabinets - this would need special handling in the service
          sanitizedFilters.cabinetIds = userContext.assignedCabinets;
        }
      } else {
        // Verify the requested cabinet is accessible
        const access = this.canAccessCabinet(userContext, sanitizedFilters.cabinetId);
        if (!access.allowed) {
          throw new Error(access.reason || 'Access denied to requested cabinet');
        }
      }
    }

    return sanitizedFilters;
  }

  /**
   * Check if user has a specific permission
   */
  private hasPermission(userContext: UserContext, permission: string): boolean {
    // Admin users have all permissions
    if (userContext.role === 'admin') {
      return true;
    }

    // Check explicit permissions
    if (userContext.permissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    const rolePermissions = this.getRolePermissions(userContext.role);
    return rolePermissions.includes(permission);
  }

  /**
   * Get default permissions for a role
   */
  private getRolePermissions(role: UserContext['role']): string[] {
    switch (role) {
      case 'admin':
        return ['*']; // All permissions
      case 'manager':
        return [
          'appointments:create',
          'appointments:read',
          'appointments:update',
          'appointments:delete',
          'patients:create',
          'patients:read',
          'patients:update',
          'reports:read'
        ];
      case 'practitioner':
        return [
          'appointments:create',
          'appointments:read',
          'appointments:update',
          'patients:read',
          'patients:update'
        ];
      case 'assistant':
        return [
          'appointments:create',
          'appointments:read',
          'appointments:update',
          'patients:read'
        ];
      default:
        return [];
    }
  }

  /**
   * Create a secure context for API operations
   */
  createSecureContext(userContext: UserContext, requestedCabinetId?: string): {
    userContext: UserContext;
    allowedCabinetIds: string[];
    effectiveCabinetId?: string;
  } {
    const allowedCabinetIds = this.getAccessibleCabinets(userContext);
    
    let effectiveCabinetId: string | undefined;
    
    if (requestedCabinetId) {
      const access = this.canAccessCabinet(userContext, requestedCabinetId);
      if (access.allowed) {
        effectiveCabinetId = requestedCabinetId;
      } else {
        throw new Error(access.reason || 'Access denied to requested cabinet');
      }
    } else if (userContext.role !== 'admin' && userContext.assignedCabinets.length === 1) {
      // Default to user's single assigned cabinet
      effectiveCabinetId = userContext.assignedCabinets[0];
    }

    return {
      userContext,
      allowedCabinetIds,
      effectiveCabinetId
    };
  }

  /**
   * Log access attempts for audit purposes
   */
  logAccess(
    userContext: UserContext, 
    resource: string, 
    operation: string, 
    cabinetId?: string,
    allowed: boolean = true
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: userContext.userId,
      role: userContext.role,
      resource,
      operation,
      cabinetId,
      allowed,
      assignedCabinets: userContext.assignedCabinets
    };

    // In a real implementation, this would write to an audit log
    console.warn('Access Log:', logEntry);
  }
}

export default CabinetAccessControl;
