/**
 * Tests E2E - Parcours patient anxieux (Fatima)
 * 
 * Scénario: Fatima, 45 ans, première visite dentaire depuis 10 ans
 * Objectifs: Tester le parcours complet d'un patient anxieux
 * - Rassurance tout au long du processus
 * - Informations claires sur la procédure
 * - Options pour les patients anxieux
 * - Temps de parcours < 3 minutes
 * - Support chat en temps réel
 */

import { test, expect, Page } from '@playwright/test'

// Données du patient type anxieux
const ANXIOUS_PATIENT = {
  name: 'Fatima Benhamou',
  phone: '+213666789012',
  email: 'fatima.benhamou@email.com',
  age: 45,
  concerns: [
    'Première visite depuis longtemps',
    'Anxiété dentaire',
    'Peur de la douleur'
  ]
}

// Helpers pour le parcours anxieux
async function fillPatientInfoWithReassurance(page: Page) {
  // Étape 1: Informations personnelles avec messages rassurants
  await page.fill('[data-testid="patient-name"]', ANXIOUS_PATIENT.name)
  await page.fill('[data-testid="patient-phone"]', ANXIOUS_PATIENT.phone)
  await page.fill('[data-testid="patient-email"]', ANXIOUS_PATIENT.email)
  
  // Sélectionner "Première visite depuis longtemps"
  await page.check('[data-testid="first-visit-long-time"]')
  
  // Sélectionner anxiété dentaire
  await page.check('[data-testid="dental-anxiety"]')
  
  // Vérifier que les messages rassurants apparaissent
  await expect(page.locator('[data-testid="reassurance-message"]')).toBeVisible()
  await expect(page.locator('text=Nous comprenons votre anxiété')).toBeVisible()
}

async function selectComfortableTimeSlot(page: Page) {
  // Privilégier les créneaux matinaux (moins stressants)
  await page.click('[data-testid="morning-slot-preference"]')
  
  // Sélectionner un créneau avec Dr. spécialisé patients anxieux
  await page.click('[data-testid="slot-dr-gentle"]')
  
  // Vérifier les informations sur le praticien
  await expect(page.locator('text=Spécialisé patients anxieux')).toBeVisible()
  await expect(page.locator('text=Techniques de relaxation')).toBeVisible()
}

