/**
 * Touch Target Validation Utilities
 * WCAG 2.5.8 Target Size (Minimum) compliance
 */

// WCAG 2.5.8 and platform guidelines
export const TOUCH_TARGET_SIZE = {
  minimum: 24, // WCAG 2.5.8 minimum (24x24 CSS pixels)
  recommended: 44, // iOS HIG recommendation
  android: 48, // Material Design recommendation
  spacing: 24, // Minimum spacing between targets
} as const;

export interface TouchTargetValidation {
  valid: boolean;
  size: { width: number; height: number };
  spacing?: { horizontal: number; vertical: number };
  issues: string[];
  recommendations: string[];
}

/**
 * Validate touch target size and spacing
 */
export function validateTouchTarget(element: HTMLElement): TouchTargetValidation {
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check minimum size requirements
  const meetsMinimumSize = width >= TOUCH_TARGET_SIZE.minimum && height >= TOUCH_TARGET_SIZE.minimum;
  
  if (!meetsMinimumSize) {
    // Check for adequate spacing if size is below minimum
    const hasAdequateSpacing = checkSpacing(element);
    
    if (!hasAdequateSpacing.adequate) {
      issues.push(`Target size ${width.toFixed(1)}×${height.toFixed(1)}px is below 24×24px minimum without adequate spacing`);
      recommendations.push('Increase target size or add 24px spacing between targets');
    }
  }
  
  // Check recommended sizes for better UX
  if (width < TOUCH_TARGET_SIZE.recommended || height < TOUCH_TARGET_SIZE.recommended) {
    recommendations.push(`Consider increasing to ${TOUCH_TARGET_SIZE.recommended}×${TOUCH_TARGET_SIZE.recommended}px for better mobile UX`);
  }
  
  // Check if element is interactive
  const isInteractive = isInteractiveElement(element);
  if (!isInteractive) {
    issues.push('Element appears to be interactive but lacks proper semantic markup');
    recommendations.push('Add appropriate ARIA attributes or use semantic HTML elements');
  }
  
  return {
    valid: issues.length === 0,
    size: { width, height },
    spacing: checkSpacing(element),
    issues,
    recommendations
  };
}

/**
 * Check spacing between adjacent interactive elements
 */
function checkSpacing(element: HTMLElement): { adequate: boolean; horizontal: number; vertical: number } {
  const rect = element.getBoundingClientRect();
  const siblings = element.parentElement?.children;
  
  if (!siblings) {
    return { adequate: true, horizontal: Infinity, vertical: Infinity };
  }
  
  let minHorizontalGap = Infinity;
  let minVerticalGap = Infinity;
  
  for (const sibling of siblings) {
    if (sibling === element || !(sibling instanceof HTMLElement)) continue;
    if (!isInteractiveElement(sibling)) continue;
    
    const siblingRect = sibling.getBoundingClientRect();
    
    // Calculate gaps
    const horizontalGap = Math.min(
      Math.abs(rect.left - siblingRect.right),
      Math.abs(rect.right - siblingRect.left)
    );
    
    const verticalGap = Math.min(
      Math.abs(rect.top - siblingRect.bottom),
      Math.abs(rect.bottom - siblingRect.top)
    );
    
    // Only consider if elements are actually adjacent
    const isHorizontallyAdjacent = (
      (rect.top < siblingRect.bottom && rect.bottom > siblingRect.top) &&
      (horizontalGap < 100) // Reasonable threshold for adjacency
    );
    
    const isVerticallyAdjacent = (
      (rect.left < siblingRect.right && rect.right > siblingRect.left) &&
      (verticalGap < 100) // Reasonable threshold for adjacency
    );
    
    if (isHorizontallyAdjacent) {
      minHorizontalGap = Math.min(minHorizontalGap, horizontalGap);
    }
    
    if (isVerticallyAdjacent) {
      minVerticalGap = Math.min(minVerticalGap, verticalGap);
    }
  }
  
  const adequateHorizontal = minHorizontalGap >= TOUCH_TARGET_SIZE.spacing || minHorizontalGap === Infinity;
  const adequateVertical = minVerticalGap >= TOUCH_TARGET_SIZE.spacing || minVerticalGap === Infinity;
  
  return {
    adequate: adequateHorizontal && adequateVertical,
    horizontal: minHorizontalGap === Infinity ? 0 : minHorizontalGap,
    vertical: minVerticalGap === Infinity ? 0 : minVerticalGap
  };
}

/**
 * Check if element is interactive
 */
function isInteractiveElement(element: HTMLElement): boolean {
  const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
  const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'tab'];
  
  // Check tag name
  if (interactiveTags.includes(element.tagName.toLowerCase())) {
    return true;
  }
  
  // Check ARIA role
  const role = element.getAttribute('role');
  if (role && interactiveRoles.includes(role)) {
    return true;
  }
  
  // Check for click handlers (less reliable but useful)
  const hasClickHandler = element.onclick !== null || 
                         element.getAttribute('onclick') !== null ||
                         element.style.cursor === 'pointer';
  
  return hasClickHandler;
}

