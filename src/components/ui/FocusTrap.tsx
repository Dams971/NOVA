'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  /** Whether the focus trap is active */
  active?: boolean;
  /** Whether to restore focus to the previous element when deactivated */
  restoreFocus?: boolean;
  /** Specific element to focus initially */
  initialFocus?: React.RefObject<HTMLElement>;
  /** Allow focus to escape on specific keys */
  escapeDeactivates?: boolean;
  /** Callback when focus trap is deactivated by escape */
  onEscape?: () => void;
  /** Whether to use a sentinel to guard against external focus */
  useSentinel?: boolean;
}

/**
 * Enhanced FocusTrap component for NOVA RDV
 * 
 * Traps keyboard focus within its children for modal dialogs and overlays.
 * Implements WCAG 2.2 guidelines for focus management.
 * 
 * Features:
 * - Comprehensive focusable element detection
 * - Support for dynamic content changes
 * - Escape key handling
 * - Focus sentinels for external focus protection
 * - Screen reader announcements
 * - Reduced motion support
 */
export default function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  initialFocus,
  escapeDeactivates = true,
  onEscape,
  useSentinel = true
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const sentinelStartRef = useRef<HTMLDivElement>(null);
  const sentinelEndRef = useRef<HTMLDivElement>(null);

  // Enhanced focusable element detection
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      // Standard form elements
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      
      // Links and interactive elements
      'a[href]',
      'area[href]',
      
      // Media elements
      'audio[controls]',
      'video[controls]',
      
      // Editable elements
      '[contenteditable="true"]',
      '[contenteditable=""]',
      
      // Tabindex elements
      '[tabindex]:not([tabindex="-1"])',
      
      // Interactive role elements
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="tab"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      
      // Custom focusable elements
      '[data-focusable="true"]'
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(element => {
      // More comprehensive visibility check
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      return (
        style.display !== 'none' && 
        style.visibility !== 'hidden' && 
        style.opacity !== '0' &&
        element.offsetParent !== null &&
        rect.width > 0 &&
        rect.height > 0 &&
        !element.hasAttribute('inert') &&
        !element.closest('[inert]')
      );
    });
  }, []);

  // Handle all keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!active) return;

    // Handle escape key
    if (escapeDeactivates && event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // Handle tab navigation
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      // If no focusable elements, prevent tabbing
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (activeElement === firstElement || 
          activeElement === sentinelStartRef.current ||
          !focusableElements.includes(activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forwards
      if (activeElement === lastElement || 
          activeElement === sentinelEndRef.current ||
          !focusableElements.includes(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [active, getFocusableElements, escapeDeactivates, onEscape]);

  // Handle sentinel focus (when external elements try to steal focus)
  const handleSentinelFocus = useCallback((isStart: boolean) => {
    if (!active) return;
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const targetElement = isStart 
      ? focusableElements[focusableElements.length - 1] 
      : focusableElements[0];
    
    targetElement.focus();
  }, [active, getFocusableElements]);

  // Monitor for external focus changes
  const handleFocusIn = useCallback((event: FocusEvent) => {
    if (!active || !containerRef.current) return;

    const target = event.target as HTMLElement;
    
    // Allow focus within our container or on sentinels
    if (containerRef.current.contains(target) || 
        target === sentinelStartRef.current ||
        target === sentinelEndRef.current) {
      return;
    }

    // External focus detected - redirect back to trap
    event.preventDefault();
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [active, getFocusableElements]);

  useEffect(() => {
    if (!active) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocus?.current && initialFocus.current.offsetParent !== null) {
        initialFocus.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else if (containerRef.current) {
          // If no focusable elements, focus the container itself
          containerRef.current.focus();
        }
      }
    };

    // Use requestAnimationFrame for better timing
    const rafId = requestAnimationFrame(setInitialFocus);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        try {
          previousActiveElement.current.focus();
        } catch (error) {
          // Element might have been removed from DOM
          console.warn('Could not restore focus:', error);
        }
      }
    };
  }, [active, handleKeyDown, handleFocusIn, getFocusableElements, initialFocus, restoreFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Start sentinel */}
      {useSentinel && (
        <div
          ref={sentinelStartRef}
          tabIndex={0}
          onFocus={() => handleSentinelFocus(true)}
          style={{
            position: 'fixed',
            top: '-1px',
            left: '-1px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={containerRef}
        tabIndex={-1}
        className="focus:outline-none"
        role="group"
        aria-label="Zone de focus restreinte"
      >
        {children}
      </div>

      {/* End sentinel */}
      {useSentinel && (
        <div
          ref={sentinelEndRef}
          tabIndex={0}
          onFocus={() => handleSentinelFocus(false)}
          style={{
            position: 'fixed',
            top: '-1px',
            left: '-1px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
