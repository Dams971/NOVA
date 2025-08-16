/**
 * Test Setup Configuration for NOVA RDV
 * 
 * This file configures the testing environment for React components,
 * accessibility testing, and French language support.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import 'jest-axe/extend-expect';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Mock next/navigation
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));

  // Mock next/image
  vi.mock('next/image', () => ({
    default: ({ src, alt, ...props }: any) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} {...props} />;
    },
  }));

  // Mock framer-motion to avoid animation issues in tests
  vi.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
      form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    },
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock Web APIs
  global.fetch = vi.fn();
  global.WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock crypto for UUID generation
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid'),
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    },
  });

  // Set French locale for tests
  Object.defineProperty(navigator, 'language', {
    value: 'fr-FR',
    configurable: true,
  });

  // Mock console methods for cleaner test output
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Ignore React warnings about useEffect in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: useEffect')
    ) {
      return;
    }
    originalError(...args);
  };
});

// Global test utilities
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
};

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  });
};

// French test data factory
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Jean Dupont',
  phone: '+213555123456',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createTestAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  patientName: 'Marie Martin',
  patientPhone: '+213555654321',
  date: '2024-01-15',
  time: '14:30',
  type: 'Consultation générale',
  status: 'confirmed',
  cabinetId: 'test-cabinet-id',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createTestCabinet = (overrides = {}) => ({
  id: 'test-cabinet-id',
  name: 'Cabinet Dentaire NOVA',
  address: 'Cité 109, Daboussy El Achour, Alger',
  phone: '+213555000000',
  email: 'contact@nova-rdv.dz',
  timezone: 'Africa/Algiers',
  status: 'active',
  ...overrides,
});

// Accessibility test helpers
export const checkAccessibility = async (container: HTMLElement) => {
  const { toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const { axe } = await import('jest-axe');
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Custom render function with providers
export { render } from './test-utils';