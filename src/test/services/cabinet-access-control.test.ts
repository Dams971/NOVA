import { describe, it, expect, beforeEach } from 'vitest';
import { CabinetAccessControl, UserContext } from '@/lib/services/cabinet-access-control';

describe('CabinetAccessControl', () => {
  let accessControl: CabinetAccessControl;
  let adminUser: UserContext;
  let managerUser: UserContext;
  let practitionerUser: UserContext;

  beforeEach(() => {
    accessControl = CabinetAccessControl.getInstance();
    
    adminUser = {
      userId: 'admin-1',
      role: 'admin',
      assignedCabinets: ['cabinet-1', 'cabinet-2'],
      permissions: ['*']
    };

    managerUser = {
      userId: 'manager-1',
      role: 'manager',
      assignedCabinets: ['cabinet-1'],
      permissions: []
    };

    practitionerUser = {
      userId: 'practitioner-1',
      role: 'practitioner',
      assignedCabinets: ['cabinet-2'],
      permissions: []
    };
  });

  describe('canAccessCabinet', () => {
    it('should allow admin to access any cabinet', () => {
      const result = accessControl.canAccessCabinet(adminUser, 'cabinet-3');
      expect(result.allowed).toBe(true);
    });

    it('should allow user to access assigned cabinet', () => {
      const result = accessControl.canAccessCabinet(managerUser, 'cabinet-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny user access to non-assigned cabinet', () => {
      const result = accessControl.canAccessCabinet(managerUser, 'cabinet-2');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });
  });

  describe('filterAppointmentsByCabinet', () => {
    const mockAppointments = [
      { id: 'apt-1', cabinetId: 'cabinet-1', patientId: 'patient-1' },
      { id: 'apt-2', cabinetId: 'cabinet-2', patientId: 'patient-2' },
      { id: 'apt-3', cabinetId: 'cabinet-3', patientId: 'patient-3' }
    ];

    it('should return all appointments for admin', () => {
      const filtered = accessControl.filterAppointmentsByCabinet(adminUser, mockAppointments);
      expect(filtered).toHaveLength(3);
    });

    it('should filter appointments for non-admin user', () => {
      const filtered = accessControl.filterAppointmentsByCabinet(managerUser, mockAppointments);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].cabinetId).toBe('cabinet-1');
    });

    it('should return empty array if no accessible appointments', () => {
      const userWithNoCabinets: UserContext = {
        userId: 'user-1',
        role: 'assistant',
        assignedCabinets: [],
        permissions: []
      };
      
      const filtered = accessControl.filterAppointmentsByCabinet(userWithNoCabinets, mockAppointments);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('validateAppointmentOperation', () => {
    it('should allow admin to perform any operation', () => {
      const result = accessControl.validateAppointmentOperation(adminUser, 'cabinet-1', 'delete');
      expect(result.allowed).toBe(true);
    });

    it('should allow manager to create appointments in assigned cabinet', () => {
      const result = accessControl.validateAppointmentOperation(managerUser, 'cabinet-1', 'create');
      expect(result.allowed).toBe(true);
    });

    it('should deny manager access to non-assigned cabinet', () => {
      const result = accessControl.validateAppointmentOperation(managerUser, 'cabinet-2', 'create');
      expect(result.allowed).toBe(false);
    });

    it('should deny practitioner delete operation', () => {
      const result = accessControl.validateAppointmentOperation(practitionerUser, 'cabinet-2', 'delete');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have permission');
    });

    it('should allow practitioner read operation', () => {
      const result = accessControl.validateAppointmentOperation(practitionerUser, 'cabinet-2', 'read');
      expect(result.allowed).toBe(true);
    });
  });

  describe('sanitizeAppointmentFilters', () => {
    it('should not modify filters for admin user', () => {
      const filters = { patientId: 'patient-1' };
      const sanitized = accessControl.sanitizeAppointmentFilters(adminUser, filters);
      expect(sanitized).toEqual(filters);
    });

    it('should add cabinet filter for single-cabinet user', () => {
      const filters = { patientId: 'patient-1' };
      const sanitized = accessControl.sanitizeAppointmentFilters(managerUser, filters);
      expect(sanitized.cabinetId).toBe('cabinet-1');
    });

    it('should validate requested cabinet access', () => {
      const filters = { cabinetId: 'cabinet-2' };
      expect(() => {
        accessControl.sanitizeAppointmentFilters(managerUser, filters);
      }).toThrow('Access denied');
    });

    it('should allow valid cabinet request', () => {
      const filters = { cabinetId: 'cabinet-1' };
      const sanitized = accessControl.sanitizeAppointmentFilters(managerUser, filters);
      expect(sanitized.cabinetId).toBe('cabinet-1');
    });
  });

  describe('createSecureContext', () => {
    it('should create context with effective cabinet for single-cabinet user', () => {
      const context = accessControl.createSecureContext(managerUser);
      expect(context.effectiveCabinetId).toBe('cabinet-1');
      expect(context.allowedCabinetIds).toEqual(['cabinet-1']);
    });

    it('should validate requested cabinet', () => {
      expect(() => {
        accessControl.createSecureContext(managerUser, 'cabinet-2');
      }).toThrow('Access denied');
    });

    it('should allow valid requested cabinet', () => {
      const context = accessControl.createSecureContext(managerUser, 'cabinet-1');
      expect(context.effectiveCabinetId).toBe('cabinet-1');
    });

    it('should handle admin user with wildcard access', () => {
      const context = accessControl.createSecureContext(adminUser, 'cabinet-3');
      expect(context.effectiveCabinetId).toBe('cabinet-3');
      expect(context.allowedCabinetIds).toEqual(['*']);
    });
  });

  describe('role-based permissions', () => {
    it('should grant appropriate permissions to manager', () => {
      const result = accessControl.validateAppointmentOperation(managerUser, 'cabinet-1', 'delete');
      expect(result.allowed).toBe(true);
    });

    it('should grant limited permissions to assistant', () => {
      const assistantUser: UserContext = {
        userId: 'assistant-1',
        role: 'assistant',
        assignedCabinets: ['cabinet-1'],
        permissions: []
      };

      const readResult = accessControl.validateAppointmentOperation(assistantUser, 'cabinet-1', 'read');
      expect(readResult.allowed).toBe(true);

      const deleteResult = accessControl.validateAppointmentOperation(assistantUser, 'cabinet-1', 'delete');
      expect(deleteResult.allowed).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle user with no assigned cabinets', () => {
      const userWithNoCabinets: UserContext = {
        userId: 'user-1',
        role: 'assistant',
        assignedCabinets: [],
        permissions: []
      };

      const result = accessControl.canAccessCabinet(userWithNoCabinets, 'cabinet-1');
      expect(result.allowed).toBe(false);
    });

    it('should handle user with multiple assigned cabinets', () => {
      const multiCabinetUser: UserContext = {
        userId: 'user-1',
        role: 'manager',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
        permissions: []
      };

      const context = accessControl.createSecureContext(multiCabinetUser);
      expect(context.effectiveCabinetId).toBeUndefined(); // No single default
      expect(context.allowedCabinetIds).toEqual(['cabinet-1', 'cabinet-2']);
    });
  });
});
