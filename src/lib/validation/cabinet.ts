import { CreateCabinetRequest, UpdateCabinetRequest, CabinetStatus, UserRole } from '../models/cabinet';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation regex - basic but functional validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone validation regex (international format)
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,}$/;

// Slug validation regex (alphanumeric, hyphens, underscores)
const SLUG_REGEX = /^[a-z0-9\-_]+$/;

export function validateCreateCabinet(data: CreateCabinetRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Cabinet name is required' });
  } else if (data.name.length > 255) {
    errors.push({ field: 'name', message: 'Cabinet name must be less than 255 characters' });
  }

  // Slug validation
  if (!data.slug || data.slug.trim().length === 0) {
    errors.push({ field: 'slug', message: 'Cabinet slug is required' });
  } else if (!SLUG_REGEX.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug must contain only lowercase letters, numbers, hyphens, and underscores' });
  } else if (data.slug.length > 100) {
    errors.push({ field: 'slug', message: 'Slug must be less than 100 characters' });
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Phone validation
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!PHONE_REGEX.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  // Address validation
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    if (!data.address.street || data.address.street.trim().length === 0) {
      errors.push({ field: 'address.street', message: 'Street address is required' });
    }
    if (!data.address.city || data.address.city.trim().length === 0) {
      errors.push({ field: 'address.city', message: 'City is required' });
    }
    if (!data.address.postalCode || data.address.postalCode.trim().length === 0) {
      errors.push({ field: 'address.postalCode', message: 'Postal code is required' });
    }
    if (!data.address.country || data.address.country.trim().length === 0) {
      errors.push({ field: 'address.country', message: 'Country is required' });
    }
  }

  // Timezone validation (basic check)
  if (data.timezone && !isValidTimezone(data.timezone)) {
    errors.push({ field: 'timezone', message: 'Invalid timezone' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUpdateCabinet(data: UpdateCabinetRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Cabinet name cannot be empty' });
    } else if (data.name.length > 255) {
      errors.push({ field: 'name', message: 'Cabinet name must be less than 255 characters' });
    }
  }

  // Email validation (if provided)
  if (data.email !== undefined) {
    if (data.email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email cannot be empty' });
    } else if (!EMAIL_REGEX.test(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  // Phone validation (if provided)
  if (data.phone !== undefined) {
    if (data.phone.trim().length === 0) {
      errors.push({ field: 'phone', message: 'Phone number cannot be empty' });
    } else if (!PHONE_REGEX.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
  }

  // Status validation (if provided)
  if (data.status !== undefined && !Object.values(CabinetStatus).includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid cabinet status' });
  }

  // Address validation (if provided)
  if (data.address) {
    if (data.address.street !== undefined && data.address.street.trim().length === 0) {
      errors.push({ field: 'address.street', message: 'Street address cannot be empty' });
    }
    if (data.address.city !== undefined && data.address.city.trim().length === 0) {
      errors.push({ field: 'address.city', message: 'City cannot be empty' });
    }
    if (data.address.postalCode !== undefined && data.address.postalCode.trim().length === 0) {
      errors.push({ field: 'address.postalCode', message: 'Postal code cannot be empty' });
    }
    if (data.address.country !== undefined && data.address.country.trim().length === 0) {
      errors.push({ field: 'address.country', message: 'Country cannot be empty' });
    }
  }

  // Timezone validation (if provided)
  if (data.timezone !== undefined && !isValidTimezone(data.timezone)) {
    errors.push({ field: 'timezone', message: 'Invalid timezone' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole);
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug) && slug.length <= 100;
}

// Basic timezone validation - in a real app, you'd use a proper timezone library
function isValidTimezone(timezone: string): boolean {
  const commonTimezones = [
    'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
    'Asia/Tokyo', 'Australia/Sydney', 'UTC'
  ];
  
  // For now, just check against common timezones
  // In production, use Intl.supportedValuesOf('timeZone') or a timezone library
  return commonTimezones.includes(timezone) || timezone.startsWith('Europe/') || timezone.startsWith('America/');
}