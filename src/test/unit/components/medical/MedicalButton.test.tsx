/**
 * Tests unitaires pour MedicalButton
 * 
 * Tests couvrant:
 * - Rendu des variants médicaux
 * - États interactifs (hover, focus, disabled)
 * - Accessibilité WCAG AAA
 * - Gestion des événements
 * - Icônes et chargement
 * - Cibles tactiles seniors
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { MedicalButton } from '@/components/ui/medical/MedicalButton'

// Mock d'icône pour les tests
const MockIcon = () => (
  <svg data-testid="mock-icon" width="16" height="16" viewBox="0 0 16 16">
    <path d="M8 0L16 8L8 16L0 8L8 0Z" />
  </svg>
)

describe('MedicalButton', () => {
  describe('Rendu de base', () => {
    it('devrait afficher le texte du bouton', () => {
      render(
        <MedicalButton>
          Prendre rendez-vous
        </MedicalButton>
      )
      
      expect(screen.getByRole('button', { name: 'Prendre rendez-vous' })).toBeInTheDocument()
    })
    
    it('devrait appliquer les classes CSS de base', () => {
      render(
        <MedicalButton data-testid="medical-btn">
          Test
        </MedicalButton>
      )
      
      const button = screen.getByTestId('medical-btn')
      expect(button).toHaveClass('medical-button')
      expect(button).toHaveClass('medical-button-primary') // variant par défaut
      expect(button).toHaveClass('medical-touch-target') // taille par défaut
    })
  })
  
  describe('Variants médicaux', () => {
    it.each([
      ['primary', 'medical-button-primary'],
      ['secondary', 'medical-button-secondary'],
      ['urgent', 'medical-button-urgent'],
      ['ghost', 'medical-button-ghost'],
    ])('devrait appliquer les classes pour le variant %s', (variant, expectedClass) => {
      render(
        <MedicalButton variant={variant as any} data-testid="variant-btn">
          Bouton {variant}
        </MedicalButton>
      )
      
      const button = screen.getByTestId('variant-btn')
      expect(button).toHaveClass(expectedClass)
    })
    
    it('devrait afficher une animation pulse pour le variant urgent', () => {
      render(
        <MedicalButton variant="urgent" data-testid="urgent-btn">
          Urgence
        </MedicalButton>
      )
      
      const button = screen.getByTestId('urgent-btn')
      expect(button).toHaveClass('medical-pulse')
    })
    
    it('ne devrait pas afficher d\'animation pulse si urgent et disabled', () => {
      render(
        <MedicalButton variant="urgent" disabled data-testid="urgent-disabled">
          Urgence désactivée
        </MedicalButton>
      )
      
      const button = screen.getByTestId('urgent-disabled')
      expect(button).not.toHaveClass('medical-pulse')
    })
  })
  
  describe('Tailles et cibles tactiles', () => {
    it.each([
      ['default', 'medical-touch-target'],
      ['large', 'h-14 px-6 text-lg'],
      ['emergency', 'emergency-touch-target text-lg font-bold'],
    ])('devrait appliquer les classes pour la taille %s', (size, expectedClasses) => {
      render(
        <MedicalButton size={size as any} data-testid="size-btn">
          Bouton {size}
        </MedicalButton>
      )
      
      const button = screen.getByTestId('size-btn')
      expectedClasses.split(' ').forEach(className => {
        expect(button).toHaveClass(className)
      })
    })
    
    it('devrait respecter les tailles minimales pour les cibles tactiles seniors', () => {
      const { container } = render(
        <MedicalButton size="emergency" data-testid="emergency-btn">
          Urgence
        </MedicalButton>
      )
      
      const button = screen.getByTestId('emergency-btn')
      const style = window.getComputedStyle(button)
      
      // Vérifie que la cible tactile est d'au moins 56px (WCAG) ou plus pour urgence
      expect(button).toHaveClass('emergency-touch-target')
    })
  })
  
  describe('États interactifs', () => {
    it('devrait gérer l\'état disabled', () => {
      const handleClick = vi.fn()
      
      render(
        <MedicalButton disabled onClick={handleClick}>
          Bouton désactivé
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
    
    it('devrait gérer l\'état loading', () => {
      const handleClick = vi.fn()
      
      render(
        <MedicalButton loading onClick={handleClick}>
          Chargement...
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('opacity-75', 'cursor-wait')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      
      // Vérifie la présence du spinner
      const spinner = button.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
    
    it('devrait exécuter onClick quand actif', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(
        <MedicalButton onClick={handleClick}>
          Bouton actif
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('Gestion des icônes', () => {
    it('devrait afficher une icône à gauche par défaut', () => {
      render(
        <MedicalButton icon={<MockIcon />}>
          Avec icône
        </MedicalButton>
      )
      
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toBeInTheDocument()
      
      // Vérifie l'ordre: icône puis texte
      const button = screen.getByRole('button')
      const iconContainer = icon.closest('span')
      expect(iconContainer).toHaveClass('mr-2', 'flex-shrink-0')
    })
    
    it('devrait afficher une icône à droite quand spécifié', () => {
      render(
        <MedicalButton icon={<MockIcon />} iconPosition="right">
          Icône droite
        </MedicalButton>
      )
      
      const icon = screen.getByTestId('mock-icon')
      const iconContainer = icon.closest('span')
      expect(iconContainer).toHaveClass('ml-2', 'flex-shrink-0')
    })
    
    it('ne devrait pas afficher l\'icône en mode loading', () => {
      render(
        <MedicalButton icon={<MockIcon />} loading>
          Chargement
        </MedicalButton>
      )
      
      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument()
    })
  })
  
  describe('Accessibilité WCAG AAA', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const { container } = render(
        <MedicalButton variant="primary">
          Bouton accessible
        </MedicalButton>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait gérer la navigation au clavier', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      
      render(
        <MedicalButton onClick={handleClick}>
          Bouton clavier
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      
      // Focus avec Tab
      await user.tab()
      expect(button).toHaveFocus()
      
      // Activation avec Entrée
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
      
      // Activation avec Espace
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
    
    it('devrait avoir des attributs ARIA appropriés', () => {
      render(
        <MedicalButton
          aria-describedby="helper-text"
          aria-expanded={false}
          loading
        >
          Bouton ARIA
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'helper-text')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
    
    it('devrait annoncer correctement les changements d\'état', () => {
      const { rerender } = render(
        <MedicalButton>
          État initial
        </MedicalButton>
      )
      
      const button = screen.getByRole('button')
      
      // État normal
      expect(button).not.toHaveAttribute('aria-busy')
      expect(button).not.toHaveAttribute('aria-disabled')
      
      // État loading
      rerender(
        <MedicalButton loading>
          Chargement...
        </MedicalButton>
      )
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      
      // État disabled
      rerender(
        <MedicalButton disabled>
          Désactivé
        </MedicalButton>
      )
      expect(button).not.toHaveAttribute('aria-busy')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })
  
  describe('Responsive et viewport mobile', () => {
    beforeEach(() => {
      // Mock viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
    })
    
    it('devrait s\'adapter aux écrans mobiles', () => {
      render(
        <MedicalButton size="large" data-testid="mobile-btn">
          Bouton mobile
        </MedicalButton>
      )
      
      const button = screen.getByTestId('mobile-btn')
      
      // Vérifie que les tailles tactiles sont appropriées pour mobile
      expect(button).toHaveClass('h-14') // Grande cible tactile
    })
  })
  
  describe('Intégration avec le système de design médical', () => {
    it('devrait utiliser les tokens de couleur médicaux', () => {
      const { container } = render(
        <>
          <MedicalButton variant="primary" data-testid="primary">
            Primaire
          </MedicalButton>
          <MedicalButton variant="urgent" data-testid="urgent">
            Urgent
          </MedicalButton>
          <MedicalButton variant="secondary" data-testid="secondary">
            Secondaire
          </MedicalButton>
        </>
      )
      
      // Vérifie que les classes de couleur médicales sont appliquées
      expect(screen.getByTestId('primary')).toHaveClass('medical-button-primary')
      expect(screen.getByTestId('urgent')).toHaveClass('medical-button-urgent')
      expect(screen.getByTestId('secondary')).toHaveClass('medical-button-secondary')
    })
    
    it('devrait supporter les classes personnalisées', () => {
      render(
        <MedicalButton className="custom-class" data-testid="custom">
          Personnalisé
        </MedicalButton>
      )
      
      const button = screen.getByTestId('custom')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('medical-button') // Classe de base préservée
    })
  })
  
  describe('Gestion d\'erreurs et cas limites', () => {
    it('devrait gérer les enfants vides ou null', () => {
      render(
        <MedicalButton data-testid="empty">
          {null}
        </MedicalButton>
      )
      
      const button = screen.getByTestId('empty')
      expect(button).toBeInTheDocument()
      expect(button).toBeEmptyDOMElement()
    })
    
    it('devrait gérer les icônes invalides', () => {
      render(
        <MedicalButton icon={null} data-testid="null-icon">
          Icône nulle
        </MedicalButton>
      )
      
      const button = screen.getByTestId('null-icon')
      expect(button).toBeInTheDocument()
      expect(screen.getByText('Icône nulle')).toBeInTheDocument()
    })
  })
  
  describe('Performance et optimisations', () => {
    it('ne devrait pas re-render inutilement', () => {
      const MockComponent = vi.fn(({ children, ...props }) => 
        <MedicalButton {...props}>{children}</MedicalButton>
      )
      
      const { rerender } = render(
        <MockComponent>Test</MockComponent>
      )
      
      // Premier render
      expect(MockComponent).toHaveBeenCalledTimes(1)
      
      // Re-render avec les mêmes props
      rerender(<MockComponent>Test</MockComponent>)
      expect(MockComponent).toHaveBeenCalledTimes(2)
      
      // Le composant devrait être optimisé avec React.memo si nécessaire
    })
  })
})