# NOVA Medical Accessibility Patterns

## Overview

This document provides comprehensive accessibility implementation guidelines for the NOVA medical platform, ensuring WCAG 2.2 AA compliance and optimal user experience for individuals with disabilities in healthcare settings.

## Accessibility Framework

### WCAG 2.2 AA Compliance Matrix

#### Perceivable
- **1.1 Text Alternatives**: All images, icons, and media have descriptive alt text
- **1.2 Time-based Media**: Captions for medical videos, transcripts for audio
- **1.3 Adaptable**: Content structure is semantic and programmatically determinable
- **1.4 Distinguishable**: Sufficient color contrast, resizable text, audio control

#### Operable
- **2.1 Keyboard Accessible**: Full keyboard navigation support
- **2.2 Enough Time**: Adjustable time limits for medical forms
- **2.3 Seizures**: No content causes seizures or vestibular disorders
- **2.4 Navigable**: Clear navigation, skip links, focus management
- **2.5 Input Modalities**: Touch targets, motion alternatives, input cancellation

#### Understandable
- **3.1 Readable**: Clear language, medical terms explained
- **3.2 Predictable**: Consistent navigation and functionality
- **3.3 Input Assistance**: Error identification, suggestions, prevention

#### Robust
- **4.1 Compatible**: Works with assistive technologies
- **4.2 Accessible**: Compatible with current and future assistive technologies

## Focus Management System

### Focus Trap Implementation
```typescript
// src/lib/accessibility/focus-trap.ts
interface FocusTrappingOptions {
  initialFocus?: HTMLElement;
  returnFocus?: HTMLElement;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  allowOutsideClick?: boolean;
}

export class MedicalFocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement;
  private lastFocusable: HTMLElement;
  private previouslyFocused: HTMLElement | null;

  constructor(container: HTMLElement, options: FocusTrappingOptions = {}) {
    this.container = container;
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    this.setupEventListeners();
    
    // Focus initial element or first focusable
    const initialFocus = options.initialFocus || this.firstFocusable;
    if (initialFocus) {
      initialFocus.focus();
    }
  }

  private updateFocusableElements(): void {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ).filter(el => this.isVisible(el)) as HTMLElement[];

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  private isVisible(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  private handleTabKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };

  private handleEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.deactivate();
    }
  };

  private setupEventListeners(): void {
    this.container.addEventListener('keydown', this.handleTabKey);
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  public deactivate(): void {
    this.container.removeEventListener('keydown', this.handleTabKey);
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    // Return focus to previously focused element
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }
}

// React Hook for Focus Trapping
export const useFocusTrap = (
  isActive: boolean, 
  options: FocusTrappingOptions = {}
) => {
  const containerRef = useRef<HTMLElement>(null);
  const trapRef = useRef<MedicalFocusTrap | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      trapRef.current = new MedicalFocusTrap(containerRef.current, options);
    }

    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
        trapRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
};
```

### Roving Tabindex Pattern
```typescript
// src/lib/accessibility/roving-tabindex.ts
export class RovingTabindex {
  private items: HTMLElement[];
  private currentIndex: number = 0;

  constructor(container: HTMLElement, itemSelector: string) {
    this.items = Array.from(container.querySelectorAll(itemSelector));
    this.setupRovingTabindex();
    this.setupEventListeners();
  }

  private setupRovingTabindex(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      item.setAttribute('role', item.getAttribute('role') || 'option');
    });
  }

  private setupEventListeners(): void {
    this.items.forEach((item, index) => {
      item.addEventListener('keydown', (event) => this.handleKeyDown(event, index));
      item.addEventListener('focus', () => this.setCurrentIndex(index));
    });
  }

  private handleKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (index + 1) % this.items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = index === 0 ? this.items.length - 1 : index - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;
      default:
        return;
    }

    this.setCurrentIndex(newIndex);
    this.items[newIndex].focus();
  }

  private setCurrentIndex(index: number): void {
    this.items[this.currentIndex].setAttribute('tabindex', '-1');
    this.currentIndex = index;
    this.items[this.currentIndex].setAttribute('tabindex', '0');
  }
}

// React Hook for Roving Tabindex
export const useRovingTabindex = (itemSelector: string) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const roving = new RovingTabindex(containerRef.current, itemSelector);
      return () => {
        // Cleanup if needed
      };
    }
  }, [itemSelector]);

  return containerRef;
};
```

