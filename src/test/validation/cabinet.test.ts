import { describe, it, expect } from 'vitest';
import { CreateCabinetRequest, UpdateCabinetRequest, CabinetStatus, UserRole } from '../../lib/models/cabinet';
import { 
  validateCreateCabinet, 
  validateUpdateCabinet,
  validateEmail,
  validatePhone,
  validateSlug,
  validateUserRole
} from '../../lib/validation/cabinet';

describe('Cabinet Validation', () => {
  describe('validateCreateCabinet', () => {
    const validCabinetData: CreateCabinetRequest = {
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

    it('should validate a correct cabinet', () => {
      const result = validateCreateCabinet(validCabinetData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const data = { ...validCabinetData, name: '' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Cabinet name is required'
      });
    });

    it('should reject name that is too long', () => {
      const data = { ...validCabinetData, name: 'a'.repeat(256) };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Cabinet name must be less than 255 characters'
      });
    });

    it('should reject empty slug', () => {
      const data = { ...validCabinetData, slug: '' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'slug',
        message: 'Cabinet slug is required'
      });
    });

    it('should reject invalid slug format', () => {
      const data = { ...validCabinetData, slug: 'Invalid Slug!' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, hyphens, and underscores'
      });
    });

    it('should reject slug that is too long', () => {
      const data = { ...validCabinetData, slug: 'a'.repeat(101) };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'slug',
        message: 'Slug must be less than 100 characters'
      });
    });

    it('should reject invalid email', () => {
      const data = { ...validCabinetData, email: 'invalid-email' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    it('should reject empty email', () => {
      const data = { ...validCabinetData, email: '' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required'
      });
    });

    it('should reject invalid phone', () => {
      const data = { ...validCabinetData, phone: '123' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Invalid phone number format'
      });
    });

    it('should reject empty phone', () => {
      const data = { ...validCabinetData, phone: '' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Phone number is required'
      });
    });

    it('should reject missing address', () => {
      const data = { ...validCabinetData, address: undefined as any };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'address',
        message: 'Address is required'
      });
    });

    it('should reject incomplete address', () => {
      const data = { 
        ...validCabinetData, 
        address: { 
          street: '', 
          city: 'Test City', 
          postalCode: '12345', 
          country: 'France' 
        } 
      };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'address.street',
        message: 'Street address is required'
      });
    });

    it('should accept valid timezone', () => {
      const data = { ...validCabinetData, timezone: 'America/New_York' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid timezone', () => {
      const data = { ...validCabinetData, timezone: 'Invalid/Timezone' };
      const result = validateCreateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'timezone',
        message: 'Invalid timezone'
      });
    });
  });

  describe('validateUpdateCabinet', () => {
    it('should validate empty update data', () => {
      const result = validateUpdateCabinet({});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate partial update with valid data', () => {
      const data: UpdateCabinetRequest = {
        name: 'Updated Cabinet',
        email: 'updated@cabinet.com'
      };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name in update', () => {
      const data: UpdateCabinetRequest = { name: '' };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Cabinet name cannot be empty'
      });
    });

    it('should reject invalid email in update', () => {
      const data: UpdateCabinetRequest = { email: 'invalid-email' };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    it('should reject invalid status', () => {
      const data: UpdateCabinetRequest = { status: 'invalid-status' as CabinetStatus };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'status',
        message: 'Invalid cabinet status'
      });
    });

    it('should validate partial address update', () => {
      const data: UpdateCabinetRequest = {
        address: {
          city: 'New City'
        }
      };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(true);
    });

    it('should reject empty address fields in update', () => {
      const data: UpdateCabinetRequest = {
        address: {
          city: ''
        }
      };
      const result = validateUpdateCabinet(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'address.city',
        message: 'City cannot be empty'
      });
    });
  });

  describe('Individual validation functions', () => {
    describe('validateEmail', () => {
      it('should validate correct emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        expect(validateEmail('test+tag@example.org')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('test@domain')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });
    });

    describe('validatePhone', () => {
      it('should validate correct phone numbers', () => {
        expect(validatePhone('+33123456789')).toBe(true);
        expect(validatePhone('0123456789')).toBe(true);
        expect(validatePhone('+1 (555) 123-4567')).toBe(true);
        expect(validatePhone('+44 20 7946 0958')).toBe(true);
      });

      it('should reject invalid phone numbers', () => {
        expect(validatePhone('123')).toBe(false);
        expect(validatePhone('abc')).toBe(false);
        expect(validatePhone('')).toBe(false);
      });
    });

    describe('validateSlug', () => {
      it('should validate correct slugs', () => {
        expect(validateSlug('test-cabinet')).toBe(true);
        expect(validateSlug('cabinet_123')).toBe(true);
        expect(validateSlug('simple')).toBe(true);
        expect(validateSlug('test-cabinet-with-numbers-123')).toBe(true);
      });

      it('should reject invalid slugs', () => {
        expect(validateSlug('Test Cabinet')).toBe(false);
        expect(validateSlug('test@cabinet')).toBe(false);
        expect(validateSlug('test.cabinet')).toBe(false);
        expect(validateSlug('TEST')).toBe(false);
        expect(validateSlug('a'.repeat(101))).toBe(false);
      });
    });

    describe('validateUserRole', () => {
      it('should validate correct user roles', () => {
        expect(validateUserRole(UserRole.SUPER_ADMIN)).toBe(true);
        expect(validateUserRole(UserRole.ADMIN)).toBe(true);
        expect(validateUserRole(UserRole.MANAGER)).toBe(true);
        expect(validateUserRole(UserRole.STAFF)).toBe(true);
      });

      it('should reject invalid user roles', () => {
        expect(validateUserRole('invalid_role')).toBe(false);
        expect(validateUserRole('user')).toBe(false);
        expect(validateUserRole('')).toBe(false);
      });
    });
  });
});