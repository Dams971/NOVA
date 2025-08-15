import { describe, it, expect } from 'vitest';
import { 
  createCabinet, 
  createUser,
  CabinetStatus, 
  UserRole,
  CreateCabinetRequest 
} from '../../lib/models/cabinet';

describe('Cabinet Models', () => {
  describe('createCabinet', () => {
    it('should create a cabinet with all required fields', () => {
      const cabinetData: CreateCabinetRequest = {
        name: 'Test Cabinet',
        slug: 'test-cabinet',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        phone: '+33123456789',
        email: 'test@cabinet.com'
      };

      const cabinet = createCabinet(cabinetData);

      expect(cabinet.id).toBeDefined();
      expect(cabinet.name).toBe('Test Cabinet');
      expect(cabinet.slug).toBe('test-cabinet');
      expect(cabinet.address).toEqual(cabinetData.address);
      expect(cabinet.phone).toBe('+33123456789');
      expect(cabinet.email).toBe('test@cabinet.com');
      expect(cabinet.timezone).toBe('Europe/Paris');
      expect(cabinet.status).toBe(CabinetStatus.DEPLOYING);
      expect(cabinet.databaseName).toBe('nova_cabinet_test-cabinet');
      expect(cabinet.createdAt).toBeInstanceOf(Date);
      expect(cabinet.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a cabinet with custom timezone', () => {
      const cabinetData: CreateCabinetRequest = {
        name: 'Test Cabinet',
        slug: 'test-cabinet',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        phone: '+33123456789',
        email: 'test@cabinet.com',
        timezone: 'America/New_York'
      };

      const cabinet = createCabinet(cabinetData);

      expect(cabinet.timezone).toBe('America/New_York');
    });

    it('should create a cabinet with default settings', () => {
      const cabinetData: CreateCabinetRequest = {
        name: 'Test Cabinet',
        slug: 'test-cabinet',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        phone: '+33123456789',
        email: 'test@cabinet.com'
      };

      const cabinet = createCabinet(cabinetData);

      expect(cabinet.settings).toBeDefined();
      expect(cabinet.settings?.timezone).toBe('Europe/Paris');
      expect(cabinet.settings?.workingHours).toBeDefined();
      expect(cabinet.settings?.bookingRules).toBeDefined();
      expect(cabinet.settings?.notifications).toBeDefined();
      expect(cabinet.settings?.branding).toBeDefined();
    });

    it('should merge custom settings with defaults', () => {
      const cabinetData: CreateCabinetRequest = {
        name: 'Test Cabinet',
        slug: 'test-cabinet',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        phone: '+33123456789',
        email: 'test@cabinet.com',
        settings: {
          branding: {
            primaryColor: '#FF0000',
            customMessage: 'Welcome to our clinic'
          }
        }
      };

      const cabinet = createCabinet(cabinetData);

      expect(cabinet.settings?.branding.primaryColor).toBe('#FF0000');
      expect(cabinet.settings?.branding.customMessage).toBe('Welcome to our clinic');
      expect(cabinet.settings?.workingHours).toBeDefined(); // Should still have defaults
    });

    it('should generate unique IDs for different cabinets', () => {
      const cabinetData: CreateCabinetRequest = {
        name: 'Test Cabinet',
        slug: 'test-cabinet',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          postalCode: '12345',
          country: 'France'
        },
        phone: '+33123456789',
        email: 'test@cabinet.com'
      };

      const cabinet1 = createCabinet(cabinetData);
      const cabinet2 = createCabinet(cabinetData);

      expect(cabinet1.id).not.toBe(cabinet2.id);
    });
  });

  describe('createUser', () => {
    it('should create a user with all required fields', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.MANAGER
      };

      const user = createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashedpassword123');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe(UserRole.MANAGER);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user without optional fields', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.STAFF
      };

      const user = createUser(userData);

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.STAFF);
      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.isActive).toBe(true);
    });

    it('should generate unique IDs for different users', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        role: UserRole.ADMIN
      };

      const user1 = createUser(userData);
      const user2 = createUser(userData);

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('Enums', () => {
    it('should have correct CabinetStatus values', () => {
      expect(CabinetStatus.ACTIVE).toBe('active');
      expect(CabinetStatus.INACTIVE).toBe('inactive');
      expect(CabinetStatus.DEPLOYING).toBe('deploying');
      expect(CabinetStatus.MAINTENANCE).toBe('maintenance');
    });

    it('should have correct UserRole values', () => {
      expect(UserRole.SUPER_ADMIN).toBe('super_admin');
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.MANAGER).toBe('manager');
      expect(UserRole.STAFF).toBe('staff');
    });
  });
});