## Screen Reader Optimization

### ARIA Live Regions
```typescript
// src/lib/accessibility/live-regions.ts
type LiveRegionPriority = 'polite' | 'assertive';
type LiveRegionType = 'status' | 'alert' | 'log';

export class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();

  constructor() {
    this.createDefaultRegions();
  }

  private createDefaultRegions(): void {
    // Status region for general updates
    this.createRegion('status', 'polite', 'status');
    
    // Alert region for important notifications
    this.createRegion('alerts', 'assertive', 'alert');
    
    // Medical alerts region for critical medical information
    this.createRegion('medical-alerts', 'assertive', 'alert');
  }

  private createRegion(
    id: string, 
    priority: LiveRegionPriority, 
    type: LiveRegionType
  ): HTMLElement {
    const region = document.createElement('div');
    region.id = `live-region-${id}`;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', type);
    region.className = 'sr-only';
    
    document.body.appendChild(region);
    this.regions.set(id, region);
    
    return region;
  }

  public announce(
    message: string, 
    regionId: string = 'status',
    delay: number = 100
  ): void {
    const region = this.regions.get(regionId);
    if (!region) return;

    // Clear existing content first
    region.textContent = '';
    
    // Add new message after delay to ensure screen reader pickup
    setTimeout(() => {
      region.textContent = message;
    }, delay);
  }

  public announceMedical(message: string): void {
    this.announce(message, 'medical-alerts', 50);
  }

  public announceStatus(message: string): void {
    this.announce(message, 'status', 100);
  }

  public clear(regionId: string): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.textContent = '';
    }
  }
}

// React Hook for Live Regions
export const useLiveRegion = () => {
  const managerRef = useRef<LiveRegionManager>();

  useEffect(() => {
    managerRef.current = new LiveRegionManager();
    
    return () => {
      // Cleanup regions on unmount
      managerRef.current?.clear('status');
      managerRef.current?.clear('alerts');
      managerRef.current?.clear('medical-alerts');
    };
  }, []);

  return {
    announce: (message: string, regionId?: string) => 
      managerRef.current?.announce(message, regionId),
    announceMedical: (message: string) => 
      managerRef.current?.announceMedical(message),
    announceStatus: (message: string) => 
      managerRef.current?.announceStatus(message),
  };
};
```

### Screen Reader Announcements Hook
```typescript
// src/hooks/useScreenReaderAnnouncements.tsx
interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
  clearPrevious?: boolean;
}

export const useScreenReaderAnnouncements = () => {
  const { announce, announceMedical, announceStatus } = useLiveRegion();

  const announceFormError = useCallback((fieldName: string, error: string) => {
    announce(`Erreur dans le champ ${fieldName}: ${error}`, 'alerts');
  }, [announce]);

  const announceFormSuccess = useCallback((message: string) => {
    announceStatus(`Succès: ${message}`);
  }, [announceStatus]);

  const announcePageLoad = useCallback((pageName: string) => {
    announceStatus(`Page ${pageName} chargée`);
  }, [announceStatus]);

  const announceMedicalUpdate = useCallback((update: string) => {
    announceMedical(`Mise à jour médicale: ${update}`);
  }, [announceMedical]);

  const announceAppointmentStatus = useCallback((status: string) => {
    announce(`Statut du rendez-vous: ${status}`, 'status');
  }, [announce]);

  return {
    announceFormError,
    announceFormSuccess,
    announcePageLoad,
    announceMedicalUpdate,
    announceAppointmentStatus,
    announce,
  };
};
```

## Keyboard Navigation Patterns

