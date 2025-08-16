'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// ==================== ARIA LIVE REGION COMPONENT ====================

interface AriaLiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  busy?: boolean
  delay?: number
  className?: string
}

export function AriaLiveRegion({
  message,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  busy = false,
  delay = 0,
  className
}: AriaLiveRegionProps) {
  const [displayMessage, setDisplayMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (message) {
      timeoutRef.current = setTimeout(() => {
        setDisplayMessage(message)
        
        // Clear message after announcement to allow re-announcement of same message
        setTimeout(() => setDisplayMessage(''), 100)
      }, delay)
    } else {
      setDisplayMessage('')
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, delay])

  return (
    <div
      className={cn('sr-only', className)}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      role="status"
    >
      {displayMessage}
    </div>
  )
}

// ==================== MEDICAL ANNOUNCER ====================

interface MedicalAnnouncerProps {
  className?: string
}

export function MedicalAnnouncer({ className }: MedicalAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  useEffect(() => {
    const handleAnnouncement = (event: CustomEvent<{
      message: string
      priority?: 'polite' | 'assertive'
      medical?: boolean
    }>) => {
      const { message, priority: eventPriority = 'polite', medical = false } = event.detail
      
      // Add medical context to announcements
      const medicalMessage = medical 
        ? `Information médicale: ${message}`
        : message
        
      setAnnouncement(medicalMessage)
      setPriority(eventPriority)
    }

    // Listen for custom announcement events
    window.addEventListener('medical-announce', handleAnnouncement as EventListener)
    window.addEventListener('nova-announce', handleAnnouncement as EventListener)

    return () => {
      window.removeEventListener('medical-announce', handleAnnouncement as EventListener)
      window.removeEventListener('nova-announce', handleAnnouncement as EventListener)
    }
  }, [])

  return <AriaLiveRegion message={announcement} priority={priority} className={className} />
}

// ==================== KEYBOARD NAVIGATION HELPER ====================

interface KeyboardNavigationProps {
  children: React.ReactNode
  onArrowNavigation?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onEnterPress?: () => void
  onEscapePress?: () => void
  onHomePress?: () => void
  onEndPress?: () => void
  disabled?: boolean
  className?: string
}

export function KeyboardNavigation({
  children,
  onArrowNavigation,
  onEnterPress,
  onEscapePress,
  onHomePress,
  onEndPress,
  disabled = false,
  className
}: KeyboardNavigationProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        onArrowNavigation?.('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        onArrowNavigation?.('down')
        break
      case 'ArrowLeft':
        event.preventDefault()
        onArrowNavigation?.('left')
        break
      case 'ArrowRight':
        event.preventDefault()
        onArrowNavigation?.('right')
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onEnterPress?.()
        break
      case 'Escape':
        event.preventDefault()
        onEscapePress?.()
        break
      case 'Home':
        event.preventDefault()
        onHomePress?.()
        break
      case 'End':
        event.preventDefault()
        onEndPress?.()
        break
    }
  }

  return (
    <div
      className={cn('focus:outline-none', className)}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  )
}

// ==================== MEDICAL FORM ACCESSIBILITY ====================

interface MedicalFieldDescriptionProps {
  id: string
  children: React.ReactNode
  error?: boolean
  required?: boolean
  helpText?: string
  className?: string
}

export function MedicalFieldDescription({
  id,
  children,
  error = false,
  required = false,
  helpText,
  className
}: MedicalFieldDescriptionProps) {
  return (
    <div
      id={id}
      className={cn(
        'text-sm',
        error ? 'text-form-invalid' : 'text-muted-foreground',
        className
      )}
      aria-atomic="true"
    >
      {children}
      {required && (
        <span className="ml-1 text-form-required" aria-label="obligatoire">
          *
        </span>
      )}
      {helpText && (
        <div className="mt-1 text-xs text-muted-foreground">
          {helpText}
        </div>
      )}
    </div>
  )
}

// ==================== EMERGENCY ALERT ANNOUNCER ====================

interface EmergencyAnnouncerProps {
  level: 'critical' | 'urgent' | 'moderate' | 'low'
  message: string
  autoAnnounce?: boolean
  repeatInterval?: number
  className?: string
}

