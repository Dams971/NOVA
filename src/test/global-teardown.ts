/**
 * Global Teardown for Playwright Tests
 * 
 * Cleans up the test environment after running E2E tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up NOVA RDV test environment...');

  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    // You can add cleanup logic here
    // For example, removing test users, appointments, etc.
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;