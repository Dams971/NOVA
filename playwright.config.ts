import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for NOVA RDV
 * 
 * Comprehensive E2E testing configuration with accessibility testing,
 * mobile support, and French language scenarios.
 */
export default defineConfig({
  testDir: './src/test/e2e',
  
  // Look for test files in these patterns
  testMatch: [
    '**/*.e2e.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/e2e/**/*.test.{ts,tsx}'
  ],
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // For CI environments
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Locale for testing French content
    locale: 'fr-FR',
    
    // Timezone for Algerian context
    timezoneId: 'Africa/Algiers',
    
    // Browser context options
    contextOptions: {
      // Permissions for notifications, geolocation, etc.
      permissions: ['notifications'],
    },
  },

  // Configure projects for major browsers
  projects: [
    // Setup project to run before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // Desktop Chrome
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // High contrast mode for accessibility testing
        colorScheme: 'light',
      },
      dependencies: ['setup'],
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },

    // Tablet testing
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
      },
      dependencies: ['setup'],
    },

    // High contrast mode for accessibility
    {
      name: 'chromium-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        extraHTTPHeaders: {
          'Sec-CH-Prefers-Color-Scheme': 'dark'
        },
      },
      dependencies: ['setup'],
    },

    // Slow connection testing
    {
      name: 'chromium-slow-3g',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G connection
        // Note: This is handled in individual tests using page.route()
      },
      dependencies: ['setup'],
    },
  ],

  // Timeout settings
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  // Global setup and teardown
  globalSetup: require.resolve('./src/test/global-setup.ts'),
  globalTeardown: require.resolve('./src/test/global-teardown.ts'),

  // Web server configuration for local development
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
    env: {
      // Test-specific environment variables
      NODE_ENV: 'test',
      SKIP_ENV_VALIDATION: 'true',
    },
  },

  // Output directories
  outputDir: 'test-results/artifacts',
});
