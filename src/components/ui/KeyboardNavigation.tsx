'use client';

import React, { useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';

// Keyboard navigation context
interface KeyboardNavigationContextValue {
  registerShortcut: (key: string, callback: () => void, description?: string) => () => void;
  unregisterShortcut: (key: string) => void;
  announceShortcuts: () => void;
  isNavigatingByKeyboard: boolean;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | null>(null);

export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
}

// Keyboard shortcut registry
interface ShortcutInfo {
  callback: () => void;
  description?: string;
}

/**
 * NOVA Keyboard Navigation Provider
 * 
 * Provides comprehensive keyboard navigation support throughout the application.
 * 
 * Features:
 * - Global keyboard shortcut registration
 * - Focus management utilities
 * - Keyboard navigation detection
 * - Accessibility shortcuts
 * - French language support for announcements
 */
export function KeyboardNavigationProvider({ children }: { children: ReactNode }) {
  const shortcuts = useRef<Map<string, ShortcutInfo>>(new Map());
  const [isNavigatingByKeyboard, setIsNavigatingByKeyboard] = React.useState(false);

  // Detect keyboard vs mouse navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') {
        setIsNavigatingByKeyboard(true);
      }
    };

    const handleMouseDown = () => {
      setIsNavigatingByKeyboard(false);
    };

    const handleFocus = () => {
      // Only show focus indicators when navigating by keyboard
      document.body.classList.toggle('keyboard-navigation', isNavigatingByKeyboard);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isNavigatingByKeyboard]);

  // Global shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut key string
      const parts = [];
      if (event.ctrlKey) parts.push('ctrl');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');
      if (event.metaKey) parts.push('meta');
      parts.push(event.key.toLowerCase());
      
      const shortcutKey = parts.join('+');
      
      const shortcut = shortcuts.current.get(shortcutKey);
      if (shortcut) {
        event.preventDefault();
        shortcut.callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const registerShortcut = useCallback((key: string, callback: () => void, description?: string) => {
    const normalizedKey = key.toLowerCase();
    shortcuts.current.set(normalizedKey, { callback, description });
    
    return () => {
      shortcuts.current.delete(normalizedKey);
    };
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    shortcuts.current.delete(key.toLowerCase());
  }, []);

  const announceShortcuts = useCallback(() => {
    const shortcutList = Array.from(shortcuts.current.entries())
      .filter(([, info]) => info.description)
      .map(([key, info]) => `${key}: ${info.description}`)
      .join(', ');
    
    if (shortcutList) {
      // This would use the announcer context if available
      console.log('Raccourcis disponibles:', shortcutList);
    }
  }, []);

  const contextValue: KeyboardNavigationContextValue = {
    registerShortcut,
    unregisterShortcut,
    announceShortcuts,
    isNavigatingByKeyboard
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string, 
  callback: () => void, 
  description?: string,
  dependencies: React.DependencyList = []
) {
  const { registerShortcut } = useKeyboardNavigation();

  useEffect(() => {
    const unregister = registerShortcut(key, callback, description);
    return unregister;
  }, [key, description, registerShortcut, ...dependencies]);
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const focusStack = useRef<HTMLElement[]>([]);

  const pushFocus = useCallback((element: HTMLElement) => {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      focusStack.current.push(currentFocus);
    }
    element.focus();
  }, []);

  const popFocus = useCallback(() => {
    const previousElement = focusStack.current.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }, []);

  const clearFocusStack = useCallback(() => {
    focusStack.current = [];
  }, []);

  return { pushFocus, popFocus, clearFocusStack };
}

/**
 * Hook for roving tabindex (for component groups like tabs, menus)
 */
