'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

// ==================== KEYBOARD SHORTCUT TYPES ====================

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: string
  global?: boolean
  disabled?: boolean
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  disabled?: boolean
  showHelpKey?: string
  children?: React.ReactNode
}

// ==================== KEYBOARD SHORTCUTS MANAGER ====================

export function KeyboardShortcuts({
  shortcuts,
  disabled = false,
  showHelpKey = 'F1',
  children
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    // Handle help key
    if (event.key === showHelpKey) {
      event.preventDefault()
      setShowHelp(prev => !prev)
      return
    }

    // Handle shortcuts
    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey
      const altMatches = !!event.altKey === !!shortcut.altKey
      const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey
      const metaMatches = !!event.metaKey === !!shortcut.metaKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [disabled, shortcuts, showHelpKey])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      {children}
      {showHelp && (
        <KeyboardShortcutsHelp
          shortcuts={shortcuts}
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  )
}

// ==================== KEYBOARD SHORTCUTS HELP MODAL ====================

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  onClose: () => void
}

function KeyboardShortcutsHelp({ shortcuts, onClose }: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'Général'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(shortcut)
    return groups
  }, {} as Record<string, KeyboardShortcut[]>)

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.metaKey) parts.push('Cmd')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-modal bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="medical-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="shortcuts-title" className="text-xl font-semibold text-foreground">
            Raccourcis clavier
          </h2>
          <button
            onClick={onClose}
            className="medical-touch-target bg-muted hover:bg-muted/80 rounded-medical-small"
            aria-label="Fermer l'aide"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="font-medium text-foreground mb-3 pb-2 border-b border-border">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-muted text-foreground rounded text-sm font-mono">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Appuyez sur <kbd className="px-1 bg-muted rounded">F1</kbd> pour afficher/masquer cette aide
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== MEDICAL KEYBOARD SHORTCUTS ====================

export function useMedicalKeyboardShortcuts() {
  const [shortcuts] = useState<KeyboardShortcut[]>([
    // Navigation shortcuts
    {
      key: 'h',
      altKey: true,
      action: () => window.location.href = '/',
      description: 'Aller à l\'accueil',
      category: 'Navigation'
    },
    {
      key: 'p',
      altKey: true,
      action: () => window.location.href = '/patients',
      description: 'Aller aux patients',
      category: 'Navigation'
    },
    {
      key: 'r',
      altKey: true,
      action: () => window.location.href = '/rdv',
      description: 'Prendre rendez-vous',
      category: 'Navigation'
    },
    {
      key: 'u',
      altKey: true,
      action: () => window.location.href = '/urgences',
      description: 'Accès urgences',
      category: 'Navigation'
    },

    // Search shortcuts
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="cherch"]') as HTMLInputElement
        searchInput?.focus()
      },
      description: 'Rechercher',
      category: 'Recherche'
    },

    // Form shortcuts
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        const form = document.querySelector('form')
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
          submitButton?.click()
        }
      },
      description: 'Enregistrer/Soumettre',
      category: 'Formulaire'
    },
    {
      key: 'Escape',
      action: () => {
        const cancelButton = document.querySelector('[data-cancel], [aria-label*="nul"], [aria-label*="ferm"]') as HTMLButtonElement
        cancelButton?.click()
      },
      description: 'Annuler/Fermer',
      category: 'Formulaire'
    },

    // Emergency shortcuts
    {
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        const emergencyButton = document.querySelector('[data-emergency], [aria-label*="urgence"]') as HTMLButtonElement
        emergencyButton?.click()
      },
      description: 'Accès urgence rapide',
      category: 'Urgence'
    },

    // Accessibility shortcuts
    {
      key: 'F1',
      action: () => {}, // Handled by KeyboardShortcuts component
      description: 'Afficher cette aide',
      category: 'Accessibilité'
    },
    {
      key: 'F6',
      action: () => {
        const mainContent = document.querySelector('#main-content, main, [role="main"]') as HTMLElement
        mainContent?.focus()
      },
      description: 'Aller au contenu principal',
      category: 'Accessibilité'
    }
  ])

  return shortcuts
}

// ==================== KEYBOARD NAVIGATION COMPONENT ====================

interface KeyboardNavigationProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical' | 'grid'
  loop?: boolean
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', currentIndex: number) => void
  className?: string
}

export function KeyboardNavigation({
  children,
  direction = 'vertical',
  loop = false,
  onNavigate,
  className
}: KeyboardNavigationProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="tab"]'
    ].join(', ')
    
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    let newIndex = currentIndex
    let handled = false

    switch (event.key) {
      case 'ArrowUp':
        if (direction === 'vertical' || direction === 'grid') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : loop ? elements.length - 1 : currentIndex
          handled = true
          onNavigate?.('up', newIndex)
        }
        break
      case 'ArrowDown':
        if (direction === 'vertical' || direction === 'grid') {
          newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex
          handled = true
          onNavigate?.('down', newIndex)
        }
        break
      case 'ArrowLeft':
        if (direction === 'horizontal' || direction === 'grid') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : loop ? elements.length - 1 : currentIndex
          handled = true
          onNavigate?.('left', newIndex)
        }
        break
      case 'ArrowRight':
        if (direction === 'horizontal' || direction === 'grid') {
          newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : loop ? 0 : currentIndex
          handled = true
          onNavigate?.('right', newIndex)
        }
        break
      case 'Home':
        newIndex = 0
        handled = true
        break
      case 'End':
        newIndex = elements.length - 1
        handled = true
        break
    }

    if (handled) {
      event.preventDefault()
      setCurrentIndex(newIndex)
      elements[newIndex]?.focus()
    }
  }, [currentIndex, direction, loop, getFocusableElements, onNavigate])

  return (
    <div
      ref={containerRef}
      className={cn('focus:outline-none', className)}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Zone de navigation clavier"
    >
      {children}
    </div>
  )
}

// ==================== MEDICAL KEYBOARD SHORTCUTS PROVIDER ====================

interface MedicalKeyboardShortcutsProviderProps {
  children: React.ReactNode
  disabled?: boolean
  customShortcuts?: KeyboardShortcut[]
}

export function MedicalKeyboardShortcutsProvider({
  children,
  disabled = false,
  customShortcuts = []
}: MedicalKeyboardShortcutsProviderProps) {
  const defaultShortcuts = useMedicalKeyboardShortcuts()
  const allShortcuts = [...defaultShortcuts, ...customShortcuts]

  return (
    <KeyboardShortcuts shortcuts={allShortcuts} disabled={disabled}>
      {children}
    </KeyboardShortcuts>
  )
}