### Medical Form Navigation
```typescript
// src/lib/accessibility/medical-form-navigation.ts
export class MedicalFormNavigation {
  private form: HTMLFormElement;
  private fields: HTMLElement[];
  private currentFieldIndex: number = 0;

  constructor(form: HTMLFormElement) {
    this.form = form;
    this.fields = this.getFormFields();
    this.setupKeyboardHandlers();
  }

  private getFormFields(): HTMLElement[] {
    const fieldSelectors = [
      'input:not([type="hidden"]):not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'button:not([disabled])',
    ].join(', ');

    return Array.from(this.form.querySelectorAll(fieldSelectors));
  }

  private setupKeyboardHandlers(): void {
    this.form.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const { key, ctrlKey, shiftKey } = event;

    // Quick navigation shortcuts
    if (ctrlKey) {
      switch (key) {
        case 'ArrowUp':
          event.preventDefault();
          this.goToFirstField();
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.goToLastField();
          break;
        case 's':
          event.preventDefault();
          this.submitForm();
          break;
      }
    }

    // Section navigation (for multi-section forms)
    if (key === 'F6') {
      event.preventDefault();
      this.goToNextSection(shiftKey);
    }
  };

  private goToFirstField(): void {
    if (this.fields.length > 0) {
      this.fields[0].focus();
      this.currentFieldIndex = 0;
    }
  }

  private goToLastField(): void {
    if (this.fields.length > 0) {
      const lastIndex = this.fields.length - 1;
      this.fields[lastIndex].focus();
      this.currentFieldIndex = lastIndex;
    }
  }

  private goToNextSection(reverse: boolean = false): void {
    const sections = this.form.querySelectorAll('[role="group"], fieldset');
    if (sections.length <= 1) return;

    const currentSection = (event?.target as HTMLElement)?.closest('[role="group"], fieldset');
    if (!currentSection) return;

    const currentIndex = Array.from(sections).indexOf(currentSection);
    const nextIndex = reverse 
      ? (currentIndex - 1 + sections.length) % sections.length
      : (currentIndex + 1) % sections.length;

    const nextSection = sections[nextIndex];
    const firstField = nextSection.querySelector('input, textarea, select, button') as HTMLElement;
    firstField?.focus();
  }

  private submitForm(): void {
    const submitButton = this.form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton && !submitButton.disabled) {
      submitButton.click();
    }
  }
}

// React Hook for Medical Form Navigation
export const useMedicalFormNavigation = (formRef: RefObject<HTMLFormElement>) => {
  useEffect(() => {
    if (formRef.current) {
      const navigation = new MedicalFormNavigation(formRef.current);
      
      return () => {
        // Cleanup event listeners
      };
    }
  }, [formRef]);
};
```

### Calendar Navigation Pattern
```typescript
// src/lib/accessibility/calendar-navigation.ts
export class AccessibleCalendarNavigation {
  private calendar: HTMLElement;
  private currentDate: Date;
  private focusedDate: Date;

  constructor(calendar: HTMLElement, initialDate: Date = new Date()) {
    this.calendar = calendar;
    this.currentDate = new Date(initialDate);
    this.focusedDate = new Date(initialDate);
    this.setupCalendarGrid();
    this.setupEventListeners();
  }

  private setupCalendarGrid(): void {
    this.calendar.setAttribute('role', 'grid');
    this.calendar.setAttribute('aria-label', 'Calendrier de sélection de date');
    
    const dates = this.calendar.querySelectorAll('[data-date]');
    dates.forEach((date, index) => {
      const element = date as HTMLElement;
      element.setAttribute('role', 'gridcell');
      element.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      // Add day of week to label
      const dateValue = new Date(element.dataset.date!);
      const dayName = dateValue.toLocaleDateString('fr-FR', { weekday: 'long' });
      const fullDate = dateValue.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      element.setAttribute('aria-label', fullDate);
    });
  }

  private setupEventListeners(): void {
    this.calendar.addEventListener('keydown', this.handleKeyDown);
    this.calendar.addEventListener('focus', this.handleFocus);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const { key } = event;
    let newDate = new Date(this.focusedDate);

    switch (key) {
      case 'ArrowRight':
        event.preventDefault();
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'Home':
        event.preventDefault();
        newDate.setDate(1); // First day of month
        break;
      case 'End':
        event.preventDefault();
        newDate.setMonth(newDate.getMonth() + 1, 0); // Last day of month
        break;
      case 'PageUp':
        event.preventDefault();
        if (event.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() - 1);
        } else {
          newDate.setMonth(newDate.getMonth() - 1);
        }
        break;
      case 'PageDown':
        event.preventDefault();
        if (event.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() + 1);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectDate(this.focusedDate);
        return;
      default:
        return;
    }

    this.focusDate(newDate);
  };

  private handleFocus = (event: FocusEvent): void => {
    const target = event.target as HTMLElement;
    if (target.dataset.date) {
      this.focusedDate = new Date(target.dataset.date);
    }
  };

  private focusDate(date: Date): void {
    // Remove tabindex from current focused date
    const currentFocused = this.calendar.querySelector('[tabindex="0"]');
    if (currentFocused) {
      currentFocused.setAttribute('tabindex', '-1');
    }

    // Find and focus new date
    const dateString = date.toISOString().split('T')[0];
    const newFocused = this.calendar.querySelector(`[data-date="${dateString}"]`) as HTMLElement;
    
    if (newFocused) {
      newFocused.setAttribute('tabindex', '0');
      newFocused.focus();
      this.focusedDate = date;
    }
  }

  private selectDate(date: Date): void {
    const event = new CustomEvent('dateselected', {
      detail: { date },
      bubbles: true,
    });
    this.calendar.dispatchEvent(event);
  }
}
```

