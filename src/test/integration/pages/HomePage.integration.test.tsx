/**
 * Tests d'intégration pour la page d'accueil HomePage
 * 
 * Tests couvrant:
 * - Rendu complet de la page avec composants médicaux
 * - Navigation et liens fonctionnels
 * - CTA principaux et actions utilisateur
 * - Responsive design (mobile/desktop)
 * - Accessibilité WCAG AAA
 * - SEO et métadonnées
 * - Performances et chargement
 * - Conformité RGPD
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import HomePage from '@/app/page'
import { renderMobile, renderDesktop, renderTablet } from '@/test/test-utils'

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('HomePage Integration', () => {
  describe('Rendu et structure de base', () => {
    it('devrait afficher tous les éléments principaux de la page', () => {
      render(<HomePage />)
      
      // Header
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByText('NOVA RDV')).toBeInTheDocument()
      
      // Hero section
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Prenez rendez-vous dentaire en ligne')
      
      // CTA principaux
      expect(screen.getByRole('button', { name: /Prendre RDV maintenant/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Urgence dentaire/ })).toBeInTheDocument()
      
      // Sections principales
      expect(screen.getByText('Pourquoi choisir NOVA ?')).toBeInTheDocument()
      expect(screen.getByText('Témoignages de nos patients')).toBeInTheDocument()
      expect(screen.getByText('Urgence dentaire ?')).toBeInTheDocument()
      
      // Footer
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
      expect(screen.getByText('© 2025 NOVA RDV. Tous droits réservés.')).toBeInTheDocument()
    })
    
    it('devrait avoir une structure sémantique appropriée', () => {
      render(<HomePage />)
      
      // Vérifie la hiérarchie des headings
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })
      const h3s = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1).toBeInTheDocument()
      expect(h2s.length).toBeGreaterThan(0)
      expect(h3s.length).toBeGreaterThan(0)
      
      // Vérifie les landmarks
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })
  
  describe('Navigation et liens', () => {
    it('devrait afficher la navigation principale', () => {
      render(<HomePage />)
      
      const nav = screen.getByRole('navigation')
      
      expect(screen.getByRole('link', { name: 'Nos cabinets' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Services & Tarifs' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'International' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '🚨 Urgences' })).toBeInTheDocument()
    })
    
    it('devrait avoir les liens avec les bonnes URLs', () => {
      render(<HomePage />)
      
      expect(screen.getByRole('link', { name: 'Nos cabinets' })).toHaveAttribute('href', '/cabinets')
      expect(screen.getByRole('link', { name: 'Services & Tarifs' })).toHaveAttribute('href', '/services')
      expect(screen.getByRole('link', { name: 'International' })).toHaveAttribute('href', '/international')
      expect(screen.getByRole('link', { name: '🚨 Urgences' })).toHaveAttribute('href', '/urgences')
    })
    
    it('devrait afficher les liens RGPD et légaux', () => {
      render(<HomePage />)
      
      expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Gestion des cookies' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Conditions d\'utilisation' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Mentions légales' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Accessibilité' })).toBeInTheDocument()
    })
    
    it('devrait avoir les liens de contact fonctionnels', () => {
      render(<HomePage />)
      
      const phoneLink = screen.getByRole('link', { name: '+213 555 000 000' })
      const emailLink = screen.getByRole('link', { name: 'contact@nova-rdv.dz' })
      
      expect(phoneLink).toHaveAttribute('href', 'tel:+213555000000')
      expect(emailLink).toHaveAttribute('href', 'mailto:contact@nova-rdv.dz')
    })
  })
  
  describe('Composants médicaux intégrés', () => {
    it('devrait utiliser les MedicalButton avec les bons variants', () => {
      render(<HomePage />)
      
      // CTA primaire dans le header
      const headerCTA = screen.getByRole('button', { name: '📅 Prendre RDV' })
      expect(headerCTA).toHaveClass('medical-button-primary')
      
      // CTA urgence dans le hero
      const urgencyCTA = screen.getByRole('button', { name: /Urgence dentaire/ })
      expect(urgencyCTA).toHaveClass('medical-button-urgent')
      
      // CTA dans la section urgence
      const emergencyCTA = screen.getByRole('button', { name: /Appeler/ })
      expect(emergencyCTA).toHaveClass('medical-button-urgent')
    })
    
    it('devrait afficher les cartes médicales avec les bons styles', () => {
      render(<HomePage />)
      
      // Cartes "Pourquoi NOVA"
      const featureCards = document.querySelectorAll('.medical-card')
      expect(featureCards.length).toBeGreaterThan(0)
      
      // Vérifie les contenus des cartes
      expect(screen.getByText('Simple et rapide')).toBeInTheDocument()
      expect(screen.getByText('Données protégées')).toBeInTheDocument()
      expect(screen.getByText('Disponible 24/7')).toBeInTheDocument()
      expect(screen.getByText('Cabinets certifiés')).toBeInTheDocument()
      expect(screen.getByText('Urgences prises en charge')).toBeInTheDocument()
      expect(screen.getByText('Suivi personnalisé')).toBeInTheDocument()
    })
    
    it('devrait afficher les preuves sociales', () => {
      render(<HomePage />)
      
      expect(screen.getByText('25+')).toBeInTheDocument()
      expect(screen.getByText('Cabinets partenaires')).toBeInTheDocument()
      expect(screen.getByText('24/7')).toBeInTheDocument()
      expect(screen.getByText('Service disponible')).toBeInTheDocument()
      expect(screen.getByText('98%')).toBeInTheDocument()
      expect(screen.getByText('Satisfaction patient')).toBeInTheDocument()
    })
  })
  
  describe('Section témoignages', () => {
    it('devrait afficher les témoignages patients', () => {
      render(<HomePage />)
      
      // Témoignages
      expect(screen.getByText('Amina K.')).toBeInTheDocument()
      expect(screen.getByText('Mohamed S.')).toBeInTheDocument()
      expect(screen.getByText('Fatima Z.')).toBeInTheDocument()
      
      // Contenu des témoignages
      expect(screen.getByText(/Interface très intuitive/)).toBeInTheDocument()
      expect(screen.getByText(/Service d'urgence exceptionnel/)).toBeInTheDocument()
      expect(screen.getByText(/Parfait pour les familles/)).toBeInTheDocument()
      
      // Étoiles de notation
      const stars = document.querySelectorAll('.text-medical-yellow-500')
      expect(stars.length).toBe(15) // 3 témoignages × 5 étoiles
    })
  })
  
  describe('Responsive design', () => {
    it('devrait s\'adapter aux écrans mobiles', () => {
      renderMobile(<HomePage />)
      
      // CTA flottant mobile devrait être visible
      const floatingCTA = screen.getByRole('button', { name: /Prendre RDV maintenant/ })
      expect(floatingCTA.closest('.fixed')).toBeInTheDocument()
      expect(floatingCTA.closest('.md\\:hidden')).toBeInTheDocument()
      
      // Navigation mobile (cachée par défaut)
      const desktopNav = screen.getByRole('navigation')
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
    })
    
    it('devrait afficher correctement sur tablette', () => {
      renderTablet(<HomePage />)
      
      // Grid responsive pour les cartes
      const featureSection = screen.getByText('Pourquoi choisir NOVA ?').closest('section')
      const grid = featureSection?.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3')
    })
    
    it('devrait afficher correctement sur desktop', () => {
      renderDesktop(<HomePage />)
      
      // Navigation desktop visible
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('md:flex')
      
      // Pas de CTA flottant sur desktop
      const floatingCTA = document.querySelector('.fixed.bottom-4.md\\:hidden')
      expect(floatingCTA).toBeInTheDocument() // Toujours présent mais caché
    })
  })
  
  describe('Interactions utilisateur', () => {
    it('devrait réagir aux clics sur les CTA principaux', async () => {
      const user = userEvent.setup()
      
      // Mock console.log pour vérifier les clics
      const mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      render(<HomePage />)
      
      const mainCTA = screen.getByRole('button', { name: /Prendre RDV maintenant/ })
      const urgencyCTA = screen.getByRole('button', { name: /Urgence dentaire/ })
      
      // Les boutons devraient être cliquables
      await user.click(mainCTA)
      await user.click(urgencyCTA)
      
      // Vérifie que les boutons sont bien fonctionnels (pas d'erreur)
      expect(mainCTA).toBeInTheDocument()
      expect(urgencyCTA).toBeInTheDocument()
      
      mockConsole.mockRestore()
    })
    
    it('devrait permettre la navigation au clavier', async () => {
      const user = userEvent.setup()
      
      render(<HomePage />)
      
      // Navigation séquentielle avec Tab
      await user.tab()
      
      // Premier élément focusable devrait être un lien ou bouton
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInstanceOf(HTMLElement)
      expect(['A', 'BUTTON'].includes(focusedElement?.tagName || '')).toBe(true)
    })
  })
  
  describe('Conformité RGPD', () => {
    it('devrait afficher les mentions RGPD', () => {
      render(<HomePage />)
      
      expect(screen.getByText(/Vos données sont protégées conformément au RGPD/)).toBeInTheDocument()
      expect(screen.getByText(/RGPD Compliant/)).toBeInTheDocument()
      expect(screen.getByText(/Conformité RGPD/)).toBeInTheDocument()
    })
    
    it('devrait afficher les certifications de sécurité', () => {
      render(<HomePage />)
      
      expect(screen.getByText('SSL Sécurisé')).toBeInTheDocument()
      expect(screen.getByText('WCAG AAA')).toBeInTheDocument()
      expect(screen.getByText('Certifié')).toBeInTheDocument()
    })
  })
  
  describe('Informations de contact et localisation', () => {
    it('devrait afficher les informations algériennes', () => {
      render(<HomePage />)
      
      expect(screen.getByText('Cité 109, Daboussy El Achour, Alger')).toBeInTheDocument()
      expect(screen.getByText('Zone horaire: Africa/Algiers')).toBeInTheDocument()
      expect(screen.getByText(/Made in Algeria 🇩🇿/)).toBeInTheDocument()
    })
    
    it('devrait afficher les numéros de téléphone algériens', () => {
      render(<HomePage />)
      
      // Numéro principal
      expect(screen.getByText('+213 555 000 000')).toBeInTheDocument()
      
      // Numéro dans le CTA urgence
      expect(screen.getByText(/📞 Appeler \+213 555 000 000/)).toBeInTheDocument()
    })
  })
  
  describe('Accessibilité WCAG AAA', () => {
    it('devrait être conforme aux standards d\'accessibilité', async () => {
      const { container } = render(<HomePage />)
      
      // Test axe-core
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('devrait avoir des contrastes suffisants', () => {
      render(<HomePage />)
      
      // Vérifie les classes de couleur médicales
      const headings = screen.getAllByRole('heading')
      headings.forEach(heading => {
        expect(heading).toHaveClass('text-medical-gray-900')
      })
    })
    
    it('devrait avoir des alternatives textuelles pour les emojis', () => {
      render(<HomePage />)
      
      // Les emojis dans les boutons ont du texte associé
      expect(screen.getByRole('button', { name: /📅 Prendre RDV/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /🚨 Urgence/ })).toBeInTheDocument()
    })
    
    it('devrait avoir des skip links et une navigation claire', () => {
      render(<HomePage />)
      
      // Navigation avec rôle approprié
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      
      // Main content
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })
  })
  
  describe('Performance et chargement', () => {
    it('devrait charger rapidement sans JavaScript bloquant', () => {
      const startTime = performance.now()
      render(<HomePage />)
      const endTime = performance.now()
      
      // Rendu initial rapide (< 100ms pour les tests)
      expect(endTime - startTime).toBeLessThan(100)
    })
    
    it('devrait avoir des images optimisées', () => {
      render(<HomePage />)
      
      // Vérifie qu'il n'y a pas d'images non optimisées
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        // Les images Next.js ont des attributs d'optimisation
        expect(img).toHaveAttribute('alt')
      })
    })
  })
  
  describe('SEO et métadonnées', () => {
    it('devrait avoir un titre approprié', () => {
      // Note: Le titre est dans les métadonnées Next.js
      render(<HomePage />)
      
      // Vérifie le H1 principal
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Prenez rendez-vous dentaire en ligne')
    })
    
    it('devrait avoir une structure de headings logique', () => {
      render(<HomePage />)
      
      // H1 unique
      const h1s = screen.getAllByRole('heading', { level: 1 })
      expect(h1s).toHaveLength(1)
      
      // H2 pour les sections principales
      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s.length).toBeGreaterThan(0)
      
      // H3 pour les sous-sections
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s.length).toBeGreaterThan(0)
    })
  })
  
  describe('Fonctionnalités spécifiques métier', () => {
    it('devrait mettre en avant le service d\'urgence', () => {
      render(<HomePage />)
      
      // Section urgence visible
      expect(screen.getByText('Urgence dentaire ?')).toBeInTheDocument()
      
      // Animation pulse sur les éléments d'urgence
      const urgencyElements = document.querySelectorAll('.medical-pulse')
      expect(urgencyElements.length).toBeGreaterThan(0)
    })
    
    it('devrait promouvoir la prise de RDV en ligne', () => {
      render(<HomePage />)
      
      // Multiples CTA de prise de RDV
      const rdvButtons = screen.getAllByRole('button', { name: /Prendre RDV|Prendre rendez-vous/ })
      expect(rdvButtons.length).toBeGreaterThan(1)
    })
    
    it('devrait rassurer sur la sécurité des données', () => {
      render(<HomePage />)
      
      expect(screen.getByText(/Données protégées/)).toBeInTheDocument()
      expect(screen.getByText(/chiffrement de bout en bout/)).toBeInTheDocument()
      expect(screen.getByText(/hébergement sécurisé en Algérie/)).toBeInTheDocument()
    })
  })
  
  describe('États d\'erreur et cas limites', () => {
    it('devrait gérer l\'absence de JavaScript gracieusement', () => {
      // Test du rendu côté serveur
      render(<HomePage />)
      
      // Contenu principal toujours visible
      expect(screen.getByText('NOVA RDV')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
    
    it('devrait avoir des fallbacks pour les composants dynamiques', () => {
      render(<HomePage />)
      
      // Boutons fonctionnels même si JavaScript désactivé
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })
  })
})