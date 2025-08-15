import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to manager dashboard
    await page.goto('/manager/cabinet-1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display patient management interface', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Check if patient management interface is visible
    await expect(page.locator('h1:has-text("Gestion des Patients")')).toBeVisible();
    await expect(page.locator('button:has-text("Nouveau Patient")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
  });

  test('should open patient creation form', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Click on "Nouveau Patient" button
    await page.click('button:has-text("Nouveau Patient")');
    
    // Check if form is visible
    await expect(page.locator('h3:has-text("Nouveau Patient")')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should create a new patient', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Click on "Nouveau Patient" button
    await page.click('button:has-text("Nouveau Patient")');
    
    // Fill out the form
    await page.fill('input[name="firstName"]', 'Jean');
    await page.fill('input[name="lastName"]', 'Dupont');
    await page.fill('input[name="email"]', 'jean.dupont@example.com');
    await page.fill('input[name="phone"]', '+33123456789');
    await page.fill('input[name="dateOfBirth"]', '1980-01-15');
    await page.selectOption('select[name="gender"]', 'male');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Check if patient was created (form should close)
    await expect(page.locator('h3:has-text("Nouveau Patient")')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Click on "Nouveau Patient" button
    await page.click('button:has-text("Nouveau Patient")');
    
    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Check for validation errors
    await expect(page.locator('text=Le prénom est requis')).toBeVisible();
    await expect(page.locator('text=Le nom est requis')).toBeVisible();
  });

  test('should search for patients', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Wait for patient list to load
    await page.waitForTimeout(1000);
    
    // Search for a patient
    await page.fill('input[placeholder*="Rechercher"]', 'Marie');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check if search results are filtered
    const patientCards = page.locator('[data-testid*="patient-"]');
    const count = await patientCards.count();
    
    if (count > 0) {
      // Check if visible patients contain the search term
      const firstPatient = patientCards.first();
      const patientText = await firstPatient.textContent();
      expect(patientText?.toLowerCase()).toContain('marie');
    }
  });

  test('should open patient detail view', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Wait for patient list to load
    await page.waitForTimeout(1000);
    
    // Click on first patient if available
    const firstPatient = page.locator('[data-testid*="patient-"]').first();
    if (await firstPatient.count() > 0) {
      await firstPatient.click();
      
      // Check if patient detail view is visible
      await expect(page.locator('[data-testid="patient-detail"]')).toBeVisible();
      await expect(page.locator('button:has-text("Modifier")')).toBeVisible();
      await expect(page.locator('button:has-text("Retour")')).toBeVisible();
    }
  });

  test('should open filters panel', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Click on filters button
    await page.click('button[aria-label="Filtres"]');
    
    // Check if filters panel is visible
    await expect(page.locator('[data-testid="patient-filters"]')).toBeVisible();
    await expect(page.locator('button:has-text("Appliquer")')).toBeVisible();
    await expect(page.locator('button:has-text("Réinitialiser")')).toBeVisible();
  });

  test('should handle empty patient list', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Search for non-existent patient
    await page.fill('input[placeholder*="Rechercher"]', 'NonExistentPatient123');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check if empty state is shown
    await expect(page.locator('text=Aucun patient trouvé')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Check if interface adapts to mobile
    await expect(page.locator('h1:has-text("Gestion des Patients")')).toBeVisible();
    await expect(page.locator('button:has-text("Nouveau Patient")')).toBeVisible();
    
    // Check if search input is still accessible
    await expect(page.locator('input[placeholder*="Rechercher"]')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Check for loading indicator (might be brief)
    const loadingIndicator = page.locator('text=Chargement...');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check that loading is complete
    await expect(page.locator('h1:has-text("Gestion des Patients")')).toBeVisible();
  });

  test('should navigate back from patient detail', async ({ page }) => {
    // Click on Patients tab
    await page.click('button:has-text("Patients")');
    
    // Wait for patient list to load
    await page.waitForTimeout(1000);
    
    // Click on first patient if available
    const firstPatient = page.locator('[data-testid*="patient-"]').first();
    if (await firstPatient.count() > 0) {
      await firstPatient.click();
      
      // Wait for detail view to load
      await page.waitForTimeout(1000);
      
      // Click back button
      await page.click('button:has-text("Retour")');
      
      // Check if we're back to patient list
      await expect(page.locator('h1:has-text("Gestion des Patients")')).toBeVisible();
      await expect(page.locator('button:has-text("Nouveau Patient")')).toBeVisible();
    }
  });
});
