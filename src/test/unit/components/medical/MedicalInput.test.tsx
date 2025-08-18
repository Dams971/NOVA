/**
 * Tests unitaires pour MedicalInput
 * 
 * Tests couvrant:
 * - Validation E.164 téléphones algériens
 * - Auto-normalisation numéros
 * - États médicaux (success, warning, error)
 * - Accessibilité WCAG AAA
 * - Gestion des icônes et actions
 * - Messages d'erreur en français
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import React from 'react'
import { vi } from 'vitest'
import { MedicalInput } from '@/components/ui/medical/MedicalInput'

// Mock d'icône pour les tests
const MockIcon = () => (
  <svg data-testid="mock-icon" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8" />
  </svg>
)

describe('MedicalInput', () => {
  describe('Rendu de base', () => {
    it('devrait afficher un input avec label', () => {
      render(
        <MedicalInput
          label="Nom complet"
          placeholder="Entrez votre nom"
          data-testid="basic-input"
        />
      )
      
      expect(screen.getByLabelText('Nom complet')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Entrez votre nom')).toBeInTheDocument()
    })
    
    it('devrait générer un ID unique si non fourni', () => {
      render(
        <MedicalInput label="Test" />
      )
      
      const input = screen.getByLabelText('Test')
      expect(input).toHaveAttribute('id')
      expect(input.id).toMatch(/^medical-input-/)
    })
    
    it('devrait utiliser l\'ID fourni', () => {
      render(
        <MedicalInput
          id="custom-id"
          label="Test personnalisé"
        />
      )
      
      const input = screen.getByLabelText('Test personnalisé')
      expect(input).toHaveAttribute('id', 'custom-id')
    })
  })
  
  describe('Validation E.164 téléphones algériens', () => {
    it('devrait valider un numéro E.164 correct', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          type="tel"
          phoneValidation
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      
      // Saisie d'un numéro valide
      await user.type(input, '+213555123456')
      
      // Aucun message d'erreur ne devrait apparaître
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    
    it.each([
      '+213555123456', // Mobile Djezzy
      '+213666789012', // Mobile Ooredoo
      '+213777654321', // Mobile Mobilis
    ])('devrait accepter le numéro valide: %s', async (phoneNumber) => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      await user.type(input, phoneNumber)
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    
    it.each([
      '+213433123456', // Fixe (commence par 4)
      '+213123456789', // Trop court après 213
      '+213555', // Beaucoup trop court
      '+33123456789', // Pas algérien
      '123456789', // Pas de code pays
      '+21355512345678', // Trop long
    ])('devrait rejeter le numéro invalide: %s', async (phoneNumber) => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      await user.type(input, phoneNumber)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Format incorrect. Utilisez +213XXXXXXXXX (exemple: +213555123456)'
        )
      })
    })
  })
  
  describe('Auto-normalisation des numéros', () => {
    it('devrait normaliser un numéro commençant par 0', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          onChange={handleChange}
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      
      // Saisie d'un numéro local
      await user.type(input, '0555123456')
      
      // Perte de focus pour déclencher la normalisation
      await user.tab()
      
      await waitFor(() => {
        expect(input).toHaveValue('+213555123456')
      })
      
      // Vérifie que onChange a été appelé avec la valeur normalisée
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1]
      expect(lastCall[0].target.value).toBe('+213555123456')
    })
    
    it('devrait normaliser un numéro commençant par 213', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      
      await user.type(input, '213666789012')
      await user.tab()
      
      await waitFor(() => {
        expect(input).toHaveValue('+213666789012')
      })
    })
    
    it('devrait conserver un numéro déjà au format E.164', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="phone-input"
        />
      )
      
      const input = screen.getByTestId('phone-input')
      
      await user.type(input, '+213777654321')
      await user.tab()
      
      expect(input).toHaveValue('+213777654321')
    })
  })
  
  describe('Variants et états visuels', () => {
    it.each([
      ['default', ''],
      ['success', 'border-medical-green-600'],
      ['warning', 'border-medical-yellow-600'],
      ['error', 'border-medical-red-600'],
    ])('devrait appliquer les styles pour le variant %s', (variant, expectedClass) => {
      render(
        <MedicalInput
          label="Test"
          variant={variant as any}
          data-testid="variant-input"
        />
      )
      
      const input = screen.getByTestId('variant-input')
      if (expectedClass) {
        expect(input).toHaveClass(expectedClass)
      }
    })
    
    it('devrait afficher un message d\'erreur', () => {
      render(
        <MedicalInput
          label="Email"
          variant="error"
          errorMessage="Format d'email invalide"
        />
      )
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toHaveTextContent('Format d\'email invalide')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
    
    it('devrait afficher un texte d\'aide', () => {
      render(
        <MedicalInput
          label="Mot de passe"
          helperText="Au moins 8 caractères"
        />
      )
      
      const helperText = screen.getByText('Au moins 8 caractères')
      expect(helperText).toBeInTheDocument()
      expect(helperText).toHaveClass('text-medical-gray-500')
    })
    
    it('devrait prioriser le message d\'erreur sur le texte d\'aide', () => {
      render(
        <MedicalInput
          label="Test"
          helperText="Texte d'aide"
          errorMessage="Message d'erreur"
        />
      )
      
      expect(screen.getByRole('alert')).toHaveTextContent('Message d\'erreur')
      expect(screen.queryByText('Texte d\'aide')).not.toBeInTheDocument()
    })
  })
  
  describe('Champs requis', () => {
    it('devrait afficher l\'indicateur requis', () => {
      render(
        <MedicalInput
          label="Nom"
          required
        />
      )
      
      const requiredIndicator = screen.getByLabelText('requis')
      expect(requiredIndicator).toHaveTextContent('*')
      expect(requiredIndicator).toHaveClass('text-medical-red-600')
      
      const input = screen.getByLabelText('Nom *')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })
  
  describe('Gestion des icônes', () => {
    it('devrait afficher une icône à gauche par défaut', () => {
      render(
        <MedicalInput
          label="Recherche"
          icon={<MockIcon />}
          data-testid="icon-input"
        />
      )
      
      const icon = screen.getByTestId('mock-icon')
      expect(icon).toBeInTheDocument()
      
      const input = screen.getByTestId('icon-input')
      expect(input).toHaveClass('pl-10') // Padding pour l'icône à gauche
    })
    
    it('devrait afficher une icône à droite', () => {
      render(
        <MedicalInput
          label="Mot de passe"
          icon={<MockIcon />}
          iconPosition="right"
          data-testid="icon-right-input"
        />
      )
      
      const input = screen.getByTestId('icon-right-input')
      expect(input).toHaveClass('pr-10') // Padding pour l'icône à droite
    })
    
    it('devrait exécuter onIconClick quand l\'icône est cliquée', async () => {
      const user = userEvent.setup()
      const handleIconClick = vi.fn()
      
      render(
        <MedicalInput
          label="Test"
          icon={<MockIcon />}
          onIconClick={handleIconClick}
        />
      )
      
      const icon = screen.getByTestId('mock-icon')
      await user.click(icon)
      
      expect(handleIconClick).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('Gestion des événements', () => {
    it('devrait appeler onChange lors de la saisie', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(
        <MedicalInput
          label="Test"
          onChange={handleChange}
          data-testid="change-input"
        />
      )
      
      const input = screen.getByTestId('change-input')
      await user.type(input, 'test')
      
      expect(handleChange).toHaveBeenCalledTimes(4) // Une fois par caractère
    })
    
    it('devrait appeler onBlur à la perte de focus', async () => {
      const user = userEvent.setup()
      const handleBlur = vi.fn()
      
      render(
        <MedicalInput
          label="Test"
          onBlur={handleBlur}
          data-testid="blur-input"
        />
      )
      
      const input = screen.getByTestId('blur-input')
      await user.click(input)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })
    
    it('devrait appeler onFocus au focus', async () => {
      const user = userEvent.setup()
      const handleFocus = vi.fn()
      
      render(
        <MedicalInput
          label="Test"
          onFocus={handleFocus}
          data-testid="focus-input"
        />
      )
      
      const input = screen.getByTestId('focus-input')
      await user.click(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('États focus et disabled', () => {
    it('devrait appliquer le style focus', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Test"
          data-testid="focus-input"
        />
      )
      
      const input = screen.getByTestId('focus-input')
      await user.click(input)
      
      expect(input).toHaveClass('medical-focus-ring')
    })
    
    it('devrait gérer l\'état disabled', () => {
      render(
        <MedicalInput
          label="Test"
          disabled
          data-testid="disabled-input"
        />
      )
      
      const input = screen.getByTestId('disabled-input')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })
  
  describe('Accessibilité WCAG AAA', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const { container } = render(
        <MedicalInput
          label="Nom complet"
          helperText="Entrez votre nom et prénom"
          required
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait avoir les attributs ARIA appropriés', () => {
      render(
        <MedicalInput
          label="Email"
          helperText="Format: nom@domaine.com"
          errorMessage="Email invalide"
          required
        />
      )
      
      const input = screen.getByLabelText(/Email/)
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      
      const describedBy = input.getAttribute('aria-describedby')
      expect(describedBy).toContain('error')
    })
    
    it('devrait associer correctement le label à l\'input', () => {
      render(
        <MedicalInput
          label="Téléphone"
          id="phone-input"
        />
      )
      
      const label = screen.getByText('Téléphone')
      const input = screen.getByLabelText('Téléphone')
      
      expect(label).toHaveAttribute('for', 'phone-input')
      expect(input).toHaveAttribute('id', 'phone-input')
    })
  })
  
  describe('Tailles et responsive', () => {
    it('devrait appliquer la taille large', () => {
      render(
        <MedicalInput
          label="Test"
          size="large"
          data-testid="large-input"
        />
      )
      
      const input = screen.getByTestId('large-input')
      expect(input).toHaveClass('h-14', 'text-lg', 'px-4')
    })
  })
  
  describe('Messages en français', () => {
    it('devrait afficher les messages d\'erreur en français', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="french-input"
        />
      )
      
      const input = screen.getByTestId('french-input')
      await user.type(input, '123456') // Numéro invalide
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toHaveTextContent('Format incorrect')
        expect(errorMessage).toHaveTextContent('exemple: +213555123456')
      })
    })
  })
  
  describe('Cas limites et gestion d\'erreurs', () => {
    it('devrait gérer une valeur initiale', () => {
      render(
        <MedicalInput
          label="Test"
          value="Valeur initiale"
          data-testid="initial-value"
        />
      )
      
      const input = screen.getByTestId('initial-value')
      expect(input).toHaveValue('Valeur initiale')
    })
    
    it('devrait gérer les changements de valeur externe', () => {
      const { rerender } = render(
        <MedicalInput
          label="Test"
          value="Première valeur"
          data-testid="external-value"
        />
      )
      
      let input = screen.getByTestId('external-value')
      expect(input).toHaveValue('Première valeur')
      
      rerender(
        <MedicalInput
          label="Test"
          value="Nouvelle valeur"
          data-testid="external-value"
        />
      )
      
      input = screen.getByTestId('external-value')
      expect(input).toHaveValue('Nouvelle valeur')
    })
    
    it('devrait gérer la validation téléphone sur champ vide', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalInput
          label="Téléphone"
          phoneValidation
          data-testid="empty-phone"
        />
      )
      
      const input = screen.getByTestId('empty-phone')
      await user.click(input)
      await user.tab() // Perte de focus sans saisie
      
      // Aucun message d'erreur pour un champ vide
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})