## Touch Target Optimization

### Touch Target Enhancement
```typescript
// src/lib/accessibility/touch-targets.ts
interface TouchTargetOptions {
  minSize: number;
  minSpacing: number;
  enhanceSmallTargets: boolean;
}

export class TouchTargetEnhancer {
  private options: TouchTargetOptions;

  constructor(options: Partial<TouchTargetOptions> = {}) {
    this.options = {
      minSize: 44, // iOS guideline
      minSpacing: 8,
      enhanceSmallTargets: true,
      ...options,
    };
  }

  public enhanceContainer(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, a, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach((element) => {
      this.enhanceElement(element as HTMLElement);
    });
  }

  private enhanceElement(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    // Check if element meets minimum size requirements
    if (rect.width < this.options.minSize || rect.height < this.options.minSize) {
      this.enlargeElement(element, rect);
    }

    // Ensure proper spacing
    this.ensureSpacing(element);

    // Add touch-specific attributes
    this.addTouchAttributes(element);
  }

  private enlargeElement(element: HTMLElement, rect: DOMRect): void {
    const widthDiff = Math.max(0, this.options.minSize - rect.width);
    const heightDiff = Math.max(0, this.options.minSize - rect.height);

    if (widthDiff > 0 || heightDiff > 0) {
      element.style.minWidth = `${this.options.minSize}px`;
      element.style.minHeight = `${this.options.minSize}px`;
      
      // Add touch-target class for styling
      element.classList.add('touch-target-enhanced');
    }
  }

  private ensureSpacing(element: HTMLElement): void {
    const siblings = this.getInteractiveSiblings(element);
    
    siblings.forEach((sibling) => {
      const distance = this.getDistance(element, sibling);
      if (distance < this.options.minSpacing) {
        this.addSpacing(element, sibling);
      }
    });
  }

  private getInteractiveSiblings(element: HTMLElement): HTMLElement[] {
    const parent = element.parentElement;
    if (!parent) return [];

    const interactiveSelector = 'button, input, select, textarea, a, [role="button"], [tabindex]:not([tabindex="-1"])';
    const siblings = Array.from(parent.querySelectorAll(interactiveSelector));
    
    return siblings.filter(sibling => sibling !== element) as HTMLElement[];
  }

  private getDistance(el1: HTMLElement, el2: HTMLElement): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    const horizontalDistance = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
    const verticalDistance = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));

    return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
  }

  private addSpacing(el1: HTMLElement, el2: HTMLElement): void {
    // Add margin classes based on layout direction
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    if (rect1.right <= rect2.left) {
      // el1 is to the left of el2
      el2.style.marginLeft = `${this.options.minSpacing}px`;
    } else if (rect1.bottom <= rect2.top) {
      // el1 is above el2
      el2.style.marginTop = `${this.options.minSpacing}px`;
    }
  }

  private addTouchAttributes(element: HTMLElement): void {
    // Add touch-action for better touch handling
    if (!element.style.touchAction) {
      element.style.touchAction = 'manipulation';
    }

    // Add data attribute for touch optimization
    element.dataset.touchOptimized = 'true';
  }
}

// React Hook for Touch Target Enhancement
export const useTouchTargetEnhancement = (
  containerRef: RefObject<HTMLElement>,
  options?: Partial<TouchTargetOptions>
) => {
  useEffect(() => {
    if (containerRef.current) {
      const enhancer = new TouchTargetEnhancer(options);
      enhancer.enhanceContainer(containerRef.current);
    }
  }, [containerRef, options]);
};
```

