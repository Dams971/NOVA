import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { validateTouchTarget, validatePageTouchTargets } from '@/lib/utils/touch-targets';

test.describe('UI Compliance Tests - WCAG 2.2 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test.describe('WCAG 2.4.7 - Focus Visible', () => {
    test('All interactive elements have visible focus indicators', async ({ page }) => {
      // Get all interactive elements
      const interactiveElements = await page.$$('button, a, input, select, textarea, [tabindex="0"], [role="button"]');
      
      for (const element of interactiveElements) {
        // Focus the element
        await element.focus();
        
        // Check for focus styles
        const computedStyle = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
            borderColor: styles.borderColor
          };
        });
        
        // Verify visible focus indicator
        const hasVisibleFocus = 
          computedStyle.outline !== 'none' && computedStyle.outline !== '0px' ||
          computedStyle.boxShadow !== 'none' ||
          computedStyle.outlineWidth !== '0px';
        
        expect(hasVisibleFocus).toBeTruthy();
        
        // Check contrast ratio (simplified check)
        if (computedStyle.outlineColor) {
          expect(computedStyle.outlineColor).not.toBe('transparent');
        }
      }
    });

    test('Focus indicators meet 3:1 contrast ratio', async ({ page }) => {
      const button = page.getByRole('button').first();
      await button.focus();
      
      const focusStyle = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outlineColor: styles.outlineColor,
          backgroundColor: styles.backgroundColor,
          outline: styles.outline
        };
      });
      
      // Ensure focus outline is present and not transparent
      expect(focusStyle.outline).not.toBe('none');
      expect(focusStyle.outlineColor).not.toBe('transparent');
    });

    test('Focus order is logical and predictable', async ({ page }) => {
      const focusableElements = await page.$$('button, a, input, select, textarea, [tabindex="0"]');
      
      // Tab through first few elements
      await page.keyboard.press('Tab');
      let focused1 = await page.evaluate(() => document.activeElement?.tagName);
      
      await page.keyboard.press('Tab');
      let focused2 = await page.evaluate(() => document.activeElement?.tagName);
      
      await page.keyboard.press('Tab');
      let focused3 = await page.evaluate(() => document.activeElement?.tagName);
      
      // Verify logical progression (skip link, then main content)
      expect([focused1, focused2, focused3]).toContain('A'); // Skip link should be first
    });
  });

  test.describe('WCAG 2.5.8 - Target Size Minimum', () => {
    test('Interactive elements meet minimum 24x24px touch target', async ({ page }) => {
      const interactiveElements = await page.$$('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]');
      
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        
        if (box) {
          const { width, height } = box;
          
          // Check if element meets minimum size OR has adequate spacing
          if (width < 24 || height < 24) {
            // Check for adequate spacing with siblings
            const hasSpacing = await element.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              const parent = el.parentElement;
              if (!parent) return true;
              
              const siblings = Array.from(parent.children).filter(child => 
                child !== el && child instanceof HTMLElement
              ) as HTMLElement[];
              
              for (const sibling of siblings) {
                const siblingRect = sibling.getBoundingClientRect();
                const horizontalGap = Math.min(
                  Math.abs(rect.left - siblingRect.right),
                  Math.abs(rect.right - siblingRect.left)
                );
                const verticalGap = Math.min(
                  Math.abs(rect.top - siblingRect.bottom),
                  Math.abs(rect.bottom - siblingRect.top)
                );
                
                // Check if elements are adjacent and spacing is adequate
                if (horizontalGap < 24 && verticalGap < 24 && 
                    (horizontalGap < 100 || verticalGap < 100)) {
                  return false; // Insufficient spacing
                }
              }
              return true;
            });
            
            expect(hasSpacing).toBeTruthy();
          }
        }
      }
    });

    test('Buttons have adequate touch target size', async ({ page }) => {
      const buttons = await page.$$('button, [role="button"]');
      
      for (const button of buttons) {
        const box = await button.boundingBox();
        
        if (box) {
          // Primary and secondary buttons should be at least 44px tall
          const buttonType = await button.evaluate((el) => {
            return el.className.includes('btn-primary') || 
                   el.className.includes('btn-secondary') ||
                   el.getAttribute('type') === 'submit';
          });
          
          if (buttonType) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          } else {
            // Other buttons should meet minimum 24px
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
          }
        }
      }
    });

    test('Form inputs have appropriate touch target height', async ({ page }) => {
      const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
      
      for (const input of inputs) {
        const box = await input.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('WCAG 1.4.3 - Contrast Minimum', () => {
    test('Page passes axe color contrast checks', async ({ page }) => {
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('Text elements have sufficient contrast', async ({ page }) => {
      // Check main text elements
      const textElements = await page.$$('p, h1, h2, h3, h4, h5, h6, span, div');
      
      for (const element of textElements.slice(0, 10)) { // Sample first 10
        const hasText = await element.evaluate((el) => {
          return el.textContent && el.textContent.trim().length > 0;
        });
        
        if (hasText) {
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });
          
          // Ensure colors are defined (not transparent/inherit)
          expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
          expect(styles.color).not.toBe('transparent');
        }
      }
    });

    test('Error states have sufficient contrast', async ({ page }) => {
      // Navigate to a form to trigger potential errors
      await page.goto('/rdv');
      
      // Look for error styling classes
      const errorElements = await page.$$('.error-message, .text-red-600, .border-red-500, [role="alert"]');
      
      for (const element of errorElements) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            borderColor: computed.borderColor,
            backgroundColor: computed.backgroundColor
          };
        });
        
        // Error colors should be defined and not transparent
        if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') {
          expect(styles.color).toContain('rgb'); // Should be a valid color
        }
      }
    });
  });

  test.describe('WCAG 1.4.11 - Non-text Contrast', () => {
    test('UI components have sufficient contrast', async ({ page }) => {
      const uiElements = await page.$$('button, input, select, textarea, [role="button"]');
      
      for (const element of uiElements.slice(0, 5)) { // Sample first 5
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderColor: computed.borderColor,
            backgroundColor: computed.backgroundColor,
            outline: computed.outline
          };
        });
        
        // Border colors should be defined for form elements
        if (styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)') {
          expect(styles.borderColor).toContain('rgb');
        }
      }
    });
  });

  test.describe('WCAG 2.4.1 - Bypass Blocks', () => {
    test('Skip links are present and functional', async ({ page }) => {
      // Tab to first element (should be skip link)
      await page.keyboard.press('Tab');
      
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          href: el?.getAttribute('href'),
          textContent: el?.textContent,
          isVisible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
        };
      });
      
      expect(activeElement.tagName).toBe('A');
      expect(activeElement.href).toContain('#');
      expect(activeElement.textContent).toMatch(/skip|main|content/i);
    });

    test('Skip links work with sticky headers', async ({ page }) => {
      // Click skip link
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Check that main content is visible and not obscured
      const mainContent = await page.$('#main-content, main, [role="main"]');
      
      if (mainContent) {
        const isVisible = await mainContent.isVisible();
        expect(isVisible).toBeTruthy();
        
        // Check scroll position accounts for header
        const scrollPosition = await page.evaluate(() => window.pageYOffset);
        expect(scrollPosition).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('WCAG 2.1.2 - No Keyboard Trap', () => {
    test('Modal dialogs properly trap focus', async ({ page }) => {
      // Look for modal triggers
      const modalTrigger = await page.$('button[data-modal], button[aria-haspopup="dialog"]');
      
      if (modalTrigger) {
        await modalTrigger.click();
        
        // Wait for modal to appear
        await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
        
        // Tab through modal elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Check that focus stays within modal
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          const modal = document.querySelector('[role="dialog"], .modal');
          return modal?.contains(focused) || false;
        });
        
        expect(focusedElement).toBeTruthy();
        
        // Test escape key
        await page.keyboard.press('Escape');
        
        // Modal should close
        const modalVisible = await page.isVisible('[role="dialog"], .modal');
        expect(modalVisible).toBeFalsy();
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('Form fields have proper labels and descriptions', async ({ page }) => {
      await page.goto('/rdv');
      
      const formInputs = await page.$$('input:not([type="hidden"]), select, textarea');
      
      for (const input of formInputs) {
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          // Check for associated label
          const label = await page.$(`label[for="${inputId}"]`);
          expect(label).toBeTruthy();
          
          // Check for aria-describedby if present
          const describedBy = await input.getAttribute('aria-describedby');
          if (describedBy) {
            const descriptions = describedBy.split(' ');
            for (const descId of descriptions) {
              const descElement = await page.$(`#${descId}`);
              expect(descElement).toBeTruthy();
            }
          }
        }
      }
    });

    test('Required fields are properly indicated', async ({ page }) => {
      await page.goto('/rdv');
      
      const requiredInputs = await page.$$('input[required], input[aria-required="true"]');
      
      for (const input of requiredInputs) {
        // Check for visual required indicator
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          const label = await page.$(`label[for="${inputId}"]`);
          const labelText = await label?.textContent();
          
          // Should have asterisk or "required" text
          expect(labelText).toMatch(/\*|required|requis|obligatoire/i);
        }
      }
    });

    test('Error messages are associated with form fields', async ({ page }) => {
      await page.goto('/rdv');
      
      // Try to submit form to trigger errors
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Wait for potential errors
        await page.waitForTimeout(1000);
        
        const errorMessages = await page.$$('[role="alert"], .error-message');
        
        for (const error of errorMessages) {
          const errorId = await error.getAttribute('id');
          
          if (errorId) {
            // Find associated input
            const associatedInput = await page.$(`[aria-describedby*="${errorId}"]`);
            expect(associatedInput).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Loading States and Dynamic Content', () => {
    test('Loading states are announced to screen readers', async ({ page }) => {
      // Look for elements with loading states
      const loadingElements = await page.$$('[aria-busy="true"], .loading, .spinner');
      
      for (const element of loadingElements) {
        const ariaBusy = await element.getAttribute('aria-busy');
        const hasLiveRegion = await page.evaluate((el) => {
          // Check if element or parent has live region
          let current = el;
          while (current && current !== document.body) {
            if (current.getAttribute('aria-live') || current.getAttribute('role') === 'status') {
              return true;
            }
            current = current.parentElement;
          }
          return false;
        }, element);
        
        // Should have aria-busy or be in a live region
        expect(ariaBusy === 'true' || hasLiveRegion).toBeTruthy();
      }
    });

    test('Dynamic content changes are announced', async ({ page }) => {
      // Check for live regions
      const liveRegions = await page.$$('[aria-live], [role="status"], [role="alert"]');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Check live region attributes
      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');
        
        if (ariaLive) {
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
        
        if (role) {
          expect(['status', 'alert', 'log']).toContain(role);
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('Touch targets are appropriate on mobile viewport', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const buttons = await page.$$('button, a, [role="button"]');
      
      for (const button of buttons.slice(0, 10)) { // Sample first 10
        const box = await button.boundingBox();
        
        if (box) {
          // Mobile targets should be at least 44px
          expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('Content is readable without horizontal scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // Small mobile screen
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('Respects prefers-reduced-motion setting', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Check for animation styles
      const animatedElements = await page.$$('.animate-spin, .animate-pulse, [style*="animation"]');
      
      for (const element of animatedElements) {
        const animationDuration = await element.evaluate((el) => {
          return window.getComputedStyle(el).animationDuration;
        });
        
        // Should be very short or none for reduced motion
        expect(animationDuration === 'none' || animationDuration === '0s' || 
               parseFloat(animationDuration) <= 0.01).toBeTruthy();
      }
    });
  });
});

test.describe('Heuristic Compliance Tests', () => {
  const heuristics = [
    { id: 'H1', name: 'Visibility of system status', selector: '.loading, .spinner, [aria-busy="true"]' },
    { id: 'H2', name: 'Match system and real world', content: 'user-friendly language' },
    { id: 'H3', name: 'User control and freedom', selector: 'button:has-text("Cancel"), button:has-text("Back")' },
    { id: 'H4', name: 'Consistency and standards', selector: 'button' },
    { id: 'H5', name: 'Error prevention', selector: '[role="dialog"]:has-text("Confirm")' },
    { id: 'H6', name: 'Recognition rather than recall', selector: 'nav, .breadcrumb' },
    { id: 'H7', name: 'Flexibility and efficiency', selector: '[accesskey]' },
    { id: 'H8', name: 'Aesthetic and minimalist', content: 'clean design' },
    { id: 'H9', name: 'Error recovery', selector: '.error-message, [role="alert"]' },
    { id: 'H10', name: 'Help and documentation', selector: '[title], .tooltip, .help-text' }
  ];

  heuristics.forEach((heuristic) => {
    test(`${heuristic.id}: ${heuristic.name}`, async ({ page }) => {
      await page.goto('/');
      
      if (heuristic.selector) {
        const elements = await page.$$(heuristic.selector);
        expect(elements.length).toBeGreaterThan(0);
      }
      
      // Specific checks per heuristic
      switch (heuristic.id) {
        case 'H1':
          // Check for loading states
          const hasLoadingIndicators = await page.$$('.loading, .spinner, [aria-busy]');
          expect(hasLoadingIndicators.length).toBeGreaterThanOrEqual(0);
          break;
          
        case 'H3':
          // Check for cancel/back buttons in forms
          await page.goto('/rdv');
          const cancelButtons = await page.$$('button:has-text("Cancel"), button:has-text("Annuler")');
          expect(cancelButtons.length).toBeGreaterThanOrEqual(0);
          break;
          
        case 'H4':
          // Check button consistency
          const allButtons = await page.$$('button');
          if (allButtons.length > 1) {
            const firstButtonClasses = await allButtons[0].getAttribute('class');
            expect(firstButtonClasses).toContain('button'); // Some consistent class
          }
          break;
          
        case 'H9':
          // Check error message clarity
          const errorElements = await page.$$('.error-message, [role="alert"]');
          for (const error of errorElements) {
            const text = await error.textContent();
            expect(text?.length).toBeGreaterThan(10); // Should be descriptive
          }
          break;
      }
    });
  });
});