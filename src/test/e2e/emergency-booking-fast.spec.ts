/**
 * Tests E2E - Urgence dentaire < 2 minutes
 * 
 * Scénario: Patient avec urgence dentaire (douleur intense)
 * Objectifs: Tester le parcours d'urgence ultra-rapide
 * - Accès direct aux urgences depuis n'importe où
 * - Formulaire simplifié (3 champs essentiels)
 * - Prise en charge < 2 minutes
 * - Contact immédiat avec praticien de garde
 * - Géolocalisation du cabinet le plus proche
 */

import { test, expect, Page } from '@playwright/test'

// Données patient urgence
const EMERGENCY_PATIENT = {
  name: 'Ahmed Mansouri',
  phone: '+213777654321',
  emergency: {
    type: 'Douleur intense',
    description: 'Douleur soudaine molaire gauche, insupportable depuis 2h',
    location: 'Alger Centre',
    severity: 'Critique'
  }
}

// Helper pour remplir le formulaire d'urgence rapidement
async function fillEmergencyFormFast(page: Page) {
  // Formulaire ultra-simplifié (3 champs seulement)
  await page.fill('[data-testid="emergency-name"]', EMERGENCY_PATIENT.name)
  await page.fill('[data-testid="emergency-phone"]', EMERGENCY_PATIENT.phone)
  await page.selectOption('[data-testid="emergency-type"]', EMERGENCY_PATIENT.emergency.type)
  
  // Auto-complétion de la localisation
  await page.fill('[data-testid="emergency-location"]', 'Alger')
  await page.click('[data-testid="location-suggestion-alger-centre"]')
}

// Helper pour vérifier la réponse d'urgence
async function verifyEmergencyResponse(page: Page) {
  // Confirmation immédiate
  await expect(page.locator('[data-testid="emergency-confirmed"]')).toBeVisible()
  
  // Numéro d'urgence attribué
  await expect(page.locator('[data-testid="emergency-id"]')).toBeVisible()
  
  // Temps de réponse affiché
  await expect(page.locator('[data-testid="response-time"]')).toContainText('< 5 minutes')
  
  // Cabinet le plus proche
  await expect(page.locator('[data-testid="nearest-cabinet"]')).toBeVisible()
  
  // Contact praticien de garde
  await expect(page.locator('[data-testid="on-call-dentist"]')).toBeVisible()
}

