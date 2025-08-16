/**
 * Vitest Configuration for NOVA
 * 
 * Comprehensive testing configuration with TypeScript support,
 * accessibility testing, and French language scenarios.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.tsx'],
    
    // Global test patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/test/**/*.test.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/test/e2e/**',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/app/**', // API routes tested separately
        '**/*.d.ts',
        '**/types.ts',
        '**/constants.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Specific thresholds for critical components
        'src/components/ui/forms/Button.tsx': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/components/rdv/ChatRDV.tsx': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    
    // Global configuration
    globals: true,
    
    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Retry configuration
    retry: process.env.CI ? 2 : 0,
    
    // Reporter configuration
    reporter: [
      'default',
      'json',
      'html',
      ...(process.env.CI ? ['github-actions'] : []),
    ],
    
    // Output configuration
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html',
    },
    
    // Watch configuration
    watch: !process.env.CI,
    
    // Pool configuration for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nova': path.resolve(__dirname, './src/components'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
  
  // Define configuration for test environment
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_ENV': '"test"',
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'node14',
  },
});