test.describe('Parcours Patient Anxieux - Fatima', () => {
  test.beforeEach(async ({ page }) => {
    // Configurer le viewport pour tester responsive
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Aller à la page d'accueil
    await page.goto('/')
    
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle')
  })
  
  test('devrait compléter le parcours complet en moins de 3 minutes', async ({ page }) => {
    const startTime = Date.now()
    
    // Étape 1: Page d'accueil - Clic sur "Prendre RDV"
    await test.step('Navigation depuis la page d\'accueil', async () => {
      await expect(page.locator('h1')).toContainText('Prenez rendez-vous dentaire')
      
      // Cliquer sur le CTA principal
      await page.click('[data-testid="main-cta-button"]')
      
      // Vérifier redirection vers RDV
      await expect(page).toHaveURL('/rdv')
      await expect(page.locator('h1')).toContainText('Prendre rendez-vous')
    })
    
    // Étape 2: Informations patient avec gestion de l'anxiété
    await test.step('Saisie des informations avec support anxiété', async () => {
      await fillPatientInfoWithReassurance(page)
      
      // Vérifier que le chat d'assistance est activé
      await expect(page.locator('[data-testid="chat-assistance"]')).toBeVisible()
      await expect(page.locator('text=Je suis là pour vous aider')).toBeVisible()
      
      // Cliquer sur "Continuer"
      await page.click('[data-testid="continue-button"]')
      
      // Vérifier progression
      await expect(page.locator('[data-testid="progress-step-2"]')).toHaveClass(/active/)
    })
    
    // Étape 3: Sélection de créneau avec options confort
    await test.step('Sélection créneau adapté aux patients anxieux', async () => {
      await selectComfortableTimeSlot(page)
      
      // Vérifier les options de confort proposées
      await expect(page.locator('text=Musique relaxante')).toBeVisible()
      await expect(page.locator('text=Consultation préparatoire')).toBeVisible()
      await expect(page.locator('text=Accompagnant autorisé')).toBeVisible()
      
      // Sélectionner les options de confort
      await page.check('[data-testid="relaxing-music"]')
      await page.check('[data-testid="preparatory-consultation"]')
      
      // Continuer vers confirmation
      await page.click('[data-testid="select-slot-button"]')
    })
    
    // Étape 4: Confirmation avec informations rassurantes
    await test.step('Confirmation avec détails rassurants', async () => {
      // Vérifier le résumé du RDV
      await expect(page.locator('[data-testid="appointment-summary"]')).toBeVisible()
      await expect(page.locator('text=Dr. spécialisé patients anxieux')).toBeVisible()
      await expect(page.locator('text=Consultation préparatoire incluse')).toBeVisible()
      
      // Vérifier les informations de préparation
      await expect(page.locator('text=Aucune préparation spéciale requise')).toBeVisible()
      await expect(page.locator('text=Équipe formée aux patients anxieux')).toBeVisible()
      
      // Confirmer le rendez-vous
      await page.click('[data-testid="confirm-appointment"]')
      
      // Attendre la confirmation
      await expect(page.locator('[data-testid="confirmation-success"]')).toBeVisible()
      await expect(page.locator('text=Rendez-vous confirmé')).toBeVisible()
    })
    
    // Étape 5: Vérification du support post-booking
    await test.step('Support post-réservation pour patient anxieux', async () => {
      // Vérifier les informations de suivi
      await expect(page.locator('text=SMS de rappel 48h avant')).toBeVisible()
      await expect(page.locator('text=Appel de courtoisie la veille')).toBeVisible()
      await expect(page.locator('text=Techniques de relaxation envoyées par email')).toBeVisible()
      
      // Vérifier les contacts d'urgence
      await expect(page.locator('text=Ligne d\'urgence 24h/24')).toBeVisible()
      await expect(page.locator('[data-testid="emergency-contact"]')).toContainText('+213555000000')
      
      // Télécharger le guide de préparation
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-preparation-guide"]')
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('guide-preparation-visite')
    })
    
    const endTime = Date.now()
    const totalTime = (endTime - startTime) / 1000
    
    // Vérifier que le parcours prend moins de 3 minutes
    expect(totalTime).toBeLessThan(180) // 3 minutes
    console.log(`Parcours patient anxieux complété en ${totalTime}s`)
  })
  
  test('devrait offrir un support chat personnalisé', async ({ page }) => {
    await page.goto('/rdv')
    
    await test.step('Activation du chat d\'assistance', async () => {
      // Sélectionner "Patient anxieux" lors de l'accueil
      await page.check('[data-testid="patient-type-anxious"]')
      
      // Vérifier que le chat s'adapte
      await expect(page.locator('[data-testid="chat-assistant"]')).toBeVisible()
      await expect(page.locator('text=Bonjour, je comprends que cette visite peut vous inquiéter')).toBeVisible()
      
      // Tester les réponses prédéfinies pour patients anxieux
      await page.click('[data-testid="chat-option-anxiety"]')
      
      // Vérifier la réponse adaptée
      await expect(page.locator('text=Nos praticiens utilisent des techniques de relaxation')).toBeVisible()
      await expect(page.locator('text=Vous pouvez demander une pause à tout moment')).toBeVisible()
    })
    
    await test.step('Questions fréquentes patients anxieux', async () => {
      // Cliquer sur "Questions fréquentes"
      await page.click('[data-testid="faq-anxious-patients"]')
      
      // Vérifier les questions spécifiques
      await expect(page.locator('text=Est-ce que ça va faire mal ?')).toBeVisible()
      await expect(page.locator('text=Puis-je venir avec quelqu\'un ?')).toBeVisible()
      await expect(page.locator('text=Que se passe-t-il si je panique ?')).toBeVisible()
      
      // Tester une question
      await page.click('[data-testid="faq-will-it-hurt"]')
      await expect(page.locator('text=Nous utilisons des techniques d\'anesthésie moderne')).toBeVisible()
    })
  })
  
  test('devrait permettre la modification facile du RDV', async ({ page }) => {
    // Simuler un patient qui veut changer son RDV
    await page.goto('/rdv')
    
    // Remplir les informations et aller jusqu'à la sélection
    await fillPatientInfoWithReassurance(page)
    await page.click('[data-testid="continue-button"]')
    
    await test.step('Modification du créneau sélectionné', async () => {
      // Sélectionner un premier créneau
      await page.click('[data-testid="slot-morning-1"]')
      
      // Changer d'avis et sélectionner un autre
      await page.click('[data-testid="change-slot-button"]')
      await page.click('[data-testid="slot-afternoon-1"]')
      
      // Vérifier que le changement est pris en compte
      await expect(page.locator('[data-testid="selected-slot"]')).toContainText('14:30')
    })
    
    await test.step('Modification des options de confort', async () => {
      // Décocher une option précédemment cochée
      await page.uncheck('[data-testid="relaxing-music"]')
      
      // Ajouter une nouvelle option
      await page.check('[data-testid="sedation-option"]')
      
      // Vérifier que les coûts sont mis à jour
      await expect(page.locator('[data-testid="total-cost"]')).toBeVisible()
    })
  })
  
  test('devrait gérer les cas d\'urgence dentaire', async ({ page }) => {
    await page.goto('/')
    
    await test.step('Signalement d\'urgence', async () => {
      // Cliquer sur le bouton d'urgence
      await page.click('[data-testid="emergency-button"]')
      
      // Vérifier redirection vers urgences
      await expect(page).toHaveURL('/urgences')
      await expect(page.locator('h1')).toContainText('Urgence dentaire')
      
      // Remplir le formulaire d'urgence
      await page.fill('[data-testid="emergency-name"]', ANXIOUS_PATIENT.name)
      await page.fill('[data-testid="emergency-phone"]', ANXIOUS_PATIENT.phone)
      await page.selectOption('[data-testid="emergency-type"]', 'Douleur intense')
      await page.fill('[data-testid="emergency-description"]', 'Douleur soudaine, molaire droite')
      
      // Indiquer l'anxiété
      await page.check('[data-testid="emergency-anxiety"]')
      
      // Soumettre
      await page.click('[data-testid="submit-emergency"]')
      
      // Vérifier la prise en charge immédiate
      await expect(page.locator('text=Urgence enregistrée')).toBeVisible()
      await expect(page.locator('text=Un praticien va vous rappeler dans les 5 minutes')).toBeVisible()
    })
  })
  
  test('devrait être accessible aux personnes à mobilité réduite', async ({ page }) => {
    await page.goto('/rdv')
    
    await test.step('Navigation uniquement au clavier', async () => {
      // Tester la navigation avec Tab
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
      
      // Continuer la navigation
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Activer avec Entrée
      await page.keyboard.press('Enter')
    })
    
    await test.step('Options accessibilité', async () => {
      // Vérifier les options spécifiques
      await expect(page.locator('text=Accès PMR disponible')).toBeVisible()
      await expect(page.locator('text=Places de parking handicapé')).toBeVisible()
      await expect(page.locator('text=Équipement adapté')).toBeVisible()
      
      // Sélectionner les besoins spéciaux
      await page.check('[data-testid="wheelchair-access"]')
      await page.check('[data-testid="sign-language"]')
    })
  })
  
  test('devrait gérer les erreurs réseau gracieusement', async ({ page }) => {
    await page.goto('/rdv')
    
    await test.step('Simulation de perte de connexion', async () => {
      // Remplir partiellement le formulaire
      await page.fill('[data-testid="patient-name"]', ANXIOUS_PATIENT.name)
      
      // Simuler une perte de réseau
      await page.context().setOffline(true)
      
      // Tenter de continuer
      await page.click('[data-testid="continue-button"]')
      
      // Vérifier le message d'erreur bienveillant
      await expect(page.locator('text=Connexion interrompue')).toBeVisible()
      await expect(page.locator('text=Vos informations sont sauvegardées')).toBeVisible()
      await expect(page.locator('text=Reconnexion automatique')).toBeVisible()
      
      // Restaurer la connexion
      await page.context().setOffline(false)
      
      // Vérifier que les données sont restaurées
      await expect(page.locator('[data-testid="patient-name"]')).toHaveValue(ANXIOUS_PATIENT.name)
    })
  })
  
  test('devrait confirmer par multiple canaux', async ({ page }) => {
    // Compléter un RDV
    await page.goto('/rdv')
    await fillPatientInfoWithReassurance(page)
    await page.click('[data-testid="continue-button"]')
    await selectComfortableTimeSlot(page)
    await page.click('[data-testid="select-slot-button"]')
    await page.click('[data-testid="confirm-appointment"]')
    
    await test.step('Vérification des confirmations multiples', async () => {
      // Vérifier SMS
      await expect(page.locator('text=SMS envoyé au +213666789012')).toBeVisible()
      
      // Vérifier email
      await expect(page.locator('text=Email de confirmation envoyé')).toBeVisible()
      
      // Vérifier calendrier
      await page.click('[data-testid="add-to-calendar"]')
      await expect(page.locator('text=Ajouté à votre calendrier')).toBeVisible()
      
      // Vérifier les rappels automatiques
      await expect(page.locator('text=Rappel 48h avant par SMS')).toBeVisible()
      await expect(page.locator('text=Rappel 24h avant par email')).toBeVisible()
      await expect(page.locator('text=Appel de courtoisie la veille')).toBeVisible()
    })
  })
})