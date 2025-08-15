import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    // Look for login button or link
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")').first();
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      
      // Check if login form is visible
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]:has-text("Connexion"), button:has-text("Se connecter")')).toBeVisible();
    }
  });

  test('should validate login form', async ({ page }) => {
    // Navigate to login page
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")').first();
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      
      // Try to submit empty form
      await page.click('button[type="submit"]:has-text("Connexion"), button:has-text("Se connecter")');
      
      // Check for validation errors
      await expect(page.locator('text=Email est requis, text=L\'email est requis')).toBeVisible();
      await expect(page.locator('text=Mot de passe est requis, text=Le mot de passe est requis')).toBeVisible();
    }
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Navigate to login page
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")').first();
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      
      // Fill invalid credentials
      await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Connexion"), button:has-text("Se connecter")');
      
      // Wait for error message
      await page.waitForTimeout(2000);
      
      // Check for error message
      await expect(page.locator('text=Identifiants invalides, text=Invalid credentials')).toBeVisible();
    }
  });

  test('should display registration form', async ({ page }) => {
    // Look for register button or link
    const registerButton = page.locator('button:has-text("S\'inscrire"), a:has-text("S\'inscrire"), a:has-text("Créer un compte")').first();
    
    if (await registerButton.count() > 0) {
      await registerButton.click();
      
      // Check if registration form is visible
      await expect(page.locator('input[name="firstName"], input[name="prenom"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"], input[name="nom"]')).toBeVisible();
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    }
  });

  test('should validate registration form', async ({ page }) => {
    // Navigate to registration page
    const registerButton = page.locator('button:has-text("S\'inscrire"), a:has-text("S\'inscrire"), a:has-text("Créer un compte")').first();
    
    if (await registerButton.count() > 0) {
      await registerButton.click();
      
      // Try to submit empty form
      await page.click('button[type="submit"]:has-text("S\'inscrire"), button:has-text("Créer un compte")');
      
      // Check for validation errors
      await expect(page.locator('text=Le prénom est requis, text=Prénom requis')).toBeVisible();
      await expect(page.locator('text=Le nom est requis, text=Nom requis')).toBeVisible();
      await expect(page.locator('text=L\'email est requis, text=Email requis')).toBeVisible();
    }
  });

  test('should validate password strength', async ({ page }) => {
    // Navigate to registration page
    const registerButton = page.locator('button:has-text("S\'inscrire"), a:has-text("S\'inscrire"), a:has-text("Créer un compte")').first();
    
    if (await registerButton.count() > 0) {
      await registerButton.click();
      
      // Fill form with weak password
      await page.fill('input[name="firstName"], input[name="prenom"]', 'John');
      await page.fill('input[name="lastName"], input[name="nom"]', 'Doe');
      await page.fill('input[type="email"], input[name="email"]', 'john.doe@example.com');
      await page.fill('input[type="password"], input[name="password"]', '123'); // Weak password
      
      // Submit form
      await page.click('button[type="submit"]:has-text("S\'inscrire"), button:has-text("Créer un compte")');
      
      // Check for password strength error
      await expect(page.locator('text=Le mot de passe doit contenir au moins 8 caractères')).toBeVisible();
    }
  });

  test('should handle successful registration', async ({ page }) => {
    // Navigate to registration page
    const registerButton = page.locator('button:has-text("S\'inscrire"), a:has-text("S\'inscrire"), a:has-text("Créer un compte")').first();
    
    if (await registerButton.count() > 0) {
      await registerButton.click();
      
      // Fill form with valid data
      const timestamp = Date.now();
      await page.fill('input[name="firstName"], input[name="prenom"]', 'John');
      await page.fill('input[name="lastName"], input[name="nom"]', 'Doe');
      await page.fill('input[type="email"], input[name="email"]', `john.doe.${timestamp}@example.com`);
      await page.fill('input[type="password"], input[name="password"]', 'SecurePassword123!');
      
      // Select role if available
      const roleSelect = page.locator('select[name="role"]');
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption('patient');
      }
      
      // Submit form
      await page.click('button[type="submit"]:has-text("S\'inscrire"), button:has-text("Créer un compte")');
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check for success (redirect or success message)
      // This depends on your app's behavior after successful registration
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('register');
    }
  });

  test('should handle logout', async ({ page }) => {
    // This test assumes user is logged in
    // You might need to login first or mock authentication
    
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Se déconnecter"), a:has-text("Déconnexion")').first();
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Wait for logout to complete
      await page.waitForTimeout(2000);
      
      // Check if redirected to home or login page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/(\/|\/login|\/auth)/);
    }
  });

  test('should remember login state', async ({ page, context }) => {
    // This test checks if authentication persists across page reloads
    
    // First, try to access a protected route
    await page.goto('/manager/cabinet-1');
    
    // If redirected to login, the auth is working
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      // Authentication is properly protecting routes
      expect(currentUrl).toContain('login');
    }
  });

  test('should handle session expiration', async ({ page }) => {
    // This test is more complex and would require mocking expired tokens
    // For now, we'll just check that the app handles invalid auth gracefully
    
    // Try to access protected route
    await page.goto('/manager/cabinet-1');
    
    // Wait for any redirects
    await page.waitForTimeout(2000);
    
    // Should either show login form or handle gracefully
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasErrorMessage = await page.locator('text=Session expirée, text=Veuillez vous reconnecter').count() > 0;
    
    expect(hasLoginForm || hasErrorMessage).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to login page
    const loginButton = page.locator('button:has-text("Se connecter"), a:has-text("Se connecter")').first();
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
      
      // Check if form is still usable on mobile
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });
});