## Color Contrast and Visual Accessibility

### Dynamic Contrast Checker
```typescript
// src/lib/accessibility/contrast-checker.ts
export class ContrastChecker {
  public static checkContrast(
    foreground: string, 
    background: string
  ): {
    ratio: number;
    aaPass: boolean;
    aaaPass: boolean;
    aaLargePass: boolean;
  } {
    const fgLum = this.getLuminance(foreground);
    const bgLum = this.getLuminance(background);
    
    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    
    return {
      ratio,
      aaPass: ratio >= 4.5,
      aaaPass: ratio >= 7,
      aaLargePass: ratio >= 3,
    };
  }

  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  public static validateMedicalColors(): ValidationResult[] {
    const medicalColorPairs = [
      { name: 'Emergency text on white', fg: '#DC2626', bg: '#FFFFFF' },
      { name: 'Success text on white', fg: '#16A34A', bg: '#FFFFFF' },
      { name: 'Warning text on white', fg: '#D97706', bg: '#FFFFFF' },
      { name: 'Primary button text', fg: '#FFFFFF', bg: '#0066FF' },
      { name: 'Secondary text', fg: '#374151', bg: '#FFFFFF' },
    ];

    return medicalColorPairs.map(pair => ({
      ...pair,
      result: this.checkContrast(pair.fg, pair.bg),
    }));
  }
}

interface ValidationResult {
  name: string;
  fg: string;
  bg: string;
  result: {
    ratio: number;
    aaPass: boolean;
    aaaPass: boolean;
    aaLargePass: boolean;
  };
}
```

### High Contrast Mode Support
```css
/* src/styles/accessibility-high-contrast.css */

/* High contrast mode detection and adaptations */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000FF;
    --color-secondary: #000000;
    --color-emergency: #FF0000;
    --color-success: #008000;
    --color-warning: #FF8C00;
    --color-background: #FFFFFF;
    --color-text: #000000;
    --border-width: 2px;
    --focus-ring-width: 4px;
  }

  /* Enhanced borders for better definition */
  .medical-card,
  .form-field,
  .button,
  .input {
    border-width: var(--border-width);
    border-style: solid;
    border-color: var(--color-text);
  }

  /* Stronger focus indicators */
  *:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Remove subtle styling in high contrast */
  .shadow,
  .gradient,
  .glass-effect {
    box-shadow: none;
    background-image: none;
    backdrop-filter: none;
  }

  /* Ensure medical status indicators are visible */
  .status-emergency { 
    background-color: var(--color-emergency);
    color: var(--color-background);
  }
  
  .status-success { 
    background-color: var(--color-success);
    color: var(--color-background);
  }
  
  .status-warning { 
    background-color: var(--color-warning);
    color: var(--color-background);
  }

  /* Enhanced medical form elements */
  .medical-input:focus,
  .medical-select:focus,
  .medical-textarea:focus {
    border-color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  /* Medical data highlighting */
  .patient-data,
  .medical-record {
    border: 2px solid var(--color-text);
    background-color: var(--color-background);
  }
}

/* Windows High Contrast Mode specific */
@media screen and (-ms-high-contrast: active) {
  .medical-icon {
    filter: invert(1);
  }
  
  .emergency-button {
    background-color: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
  }
}

/* Forced colors mode (newer browsers) */
@media (forced-colors: active) {
  .medical-card {
    border: 1px solid ButtonBorder;
    background-color: ButtonFace;
    color: ButtonText;
  }

  .emergency-alert {
    background-color: Mark;
    color: MarkText;
    border: 2px solid MarkText;
  }

  .success-message {
    background-color: GrayText;
    color: Canvas;
  }
}
```

## Medical-Specific Accessibility Patterns

