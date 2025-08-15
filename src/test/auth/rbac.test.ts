import { describe, it, expect, beforeEach } from 'vitest';
import { RBACService, UserRole, PERMISSIONS, ROLE_DEFINITIONS } from '@/lib/auth/rbac';

describe('RBACService', () => {
  let rbacService: RBACService;

  beforeEach(() => {
    rbacService = RBACService.getInstance();
  });

  describe('hasPermission', () => {
    it('should grant super_admin access to everything', () => {
      expect(rbacService.hasPermission('super_admin', 'cabinet', 'create')).toBe(true);
      expect(rbacService.hasPermission('super_admin', 'user', 'delete')).toBe(true);
      expect(rbacService.hasPermission('super_admin', 'analytics', 'export')).toBe(true);
      expect(rbacService.hasPermission('super_admin', 'nonexistent', 'action')).toBe(true);
    });

    it('should grant admin appropriate permissions', () => {
      expect(rbacService.hasPermission('admin', 'cabinet', 'read')).toBe(true);
      expect(rbacService.hasPermission('admin', 'user', 'create')).toBe(true);
      expect(rbacService.hasPermission('admin', 'analytics', 'compare')).toBe(true);
      
      // Admin cannot create cabinets
      expect(rbacService.hasPermission('admin', 'cabinet', 'create')).toBe(false);
      // Admin cannot delete users
      expect(rbacService.hasPermission('admin', 'user', 'delete')).toBe(false);
    });

    it('should grant manager cabinet-scoped permissions', () => {
      const context = {
        userId: 'manager-1',
        cabinetId: 'cabinet-1',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
      };

      expect(rbacService.hasPermission('manager', 'patient', 'create', context)).toBe(true);
      expect(rbacService.hasPermission('manager', 'appointment', 'read', context)).toBe(true);
      expect(rbacService.hasPermission('manager', 'analytics', 'read', context)).toBe(true);

      // Manager cannot access unassigned cabinet
      const unauthorizedContext = {
        ...context,
        cabinetId: 'cabinet-3',
      };
      expect(rbacService.hasPermission('manager', 'patient', 'create', unauthorizedContext)).toBe(false);
    });

    it('should grant staff limited cabinet-scoped permissions', () => {
      const context = {
        userId: 'staff-1',
        cabinetId: 'cabinet-1',
        assignedCabinets: ['cabinet-1'],
      };

      expect(rbacService.hasPermission('staff', 'patient', 'read', context)).toBe(true);
      expect(rbacService.hasPermission('staff', 'appointment', 'update', context)).toBe(true);

      // Staff cannot create patients
      expect(rbacService.hasPermission('staff', 'patient', 'create', context)).toBe(false);
      // Staff cannot access analytics
      expect(rbacService.hasPermission('staff', 'analytics', 'read', context)).toBe(false);
    });

    it('should deny permissions for invalid roles', () => {
      expect(rbacService.hasPermission('invalid_role' as UserRole, 'cabinet', 'read')).toBe(false);
    });

    it('should handle missing context for scoped permissions', () => {
      expect(rbacService.hasPermission('manager', 'patient', 'create')).toBe(false);
      expect(rbacService.hasPermission('staff', 'appointment', 'read')).toBe(false);
    });
  });

  describe('canAccessCabinet', () => {
    it('should allow super_admin to access any cabinet', () => {
      expect(rbacService.canAccessCabinet('super_admin', 'any-cabinet', [])).toBe(true);
    });

    it('should allow admin to access any cabinet', () => {
      expect(rbacService.canAccessCabinet('admin', 'any-cabinet', [])).toBe(true);
    });

    it('should restrict manager to assigned cabinets', () => {
      const assignedCabinets = ['cabinet-1', 'cabinet-2'];
      
      expect(rbacService.canAccessCabinet('manager', 'cabinet-1', assignedCabinets)).toBe(true);
      expect(rbacService.canAccessCabinet('manager', 'cabinet-2', assignedCabinets)).toBe(true);
      expect(rbacService.canAccessCabinet('manager', 'cabinet-3', assignedCabinets)).toBe(false);
    });

    it('should restrict staff to assigned cabinets', () => {
      const assignedCabinets = ['cabinet-1'];
      
      expect(rbacService.canAccessCabinet('staff', 'cabinet-1', assignedCabinets)).toBe(true);
      expect(rbacService.canAccessCabinet('staff', 'cabinet-2', assignedCabinets)).toBe(false);
    });
  });

  describe('getAccessibleCabinets', () => {
    const allCabinets = ['cabinet-1', 'cabinet-2', 'cabinet-3', 'cabinet-4'];

    it('should return all cabinets for super_admin', () => {
      const result = rbacService.getAccessibleCabinets('super_admin', ['cabinet-1'], allCabinets);
      expect(result).toEqual(allCabinets);
    });

    it('should return all cabinets for admin', () => {
      const result = rbacService.getAccessibleCabinets('admin', ['cabinet-1'], allCabinets);
      expect(result).toEqual(allCabinets);
    });

    it('should return only assigned cabinets for manager', () => {
      const assignedCabinets = ['cabinet-1', 'cabinet-3'];
      const result = rbacService.getAccessibleCabinets('manager', assignedCabinets, allCabinets);
      expect(result).toEqual(assignedCabinets);
    });

    it('should return only assigned cabinets for staff', () => {
      const assignedCabinets = ['cabinet-2'];
      const result = rbacService.getAccessibleCabinets('staff', assignedCabinets, allCabinets);
      expect(result).toEqual(assignedCabinets);
    });
  });

  describe('canPerformAction', () => {
    it('should allow super_admin to perform any action on any cabinet', () => {
      expect(rbacService.canPerformAction('super_admin', 'patient', 'create', 'cabinet-1', [])).toBe(true);
      expect(rbacService.canPerformAction('super_admin', 'user', 'delete', 'cabinet-2', [])).toBe(true);
    });

    it('should check both cabinet access and permission for other roles', () => {
      const assignedCabinets = ['cabinet-1'];

      // Manager can create patients in assigned cabinet
      expect(rbacService.canPerformAction('manager', 'patient', 'create', 'cabinet-1', assignedCabinets)).toBe(true);
      
      // Manager cannot create patients in unassigned cabinet
      expect(rbacService.canPerformAction('manager', 'patient', 'create', 'cabinet-2', assignedCabinets)).toBe(false);
      
      // Staff cannot create patients even in assigned cabinet
      expect(rbacService.canPerformAction('staff', 'patient', 'create', 'cabinet-1', assignedCabinets)).toBe(false);
      
      // Staff can read patients in assigned cabinet
      expect(rbacService.canPerformAction('staff', 'patient', 'read', 'cabinet-1', assignedCabinets)).toBe(true);
    });
  });

  describe('canManageUser', () => {
    it('should allow higher roles to manage lower roles', () => {
      expect(rbacService.canManageUser('super_admin', 'admin')).toBe(true);
      expect(rbacService.canManageUser('super_admin', 'manager')).toBe(true);
      expect(rbacService.canManageUser('super_admin', 'staff')).toBe(true);
      
      expect(rbacService.canManageUser('admin', 'manager')).toBe(true);
      expect(rbacService.canManageUser('admin', 'staff')).toBe(true);
      
      expect(rbacService.canManageUser('manager', 'staff')).toBe(true);
    });

    it('should not allow lower roles to manage higher roles', () => {
      expect(rbacService.canManageUser('admin', 'super_admin')).toBe(false);
      expect(rbacService.canManageUser('manager', 'admin')).toBe(false);
      expect(rbacService.canManageUser('staff', 'manager')).toBe(false);
    });

    it('should not allow same level role management', () => {
      expect(rbacService.canManageUser('admin', 'admin')).toBe(false);
      expect(rbacService.canManageUser('manager', 'manager')).toBe(false);
      expect(rbacService.canManageUser('staff', 'staff')).toBe(false);
    });
  });

  describe('getAssignableRoles', () => {
    it('should return correct assignable roles for super_admin', () => {
      const roles = rbacService.getAssignableRoles('super_admin');
      expect(roles).toEqual(['super_admin', 'admin', 'manager', 'staff']);
    });

    it('should return correct assignable roles for admin', () => {
      const roles = rbacService.getAssignableRoles('admin');
      expect(roles).toEqual(['manager', 'staff']);
    });

    it('should return correct assignable roles for manager', () => {
      const roles = rbacService.getAssignableRoles('manager');
      expect(roles).toEqual(['staff']);
    });

    it('should return empty array for staff', () => {
      const roles = rbacService.getAssignableRoles('staff');
      expect(roles).toEqual([]);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions for valid roles', () => {
      const superAdminPermissions = rbacService.getRolePermissions('super_admin');
      expect(superAdminPermissions).toEqual(ROLE_DEFINITIONS.super_admin.permissions);

      const managerPermissions = rbacService.getRolePermissions('manager');
      expect(managerPermissions).toEqual(ROLE_DEFINITIONS.manager.permissions);
    });

    it('should return empty array for invalid roles', () => {
      const permissions = rbacService.getRolePermissions('invalid_role' as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RBACService.getInstance();
      const instance2 = RBACService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('role definitions', () => {
    it('should have valid role definitions for all roles', () => {
      const roles: UserRole[] = ['super_admin', 'admin', 'manager', 'staff'];
      
      roles.forEach(role => {
        expect(ROLE_DEFINITIONS[role]).toBeDefined();
        expect(ROLE_DEFINITIONS[role].name).toBe(role);
        expect(ROLE_DEFINITIONS[role].description).toBeTruthy();
        expect(Array.isArray(ROLE_DEFINITIONS[role].permissions)).toBe(true);
      });
    });

    it('should have decreasing permissions from super_admin to staff', () => {
      const superAdminPerms = ROLE_DEFINITIONS.super_admin.permissions.length;
      const adminPerms = ROLE_DEFINITIONS.admin.permissions.length;
      const managerPerms = ROLE_DEFINITIONS.manager.permissions.length;
      const staffPerms = ROLE_DEFINITIONS.staff.permissions.length;

      expect(superAdminPerms).toBeGreaterThan(adminPerms);
      expect(adminPerms).toBeGreaterThan(managerPerms);
      expect(managerPerms).toBeGreaterThan(staffPerms);
    });
  });
});