export function EmergencyAnnouncer({
  level,
  message,
  autoAnnounce = true,
  repeatInterval,
  className
}: EmergencyAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState('')
  const intervalRef = useRef<NodeJS.Timeout>()

  const levelPrefixes = {
    critical: 'ALERTE CRITIQUE',
    urgent: 'ALERTE URGENTE',
    moderate: 'ALERTE MODÉRÉE',
    low: 'INFORMATION'
  }

  const priority = level === 'critical' || level === 'urgent' ? 'assertive' : 'polite'
  const fullMessage = `${levelPrefixes[level]}: ${message}`

  useEffect(() => {
    if (autoAnnounce) {
      setCurrentMessage(fullMessage)

      // Set up repeat interval for critical alerts
      if (repeatInterval && (level === 'critical' || level === 'urgent')) {
        intervalRef.current = setInterval(() => {
          setCurrentMessage('')
          setTimeout(() => setCurrentMessage(fullMessage), 100)
        }, repeatInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoAnnounce, fullMessage, repeatInterval, level])

  return (
    <AriaLiveRegion
      message={currentMessage}
      priority={priority}
      atomic={true}
      className={className}
    />
  )
}

// ==================== SCREEN READER ONLY CONTENT ====================

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span',
  className 
}: ScreenReaderOnlyProps) {
  return (
    <Component className={cn('sr-only', className)}>
      {children}
    </Component>
  )
}

// ==================== ARIA HOOKS ====================

// Hook for managing focus announcements
export function useFocusAnnouncement() {
  const announce = (message: string, medical = false) => {
    const event = new CustomEvent('medical-announce', {
      detail: { message, priority: 'polite', medical }
    })
    window.dispatchEvent(event)
  }

  const announceUrgent = (message: string, medical = false) => {
    const event = new CustomEvent('medical-announce', {
      detail: { message, priority: 'assertive', medical }
    })
    window.dispatchEvent(event)
  }

  return { announce, announceUrgent }
}

// Hook for managing ARIA expanded state
export function useAriaExpanded(initialExpanded = false) {
  const [expanded, setExpanded] = useState(initialExpanded)

  const toggle = () => setExpanded(prev => !prev)
  const expand = () => setExpanded(true)
  const collapse = () => setExpanded(false)

  return {
    expanded,
    setExpanded,
    toggle,
    expand,
    collapse,
    'aria-expanded': expanded
  }
}

// Hook for managing ARIA selected state
export function useAriaSelected(initialSelected = false) {
  const [selected, setSelected] = useState(initialSelected)

  const toggle = () => setSelected(prev => !prev)
  const select = () => setSelected(true)
  const deselect = () => setSelected(false)

  return {
    selected,
    setSelected,
    toggle,
    select,
    deselect,
    'aria-selected': selected
  }
}

// Hook for generating unique IDs for accessibility
export function useAriaIds(prefix = 'nova') {
  const [ids] = useState(() => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    
    return {
      id: `${prefix}-${timestamp}-${random}`,
      labelId: `${prefix}-label-${timestamp}-${random}`,
      descriptionId: `${prefix}-desc-${timestamp}-${random}`,
      errorId: `${prefix}-error-${timestamp}-${random}`,
      helpId: `${prefix}-help-${timestamp}-${random}`
    }
  })

  return ids
}

// ==================== UTILITY FUNCTIONS ====================

// Function to dispatch medical announcements
export function announceMedical(
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
) {
  const event = new CustomEvent('medical-announce', {
    detail: { message, priority, medical: true }
  })
  window.dispatchEvent(event)
}

// Function to announce form validation errors
export function announceFormError(
  fieldName: string,
  error: string,
  isRequired = false
) {
  const requiredText = isRequired ? ' Ce champ est obligatoire.' : ''
  const message = `Erreur dans ${fieldName}: ${error}${requiredText}`
  
  announceMedical(message, 'assertive')
}

// Function to announce successful form submission
export function announceFormSuccess(message = 'Formulaire envoyé avec succès') {
  announceMedical(message, 'polite')
}