### Medical Error Handling
```typescript
// src/lib/accessibility/medical-error-handling.ts
interface MedicalError {
  field: string;
  type: 'validation' | 'medical' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  medicalContext?: string;
}

export class MedicalErrorManager {
  private errorSummaryRef: RefObject<HTMLElement>;
  private liveRegion: LiveRegionManager;

  constructor(errorSummaryRef: RefObject<HTMLElement>) {
    this.errorSummaryRef = errorSummaryRef;
    this.liveRegion = new LiveRegionManager();
  }

  public displayErrors(errors: MedicalError[]): void {
    this.createErrorSummary(errors);
    this.announceErrors(errors);
    this.focusErrorSummary();
  }

  private createErrorSummary(errors: MedicalError[]): void {
    if (!this.errorSummaryRef.current) return;

    const summary = this.errorSummaryRef.current;
    summary.innerHTML = '';

    // Create error summary heading
    const heading = document.createElement('h2');
    heading.id = 'error-summary-heading';
    heading.textContent = `${errors.length} erreur(s) trouvée(s)`;
    heading.className = 'text-lg font-semibold text-error-700 mb-4';
    summary.appendChild(heading);

    // Create error list
    const list = document.createElement('ul');
    list.className = 'space-y-2';

    errors.forEach((error, index) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      
      link.href = `#${error.field}`;
      link.className = 'text-error-600 underline hover:text-error-800';
      link.textContent = this.formatErrorMessage(error);
      
      // Add medical context if available
      if (error.medicalContext) {
        const context = document.createElement('span');
        context.className = 'block text-sm text-error-500 mt-1';
        context.textContent = error.medicalContext;
        listItem.appendChild(context);
      }

      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.focusField(error.field);
      });

      listItem.appendChild(link);
      list.appendChild(listItem);
    });

    summary.appendChild(list);

    // Set ARIA attributes
    summary.setAttribute('role', 'alert');
    summary.setAttribute('aria-labelledby', 'error-summary-heading');
    summary.tabIndex = -1;
  }

  private formatErrorMessage(error: MedicalError): string {
    const severityPrefix = {
      critical: '🚨 Critique: ',
      high: '⚠️ Important: ',
      medium: '⚡ Attention: ',
      low: 'ℹ️ Info: ',
    };

    return `${severityPrefix[error.severity]}${error.message}`;
  }

  private announceErrors(errors: MedicalError[]): void {
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const highErrors = errors.filter(e => e.severity === 'high');

    if (criticalErrors.length > 0) {
      this.liveRegion.announceMedical(
        `${criticalErrors.length} erreur(s) critique(s) détectée(s). Veuillez corriger immédiatement.`
      );
    } else if (highErrors.length > 0) {
      this.liveRegion.announce(
        `${errors.length} erreur(s) trouvée(s), dont ${highErrors.length} importante(s).`,
        'alerts'
      );
    } else {
      this.liveRegion.announceStatus(
        `${errors.length} erreur(s) de validation trouvée(s).`
      );
    }
  }

  private focusErrorSummary(): void {
    if (this.errorSummaryRef.current) {
      this.errorSummaryRef.current.focus();
      this.errorSummaryRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  private focusField(fieldId: string): void {
    const field = document.getElementById(fieldId);
    if (field) {
      field.focus();
      field.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
}

// React Hook for Medical Error Management
export const useMedicalErrorManager = () => {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<MedicalErrorManager>();

  useEffect(() => {
    managerRef.current = new MedicalErrorManager(errorSummaryRef);
  }, []);

  const displayErrors = useCallback((errors: MedicalError[]) => {
    managerRef.current?.displayErrors(errors);
  }, []);

  return {
    errorSummaryRef,
    displayErrors,
  };
};
```

### Medical Data Entry Patterns
```typescript
// src/lib/accessibility/medical-data-entry.ts
interface MedicalFieldConfig {
  type: 'text' | 'number' | 'date' | 'select' | 'medical-id';
  required: boolean;
  sensitive: boolean;
  autoComplete?: string;
  pattern?: string;
  validation?: (value: string) => string | null;
  medicalTerminology?: boolean;
}

export class MedicalDataEntryHelper {
  public static createAccessibleField(
    fieldId: string,
    config: MedicalFieldConfig
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'medical-form-field';

    // Create label
    const label = document.createElement('label');
    label.htmlFor = fieldId;
    label.className = 'block text-sm font-medium text-gray-700 mb-2';
    
    if (config.required) {
      label.innerHTML += ' <span class="text-error-500" aria-label="requis">*</span>';
    }

    if (config.sensitive) {
      const securityIcon = document.createElement('span');
      securityIcon.className = 'ml-2 text-blue-500';
      securityIcon.setAttribute('aria-label', 'Données sensibles');
      securityIcon.innerHTML = '🔒';
      label.appendChild(securityIcon);
    }

    // Create input
    const input = this.createInputElement(fieldId, config);
    
    // Create help text container
    const helpContainer = document.createElement('div');
    helpContainer.id = `${fieldId}-help`;
    helpContainer.className = 'mt-1 text-sm text-gray-600';

    if (config.medicalTerminology) {
      helpContainer.innerHTML = 'Utilisez la terminologie médicale standard';
    }

    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.id = `${fieldId}-error`;
    errorContainer.className = 'mt-1 text-sm text-error-600 hidden';
    errorContainer.setAttribute('role', 'alert');

    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(helpContainer);
    container.appendChild(errorContainer);

    return container;
  }

  private static createInputElement(
    fieldId: string,
    config: MedicalFieldConfig
  ): HTMLInputElement {
    const input = document.createElement('input');
    
    input.id = fieldId;
    input.type = config.type === 'medical-id' ? 'text' : config.type;
    input.required = config.required;
    input.className = 'w-full px-4 py-3 min-h-[44px] border-2 border-gray-300 rounded-md focus:outline-none focus:ring-3 focus:ring-primary-500/20 focus:border-primary-500';

    if (config.autoComplete) {
      input.autocomplete = config.autoComplete;
    }

    if (config.pattern) {
      input.pattern = config.pattern;
    }

    if (config.sensitive) {
      input.classList.add('bg-blue-50', 'border-blue-200');
      input.setAttribute('data-sensitive', 'true');
    }

    if (config.medicalTerminology) {
      input.setAttribute('data-medical-terminology', 'true');
      input.setAttribute('spellcheck', 'false');
    }

    // Add ARIA descriptions
    const describedBy = [];
    if (config.required) describedBy.push(`${fieldId}-help`);
    if (describedBy.length > 0) {
      input.setAttribute('aria-describedby', describedBy.join(' '));
    }

    // Add validation
    if (config.validation) {
      input.addEventListener('blur', () => {
        const error = config.validation!(input.value);
        this.displayFieldError(fieldId, error);
      });
    }

    return input;
  }

  private static displayFieldError(fieldId: string, error: string | null): void {
    const errorContainer = document.getElementById(`${fieldId}-error`);
    const input = document.getElementById(fieldId) as HTMLInputElement;

    if (error) {
      if (errorContainer) {
        errorContainer.textContent = error;
        errorContainer.classList.remove('hidden');
      }
      
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${fieldId}-error ${input.getAttribute('aria-describedby') || ''}`);
        input.classList.add('border-error-500');
      }
    } else {
      if (errorContainer) {
        errorContainer.classList.add('hidden');
      }
      
      if (input) {
        input.setAttribute('aria-invalid', 'false');
        input.classList.remove('border-error-500');
      }
    }
  }
}
```

## Accessibility Testing Framework

### Automated Testing
```typescript
// src/lib/accessibility/testing.ts
import { toHaveNoViolations, axe } from 'jest-axe';

expect.extend(toHaveNoViolations);

export class AccessibilityTester {
  public static async testComponent(component: HTMLElement): Promise<void> {
    const results = await axe(component, {
      rules: {
        // Medical-specific accessibility rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'touch-targets': { enabled: true },
        'medical-terminology': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  }

  public static async testMedicalForm(form: HTMLFormElement): Promise<void> {
    // Test form structure
    const formElements = form.querySelectorAll('input, select, textarea');
    
    formElements.forEach((element) => {
      const label = form.querySelector(`label[for="${element.id}"]`);
      expect(label).toBeTruthy();
      
      if (element.hasAttribute('required')) {
        expect(label?.textContent).toMatch(/\*/);
      }
    });

    // Test error handling
    const errorContainers = form.querySelectorAll('[role="alert"]');
    errorContainers.forEach((container) => {
      expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    // Test keyboard navigation
    await this.testKeyboardNavigation(form);
  }

  private static async testKeyboardNavigation(container: HTMLElement): Promise<void> {
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    // Test tab order
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement;
      element.focus();
      
      expect(document.activeElement).toBe(element);
      
      // Test that focus is visible
      const computedStyle = getComputedStyle(element, ':focus-visible');
      expect(computedStyle.outline).not.toBe('none');
    }
  }

  public static testTouchTargets(container: HTMLElement): void {
    const interactiveElements = container.querySelectorAll(
      'button, input, select, textarea, a, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    interactiveElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      
      // WCAG AAA requirements
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  }
}

// Test utilities for medical components
export const medicalAccessibilityTests = {
  async testPatientForm(form: HTMLFormElement) {
    await AccessibilityTester.testMedicalForm(form);
    
    // Test medical-specific requirements
    const patientIdField = form.querySelector('[data-medical-id]');
    if (patientIdField) {
      expect(patientIdField).toHaveAttribute('autocomplete', 'off');
      expect(patientIdField).toHaveAttribute('spellcheck', 'false');
    }

    const sensitiveFields = form.querySelectorAll('[data-sensitive]');
    sensitiveFields.forEach((field) => {
      expect(field).toHaveClass('bg-blue-50');
      expect(field.parentElement).toContainHTML('🔒');
    });
  },

  async testEmergencyInterface(container: HTMLElement) {
    const emergencyButtons = container.querySelectorAll('[data-emergency]');
    
    emergencyButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-describedby');
      expect(button.textContent).toMatch(/urgence|emergency/i);
      
      // Emergency buttons should be prominent
      const rect = button.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(60);
    });

    // Test emergency announcements
    const alerts = container.querySelectorAll('[role="alert"]');
    const emergencyAlerts = Array.from(alerts).filter(alert => 
      alert.textContent?.includes('urgence') || alert.textContent?.includes('emergency')
    );

    emergencyAlerts.forEach((alert) => {
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  },
};
```

## Implementation Checklist

### WCAG 2.2 AA Compliance Checklist

#### Perceivable
- [ ] All images have descriptive alt text
- [ ] Color contrast ratios meet 4.5:1 for normal text, 3:1 for large text
- [ ] Content is structured with proper headings (h1-h6)
- [ ] Form labels are programmatically associated with inputs
- [ ] Error messages are clearly identified
- [ ] Audio/video content has captions and transcripts

#### Operable
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Skip links are provided for navigation
- [ ] Time limits are adjustable or removable
- [ ] Touch targets are at least 44px × 44px
- [ ] Motion can be disabled by user preference

#### Understandable
- [ ] Language is specified in HTML
- [ ] Instructions are clear and available before form submission
- [ ] Error messages provide suggestions for correction
- [ ] Help text is available for complex inputs
- [ ] Navigation is consistent across pages

#### Robust
- [ ] Markup is valid and semantic
- [ ] Components work with assistive technologies
- [ ] Content is compatible with current and future assistive technologies
- [ ] ARIA attributes are used correctly and appropriately

### Medical-Specific Accessibility Requirements
- [ ] Medical terminology is explained or defined
- [ ] Emergency interfaces are highly visible and accessible
- [ ] Patient data is clearly marked as sensitive
- [ ] Multi-step forms provide progress indicators
- [ ] Consent forms are clearly structured and navigable
- [ ] Medical status indicators use multiple cues (not just color)

### Testing Requirements
- [ ] Automated accessibility testing with axe-core
- [ ] Manual keyboard navigation testing
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Touch device testing on mobile/tablet
- [ ] High contrast mode testing
- [ ] Reduced motion preference testing

---

**Accessibility Patterns Version**: 1.0  
**Last Updated**: 2025-08-15  
**Compliance**: WCAG 2.2 AA, Section 508, Medical Device Accessibility  
**Testing Framework**: Jest, jest-axe, Testing Library