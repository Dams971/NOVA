/**
 * Tests unitaires pour UrgencyBanner
 * 
 * Tests couvrant:
 * - Niveaux d'urgence (low, moderate, urgent, critical)
 * - Animation pulse pour urgences élevées
 * - Actions intégrées avec variants
 * - Auto-masquage avec timer et barre de progression
 * - Position fixe et dismissible
 * - Accessibilité WCAG AAA (ARIA, lecteurs d'écran)
 * - Navigation clavier (Escape pour fermer)
 * - Gestion des événements et callbacks
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { UrgencyBanner, type UrgencyLevel } from '@/components/ui/medical/UrgencyBanner'

// Mock d'icône pour les tests
const MockPhoneIcon = () => (
  <svg data-testid="phone-icon" width="12" height="12" viewBox="0 0 12 12">
    <path d="M2 2h8v8H2z" />
  </svg>
)

describe('UrgencyBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  describe('Rendu de base', () => {
    it('devrait afficher le message principal', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Nouveau rendez-vous disponible"
        />
      )
      
      expect(screen.getByText('Nouveau rendez-vous disponible')).toBeInTheDocument()
    })
    
    it('devrait avoir les attributs ARIA appropriés', () => {
      const urgency: UrgencyLevel = { level: 'urgent' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Attention requise"
          data-testid="urgency-banner"
        />
      )
      
      const banner = screen.getByTestId('urgency-banner')
      expect(banner).toHaveAttribute('role', 'alert')
      expect(banner).toHaveAttribute('aria-live', 'assertive')
      expect(banner).toHaveAttribute('aria-atomic', 'true')
    })
    
    it('devrait afficher le sous-titre quand fourni', () => {
      const urgency: UrgencyLevel = { level: 'low' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Succès"
          subtitle="Votre rendez-vous a été confirmé"
        />
      )
      
      expect(screen.getByText('Votre rendez-vous a été confirmé')).toBeInTheDocument()
    })
  })
  
  describe('Niveaux d\'urgence', () => {
    it.each([
      ['low', 'bg-medical-green-50', '💚', false],
      ['moderate', 'bg-medical-blue-50', '💙', false],
      ['urgent', 'bg-medical-yellow-50', '⚠️', true],
      ['critical', 'bg-medical-red-50', '🚨', true],
    ])('devrait afficher le niveau %s correctement', (level, bgClass, icon, shouldPulse) => {
      const urgency: UrgencyLevel = { level: level as any }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Message de test"
          data-testid="urgency-banner"
        />
      )
      
      const banner = screen.getByTestId('urgency-banner')
      expect(banner).toHaveClass(bgClass)
      
      // Vérifie l'icône
      expect(screen.getByText(icon)).toBeInTheDocument()
      
      // Vérifie l'animation pulse pour urgences élevées
      if (shouldPulse) {
        expect(banner).toHaveClass('medical-pulse')
      } else {
        expect(banner).not.toHaveClass('medical-pulse')
      }
    })
    
    it('devrait utiliser le label personnalisé si fourni', () => {
      const urgency: UrgencyLevel = {
        level: 'critical',
        label: 'URGENCE MÉDICALE',
        description: 'Contactez immédiatement un professionnel'
      }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Message original"
        />
      )
      
      expect(screen.getByText('URGENCE MÉDICALE')).toBeInTheDocument()
      expect(screen.getByText('Contactez immédiatement un professionnel')).toBeInTheDocument()
      expect(screen.queryByText('Message original')).not.toBeInTheDocument()
    })
    
    it('devrait pouvoir désactiver l\'animation', () => {
      const urgency: UrgencyLevel = { level: 'critical' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans animation"
          animate={false}
          data-testid="no-animation"
        />
      )
      
      const banner = screen.getByTestId('no-animation')
      expect(banner).not.toHaveClass('medical-pulse')
    })
  })
  
  describe('Gestion des icônes', () => {
    it('devrait afficher l\'icône par défaut', () => {
      const urgency: UrgencyLevel = { level: 'urgent' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Avec icône"
        />
      )
      
      const icon = screen.getByLabelText('Urgence urgent')
      expect(icon).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })
    
    it('devrait pouvoir masquer l\'icône', () => {
      const urgency: UrgencyLevel = { level: 'urgent' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans icône"
          showIcon={false}
        />
      )
      
      expect(screen.queryByLabelText('Urgence urgent')).not.toBeInTheDocument()
    })
  })
  
  describe('Actions intégrées', () => {
    it('devrait afficher les actions avec variants appropriés', async () => {
      const user = userEvent.setup()
      const handlePrimary = vi.fn()
      const handleSecondary = vi.fn()
      const handleDanger = vi.fn()
      
      const urgency: UrgencyLevel = { level: 'critical' }
      const actions = [
        {
          label: 'Appeler',
          onClick: handlePrimary,
          variant: 'primary' as const,
          icon: <MockPhoneIcon />
        },
        {
          label: 'Détails',
          onClick: handleSecondary,
          variant: 'secondary' as const
        },
        {
          label: 'Annuler',
          onClick: handleDanger,
          variant: 'danger' as const
        }
      ]
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Actions disponibles"
          actions={actions}
        />
      )
      
      // Vérifie la présence des boutons
      const primaryBtn = screen.getByRole('button', { name: 'Appeler' })
      const secondaryBtn = screen.getByRole('button', { name: 'Détails' })
      const dangerBtn = screen.getByRole('button', { name: 'Annuler' })
      
      expect(primaryBtn).toBeInTheDocument()
      expect(secondaryBtn).toBeInTheDocument()
      expect(dangerBtn).toBeInTheDocument()
      
      // Vérifie l'icône
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument()
      
      // Vérifie les styles
      expect(primaryBtn).toHaveClass('bg-medical-red-600', 'text-white')
      expect(dangerBtn).toHaveClass('bg-medical-red-600')
      
      // Test des callbacks
      await user.click(primaryBtn)
      await user.click(secondaryBtn)
      await user.click(dangerBtn)
      
      expect(handlePrimary).toHaveBeenCalledTimes(1)
      expect(handleSecondary).toHaveBeenCalledTimes(1)
      expect(handleDanger).toHaveBeenCalledTimes(1)
    })
    
    it('ne devrait pas afficher d\'actions si la liste est vide', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans actions"
          actions={[]}
        />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
  
  describe('Fonctionnalité dismissible', () => {
    it('devrait afficher le bouton de fermeture quand dismissible', async () => {
      const user = userEvent.setup()
      const handleDismiss = vi.fn()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Fermeture possible"
          dismissible
          onDismiss={handleDismiss}
        />
      )
      
      const dismissBtn = screen.getByLabelText('Fermer la notification')
      expect(dismissBtn).toBeInTheDocument()
      
      await user.click(dismissBtn)
      expect(handleDismiss).toHaveBeenCalledTimes(1)
    })
    
    it('devrait fermer avec la touche Escape', async () => {
      const user = userEvent.setup()
      const handleDismiss = vi.fn()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Fermeture clavier"
          dismissible
          onDismiss={handleDismiss}
        />
      )
      
      const banner = screen.getByRole('alert')
      banner.focus()
      
      await user.keyboard('{Escape}')
      expect(handleDismiss).toHaveBeenCalledTimes(1)
    })
    
    it('ne devrait pas réagir à Escape si non dismissible', async () => {
      const user = userEvent.setup()
      const handleDismiss = vi.fn()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Pas de fermeture"
          dismissible={false}
          onDismiss={handleDismiss}
        />
      )
      
      const banner = screen.getByRole('alert')
      banner.focus()
      
      await user.keyboard('{Escape}')
      expect(handleDismiss).not.toHaveBeenCalled()
    })
  })
  
  describe('Auto-masquage avec timer', () => {
    it('devrait se masquer automatiquement après le délai', async () => {
      const handleDismiss = vi.fn()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      const { container } = render(
        <UrgencyBanner
          urgency={urgency}
          message="Auto-masquage"
          autoHide={3000}
          onDismiss={handleDismiss}
        />
      )
      
      // Vérifie l'affichage initial du timer
      expect(screen.getByText('3s')).toBeInTheDocument()
      
      // Avance de 1 seconde
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('2s')).toBeInTheDocument()
      })
      
      // Avance de 2 secondes supplémentaires
      vi.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalledTimes(1)
      })
    })
    
    it('devrait afficher la barre de progression', async () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Avec progression"
          autoHide={4000}
          data-testid="progress-banner"
        />
      )
      
      const progressBar = screen.getByTestId('progress-banner')
        .querySelector('.h-1 .h-full')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '0%' })
      
      // Avance de 1 seconde (25% de 4s)
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(progressBar).toHaveStyle({ width: '25%' })
      })
    })
    
    it('ne devrait pas afficher de timer si autoHide n\'est pas défini', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans timer"
        />
      )
      
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument()
    })
  })
  
  describe('Position fixe', () => {
    it('devrait appliquer la position fixe quand demandé', () => {
      const urgency: UrgencyLevel = { level: 'urgent' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Position fixe"
          fixed
          data-testid="fixed-banner"
        />
      )
      
      const banner = screen.getByTestId('fixed-banner')
      expect(banner).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })
    
    it('ne devrait pas être fixe par défaut', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Position normale"
          data-testid="normal-banner"
        />
      )
      
      const banner = screen.getByTestId('normal-banner')
      expect(banner).not.toHaveClass('fixed')
    })
  })
  
  describe('Transitions et animations', () => {
    it('devrait avoir les classes de transition', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Avec transitions"
          data-testid="transition-banner"
        />
      )
      
      const banner = screen.getByTestId('transition-banner')
      expect(banner).toHaveClass('transition-all', 'duration-300')
    })
    
    it('devrait masquer avec les classes appropriées lors de la fermeture', async () => {
      const user = userEvent.setup()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Test fermeture"
          dismissible
          data-testid="closable-banner"
        />
      )
      
      const banner = screen.getByTestId('closable-banner')
      const dismissBtn = screen.getByLabelText('Fermer la notification')
      
      await user.click(dismissBtn)
      
      // Le composant devrait être retiré du DOM après fermeture
      await waitFor(() => {
        expect(screen.queryByTestId('closable-banner')).not.toBeInTheDocument()
      })
    })
  })
  
  describe('Accessibilité WCAG AAA', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const urgency: UrgencyLevel = { level: 'critical' }
      const actions = [
        { label: 'Action', onClick: vi.fn() }
      ]
      
      const { container } = render(
        <UrgencyBanner
          urgency={urgency}
          message="Test accessibilité"
          subtitle="Description détaillée"
          actions={actions}
          dismissible
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait avoir des labels ARIA appropriés pour les actions', () => {
      const urgency: UrgencyLevel = { level: 'urgent' }
      const actions = [
        { label: 'Confirmer', onClick: vi.fn() },
        { label: 'Annuler', onClick: vi.fn() }
      ]
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Actions avec ARIA"
          actions={actions}
        />
      )
      
      const confirmBtn = screen.getByRole('button', { name: 'Confirmer' })
      const cancelBtn = screen.getByRole('button', { name: 'Annuler' })
      
      expect(confirmBtn).toHaveAttribute('aria-label', 'Confirmer')
      expect(cancelBtn).toHaveAttribute('aria-label', 'Annuler')
    })
    
    it('devrait être focusable pour la navigation clavier', async () => {
      const user = userEvent.setup()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Navigation clavier"
          dismissible
        />
      )
      
      const banner = screen.getByRole('alert')
      expect(banner).toHaveAttribute('tabIndex', '-1')
      
      // Test de focus programmatique
      banner.focus()
      expect(banner).toHaveFocus()
    })
  })
  
  describe('Gestion d\'erreurs et cas limites', () => {
    it('devrait gérer un niveau d\'urgence invalide sans crash', () => {
      const urgency: UrgencyLevel = { level: 'invalid' as any }
      
      expect(() => {
        render(
          <UrgencyBanner
            urgency={urgency}
            message="Niveau invalide"
          />
        )
      }).not.toThrow()
    })
    
    it('devrait gérer l\'absence d\'actions', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans actions"
          actions={undefined}
        />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
    
    it('devrait gérer un autoHide de 0 ou négatif', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="AutoHide invalide"
          autoHide={0}
        />
      )
      
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument()
    })
    
    it('devrait gérer l\'absence de callback onDismiss', async () => {
      const user = userEvent.setup()
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Sans callback"
          dismissible
        />
      )
      
      const dismissBtn = screen.getByLabelText('Fermer la notification')
      
      // Ne devrait pas crasher même sans callback
      expect(() => user.click(dismissBtn)).not.toThrow()
    })
  })
  
  describe('Customisation et extensibilité', () => {
    it('devrait supporter les classes CSS personnalisées', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Classes personnalisées"
          className="custom-class extra-margin"
          data-testid="custom-banner"
        />
      )
      
      const banner = screen.getByTestId('custom-banner')
      expect(banner).toHaveClass('custom-class', 'extra-margin')
    })
    
    it('devrait préserver les autres props HTML', () => {
      const urgency: UrgencyLevel = { level: 'moderate' }
      
      render(
        <UrgencyBanner
          urgency={urgency}
          message="Props HTML"
          data-custom="value"
          id="custom-id"
        />
      )
      
      const banner = screen.getByRole('alert')
      expect(banner).toHaveAttribute('data-custom', 'value')
      expect(banner).toHaveAttribute('id', 'custom-id')
    })
  })
})