test.describe('Urgence Dentaire - Parcours < 2 minutes', () => {
  test.beforeEach(async ({ page }) => {
    // Configuration mobile-first (la plupart des urgences sont mobiles)
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Permettre la géolocalisation
    await page.context().grantPermissions(['geolocation'])
    
    // Simuler position Alger Centre
    await page.context().setGeolocation({
      latitude: 36.7631,
      longitude: 3.0506
    })
  })
  
  test('devrait traiter une urgence dentaire en moins de 2 minutes', async ({ page }) => {
    const startTime = Date.now()
    
    // Étape 1: Accès direct urgence depuis page d'accueil (5-10 secondes)
    await test.step('Accès urgence ultra-rapide', async () => {
      await page.goto('/')
      
      // Le bouton d'urgence doit être immédiatement visible
      await expect(page.locator('[data-testid="emergency-cta"]')).toBeVisible()
      
      // Animation d'attention (pulse) pour attirer l'œil
      await expect(page.locator('[data-testid="emergency-cta"]')).toHaveClass(/medical-pulse/)
      
      // Clic sur urgence
      await page.click('[data-testid="emergency-cta"]')
      
      // Redirection immédiate (< 1 seconde)
      await expect(page).toHaveURL('/urgences')
      
      const accessTime = Date.now() - startTime
      expect(accessTime).toBeLessThan(10000) // < 10 secondes pour l'accès
    })
    
    // Étape 2: Formulaire d'urgence ultra-simplifié (30-45 secondes)
    await test.step('Formulaire urgence simplifié', async () => {
      // Vérifier la structure d'urgence
      await expect(page.locator('h1')).toContainText('Urgence dentaire')
      await expect(page.locator('[data-testid="urgency-banner"]')).toBeVisible()
      
      // Message rassurant immédiat
      await expect(page.locator('text=Nous allons vous aider immédiatement')).toBeVisible()
      await expect(page.locator('text=Un praticien va vous recontacter sous 5 minutes')).toBeVisible()
      
      // Remplir le formulaire simplifié
      await fillEmergencyFormFast(page)
      
      // Description rapide (optionnelle mais recommandée)
      await page.fill('[data-testid="emergency-description"]', EMERGENCY_PATIENT.emergency.description)
      
      // Niveau de douleur rapide (slider ou boutons)
      await page.click('[data-testid="pain-level-severe"]')
      
      const formTime = Date.now() - startTime
      expect(formTime).toBeLessThan(60000) // < 1 minute pour le formulaire
    })
    
    // Étape 3: Géolocalisation automatique du cabinet le plus proche (5-10 secondes)
    await test.step('Localisation cabinet le plus proche', async () => {
      // Bouton de soumission bien visible
      await expect(page.locator('[data-testid="submit-emergency"]')).toBeVisible()
      await expect(page.locator('[data-testid="submit-emergency"]')).toHaveClass(/emergency-touch-target/)
      
      // Soumettre l'urgence
      await page.click('[data-testid="submit-emergency"]')
      
      // Loading avec feedback rassurant
      await expect(page.locator('[data-testid="emergency-processing"]')).toBeVisible()
      await expect(page.locator('text=Recherche du praticien le plus proche')).toBeVisible()
      
      // Attendre le traitement (doit être rapide)
      await page.waitForSelector('[data-testid="emergency-confirmed"]', { timeout: 10000 })
      
      const locationTime = Date.now() - startTime
      expect(locationTime).toBeLessThan(90000) // < 1.5 minutes jusqu'ici
    })
    
    // Étape 4: Confirmation et contact immédiat (15-30 secondes)
    await test.step('Confirmation et prise en charge immédiate', async () => {
      await verifyEmergencyResponse(page)
      
      // Informations du cabinet le plus proche
      await expect(page.locator('[data-testid="cabinet-name"]')).toContainText('Cabinet')
      await expect(page.locator('[data-testid="cabinet-distance"]')).toContainText('km')
      await expect(page.locator('[data-testid="cabinet-eta"]')).toContainText('minutes')
      
      // Contact direct praticien
      await expect(page.locator('[data-testid="call-dentist-now"]')).toBeVisible()
      await expect(page.locator('[data-testid="dentist-phone"]')).toBeVisible()
      
      // Instructions immédiates
      await expect(page.locator('text=En attendant le contact')).toBeVisible()
      await expect(page.locator('text=Évitez les aliments chauds')).toBeVisible()
      await expect(page.locator('text=Appliquez du froid si possible')).toBeVisible()
      
      const confirmationTime = Date.now() - startTime
      expect(confirmationTime).toBeLessThan(120000) // < 2 minutes TOTAL
    })
    
    const totalTime = (Date.now() - startTime) / 1000
    console.warn(`Urgence traitée en ${totalTime} secondes`)
    
    // ASSERTION PRINCIPALE: < 2 minutes
    expect(totalTime).toBeLessThan(120) // 2 minutes max
  })
  
  test('devrait fonctionner même avec connexion lente', async ({ page }) => {
    // Simuler connexion 3G lente
    await page.context().route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200)) // Délai 200ms
      return route.continue()
    })
    
    const startTime = Date.now()
    
    await page.goto('/urgences')
    
    await test.step('Urgence avec connexion lente', async () => {
      // Même avec connexion lente, doit rester sous 3 minutes
      await fillEmergencyFormFast(page)
      await page.click('[data-testid="submit-emergency"]')
      
      await page.waitForSelector('[data-testid="emergency-confirmed"]', { timeout: 15000 })
      
      const totalTime = (Date.now() - startTime) / 1000
      expect(totalTime).toBeLessThan(180) // 3 minutes max avec connexion lente
    })
  })
  
  test('devrait permettre l\'appel direct d\'urgence', async ({ page }) => {
    await page.goto('/urgences')
    
    await test.step('Option appel direct', async () => {
      // Bouton d'appel d'urgence très visible
      await expect(page.locator('[data-testid="call-emergency-now"]')).toBeVisible()
      await expect(page.locator('[data-testid="emergency-phone-number"]')).toContainText('+213555000000')
      
      // Clic sur appel (simulé)
      await page.click('[data-testid="call-emergency-now"]')
      
      // Vérifier que l'action d'appel est déclenchée
      // Note: En test, on vérifie que l'URL tel: est générée
      const telLink = page.locator('[data-testid="call-emergency-now"]')
      await expect(telLink).toHaveAttribute('href', 'tel:+213555000000')
    })
  })
  
  test('devrait gérer plusieurs types d\'urgence rapidement', async ({ page }) => {
    await page.goto('/urgences')
    
    await test.step('Types d\'urgence prédéfinis', async () => {
      // Boutons rapides pour types d'urgence courants
      await expect(page.locator('[data-testid="urgent-pain"]')).toBeVisible()
      await expect(page.locator('[data-testid="trauma"]')).toBeVisible()
      await expect(page.locator('[data-testid="infection"]')).toBeVisible()
      await expect(page.locator('[data-testid="broken-tooth"]')).toBeVisible()
      
      // Test sélection rapide
      await page.click('[data-testid="urgent-pain"]')
      
      // Formulaire pré-rempli
      await expect(page.locator('[data-testid="emergency-type"]')).toHaveValue('Douleur intense')
      
      // Instructions spécifiques au type
      await expect(page.locator('text=Douleur dentaire sévère')).toBeVisible()
      await expect(page.locator('text=Prendre un antalgique si possible')).toBeVisible()
    })
  })
  
  test('devrait afficher le statut en temps réel', async ({ page }) => {
    await page.goto('/urgences')
    
    await fillEmergencyFormFast(page)
    await page.click('[data-testid="submit-emergency"]')
    
    await test.step('Suivi temps réel de l\'urgence', async () => {
      // Attendre la confirmation
      await page.waitForSelector('[data-testid="emergency-confirmed"]')
      
      // Vérifier le statut temps réel
      await expect(page.locator('[data-testid="status-live"]')).toBeVisible()
      await expect(page.locator('text=Urgence transmise')).toBeVisible()
      
      // Simuler l'évolution du statut
      await page.evaluate(() => {
        // Simuler WebSocket update
        window.dispatchEvent(new CustomEvent('emergency-status-update', {
          detail: { status: 'dentist-contacted', time: new Date() }
        }))
      })
      
      // Vérifier mise à jour
      await expect(page.locator('text=Praticien contacté')).toBeVisible()
    })
  })
  
  test('devrait fonctionner en mode hors-ligne', async ({ page }) => {
    await page.goto('/urgences')
    
    // Remplir le formulaire
    await fillEmergencyFormFast(page)
    
    await test.step('Urgence hors-ligne', async () => {
      // Passer hors ligne
      await page.context().setOffline(true)
      
      // Tenter de soumettre
      await page.click('[data-testid="submit-emergency"]')
      
      // Vérifier le message hors-ligne
      await expect(page.locator('text=Données sauvegardées')).toBeVisible()
      await expect(page.locator('text=Transmission dès reconnexion')).toBeVisible()
      
      // Afficher numéro d'urgence pour appel direct
      await expect(page.locator('[data-testid="offline-emergency-phone"]')).toBeVisible()
      
      // Remettre en ligne
      await page.context().setOffline(false)
      
      // Vérifier transmission automatique
      await expect(page.locator('text=Urgence transmise')).toBeVisible()
    })
  })
  
  test('devrait gérer les urgences multiples (plusieurs patients)', async ({ page }) => {
    await page.goto('/urgences')
    
    await test.step('File d\'attente urgences', async () => {
      await fillEmergencyFormFast(page)
      await page.click('[data-testid="submit-emergency"]')
      
      await page.waitForSelector('[data-testid="emergency-confirmed"]')
      
      // Vérifier position dans la file
      await expect(page.locator('[data-testid="queue-position"]')).toBeVisible()
      await expect(page.locator('text=Position dans la file')).toBeVisible()
      
      // Temps d'attente estimé
      await expect(page.locator('[data-testid="estimated-wait"]')).toBeVisible()
      
      // Option d'escalade si très urgent
      await expect(page.locator('[data-testid="escalate-urgent"]')).toBeVisible()
    })
  })
  
  test('devrait envoyer des confirmations immédiates', async ({ page }) => {
    await page.goto('/urgences')
    
    await fillEmergencyFormFast(page)
    await page.click('[data-testid="submit-emergency"]')
    
    await test.step('Confirmations multiples urgence', async () => {
      await page.waitForSelector('[data-testid="emergency-confirmed"]')
      
      // SMS immédiat
      await expect(page.locator('text=SMS envoyé')).toBeVisible()
      
      // Email de confirmation
      await expect(page.locator('text=Email envoyé')).toBeVisible()
      
      // Numéro de suivi
      await expect(page.locator('[data-testid="emergency-tracking-number"]')).toBeVisible()
      
      // QR Code pour suivi rapide
      await expect(page.locator('[data-testid="emergency-qr-code"]')).toBeVisible()
    })
  })
  
  test('devrait adapter l\'interface pour les seniors', async ({ page }) => {
    // Simuler utilisateur senior
    await page.setViewportSize({ width: 768, height: 1024 }) // Tablette
    
    await page.goto('/urgences')
    
    await test.step('Interface adaptée seniors', async () => {
      // Vérifier les cibles tactiles grandes
      const emergencyButton = page.locator('[data-testid="submit-emergency"]')
      await expect(emergencyButton).toHaveClass(/emergency-touch-target/) // 72px minimum
      
      // Texte plus gros
      await expect(page.locator('h1')).toHaveClass(/text-2xl|text-3xl/)
      
      // Contraste élevé
      await expect(page.locator('[data-testid="emergency-cta"]')).toHaveClass(/medical-button-urgent/)
      
      // Instructions claires et simples
      await expect(page.locator('text=1. Nom et téléphone')).toBeVisible()
      await expect(page.locator('text=2. Type d\'urgence')).toBeVisible()
      await expect(page.locator('text=3. Cliquer Valider')).toBeVisible()
    })
  })
  
  test('devrait supporter les langues (berbère, arabe)', async ({ page }) => {
    await page.goto('/urgences?lang=ar')
    
    await test.step('Support multilingue urgence', async () => {
      // Vérifier l'interface en arabe
      await expect(page.locator('h1')).toContainText('طوارئ الأسنان')
      
      // Bouton d'urgence en arabe
      await expect(page.locator('[data-testid="submit-emergency"]')).toContainText('إرسال')
      
      // Passer en berbère
      await page.selectOption('[data-testid="language-select"]', 'ber')
      
      // Vérifier changement de langue
      await expect(page.locator('h1')).toContainText('Urgence dentaire') // Fallback FR
    })
  })
})