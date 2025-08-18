/**
 * Tests unitaires pour PatientSummaryCard
 * 
 * Tests couvrant:
 * - Affichage des données patient en temps réel
 * - Progression du rendez-vous (stepper)
 * - États d'appointment (selecting, confirming, confirmed, error)
 * - Actions utilisateur (édition, confirmation, annulation)
 * - Mode compact et expansion
 * - Position sticky et responsive
 * - Formatage données françaises (dates, téléphones)
 * - Mises à jour temps réel WebSocket
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import React from 'react'
import { vi } from 'vitest'
import { PatientSummaryCard, type PatientData, type AppointmentSummary } from '@/components/ui/medical/PatientSummaryCard'

// Données de test
const mockPatient: PatientData = {
  name: 'Amina Benali',
  phone: '+213555123456',
  email: 'amina.benali@email.com',
  age: 32,
  gender: 'F',
  lastVisit: new Date('2023-12-15'),
  totalVisits: 3,
  allergies: ['Pénicilline', 'Latex'],
  conditions: ['Bruxisme'],
  emergencyContact: {
    name: 'Mohamed Benali',
    phone: '+213666789012',
    relation: 'Époux'
  }
}

const mockAppointment: AppointmentSummary = {
  status: 'confirming',
  currentStep: 3,
  totalSteps: 4,
  selectedSlot: {
    date: new Date('2024-01-15T14:30:00.000Z'),
    time: '14:30',
    duration: 30,
    type: 'Consultation générale',
    practitioner: 'Dr. Sarah Amrani'
  },
  payment: {
    amount: 2500,
    method: 'card',
    status: 'pending'
  },
  notes: 'Patient anxieux - première visite',
  confirmationId: 'NOVA-2024-001'
}

describe('PatientSummaryCard', () => {
  beforeEach(() => {
    // Mock des fonctions de date pour cohérence
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T15:00:00.000Z'))
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  describe('Rendu de base', () => {
    it('devrait afficher le titre et le statut', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Votre rendez-vous')).toBeInTheDocument()
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
      expect(screen.getByText('🔄')).toBeInTheDocument() // Icône status confirming
    })
    
    it('devrait avoir les attributs d\'accessibilité appropriés', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          data-testid="summary-card"
        />
      )
      
      const card = screen.getByTestId('summary-card')
      expect(card).toHaveAttribute('role', 'complementary')
      expect(card).toHaveAttribute('aria-label', 'Résumé du rendez-vous en cours')
    })
    
    it('devrait appliquer la position sticky par défaut', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          data-testid="sticky-card"
        />
      )
      
      const card = screen.getByTestId('sticky-card')
      expect(card).toHaveClass('sticky', 'top-4')
    })
  })
  
  describe('Indicateur de progression', () => {
    it('devrait afficher la progression correcte', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Étape 3 sur 4')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '3')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '4')
      expect(progressBar).toHaveAttribute('aria-label', 'Progression: étape 3 sur 4')
    })
    
    it('devrait animer la barre de progression', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out')
      expect(progressBar).toHaveStyle({ width: '75%' })
    })
    
    it('devrait gérer différents niveaux de progression', () => {
      const appointmentStep1 = { ...mockAppointment, currentStep: 1, totalSteps: 4 }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentStep1}
        />
      )
      
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle({ width: '25%' })
    })
  })
  
  describe('États de statut', () => {
    it.each([
      ['selecting', 'Sélection en cours', '⏳', 'bg-medical-yellow-100'],
      ['confirming', 'Confirmation', '🔄', 'bg-medical-blue-100'],
      ['confirmed', 'Confirmé', '✅', 'bg-medical-green-100'],
      ['error', 'Erreur', '❌', 'bg-medical-red-100'],
    ])('devrait afficher le statut %s correctement', (status, label, icon, colorClass) => {
      const appointmentWithStatus = { ...mockAppointment, status: status as any }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentWithStatus}
        />
      )
      
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(icon)).toBeInTheDocument()
      
      const badge = screen.getByText(label).closest('span')
      expect(badge).toHaveClass(colorClass)
    })
  })
  
  describe('Informations patient', () => {
    it('devrait afficher les informations de base du patient', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Amina Benali')).toBeInTheDocument()
      expect(screen.getByText('+213 55 512 3456')).toBeInTheDocument() // Formaté
      expect(screen.getByText('32 ans')).toBeInTheDocument()
    })
    
    it('devrait formater correctement les numéros de téléphone', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      // Vérifie le formatage E.164 vers affichage français
      expect(screen.getByText('+213 55 512 3456')).toBeInTheDocument()
    })
    
    it('devrait afficher les boutons d\'édition', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          onEdit={handleEdit}
        />
      )
      
      const editButtons = screen.getAllByLabelText(/Modifier/)
      expect(editButtons).toHaveLength(2) // Nom et téléphone
      
      await user.click(editButtons[0]) // Bouton modifier nom
      expect(handleEdit).toHaveBeenCalledWith('name')
      
      await user.click(editButtons[1]) // Bouton modifier téléphone
      expect(handleEdit).toHaveBeenCalledWith('phone')
    })
    
    it('ne devrait pas afficher les informations manquantes', () => {
      const patientPartiel = { name: 'Test User' }
      
      render(
        <PatientSummaryCard
          patient={patientPartiel}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.queryByText('Téléphone')).not.toBeInTheDocument()
      expect(screen.queryByText('Âge')).not.toBeInTheDocument()
    })
  })
  
  describe('Détails du rendez-vous', () => {
    it('devrait afficher les informations du créneau sélectionné', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      // Vérifie le formatage de date en français
      expect(screen.getByText('lundi 15 janvier 2024')).toBeInTheDocument()
      expect(screen.getByText('14:30 (30 min)')).toBeInTheDocument()
      expect(screen.getByText('Consultation générale • Dr. Sarah Amrani')).toBeInTheDocument()
    })
    
    it('devrait permettre de modifier le créneau', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          onEdit={handleEdit}
        />
      )
      
      const editSlotButton = screen.getByLabelText('Modifier le créneau')
      await user.click(editSlotButton)
      
      expect(handleEdit).toHaveBeenCalledWith('slot')
    })
    
    it('devrait gérer l\'absence de créneau sélectionné', () => {
      const appointmentSansSlot = { ...mockAppointment, selectedSlot: undefined }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentSansSlot}
        />
      )
      
      expect(screen.queryByText('Détails du rendez-vous')).not.toBeInTheDocument()
    })
  })
  
  describe('Informations de paiement', () => {
    it('devrait afficher les détails de paiement', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('2500 DA')).toBeInTheDocument()
      expect(screen.getByText('Carte bancaire')).toBeInTheDocument()
    })
    
    it.each([
      ['card', 'Carte bancaire'],
      ['cash', 'Espèces'],
      ['insurance', 'Assurance'],
    ])('devrait afficher la méthode de paiement %s', (method, displayText) => {
      const appointmentWithPayment = {
        ...mockAppointment,
        payment: { ...mockAppointment.payment!, method: method as any }
      }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentWithPayment}
        />
      )
      
      expect(screen.getByText(displayText)).toBeInTheDocument()
    })
    
    it.each([
      ['completed', 'bg-medical-green-500'],
      ['processing', 'bg-medical-yellow-500'],
      ['failed', 'bg-medical-red-500'],
      ['pending', 'bg-medical-gray-300'],
    ])('devrait afficher l\'indicateur de statut %s', (status, colorClass) => {
      const appointmentWithStatus = {
        ...mockAppointment,
        payment: { ...mockAppointment.payment!, status: status as any }
      }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentWithStatus}
          data-testid="payment-card"
        />
      )
      
      const statusIndicator = screen.getByTestId('payment-card')
        .querySelector('.w-2.h-2.rounded-full')
      expect(statusIndicator).toHaveClass(colorClass)
    })
  })
  
  describe('Notes et confirmation', () => {
    it('devrait afficher les notes', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Patient anxieux - première visite')).toBeInTheDocument()
    })
    
    it('devrait afficher l\'ID de confirmation', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
      expect(screen.getByText('#NOVA-2024-001')).toBeInTheDocument()
    })
    
    it('ne devrait pas afficher les sections vides', () => {
      const appointmentSansExtras = {
        ...mockAppointment,
        notes: undefined,
        confirmationId: undefined
      }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentSansExtras}
        />
      )
      
      expect(screen.queryByText('Notes')).not.toBeInTheDocument()
      expect(screen.queryByText('Confirmation')).not.toBeInTheDocument()
    })
  })
  
  describe('Actions utilisateur', () => {
    it('devrait afficher le bouton de confirmation quand approprié', async () => {
      const user = userEvent.setup()
      const handleConfirm = vi.fn()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment} // status: 'confirming'
          onConfirm={handleConfirm}
        />
      )
      
      const confirmButton = screen.getByLabelText('Confirmer le rendez-vous')
      expect(confirmButton).toBeInTheDocument()
      expect(confirmButton).toHaveClass('medical-button-primary')
      
      await user.click(confirmButton)
      expect(handleConfirm).toHaveBeenCalledTimes(1)
    })
    
    it('devrait afficher le bouton d\'annulation', async () => {
      const user = userEvent.setup()
      const handleCancel = vi.fn()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          onCancel={handleCancel}
        />
      )
      
      const cancelButton = screen.getByLabelText('Annuler le rendez-vous')
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).toHaveClass('medical-button-secondary')
      
      await user.click(cancelButton)
      expect(handleCancel).toHaveBeenCalledTimes(1)
    })
    
    it('ne devrait pas afficher d\'annulation pour un RDV confirmé', () => {
      const appointmentConfirmed = { ...mockAppointment, status: 'confirmed' as const }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentConfirmed}
          onCancel={vi.fn()}
        />
      )
      
      expect(screen.queryByLabelText('Annuler le rendez-vous')).not.toBeInTheDocument()
    })
  })
  
  describe('Mode compact et expansion', () => {
    it('devrait supporter le mode compact', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          compact
          data-testid="compact-card"
        />
      )
      
      const card = screen.getByTestId('compact-card')
      expect(card).toHaveClass('p-3')
      
      // Bouton d'expansion devrait être présent
      expect(screen.getByLabelText('Développer')).toBeInTheDocument()
    })
    
    it('devrait permettre d\'étendre/réduire en mode compact', async () => {
      const user = userEvent.setup()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          compact
        />
      )
      
      const expandButton = screen.getByLabelText('Développer')
      await user.click(expandButton)
      
      // Devrait maintenant afficher "Réduire"
      expect(screen.getByLabelText('Réduire')).toBeInTheDocument()
      
      // Les détails devraient être visibles
      expect(screen.getByText('Informations patient')).toBeInTheDocument()
    })
    
    it('devrait masquer les détails en mode compact fermé', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          compact
        />
      )
      
      // Les sections détaillées ne devraient pas être visibles
      expect(screen.queryByText('Informations patient')).not.toBeInTheDocument()
      expect(screen.queryByText('Détails du rendez-vous')).not.toBeInTheDocument()
    })
  })
  
  describe('Mises à jour temps réel', () => {
    it('devrait afficher l\'indicateur temps réel', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          realTimeUpdates
        />
      )
      
      expect(screen.getByText('Mis à jour en temps réel')).toBeInTheDocument()
      expect(screen.getByText('16:00')).toBeInTheDocument() // Heure actuelle mockée
      
      const indicator = screen.getByText('Mis à jour en temps réel')
        .closest('div')?.querySelector('.animate-pulse')
      expect(indicator).toBeInTheDocument()
    })
    
    it('devrait mettre à jour l\'heure périodiquement', async () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          realTimeUpdates
        />
      )
      
      expect(screen.getByText('16:00')).toBeInTheDocument()
      
      // Avance le temps de 30 secondes
      vi.advanceTimersByTime(30000)
      
      await waitFor(() => {
        expect(screen.getByText('16:00')).toBeInTheDocument() // Toujours la même minute
      })
    })
  })
  
  describe('Position sticky et responsive', () => {
    it('devrait pouvoir désactiver la position sticky', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          sticky={false}
          data-testid="non-sticky-card"
        />
      )
      
      const card = screen.getByTestId('non-sticky-card')
      expect(card).not.toHaveClass('sticky')
    })
    
    it('devrait avoir une largeur maximale appropriée', () => {
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          data-testid="width-card"
        />
      )
      
      const card = screen.getByTestId('width-card')
      expect(card).toHaveClass('max-w-md')
    })
  })
  
  describe('Accessibilité', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const { container } = render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait avoir une navigation clavier appropriée', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
          onEdit={handleEdit}
        />
      )
      
      // Navigue vers le premier bouton d'édition
      await user.tab()
      await user.tab()
      await user.tab()
      
      const editButton = screen.getAllByLabelText(/Modifier/)[0]
      expect(editButton).toHaveFocus()
      
      // Active avec Entrée
      await user.keyboard('{Enter}')
      expect(handleEdit).toHaveBeenCalled()
    })
    
    it('devrait annoncer les changements d\'état importants', () => {
      const { rerender } = render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={mockAppointment}
        />
      )
      
      const appointmentConfirmed = { ...mockAppointment, status: 'confirmed' as const }
      
      rerender(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentConfirmed}
        />
      )
      
      expect(screen.getByText('Confirmé')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeInTheDocument()
    })
  })
  
  describe('Gestion d\'erreurs et cas limites', () => {
    it('devrait gérer un patient sans nom', () => {
      const patientSansNom = { phone: '+213555123456' }
      
      render(
        <PatientSummaryCard
          patient={patientSansNom}
          appointment={mockAppointment}
        />
      )
      
      // Ne devrait pas afficher la section patient
      expect(screen.queryByText('Informations patient')).not.toBeInTheDocument()
    })
    
    it('devrait gérer des données de paiement manquantes', () => {
      const appointmentSansPaiement = { ...mockAppointment, payment: undefined }
      
      render(
        <PatientSummaryCard
          patient={mockPatient}
          appointment={appointmentSansPaiement}
        />
      )
      
      expect(screen.queryByText('Paiement')).not.toBeInTheDocument()
    })
    
    it('devrait gérer un numéro de téléphone mal formaté', () => {
      const patientTelInvalide = { ...mockPatient, phone: '123456789' }
      
      render(
        <PatientSummaryCard
          patient={patientTelInvalide}
          appointment={mockAppointment}
        />
      )
      
      // Devrait afficher tel quel si pas E.164 valide
      expect(screen.getByText('123456789')).toBeInTheDocument()
    })
  })
})