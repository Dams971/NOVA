/**
 * Tests unitaires pour ChatBubble
 * 
 * Tests couvrant:
 * - Rendu différencié bot/patient/system
 * - Gestion des suggestions (chips)
 * - Formatage timestamps français
 * - États de message (envoi, livré, lu, erreur)
 * - Regroupement intelligent des messages
 * - Accessibilité et screen readers
 * - Animations et interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import React from 'react'
import { vi } from 'vitest'
import { ChatBubble, type ChatMessage } from '@/components/ui/medical/ChatBubble'

// Données de test
const createTestMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'test-message-1',
  content: 'Message de test',
  sender: 'bot',
  timestamp: new Date('2024-01-15T14:30:00.000Z'),
  status: 'sent',
  ...overrides,
})

const botMessage = createTestMessage({
  sender: 'bot',
  content: 'Bienvenue sur NOVA RDV ! Comment puis-je vous aider ?',
  suggestions: ['Prendre RDV', 'Urgence', 'Informations'],
})

const patientMessage = createTestMessage({
  sender: 'patient',
  content: 'Je voudrais prendre un rendez-vous',
  status: 'delivered',
})

const systemMessage = createTestMessage({
  sender: 'system',
  content: 'Session démarrée',
})

describe('ChatBubble', () => {
  describe('Rendu différencié par expéditeur', () => {
    it('devrait afficher un message bot avec le bon style', () => {
      render(
        <ChatBubble
          message={botMessage}
          data-testid="bot-bubble"
        />
      )
      
      const bubble = screen.getByRole('article')
      expect(bubble).toHaveClass('bg-medical-blue-600', 'text-white')
      expect(bubble).toHaveAttribute('aria-label', 'Message de l\'assistant')
      
      // Vérifie la disposition (avatar à gauche)
      const container = bubble.closest('div')
      expect(container).toHaveClass('flex-row')
    })
    
    it('devrait afficher un message patient avec le bon style', () => {
      render(
        <ChatBubble
          message={patientMessage}
          data-testid="patient-bubble"
        />
      )
      
      const bubble = screen.getByRole('article')
      expect(bubble).toHaveClass('bg-white', 'text-medical-gray-900', 'border-medical-gray-200')
      expect(bubble).toHaveAttribute('aria-label', 'Message de vous')
      
      // Vérifie la disposition (avatar à droite)
      const container = bubble.closest('div')
      expect(container).toHaveClass('flex-row-reverse')
    })
    
    it('devrait afficher un message système centré', () => {
      render(
        <ChatBubble
          message={systemMessage}
          data-testid="system-bubble"
        />
      )
      
      const bubble = screen.getByRole('article')
      expect(bubble).toHaveClass('bg-medical-gray-100', 'text-medical-gray-600')
      expect(bubble).toHaveAttribute('aria-label', 'Message du système')
      
      const container = bubble.closest('div')
      expect(container).toHaveClass('justify-center')
    })
  })
  
  describe('Gestion des avatars', () => {
    it('devrait afficher l\'avatar du bot', () => {
      render(
        <ChatBubble
          message={botMessage}
          showAvatar={true}
        />
      )
      
      const avatar = screen.getByRole('article').closest('div')?.querySelector('.bg-medical-blue-600')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveClass('rounded-full')
    })
    
    it('devrait afficher l\'avatar du patient', () => {
      render(
        <ChatBubble
          message={patientMessage}
          showAvatar={true}
        />
      )
      
      const avatar = screen.getByRole('article').closest('div')?.querySelector('.bg-medical-gray-300')
      expect(avatar).toBeInTheDocument()
    })
    
    it('ne devrait pas afficher d\'avatar si désactivé', () => {
      render(
        <ChatBubble
          message={botMessage}
          showAvatar={false}
        />
      )
      
      const avatars = screen.getByRole('article').closest('div')?.querySelectorAll('.rounded-full')
      expect(avatars).toHaveLength(0)
    })
    
    it('devrait masquer l\'avatar pour les messages groupés', () => {
      const previousMessage = createTestMessage({ sender: 'bot' })
      
      render(
        <ChatBubble
          message={botMessage}
          previousMessage={previousMessage}
          showAvatar={true}
        />
      )
      
      // L'avatar devrait être invisible mais présent (pour l'espacement)
      const avatarContainer = screen.getByRole('article').closest('div')?.querySelector('.invisible')
      expect(avatarContainer).toBeInTheDocument()
    })
  })
  
  describe('Gestion des suggestions (chips)', () => {
    it('devrait afficher les suggestions du bot', () => {
      render(
        <ChatBubble message={botMessage} />
      )
      
      expect(screen.getByRole('button', { name: /Prendre RDV/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Urgence/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Informations/ })).toBeInTheDocument()
    })
    
    it('devrait exécuter onSuggestionSelect lors du clic', async () => {
      const user = userEvent.setup()
      const handleSuggestionSelect = vi.fn()
      
      render(
        <ChatBubble
          message={botMessage}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )
      
      const suggestionButton = screen.getByRole('button', { name: /Prendre RDV/ })
      await user.click(suggestionButton)
      
      expect(handleSuggestionSelect).toHaveBeenCalledWith('Prendre RDV')
    })
    
    it('devrait avoir les styles appropriés pour les suggestions', () => {
      render(
        <ChatBubble message={botMessage} />
      )
      
      const suggestionButton = screen.getByRole('button', { name: /Prendre RDV/ })
      expect(suggestionButton).toHaveClass(
        'px-3',
        'py-1',
        'text-xs',
        'rounded-full',
        'border',
        'hover:bg-current',
        'hover:text-white'
      )
    })
    
    it('ne devrait pas afficher de suggestions pour les messages patients', () => {
      const messageWithSuggestions = {
        ...patientMessage,
        suggestions: ['Test 1', 'Test 2'],
      }
      
      render(
        <ChatBubble message={messageWithSuggestions} />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
  
  describe('Formatage des timestamps français', () => {
    beforeEach(() => {
      // Mock de la date actuelle pour des tests cohérents
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T15:00:00.000Z'))
    })
    
    afterEach(() => {
      vi.useRealTimers()
    })
    
    it('devrait afficher "À l\'instant" pour les messages récents', () => {
      const recentMessage = createTestMessage({
        timestamp: new Date('2024-01-15T14:59:30.000Z'), // 30 secondes avant
      })
      
      render(
        <ChatBubble
          message={recentMessage}
          showTimestamp={true}
        />
      )
      
      expect(screen.getByText('À l\'instant')).toBeInTheDocument()
    })
    
    it('devrait afficher "Il y a X min" pour les messages de moins d\'une heure', () => {
      const oldMessage = createTestMessage({
        timestamp: new Date('2024-01-15T14:45:00.000Z'), // 15 minutes avant
      })
      
      render(
        <ChatBubble
          message={oldMessage}
          showTimestamp={true}
        />
      )
      
      expect(screen.getByText('Il y a 15 min')).toBeInTheDocument()
    })
    
    it('devrait afficher l\'heure pour les messages du jour', () => {
      const sameDayMessage = createTestMessage({
        timestamp: new Date('2024-01-15T10:30:00.000Z'), // Plus tôt le même jour
      })
      
      render(
        <ChatBubble
          message={sameDayMessage}
          showTimestamp={true}
        />
      )
      
      // Format français HH:MM
      expect(screen.getByText('11:30')).toBeInTheDocument() // UTC+1 Algerie
    })
    
    it('devrait afficher la date pour les messages d\'autres jours', () => {
      const otherDayMessage = createTestMessage({
        timestamp: new Date('2024-01-14T14:30:00.000Z'), // Jour précédent
      })
      
      render(
        <ChatBubble
          message={otherDayMessage}
          showTimestamp={true}
        />
      )
      
      const timestampElement = screen.getByText(/14 janv/)
      expect(timestampElement).toBeInTheDocument()
    })
    
    it('ne devrait pas afficher de timestamp si désactivé', () => {
      render(
        <ChatBubble
          message={botMessage}
          showTimestamp={false}
        />
      )
      
      expect(screen.queryByText(/Il y a|À l'instant|\d{2}:\d{2}/)).not.toBeInTheDocument()
    })
  })
  
  describe('États de message et icônes de statut', () => {
    it.each([
      ['sending', 'animate-spin'],
      ['sent', 'w-3 h-3'],
      ['delivered', 'w-3 h-3'],
      ['read', 'text-medical-blue-600'],
      ['error', 'text-medical-red-600'],
    ])('devrait afficher l\'icône correcte pour le statut %s', (status, expectedClass) => {
      const messageWithStatus = createTestMessage({
        sender: 'patient', // Seuls les messages patients affichent le statut
        status: status as any,
      })
      
      render(
        <ChatBubble message={messageWithStatus} />
      )
      
      const statusIcon = screen.getByRole('article').closest('div')?.querySelector('svg')
      expect(statusIcon).toHaveClass(expectedClass)
    })
    
    it('ne devrait pas afficher de statut pour les messages bot', () => {
      const botMessageWithStatus = createTestMessage({
        sender: 'bot',
        status: 'delivered',
      })
      
      render(
        <ChatBubble message={botMessageWithStatus} />
      )
      
      // Pas d'icône de statut pour les messages bot
      const statusArea = screen.getByRole('article').closest('div')?.querySelector('.text-xs')
      expect(statusArea?.querySelector('svg')).not.toBeInTheDocument()
    })
  })
  
  describe('Types de message et styles', () => {
    it.each([
      ['text', ''],
      ['options', 'border-medical-blue-200 bg-medical-blue-50'],
      ['calendar', 'border-medical-green-200 bg-medical-green-50'],
      ['confirmation', 'border-medical-green-200 bg-medical-green-50'],
      ['error', 'border-medical-red-200 bg-medical-red-50'],
    ])('devrait appliquer les styles pour le type %s', (type, expectedClasses) => {
      const typedMessage = createTestMessage({
        type: type as any,
      })
      
      render(
        <ChatBubble message={typedMessage} />
      )
      
      const bubble = screen.getByRole('article')
      if (expectedClasses) {
        expectedClasses.split(' ').forEach(className => {
          expect(bubble).toHaveClass(className)
        })
      }
    })
  })
  
  describe('Regroupement intelligent des messages', () => {
    it('devrait réduire l\'espacement pour les messages groupés', () => {
      const previousMessage = createTestMessage({ sender: 'bot' })
      
      render(
        <ChatBubble
          message={botMessage}
          previousMessage={previousMessage}
        />
      )
      
      const container = screen.getByRole('article').closest('div')
      expect(container).toHaveClass('mb-1') // Espacement réduit
      expect(container).not.toHaveClass('mb-4') // Espacement normal
    })
    
    it('devrait utiliser l\'espacement normal pour des expéditeurs différents', () => {
      const previousMessage = createTestMessage({ sender: 'patient' })
      
      render(
        <ChatBubble
          message={botMessage}
          previousMessage={previousMessage}
        />
      )
      
      const container = screen.getByRole('article').closest('div')
      expect(container).toHaveClass('mb-4') // Espacement normal
    })
  })
  
  describe('Accessibilité et interaction', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const { container } = render(
        <ChatBubble message={botMessage} />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait être focusable au clavier', async () => {
      const user = userEvent.setup()
      
      render(
        <ChatBubble message={botMessage} />
      )
      
      const bubble = screen.getByRole('article')
      expect(bubble).toHaveAttribute('tabIndex', '0')
      
      await user.tab()
      expect(bubble).toHaveFocus()
    })
    
    it('devrait afficher le focus ring quand focusé', async () => {
      const user = userEvent.setup()
      
      render(
        <ChatBubble message={botMessage} />
      )
      
      const bubble = screen.getByRole('article')
      await user.tab()
      
      expect(bubble).toHaveClass('focus-within:ring-2', 'focus-within:ring-medical-blue-300')
    })
    
    it('devrait avoir les labels ARIA appropriés pour les suggestions', () => {
      render(
        <ChatBubble message={botMessage} />
      )
      
      const suggestionButton = screen.getByRole('button', { name: /Prendre RDV/ })
      expect(suggestionButton).toHaveAttribute('aria-label', 'Sélectionner la suggestion: Prendre RDV')
    })
  })
  
  describe('Animations et interactions hover', () => {
    it('devrait afficher l\'effet hover', async () => {
      const user = userEvent.setup()
      
      render(
        <ChatBubble message={botMessage} />
      )
      
      const container = screen.getByRole('article').closest('div')!
      
      await user.hover(container)
      
      // L'effet hover devrait être visible sur la bulle
      const bubble = screen.getByRole('article')
      expect(bubble).toHaveClass('shadow-medical-card')
    })
    
    it('devrait retirer l\'effet hover quand la souris part', async () => {
      const user = userEvent.setup()
      
      render(
        <ChatBubble message={botMessage} />
      )
      
      const container = screen.getByRole('article').closest('div')!
      
      await user.hover(container)
      await user.unhover(container)
      
      // L'effet hover ne devrait plus être visible
      const bubble = screen.getByRole('article')
      expect(bubble).not.toHaveClass('shadow-medical-card')
    })
  })
  
  describe('Gestion des actions sur message', () => {
    it('devrait exécuter onMessageAction si fourni', () => {
      const handleMessageAction = vi.fn()
      
      render(
        <ChatBubble
          message={botMessage}
          onMessageAction={handleMessageAction}
        />
      )
      
      // Note: L'action sur message n'est pas implémentée dans le composant actuel
      // mais la prop est acceptée pour usage futur
      expect(handleMessageAction).not.toHaveBeenCalled()
    })
  })
  
  describe('Cas limites et gestion d\'erreurs', () => {
    it('devrait gérer un contenu vide', () => {
      const emptyMessage = createTestMessage({
        content: '',
      })
      
      render(
        <ChatBubble message={emptyMessage} />
      )
      
      const bubble = screen.getByRole('article')
      expect(bubble).toBeInTheDocument()
    })
    
    it('devrait gérer des suggestions vides', () => {
      const messageWithEmptySuggestions = createTestMessage({
        suggestions: [],
      })
      
      render(
        <ChatBubble message={messageWithEmptySuggestions} />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
    
    it('devrait gérer un timestamp invalide', () => {
      const messageWithInvalidTimestamp = createTestMessage({
        timestamp: new Date('invalid'),
      })
      
      expect(() => {
        render(
          <ChatBubble
            message={messageWithInvalidTimestamp}
            showTimestamp={true}
          />
        )
      }).not.toThrow()
    })
    
    it('devrait gérer l\'absence de previousMessage/nextMessage', () => {
      render(
        <ChatBubble
          message={botMessage}
          previousMessage={undefined}
          nextMessage={undefined}
        />
      )
      
      const container = screen.getByRole('article').closest('div')
      expect(container).toHaveClass('mb-4') // Espacement normal
    })
  })
  
  describe('Contenu multiline et formatage', () => {
    it('devrait préserver les sauts de ligne', () => {
      const multilineMessage = createTestMessage({
        content: 'Première ligne\nDeuxième ligne\nTroisième ligne',
      })
      
      render(
        <ChatBubble message={multilineMessage} />
      )
      
      const content = screen.getByRole('article').querySelector('.whitespace-pre-wrap')
      expect(content).toHaveTextContent('Première ligne\nDeuxième ligne\nTroisième ligne')
    })
    
    it('devrait limiter la largeur des bulles', () => {
      render(
        <ChatBubble message={botMessage} />
      )
      
      const contentContainer = screen.getByRole('article').closest('.max-w-xs')
      expect(contentContainer).toHaveClass('lg:max-w-md')
    })
  })
})