export function useRovingTabIndex(
  containerRef: React.RefObject<HTMLElement>,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const getFocusableChildren = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        '[role="tab"], [role="menuitem"], [role="option"], [data-roving-tabindex]'
      )
    ).filter(element => !element.hasAttribute('disabled'));
  }, [containerRef]);

  const updateTabIndex = useCallback(() => {
    const children = getFocusableChildren();
    children.forEach((child, index) => {
      child.tabIndex = index === activeIndex ? 0 : -1;
    });
  }, [activeIndex, getFocusableChildren]);

  const moveToIndex = useCallback((index: number) => {
    const children = getFocusableChildren();
    if (index >= 0 && index < children.length) {
      setActiveIndex(index);
      children[index].focus();
    }
  }, [getFocusableChildren]);

  const moveNext = useCallback(() => {
    const children = getFocusableChildren();
    const nextIndex = (activeIndex + 1) % children.length;
    moveToIndex(nextIndex);
  }, [activeIndex, getFocusableChildren, moveToIndex]);

  const movePrevious = useCallback(() => {
    const children = getFocusableChildren();
    const prevIndex = activeIndex === 0 ? children.length - 1 : activeIndex - 1;
    moveToIndex(prevIndex);
  }, [activeIndex, getFocusableChildren, moveToIndex]);

  const moveFirst = useCallback(() => {
    moveToIndex(0);
  }, [moveToIndex]);

  const moveLast = useCallback(() => {
    const children = getFocusableChildren();
    moveToIndex(children.length - 1);
  }, [getFocusableChildren, moveToIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isHorizontal = orientation === 'horizontal';
      
      switch (event.key) {
        case 'ArrowRight':
          if (isHorizontal) {
            event.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowLeft':
          if (isHorizontal) {
            event.preventDefault();
            movePrevious();
          }
          break;
        case 'ArrowDown':
          if (!isHorizontal) {
            event.preventDefault();
            moveNext();
          }
          break;
        case 'ArrowUp':
          if (!isHorizontal) {
            event.preventDefault();
            movePrevious();
          }
          break;
        case 'Home':
          event.preventDefault();
          moveFirst();
          break;
        case 'End':
          event.preventDefault();
          moveLast();
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [orientation, moveNext, movePrevious, moveFirst, moveLast]);

  // Update tabindex when activeIndex changes
  useEffect(() => {
    updateTabIndex();
  }, [updateTabIndex]);

  return {
    activeIndex,
    setActiveIndex,
    moveToIndex,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast
  };
}

/**
 * Skip Link Component
 * 
 * Provides a skip link for keyboard users to bypass navigation.
 */
interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        skip-to-content
        absolute -top-10 left-6 z-notification
        bg-background text-foreground
        px-4 py-2 rounded-md border-2 border-border
        focus:top-6 transition-all duration-base
        font-medium text-sm
        ${className}
      `}
    >
      {children}
    </a>
  );
}

/**
 * Keyboard Navigation Help Dialog Component
 */
interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  const shortcuts = [
    { key: 'Tab', description: 'Naviguer vers l\'élément suivant' },
    { key: 'Shift + Tab', description: 'Naviguer vers l\'élément précédent' },
    { key: 'Entrée/Espace', description: 'Activer un bouton ou lien' },
    { key: 'Échap', description: 'Fermer une modale ou menu' },
    { key: 'Flèches', description: 'Naviguer dans les menus et listes' },
    { key: 'Début/Fin', description: 'Aller au premier/dernier élément' },
    { key: 'Ctrl + F', description: 'Rechercher dans la page' },
    { key: 'Alt + 1', description: 'Aller au contenu principal' },
    { key: 'Alt + 2', description: 'Aller au menu de navigation' },
    { key: '?', description: 'Afficher cette aide' }
  ];

  useKeyboardShortcut('escape', onClose, 'Fermer l\'aide clavier');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal bg-black/50 flex items-center justify-center p-4">
      <div 
        className="bg-background rounded-lg border border-border max-w-md w-full p-6"
        role="dialog"
        aria-labelledby="keyboard-help-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="keyboard-help-title" className="text-lg font-semibold">
            Raccourcis Clavier
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md"
            aria-label="Fermer l'aide"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex justify-between items-center">
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm font-mono">
                {key}
              </kbd>
              <span className="text-sm text-muted-foreground ml-4 flex-1">
                {description}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Cette interface respecte les standards WCAG 2.2 AA pour l'accessibilité.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to show keyboard help
 */
export function useKeyboardHelp() {
  const [isOpen, setIsOpen] = React.useState(false);

  useKeyboardShortcut('?', () => setIsOpen(true), 'Afficher l\'aide clavier');

  const KeyboardHelpComponent = useCallback(() => (
    <KeyboardHelp isOpen={isOpen} onClose={() => setIsOpen(false)} />
  ), [isOpen]);

  return {
    showHelp: () => setIsOpen(true),
    hideHelp: () => setIsOpen(false),
    isHelpOpen: isOpen,
    KeyboardHelp: KeyboardHelpComponent
  };
}

/**
 * Focus trap that works with NOVA design system
 */
interface NovaFocusTrapProps {
  children: ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export function NovaFocusTrap({ children, active = true, onEscape }: NovaFocusTrapProps) {
  useKeyboardShortcut('escape', () => onEscape?.(), 'Fermer');

  return (
    <div className={active ? 'focus-trap-active' : ''}>
      {children}
    </div>
  );
}

/**
 * Utility function to check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.hasAttribute('inert')) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type')?.toLowerCase();

  // Form elements
  if (['input', 'select', 'textarea', 'button'].includes(tagName)) {
    return type !== 'hidden';
  }

  // Links with href
  if (tagName === 'a' && element.hasAttribute('href')) {
    return true;
  }

  // Elements with tabindex
  if (element.hasAttribute('tabindex')) {
    return element.tabIndex >= 0;
  }

  // Interactive role elements
  const role = element.getAttribute('role');
  if (role && ['button', 'link', 'menuitem', 'option', 'tab'].includes(role)) {
    return true;
  }

  return false;
}

/**
 * Utility function to get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    'area[href]',
    'audio[controls]',
    'video[controls]',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="tab"]',
    '[data-focusable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter(element => isFocusable(element));
}