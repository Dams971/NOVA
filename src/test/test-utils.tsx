/**
 * Test Utilities for NOVA RDV
 * 
 * Custom render functions and providers for testing React components
 * with proper context setup and French language support.
 */

import { render as rtlRender, RenderOptions } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { createTestUser } from './setup';

// Mock Auth Context for tests
const MockAuthProvider = ({ 
  children, 
  user = null, 
  loading = false 
}: { 
  children: React.ReactNode; 
  user?: any; 
  loading?: boolean; 
}) => {
  const mockAuthValue = {
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    refreshToken: vi.fn(),
    updateProfile: vi.fn(),
    isAuthenticated: !!user,
  };

  return (
    <AuthProvider value={mockAuthValue}>
      {children}
    </AuthProvider>
  );
};

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Auth context props
  user?: any;
  authLoading?: boolean;
  
  // Custom wrapper
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  
  // Locale settings
  locale?: string;
}

/**
 * Custom render function with NOVA-specific providers
 */
export const render = (
  ui: React.ReactElement,
  {
    user,
    authLoading = false,
    wrapper,
    locale = 'fr-FR',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  // Set up providers
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    let component = (
      <MockAuthProvider user={user} loading={authLoading}>
        {children}
      </MockAuthProvider>
    );

    // Apply custom wrapper if provided
    if (wrapper) {
      const CustomWrapper = wrapper;
      component = <CustomWrapper>{component}</CustomWrapper>;
    }

    return component;
  };

  return rtlRender(ui, { wrapper: AllTheProviders, ...renderOptions });
};

/**
 * Render component with authenticated user
 */
export const renderWithAuth = (ui: React.ReactElement, userOverrides = {}) => {
  const testUser = createTestUser(userOverrides);
  return render(ui, { user: testUser });
};

/**
 * Render component with loading auth state
 */
export const renderWithAuthLoading = (ui: React.ReactElement) => {
  return render(ui, { authLoading: true });
};

/**
 * Render component for mobile viewport
 */
export const renderMobile = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  // Set mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });

  // Mock mobile user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    configurable: true,
  });

  return render(ui, options);
};

/**
 * Render component for tablet viewport
 */
export const renderTablet = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  return render(ui, options);
};

/**
 * Render component for desktop viewport
 */
export const renderDesktop = (ui: React.ReactElement, options: CustomRenderOptions = {}) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  });

  return render(ui, options);
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Export userEvent for interaction testing
export { default as userEvent } from '@testing-library/user-event';

// Export vi for mocking
export { vi } from 'vitest';

// Mock data helpers
export const createMockFormData = (data: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Type for WebSocket event callback
type WebSocketCallback = (data?: any) => void;

// Mock WebSocket helper
export const createMockWebSocket = () => {
  const listeners: Record<string, WebSocketCallback[]> = {};
  
  return {
    addEventListener: vi.fn((event: string, callback: WebSocketCallback) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    removeEventListener: vi.fn((event: string, callback: WebSocketCallback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    trigger: (event: string, data?: any) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
  };
};

// Mock API fetch helper
export const setupMockFetch = (responses: Record<string, any>) => {
  global.fetch = vi.fn((url: string) => {
    const response = responses[url] || responses.default;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    });
  });
};

// Cleanup helper for tests
export const cleanupMocks = () => {
  vi.clearAllMocks();
  
  // Reset window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
  
  // Reset user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    configurable: true,
  });
};