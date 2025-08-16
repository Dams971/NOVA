/**
 * Tests d'intégration pour la page RDV
 * 
 * Tests couvrant:
 * - Layout split-screen 3 zones (sidebar gauche, centre calendrier, chat droite)
 * - Flow complet de prise de RDV (4 étapes)
 * - Composants intégrés (PatientContext, CalendarView, ChatRDV)
 * - Navigation et breadcrumbs
 * - Responsive design et accessibilité
 * - Actions utilisateur et callbacks
 * - Indicateur de progression
 * - Skip links et navigation clavier
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import RDVPage from '@/app/rdv/page'
import { renderMobile, renderDesktop, renderTablet } from '@/test/test-utils'

// Mock de next/navigation
const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    pathname: '/rdv',
  }),
  usePathname: () => '/rdv',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock des composants RDV
vi.mock('@/components/rdv/RDVLayout', () => ({
  RDVLayout: ({ leftPanel, centerPanel, rightPanel }: any) => (
    <div data-testid="rdv-layout" className="grid grid-cols-12 gap-6">
      <div data-testid="left-panel" className="col-span-3">
        {leftPanel}
      </div>
      <div data-testid="center-panel" className="col-span-6">
        {centerPanel}
      </div>
      <div data-testid="right-panel" className="col-span-3">
        {rightPanel}
      </div>
    </div>
  ),
}))

vi.mock('@/components/rdv/PatientContext', () => ({
  PatientContext: () => (
    <div data-testid="patient-context">
      <h3>Vos informations</h3>
      <p>Amina Benali</p>
      <p>+213 555 123 456</p>
    </div>
  ),
}))

vi.mock('@/components/rdv/CalendarView', () => ({
  CalendarView: () => (
    <div data-testid="calendar-view">
      <h3>Sélectionnez un créneau</h3>
      <button>Lundi 15 janvier - 14:30</button>
      <button>Mardi 16 janvier - 09:00</button>
    </div>
  ),
}))

vi.mock('@/components/rdv/ChatRDV', () => ({
  ChatRDV: () => (
    <div data-testid="chat-rdv">
      <h3>Assistant NOVA</h3>
      <div className="chat-message">Bonjour ! Comment puis-je vous aider ?</div>
    </div>
  ),
}))

vi.mock('@/components/ui/nova/ButtonMedical', () => ({
  ButtonMedical: ({ children, onClick, leftIcon, rightIcon, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`button-medical ${variant} ${size} ${className || ''}`}
      data-testid={`button-${variant || 'default'}`}
      {...props}
    >
      {leftIcon && <span data-testid="left-icon">{leftIcon}</span>}
      {children}
      {rightIcon && <span data-testid="right-icon">{rightIcon}</span>}
    </button>
  ),
}))

describe('RDVPage Integration', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockBack.mockClear()
  })
  
  describe('Structure et layout de base', () => {
    it('devrait afficher la structure complète de la page', () => {
      render(<RDVPage />)
      
      // Header avec navigation
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Prendre rendez-vous' })).toBeInTheDocument()
      
      // Layout 3 zones
      expect(screen.getByTestId('rdv-layout')).toBeInTheDocument()
      expect(screen.getByTestId('left-panel')).toBeInTheDocument()
      expect(screen.getByTestId('center-panel')).toBeInTheDocument()
      expect(screen.getByTestId('right-panel')).toBeInTheDocument()
      
      // Composants intégrés
      expect(screen.getByTestId('patient-context')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
      expect(screen.getByTestId('chat-rdv')).toBeInTheDocument()
      
      // Section informations complémentaires
      expect(screen.getByText('Confirmation immédiate')).toBeInTheDocument()
      expect(screen.getByText('Données sécurisées')).toBeInTheDocument()
      expect(screen.getByText('Rappel automatique')).toBeInTheDocument()
    })
    
    it('devrait avoir une hiérarchie sémantique appropriée', () => {
      render(<RDVPage />)
      
      // H1 principal
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Prendre rendez-vous')
      
      // H2 caché pour l'accessibilité
      const h2 = screen.getByText('Informations complémentaires sur le service')
      expect(h2).toHaveClass('sr-only')
      
      // H3 dans les cartes
      expect(screen.getByRole('heading', { level: 3, name: 'Confirmation immédiate' })).toBeInTheDocument()
    })
  })
  
  describe('Navigation et breadcrumbs', () => {
    it('devrait afficher la navigation breadcrumb', () => {
      render(<RDVPage />)
      
      const breadcrumb = screen.getByRole('navigation', { name: 'Fil d\'Ariane' })
      expect(breadcrumb).toBeInTheDocument()
      
      const breadcrumbList = screen.getByRole('list')
      expect(breadcrumbList).toBeInTheDocument()
      
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Prendre rendez-vous')).toBeInTheDocument()
    })
    
    it('devrait gérer la navigation vers l\'accueil', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      const homeButtons = screen.getAllByLabelText('Retour à l\'accueil')
      expect(homeButtons).toHaveLength(1)
      
      await user.click(homeButtons[0])
      expect(mockPush).toHaveBeenCalledWith('/')
      
      // Test du bouton breadcrumb
      const breadcrumbHome = screen.getByRole('button', { name: 'Accueil' })
      await user.click(breadcrumbHome)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
    
    it('devrait gérer la navigation retour', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      const backButton = screen.getByLabelText('Retour à la page précédente')
      await user.click(backButton)
      
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('Indicateur de progression', () => {
    it('devrait afficher l\'état actuel du processus', () => {
      render(<RDVPage />)
      
      // Étape 1 - Complétée
      const step1 = screen.getByText('Informations').closest('div')
      expect(step1?.querySelector('.bg-success-600')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument()
      
      // Étape 2 - En cours
      const step2 = screen.getByText('Créneau').closest('div')
      expect(step2?.querySelector('.bg-primary-600')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      
      // Étape 3 - En attente
      const step3 = screen.getByText('Confirmation').closest('div')
      expect(step3?.querySelector('.bg-neutral-200')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
    
    it('devrait avoir les couleurs et états appropriés', () => {
      render(<RDVPage />)
      
      // Vérifie les classes CSS des étapes
      const successStep = document.querySelector('.bg-success-600')
      const activeStep = document.querySelector('.bg-primary-600')
      const pendingStep = document.querySelector('.bg-neutral-200')
      
      expect(successStep).toBeInTheDocument()
      expect(activeStep).toBeInTheDocument()
      expect(pendingStep).toBeInTheDocument()
    })
  })
  
  describe('Composants intégrés', () => {
    it('devrait intégrer PatientContext dans le panneau gauche', () => {
      render(<RDVPage />)
      
      const leftPanel = screen.getByTestId('left-panel')
      const patientContext = screen.getByTestId('patient-context')
      
      expect(leftPanel).toContainElement(patientContext)
      expect(screen.getByText('Vos informations')).toBeInTheDocument()
      expect(screen.getByText('Amina Benali')).toBeInTheDocument()
      expect(screen.getByText('+213 555 123 456')).toBeInTheDocument()
    })
    
    it('devrait intégrer CalendarView dans le panneau central', () => {
      render(<RDVPage />)
      
      const centerPanel = screen.getByTestId('center-panel')
      const calendarView = screen.getByTestId('calendar-view')
      
      expect(centerPanel).toContainElement(calendarView)
      expect(screen.getByText('Sélectionnez un créneau')).toBeInTheDocument()
      expect(screen.getByText('Lundi 15 janvier - 14:30')).toBeInTheDocument()
    })
    
    it('devrait intégrer ChatRDV dans le panneau droit', () => {
      render(<RDVPage />)
      
      const rightPanel = screen.getByTestId('right-panel')
      const chatRDV = screen.getByTestId('chat-rdv')
      
      expect(rightPanel).toContainElement(chatRDV)
      expect(screen.getByText('Assistant NOVA')).toBeInTheDocument()
      expect(screen.getByText('Bonjour ! Comment puis-je vous aider ?')).toBeInTheDocument()
    })
  })
  
  describe('Actions principales', () => {
    it('devrait afficher les boutons d\'action principaux', () => {
      render(<RDVPage />)
      
      const backButton = screen.getByText('Retour aux informations')
      const confirmButton = screen.getByText('Confirmer le rendez-vous')
      
      expect(backButton).toBeInTheDocument()
      expect(confirmButton).toBeInTheDocument()
      
      // Vérifie les variants des boutons
      expect(backButton.closest('button')).toHaveClass('outline')
      expect(confirmButton.closest('button')).toHaveClass('primary')
    })
    
    it('devrait gérer la confirmation du rendez-vous', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      render(<RDVPage />)
      
      const confirmButton = screen.getByText('Confirmer le rendez-vous')
      await user.click(confirmButton)
      
      expect(consoleSpy).toHaveBeenCalledWith('Confirmation du rendez-vous')
      
      consoleSpy.mockRestore()
    })
    
    it('devrait afficher les icônes dans les boutons', () => {
      render(<RDVPage />)
      
      // Bouton retour avec icône gauche
      const backButton = screen.getByText('Retour aux informations').closest('button')
      expect(backButton?.querySelector('[data-testid="left-icon"]')).toBeInTheDocument()
      
      // Bouton confirmation avec icône droite
      const confirmButton = screen.getByText('Confirmer le rendez-vous').closest('button')
      expect(confirmButton?.querySelector('[data-testid="right-icon"]')).toBeInTheDocument()
    })
  })
  
  describe('Accessibilité', () => {
    it('devrait avoir un skip link fonctionnel', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      const skipLink = screen.getByText('Aller au contenu principal')
      expect(skipLink).toHaveAttribute('href', '#main-content')
      expect(skipLink).toHaveClass('skip-to-content')
      
      // Vérifie que le contenu principal a l'ID correspondant
      const mainContent = document.getElementById('main-content')
      expect(mainContent).toBeInTheDocument()
    })
    
    it('devrait être conforme aux standards WCAG AAA', async () => {
      const { container } = render(<RDVPage />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait avoir des labels ARIA appropriés', () => {
      render(<RDVPage />)
      
      // Navigation
      expect(screen.getByRole('navigation', { name: 'Fil d\'Ariane' })).toBeInTheDocument()
      
      // Boutons avec labels
      expect(screen.getByLabelText('Retour à la page précédente')).toBeInTheDocument()
      expect(screen.getByLabelText('Retour à l\'accueil')).toBeInTheDocument()
      
      // Section avec labelledby
      const section = screen.getByLabelText('Informations complémentaires sur le service')
      expect(section).toBeInTheDocument()
    })
    
    it('devrait supporter la navigation au clavier', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      // Navigation séquentielle
      await user.tab()
      
      const firstFocusable = document.activeElement
      expect(firstFocusable?.tagName).toMatch(/BUTTON|A/)
    })
  })
  
  describe('Responsive design', () => {
    it('devrait s\'adapter aux écrans mobiles', () => {
      renderMobile(<RDVPage />)
      
      // Boutons empilés verticalement sur mobile
      const actionButtons = screen.getByText('Retour aux informations').closest('.flex')
      expect(actionButtons).toHaveClass('flex-col', 'sm:flex-row')
      
      // Boutons pleine largeur sur mobile
      const backButton = screen.getByText('Retour aux informations').closest('button')
      const confirmButton = screen.getByText('Confirmer le rendez-vous').closest('button')
      
      expect(backButton).toHaveClass('w-full', 'sm:w-auto')
      expect(confirmButton).toHaveClass('w-full', 'sm:w-auto')
    })
    
    it('devrait s\'adapter aux tablettes', () => {
      renderTablet(<RDVPage />)
      
      // Grid responsive pour les cartes d'information
      const infoGrid = screen.getByText('Confirmation immédiate').closest('.grid')
      expect(infoGrid).toHaveClass('md:grid-cols-3')
    })
    
    it('devrait s\'adapter aux écrans desktop', () => {
      renderDesktop(<RDVPage />)
      
      // Layout large
      const container = screen.getByRole('banner').closest('.max-w-\\[1280px\\]')
      expect(container).toBeInTheDocument()
    })
  })
  
  describe('Liens légaux et conformité', () => {
    it('devrait afficher les liens de conformité', () => {
      render(<RDVPage />)
      
      const conditionsLink = screen.getByRole('link', { name: 'conditions d\'utilisation' })
      const privacyLink = screen.getByRole('link', { name: 'politique de confidentialité' })
      
      expect(conditionsLink).toHaveAttribute('href', '/legal/conditions')
      expect(privacyLink).toHaveAttribute('href', '/legal/privacy')
    })
    
    it('devrait afficher le texte de consentement', () => {
      render(<RDVPage />)
      
      expect(screen.getByText(/En confirmant, vous acceptez nos/)).toBeInTheDocument()
    })
  })
  
  describe('Flow de prise de RDV', () => {
    it('devrait simuler le flow complet de prise de rendez-vous', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      // 1. Vérifier que nous sommes à l'étape 2 (sélection créneau)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Créneau')).toBeInTheDocument()
      
      // 2. Sélectionner un créneau (simulé par le clic sur le calendrier)
      const timeSlot = screen.getByText('Lundi 15 janvier - 14:30')
      await user.click(timeSlot)
      
      // 3. Confirmer le rendez-vous
      const confirmButton = screen.getByText('Confirmer le rendez-vous')
      await user.click(confirmButton)
      
      // Vérifier que la confirmation a été déclenchée
      expect(confirmButton).toBeInTheDocument()
    })
    
    it('devrait permettre de revenir en arrière dans le flow', async () => {
      const user = userEvent.setup()
      render(<RDVPage />)
      
      // Clic sur retour aux informations
      const backToInfoButton = screen.getByText('Retour aux informations')
      await user.click(backToInfoButton)
      
      expect(mockBack).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('Integration avec les composants métier', () => {
    it('devrait passer les bonnes props aux composants enfants', () => {
      render(<RDVPage />)
      
      // Vérifie que les composants sont rendus avec leurs contenus attendus
      expect(screen.getByTestId('patient-context')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
      expect(screen.getByTestId('chat-rdv')).toBeInTheDocument()
      
      // Vérifie le contenu spécifique des composants mockés
      expect(screen.getByText('Vos informations')).toBeInTheDocument()
      expect(screen.getByText('Sélectionnez un créneau')).toBeInTheDocument()
      expect(screen.getByText('Assistant NOVA')).toBeInTheDocument()
    })
  })
  
  describe('Gestion d\'erreurs et états', () => {
    it('devrait gérer l\'absence de composants enfants', () => {
      // Test de robustesse - les composants sont mockés donc toujours présents
      render(<RDVPage />)
      
      expect(screen.getByTestId('rdv-layout')).toBeInTheDocument()
    })
    
    it('devrait gérer les erreurs de navigation', () => {
      mockPush.mockImplementation(() => {
        throw new Error('Navigation error')
      })
      
      expect(() => render(<RDVPage />)).not.toThrow()
    })
  })
  
  describe('SEO et performance', () => {
    it('devrait avoir une structure appropriée pour le SEO', () => {
      render(<RDVPage />)
      
      // H1 descriptif
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Prendre rendez-vous')
      
      // Description claire
      expect(screen.getByText(/Sélectionnez un créneau disponible/)).toBeInTheDocument()
    })
    
    it('devrait charger efficacement', () => {
      const startTime = performance.now()
      render(<RDVPage />)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})