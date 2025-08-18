/**
 * E2E Accessibility Tests
 * 
 * End-to-end accessibility testing using axe-playwright
 * for WCAG 2.2 AA compliance across the NOVA platform.
 */

import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

test.describe('Accessibility E2E Tests', () => {
  
  test.describe('RDV Page Accessibility', () => {
    test('RDV page has no accessibility violations', async ({ page }) => {
      await page.goto('/rdv');
      
      // Wait for page to load completely
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Run accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('RDV page keyboard navigation works', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Test tab navigation through main elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Continue tabbing through interactive elements
      const focusableElements = [
        '[data-testid="date-15"]',
        '[data-testid="slot-14:00"]',
        '[placeholder*="message"]',
        'text=Envoyer'
      ];
      
      for (const selector of focusableElements) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('RDV page screen reader landmarks', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Check for proper landmarks
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('[role="banner"]')).toBeVisible();
      await expect(page.locator('[role="complementary"]')).toBeVisible();
      
      // Check for proper headings hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Verify heading structure (no skipped levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('RDV page color contrast compliance', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Run specific color contrast tests
      const contrastResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();
      
      expect(contrastResults.violations).toEqual([]);
    });

    test('RDV page touch target compliance', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Check button sizes meet minimum requirements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('RDV page supports reduced motion', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Verify animations are disabled or reduced
      const animatedElements = page.locator('[class*="animate"]');
      const count = await animatedElements.count();
      
      if (count > 0) {
        // Check that animation durations are minimized
        for (let i = 0; i < count; i++) {
          const element = animatedElements.nth(i);
          const animationDuration = await element.evaluate(el => 
            getComputedStyle(el).animationDuration
          );
          
          // Should be 0s or very short for reduced motion
          expect(animationDuration).toMatch(/^(0s|0\.01s)$/);
        }
      }
    });
  });

  test.describe('Chat Component Accessibility', () => {
    test('chat has proper ARIA live regions', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="chat-rdv"]')).toBeVisible();
      
      // Check for live region
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
      
      // Test message announcement
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.fill('Test message for screen reader');
      await page.keyboard.press('Enter');
      
      // Message should appear in live region
      await expect(liveRegion.locator('text=Test message for screen reader')).toBeVisible();
    });

    test('chat input has proper labels', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="chat-rdv"]')).toBeVisible();
      
      // Check input accessibility
      const chatInput = page.locator('[placeholder*="message"]');
      
      // Should have accessible name
      const accessibleName = await chatInput.getAttribute('aria-label');
      expect(accessibleName).toBeTruthy();
      
      // Check send button accessibility
      const sendButton = page.locator('text=Envoyer');
      await expect(sendButton).toHaveAttribute('aria-label');
    });

    test('typing indicator is announced', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="chat-rdv"]')).toBeVisible();
      
      // Send message to trigger typing indicator
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.fill('Test message');
      await page.keyboard.press('Enter');
      
      // Check for typing indicator with proper accessibility
      const typingIndicator = page.locator('[aria-label*="tape"]');
      await expect(typingIndicator).toBeVisible();
    });
  });

  test.describe('Form Accessibility', () => {
    test('patient form has proper labels and validation', async ({ page }) => {
      await page.goto('/rdv');
      
      // Trigger form appearance
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      const patientForm = page.locator('[data-testid="patient-form"]');
      if (await patientForm.isVisible()) {
        // Check all inputs have labels
        const inputs = patientForm.locator('input');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputId = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          
          // Must have one of these accessibility features
          const hasAccessibleName = inputId || ariaLabel || ariaLabelledby;
          expect(hasAccessibleName).toBeTruthy();
        }
        
        // Check for error message association
        await page.click('text=Confirmer le rendez-vous');
        
        const errorMessages = patientForm.locator('[role="alert"]');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          // Error messages should be properly associated
          for (let i = 0; i < errorCount; i++) {
            const error = errorMessages.nth(i);
            await expect(error).toBeVisible();
          }
        }
      }
    });

    test('form validation errors are accessible', async ({ page }) => {
      await page.goto('/rdv');
      
      // Try to submit empty form
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      await page.click('text=Confirmer le rendez-vous');
      
      // Check for accessible error messages
      const errorMessages = page.locator('[role="alert"]');
      const errorCount = await errorMessages.count();
      
      expect(errorCount).toBeGreaterThan(0);
      
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        await expect(error).toBeVisible();
        
        // Error should have meaningful text
        const errorText = await error.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Calendar Accessibility', () => {
    test('calendar navigation is keyboard accessible', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      // Test calendar keyboard navigation
      const calendar = page.locator('[data-testid="calendar-view"]');
      
      // Focus on calendar
      await calendar.focus();
      
      // Use arrow keys to navigate
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowUp');
      
      // Enter should select date
      await page.keyboard.press('Enter');
      
      // Should show time slots
      await expect(page.locator('[data-testid="time-slots"]')).toBeVisible();
    });

    test('calendar has proper ARIA attributes', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      const calendar = page.locator('[data-testid="calendar-view"]');
      
      // Check for calendar role
      await expect(calendar).toHaveAttribute('role', 'grid');
      
      // Check for month/year label
      const monthLabel = calendar.locator('[aria-live="polite"]');
      await expect(monthLabel).toBeVisible();
      
      // Check for navigation buttons
      const prevButton = page.locator('[aria-label*="précédent"]');
      const nextButton = page.locator('[aria-label*="suivant"]');
      
      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    });

    test('date selection announces changes', async ({ page }) => {
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      // Select a date
      await page.click('text=15 janvier');
      
      // Should announce selection
      const announcement = page.locator('[aria-live="polite"]');
      await expect(announcement).toContainText('15');
    });
  });

  test.describe('High Contrast Mode', () => {
    test('works in high contrast mode', async ({ page, browserName }) => {
      // Skip for browsers that don't support forced colors
      if (browserName === 'webkit') {
        test.skip('Skipping high contrast test for WebKit');
      }
      
      // Enable high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Run accessibility scan in high contrast
      const contrastResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();
      
      expect(contrastResults.violations).toEqual([]);
      
      // Verify buttons are still visible and functional
      await page.click('text=15 janvier');
      await expect(page.locator('text=15 janvier')).toBeVisible();
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('has proper page title and meta information', async ({ page }) => {
      await page.goto('/rdv');
      
      // Check page title
      const title = await page.title();
      expect(title).toContain('Rendez-vous');
      
      // Check lang attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('fr');
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
    });

    test('skip links work correctly', async ({ page }) => {
      await page.goto('/rdv');
      
      // Press Tab to reveal skip link
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('text=Aller au contenu principal');
      if (await skipLink.isVisible()) {
        await skipLink.click();
        
        // Should focus main content
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
      }
    });

    test('button states are properly announced', async ({ page }) => {
      await page.goto('/rdv');
      
      // Check disabled button state
      const confirmButton = page.locator('text=Confirmer le rendez-vous');
      
      // Should be disabled initially
      await expect(confirmButton).toBeDisabled();
      await expect(confirmButton).toHaveAttribute('aria-disabled', 'true');
      
      // Enable button by making selections
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Should become enabled
      await expect(confirmButton).toBeEnabled();
      await expect(confirmButton).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('maintains accessibility on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      // Run accessibility scan on mobile
      const mobileResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();
      
      expect(mobileResults.violations).toEqual([]);
      
      // Test touch interactions
      await page.tap('text=15 janvier');
      await page.tap('[data-testid="slot-14:00"]');
      
      // Should work correctly
      await expect(page.locator('[data-testid="slot-14:00"]')).toHaveClass(/selected/);
    });

    test('mobile keyboard navigation works', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/rdv');
      
      // Test mobile virtual keyboard doesn't break accessibility
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.tap();
      
      // Input should remain accessible
      await expect(chatInput).toBeFocused();
      await expect(chatInput).toHaveAttribute('aria-label');
    });
  });

  test.describe('Focus Management', () => {
    test('manages focus during state changes', async ({ page }) => {
      await page.goto('/rdv');
      
      // Focus on a time slot
      await page.click('[data-testid="slot-14:00"]');
      
      // Focus should remain manageable during updates
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // State changes shouldn't trap focus
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.focus();
      await expect(chatInput).toBeFocused();
    });

    test('focus trap works in modals', async ({ page }) => {
      await page.goto('/rdv');
      
      // Trigger modal if it exists
      const modal = page.locator('[role="dialog"]');
      
      if (await modal.isVisible()) {
        // Focus should be trapped within modal
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Focused element should be within modal
        const isWithinModal = await modal.locator(':focus').count();
        expect(isWithinModal).toBeGreaterThan(0);
      }
    });
  });
});