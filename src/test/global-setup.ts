/**
 * Global Setup for Playwright Tests
 * 
 * Sets up the test environment before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up NOVA RDV test environment...');

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // Wait for the main app to load
    await page.waitForSelector('body', { timeout: 30000 });
    
    // Check if the application is responding
    const title = await page.title();
    console.log(`✅ Application ready: ${title}`);

    // Set up test data if needed
    console.log('📝 Setting up test data...');
    
    // You can add API calls here to set up test data
    // For example, creating test users, appointments, etc.
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;