/**
 * Validate all touch targets on the page
 */
export function validatePageTouchTargets(): {
  totalElements: number;
  validElements: number;
  issues: Array<{ element: HTMLElement; validation: TouchTargetValidation }>;
} {
  const interactiveElements = document.querySelectorAll(`
    button, 
    a, 
    input:not([type="hidden"]), 
    select, 
    textarea,
    [role="button"],
    [role="link"],
    [role="menuitem"],
    [onclick],
    [style*="cursor: pointer"]
  `) as NodeListOf<HTMLElement>;
  
  const issues: Array<{ element: HTMLElement; validation: TouchTargetValidation }> = [];
  let validElements = 0;
  
  interactiveElements.forEach(element => {
    const validation = validateTouchTarget(element);
    
    if (validation.valid) {
      validElements++;
    } else {
      issues.push({ element, validation });
    }
  });
  
  return {
    totalElements: interactiveElements.length,
    validElements,
    issues
  };
}

/**
 * Get appropriate touch target classes for Tailwind
 */
export function getTouchTargetClasses(size: 'minimum' | 'recommended' | 'android' = 'recommended'): string {
  const sizeValue = TOUCH_TARGET_SIZE[size];
  
  return `min-w-[${sizeValue}px] min-h-[${sizeValue}px] inline-flex items-center justify-center`;
}

/**
 * Generate spacing classes for touch targets
 */
export function getTouchSpacingClasses(direction: 'horizontal' | 'vertical' | 'both' = 'both'): string {
  const spacing = TOUCH_TARGET_SIZE.spacing;
  
  switch (direction) {
    case 'horizontal':
      return `space-x-[${spacing}px]`;
    case 'vertical':
      return `space-y-[${spacing}px]`;
    case 'both':
      return `gap-[${spacing}px]`;
    default:
      return '';
  }
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy IE support
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get device-appropriate target size
 */
export function getDeviceTargetSize(): number {
  if (typeof window === 'undefined') return TOUCH_TARGET_SIZE.recommended;
  
  const userAgent = navigator.userAgent;
  
  // iOS devices prefer 44px
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return TOUCH_TARGET_SIZE.recommended;
  }
  
  // Android devices prefer 48px
  if (/Android/.test(userAgent)) {
    return TOUCH_TARGET_SIZE.android;
  }
  
  // Desktop/other devices can use smaller targets
  if (!isTouchDevice()) {
    return TOUCH_TARGET_SIZE.minimum;
  }
  
  return TOUCH_TARGET_SIZE.recommended;
}

/**
 * CSS custom properties for dynamic sizing
 */
export function generateTouchTargetCSS(): string {
  const deviceSize = getDeviceTargetSize();
  
  return `
    :root {
      --touch-target-size: ${deviceSize}px;
      --touch-target-spacing: ${TOUCH_TARGET_SIZE.spacing}px;
    }
    
    .touch-target {
      min-width: var(--touch-target-size);
      min-height: var(--touch-target-size);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .touch-spacing > * + * {
      margin-left: var(--touch-target-spacing);
    }
    
    .touch-spacing-vertical > * + * {
      margin-top: var(--touch-target-spacing);
    }
    
    @media (pointer: fine) {
      :root {
        --touch-target-size: ${TOUCH_TARGET_SIZE.minimum}px;
      }
    }
  `;
}

/**
 * Debug helper to visually highlight touch target issues
 */
export function debugTouchTargets(): void {
  if (typeof window === 'undefined') return;
  
  const validation = validatePageTouchTargets();
  
  console.group('🎯 Touch Target Validation');
  console.warn(`Total elements: ${validation.totalElements}`);
  console.warn(`Valid elements: ${validation.validElements}`);
  console.warn(`Issues found: ${validation.issues.length}`);
  
  validation.issues.forEach(({ element, validation }, index) => {
    console.group(`Issue ${index + 1}`);
    console.warn('Element:', element);
    console.warn('Size:', validation.size);
    console.warn('Issues:', validation.issues);
    console.warn('Recommendations:', validation.recommendations);
    console.groupEnd();
    
    // Add visual indicator
    element.style.outline = '2px solid red';
    element.style.outlineOffset = '2px';
    element.title = `Touch target issue: ${validation.issues.join(', ')}`;
  });
  
  console.groupEnd();
}

// Export utilities object
export default {
  TOUCH_TARGET_SIZE,
  validateTouchTarget,
  validatePageTouchTargets,
  getTouchTargetClasses,
  getTouchSpacingClasses,
  isTouchDevice,
  getDeviceTargetSize,
  generateTouchTargetCSS,
  debugTouchTargets
};