/**
 * RDV Booking E2E Tests
 * 
 * End-to-end testing for the complete appointment booking workflow
 * in the NOVA medical platform. Tests user journeys, accessibility,
 * and cross-browser compatibility.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('RDV Booking E2E Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to RDV page
    await page.goto('/rdv');
    
    // Wait for page to load completely
    await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
  });

  test.describe('Complete Booking Flow', () => {
    test('user can book appointment successfully', async ({ page }) => {
      // Verify layout components are visible
      await expect(page.locator('[data-testid="patient-context"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      await expect(page.locator('[data-testid="chat-rdv"]')).toBeVisible();
      
      // Step 1: Select date
      await page.click('text=15 janvier');
      
      // Step 2: Select time slot
      await page.click('[data-testid="slot-14:00"]');
      
      // Verify slot selection visual feedback
      await expect(page.locator('[data-testid="slot-14:00"]')).toHaveClass(/selected|bg-primary/);
      
      // Step 3: Chat interaction
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.fill('Je confirme ce créneau pour une consultation');
      await page.click('text=Envoyer');
      
      // Wait for bot response
      await expect(page.locator('text=/disponibilité|confirmé/i')).toBeVisible();
      
      // Step 4: Fill patient information if required
      const patientForm = page.locator('[data-testid="patient-form"]');
      if (await patientForm.isVisible()) {
        await page.fill('[name="name"]', 'Marie Dupont');
        await page.fill('[name="phone"]', '+213555123456');
        await page.fill('[name="email"]', 'marie.dupont@example.com');
      }
      
      // Step 5: Confirm booking
      await page.click('text=Confirmer le rendez-vous');
      
      // Step 6: Verify success
      await expect(page.locator('text=/rendez-vous confirmé|réservation confirmée/i')).toBeVisible();
      
      // Verify appointment details are shown
      await expect(page.locator('text=15 janvier')).toBeVisible();
      await expect(page.locator('text=14:00')).toBeVisible();
    });

    test('handles appointment modification flow', async ({ page }) => {
      // Book initial appointment
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Chat to confirm
      await page.fill('[placeholder*="message"]', 'Je veux ce créneau');
      await page.click('text=Envoyer');
      
      // Wait for confirmation option
      await page.click('text=Confirmer le rendez-vous');
      
      // Now modify the appointment
      await page.click('text=Modifier');
      
      // Change to different time
      await page.click('[data-testid="slot-15:30"]');
      
      // Confirm change
      await page.click('text=Confirmer la modification');
      
      // Verify new time is reflected
      await expect(page.locator('text=15:30')).toBeVisible();
    });

    test('prevents double booking', async ({ page }) => {
      // Select a slot
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Confirm booking
      await page.fill('[placeholder*="message"]', 'Je veux ce créneau');
      await page.click('text=Envoyer');
      await page.click('text=Confirmer le rendez-vous');
      
      // Wait for success
      await expect(page.locator('text=/confirmé/i')).toBeVisible();
      
      // Try to book another appointment at same time
      await page.click('text=Nouveau rendez-vous');
      await page.click('text=15 janvier');
      
      // The same slot should not be available
      await expect(page.locator('[data-testid="slot-14:00"]')).toBeDisabled();
    });
  });

  test.describe('Calendar Interaction', () => {
    test('navigates through calendar months', async ({ page }) => {
      // Navigate to next month
      await page.click('[aria-label="Mois suivant"]');
      
      // Verify month changed
      await expect(page.locator('text=février')).toBeVisible();
      
      // Navigate back
      await page.click('[aria-label="Mois précédent"]');
      
      // Verify back to original month
      await expect(page.locator('text=janvier')).toBeVisible();
    });

    test('shows available time slots for selected date', async ({ page }) => {
      // Select a date
      await page.click('text=15 janvier');
      
      // Wait for time slots to load
      await expect(page.locator('[data-testid="time-slots"]')).toBeVisible();
      
      // Verify multiple slots are available
      await expect(page.locator('[data-testid*="slot-"]')).toHaveCount(expect.any(Number));
      
      // Verify slot information
      await expect(page.locator('text=14:00')).toBeVisible();
      await expect(page.locator('text=15:30')).toBeVisible();
    });

    test('handles unavailable dates', async ({ page }) => {
      // Try to select a weekend or holiday
      const unavailableDate = page.locator('text=20 janvier'); // Assuming Sunday
      
      if (await unavailableDate.isVisible()) {
        await expect(unavailableDate).toHaveClass(/disabled|unavailable/);
      }
    });

    test('shows appointment duration and type', async ({ page }) => {
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Verify appointment details
      await expect(page.locator('text=/30 min|45 min|1h/')).toBeVisible();
      await expect(page.locator('text=/Consultation|Contrôle|Urgence/')).toBeVisible();
    });
  });

  test.describe('Chat Assistant', () => {
    test('provides helpful responses', async ({ page }) => {
      const chatInput = page.locator('[placeholder*="message"]');
      
      // Ask about availability
      await chatInput.fill('Quels sont les créneaux disponibles cette semaine ?');
      await page.click('text=Envoyer');
      
      // Wait for response
      await expect(page.locator('text=/créneaux|disponible|semaine/i')).toBeVisible();
      
      // Ask about appointment types
      await chatInput.fill('Quels types de consultations proposez-vous ?');
      await page.click('text=Envoyer');
      
      // Wait for response
      await expect(page.locator('text=/consultation|contrôle|type/i')).toBeVisible();
    });

    test('handles appointment cancellation requests', async ({ page }) => {
      const chatInput = page.locator('[placeholder*="message"]');
      
      // Request cancellation
      await chatInput.fill('Je veux annuler mon rendez-vous');
      await page.click('text=Envoyer');
      
      // Should provide cancellation options
      await expect(page.locator('text=/annulation|annuler|contact/i')).toBeVisible();
    });

    test('provides emergency contact information', async ({ page }) => {
      const chatInput = page.locator('[placeholder*="message"]');
      
      // Ask about emergency
      await chatInput.fill('Urgence dentaire');
      await page.click('text=Envoyer');
      
      // Should show emergency information
      await expect(page.locator('text=/urgence|contact|téléphone/i')).toBeVisible();
      await expect(page.locator('text=+213')).toBeVisible(); // Emergency phone number
    });

    test('maintains conversation context', async ({ page }) => {
      const chatInput = page.locator('[placeholder*="message"]');
      
      // Start conversation
      await chatInput.fill('Je cherche un rendez-vous');
      await page.click('text=Envoyer');
      
      // Continue conversation
      await chatInput.fill('Plutôt en fin de semaine');
      await page.click('text=Envoyer');
      
      // Bot should understand context
      await expect(page.locator('text=/vendredi|samedi|fin de semaine/i')).toBeVisible();
    });
  });

  test.describe('Patient Information', () => {
    test('validates required patient fields', async ({ page }) => {
      // Try to book without filling required info
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      await page.click('text=Confirmer le rendez-vous');
      
      // Should show validation errors
      await expect(page.locator('text=/requis|obligatoire/i')).toBeVisible();
    });

    test('validates phone number format', async ({ page }) => {
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Enter invalid phone number
      await page.fill('[name="phone"]', '123456789');
      await page.click('text=Confirmer le rendez-vous');
      
      // Should show format error
      await expect(page.locator('text=/format|+213/i')).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Enter invalid email
      await page.fill('[name="email"]', 'invalid-email');
      await page.click('text=Confirmer le rendez-vous');
      
      // Should show email format error
      await expect(page.locator('text=/email.*valide/i')).toBeVisible();
    });

    test('saves patient preferences', async ({ page }) => {
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      
      // Fill patient info with preferences
      await page.fill('[name="name"]', 'Marie Dupont');
      await page.fill('[name="phone"]', '+213555123456');
      await page.fill('[name="email"]', 'marie@example.com');
      
      // Select preferences
      await page.check('[name="reminderEnabled"]');
      await page.selectOption('[name="communicationMethod"]', 'sms');
      
      await page.click('text=Confirmer le rendez-vous');
      
      // Verify preferences are saved
      await expect(page.locator('text=/préférences|SMS/i')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/appointments/create', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      // Try to book appointment
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="phone"]', '+213555123456');
      await page.click('text=Confirmer le rendez-vous');
      
      // Should show error message
      await expect(page.locator('text=/erreur|problème/i')).toBeVisible();
      
      // Should provide retry option
      await expect(page.locator('text=/réessayer/i')).toBeVisible();
    });

    test('handles network timeout', async ({ page }) => {
      // Mock slow response
      await page.route('**/api/appointments/slots', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ slots: [] })
          });
        }, 10000); // 10 second delay
      });
      
      await page.click('text=15 janvier');
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading"]')).toBeVisible();
      
      // Should eventually show timeout message
      await expect(page.locator('text=/timeout|délai/i')).toBeVisible({ timeout: 15000 });
    });

    test('recovers from temporary failures', async ({ page }) => {
      let attemptCount = 0;
      
      // Mock failing then succeeding
      await page.route('**/api/appointments/create', route => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Temporary error' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, appointmentId: '123' })
          });
        }
      });
      
      // Try to book appointment
      await page.click('text=15 janvier');
      await page.click('[data-testid="slot-14:00"]');
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="phone"]', '+213555123456');
      await page.click('text=Confirmer le rendez-vous');
      
      // Should show error first
      await expect(page.locator('text=/erreur/i')).toBeVisible();
      
      // Retry
      await page.click('text=Réessayer');
      
      // Should succeed on retry
      await expect(page.locator('text=/confirmé/i')).toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test('works on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip('Skipping mobile test on desktop');
      }
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
      
      // Test mobile-specific interactions
      await page.tap('text=15 janvier');
      await page.tap('[data-testid="slot-14:00"]');
      
      // Verify touch interactions work
      await expect(page.locator('[data-testid="slot-14:00"]')).toHaveClass(/selected/);
      
      // Test mobile chat
      const chatInput = page.locator('[placeholder*="message"]');
      await chatInput.tap();
      await chatInput.fill('Rendez-vous mobile');
      await page.tap('text=Envoyer');
      
      await expect(page.locator('text=Rendez-vous mobile')).toBeVisible();
    });

    test('handles mobile keyboard interactions', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip('Skipping mobile test on desktop');
      }
      
      // Focus on input should bring up keyboard
      const phoneInput = page.locator('[name="phone"]');
      await phoneInput.tap();
      
      // Verify numeric keyboard for phone input
      await expect(phoneInput).toBeFocused();
      
      // Test form navigation on mobile
      await page.keyboard.press('Tab');
      await expect(page.locator('[name="email"]')).toBeFocused();
    });
  });

  test.describe('Performance', () => {
    test('loads within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/rdv');
      await expect(page.locator('[data-testid="rdv-layout"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('handles large calendar data efficiently', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/appointments/slots', route => {
        const slots = Array.from({ length: 100 }, (_, i) => ({
          time: `${8 + Math.floor(i / 4)}:${(i % 4) * 15 || '00'}`,
          available: true,
          type: 'Consultation'
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ slots })
        });
      });
      
      await page.click('text=15 janvier');
      
      // Should render efficiently without blocking
      await expect(page.locator('[data-testid="time-slots"]')).toBeVisible();
      
      // Should remain interactive
      await page.click('[data-testid="slot-8:00"]');
      await expect(page.locator('[data-testid="slot-8:00"]')).toHaveClass(/selected/);
    });
  });
});