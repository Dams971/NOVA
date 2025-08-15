'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAccessibleModalOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  restoreFocus?: boolean;
  preventScroll?: boolean;
}

/**
 * Custom hook for managing accessible modal behavior.
 * Handles focus management, keyboard navigation, and ARIA attributes.
 */
export function useAccessibleModal({
  isOpen,
  onClose,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  restoreFocus = true,
  preventScroll = true
}: UseAccessibleModalOptions) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Get focusable elements within the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(element => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             element.offsetParent !== null;
    });
  }, []);

  // Handle tab key for focus trapping
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forwards
      if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  // Combined keyboard event handler
  const handleKeyboardEvents = useCallback((event: KeyboardEvent) => {
    handleKeyDown(event);
    handleTabKey(event);
  }, [handleKeyDown, handleTabKey]);

  // Effect for managing modal state
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll if requested
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }

      // Set initial focus to the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Add keyboard event listeners
      document.addEventListener('keydown', handleKeyboardEvents);

      // Set aria-hidden on other elements
      const rootElements = document.querySelectorAll('body > *:not([aria-hidden])');
      rootElements.forEach(element => {
        if (element !== modalRef.current?.closest('[data-modal-root]')) {
          element.setAttribute('aria-hidden', 'true');
          element.setAttribute('data-modal-hidden', 'true');
        }
      });

    } else {
      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = '';
      }

      // Remove keyboard event listeners
      document.removeEventListener('keydown', handleKeyboardEvents);

      // Restore aria-hidden attributes
      const hiddenElements = document.querySelectorAll('[data-modal-hidden]');
      hiddenElements.forEach(element => {
        element.removeAttribute('aria-hidden');
        element.removeAttribute('data-modal-hidden');
      });

      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      // Cleanup function
      document.removeEventListener('keydown', handleKeyboardEvents);
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      
      // Restore aria-hidden attributes
      const hiddenElements = document.querySelectorAll('[data-modal-hidden]');
      hiddenElements.forEach(element => {
        element.removeAttribute('aria-hidden');
        element.removeAttribute('data-modal-hidden');
      });
    };
  }, [isOpen, handleKeyboardEvents, restoreFocus, preventScroll]);

  // Generate unique IDs for ARIA attributes
  const modalId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descriptionId = useRef(`modal-description-${Math.random().toString(36).substr(2, 9)}`);

  return {
    modalRef,
    overlayRef,
    handleOverlayClick,
    modalProps: {
      id: modalId.current,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': titleId.current,
      'aria-describedby': descriptionId.current,
      tabIndex: -1,
      ref: modalRef
    },
    overlayProps: {
      ref: overlayRef,
      onClick: handleOverlayClick,
      'data-modal-root': true
    },
    titleProps: {
      id: titleId.current
    },
    descriptionProps: {
      id: descriptionId.current
    }
  };
}
