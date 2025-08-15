import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock libphonenumber-js
vi.mock('libphonenumber-js', () => ({
  default: vi.fn(),
  parsePhoneNumber: vi.fn((phone) => ({
    isValid: () => true,
    formatInternational: () => phone,
    format: () => phone,
    number: phone,
    countryCallingCode: '213',
    country: 'DZ'
  })),
  isValidPhoneNumber: vi.fn(() => true),
  formatIncompletePhoneNumber: vi.fn((phone) => phone),
  AsYouType: vi.fn(() => ({
    input: vi.fn((val) => val),
    reset: vi.fn(),
    getNumber: vi.fn(() => ({ number: '+213' }))
  }))
}));

// Mock date-fns/locale
vi.mock('date-fns/locale', () => ({
  default: {
    fr: {
      code: 'fr',
      localize: {
        month: vi.fn(),
        day: vi.fn(),
        ordinalNumber: vi.fn()
      },
      formatLong: {},
      options: {
        weekStartsOn: 1,
        firstWeekContainsDate: 1
      }
    }
  },
  fr: {
    code: 'fr',
    localize: {
      month: vi.fn(),
      day: vi.fn(),
      ordinalNumber: vi.fn()
    },
    formatLong: {},
    options: {
      weekStartsOn: 1,
      firstWeekContainsDate: 1
    }
  }
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver for recharts and other components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver for performance monitoring tests
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn(() => ''),
    minHeight: '44px',
    minWidth: '44px',
    color: 'rgb(55, 65, 81)',
    backgroundColor: 'rgb(255, 255, 255)',
  })),
});

// Mock libphonenumber-js for TelInput tests
vi.mock('libphonenumber-js', () => ({
  parsePhoneNumber: vi.fn((input: string) => {
    if (input.includes('+213') || input.startsWith('05') || input.startsWith('06') || input.startsWith('07')) {
      return {
        isValid: () => true,
        number: input.startsWith('+') ? input : `+213${input.substring(1)}`,
        country: 'DZ',
      };
    }
    return null;
  }),
  isValidPhoneNumber: vi.fn((phoneNumber: string, country?: string) => {
    if (country === 'DZ') {
      return phoneNumber.startsWith('+213') && phoneNumber.length >= 13;
    }
    return phoneNumber.startsWith('+') && phoneNumber.length >= 10;
  }),
}));

// Mock date-fns/locale
vi.mock('date-fns/locale', () => ({
  fr: {
    localize: {
      month: vi.fn((n: number) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][n]),
      day: vi.fn((n: number) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][n]),
    },
  },
}));

// Add custom matchers
expect.extend({
  toHaveAccessibleName: (received: Element, expectedName: string) => {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') || 
                          received.textContent;
    
    const pass = accessibleName === expectedName;
    
    return {
      message: () => 
        pass 
          ? `Expected element not to have accessible name "${expectedName}"`
          : `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`,
      pass,
    };
  },
});

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.NODE_ENV = 'test';

// Suppress console.log in tests unless debugging
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  if (!process.env.DEBUG_TESTS) {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  }
});

afterEach(() => {
  if (!process.env.DEBUG_TESTS) {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
});

// Set up global test utilities
global.testUtils = {
  // Mock user events
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }),
  
  // Mock appointment data
  createMockAppointment: () => ({
    id: 'test-appointment-id',
    patientName: 'John Doe',
    date: new Date('2024-12-01T10:00:00Z'),
    type: 'consultation',
    status: 'confirmed',
  }),
  
  // Wait for async operations
  waitFor: (callback: () => boolean | Promise<boolean>, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = async () => {
        try {
          const result = await callback();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
          } else {
            setTimeout(check, 100);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      check();
    });
  },
};

// Declare global types
declare global {
  var testUtils: {
    createMockUser: () => any;
    createMockAppointment: () => any;
    waitFor: (callback: () => boolean | Promise<boolean>, timeout?: number) => Promise<any>;
  };
}

// Extend the expect interface
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toHaveAccessibleName(expectedName: string): any;
    }
  }
}