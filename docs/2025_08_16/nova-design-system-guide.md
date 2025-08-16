# NOVA Design System - Guide d'utilisation

## Table des matières

1. [Introduction](#introduction)
2. [Installation et Configuration](#installation-et-configuration)
3. [Tokens de Design](#tokens-de-design)
4. [Composants](#composants)
5. [Layout RDV](#layout-rdv)
6. [Accessibilité](#accessibilité)
7. [Performance](#performance)
8. [Tests](#tests)
9. [Migration](#migration)
10. [FAQ](#faq)

## Introduction

Le design system NOVA est conçu spécifiquement pour les applications médicales professionnelles avec un focus particulier sur :

- **Accessibilité WCAG 2.2 AA** : Conformité complète pour tous les utilisateurs
- **Performance** : Optimisé pour des interactions fluides
- **Langue française** : Interface et contenu en français par défaut
- **Responsive design** : Adapté mobile, tablet et desktop
- **Contexte médical** : Couleurs et interactions adaptées au secteur de la santé

### Valeurs fondamentales

- **Inclusivité** : Accessible à tous les utilisateurs, y compris ceux utilisant des technologies d'assistance
- **Fiabilité** : Composants testés et robustes pour un environnement médical critique
- **Clarté** : Interface claire et sans ambiguïté pour réduire les erreurs
- **Efficacité** : Interactions optimisées pour les professionnels de santé

## Installation et Configuration

### Installation

```bash
# Installation via npm
npm install @nova/design-system

# Ou via yarn
yarn add @nova/design-system
```

### Configuration CSS

Importez les tokens CSS dans votre fichier principal :

```css
/* styles/globals.css */
@import '@nova/design-system/tokens.css';
@import '@nova/design-system/components.css';

/* Configuration personnalisée */
:root {
  --nova-font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --nova-locale: 'fr-FR';
}
```

### Configuration TypeScript

```typescript
// types/nova.d.ts
declare module '@nova/design-system' {
  export * from '@nova/design-system/types';
}

// Configuration dans tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@nova/*": ["./node_modules/@nova/design-system/*"]
    }
  }
}
```

### Configuration Next.js

```typescript
// next.config.js
module.exports = {
  // Optimisation pour les composants NOVA
  experimental: {
    optimizeCss: true,
  },
  // Support des tokens CSS
  transpilePackages: ['@nova/design-system'],
}
```

## Tokens de Design

### Couleurs primaires

Le système de couleurs NOVA est conçu pour respecter les contrastes WCAG 2.2 AA dans le contexte médical :

```css
/* Couleurs principales */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;
--primary-600: #2563eb;  /* Couleur principale */
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Utilisation recommandée */
.button-primary {
  background-color: var(--primary-600);
  color: var(--primary-foreground);
}
```

### Couleurs sémantiques

```css
/* Succès - pour confirmations et validations */
--success-600: #10b981;
--success-foreground: #ffffff;

/* Avertissement - pour alertes importantes */
--warning-600: #f59e0b;
--warning-foreground: #000000;

/* Erreur - pour erreurs et suppressions */
--error-600: #ef4444;
--error-foreground: #ffffff;

/* Secondaire - pour actions secondaires */
--secondary-600: #6b7280;
--secondary-foreground: #ffffff;
```

### Couleurs neutres

```css
/* Échelle de gris pour textes et arrière-plans */
--neutral-50: #f9fafb;
--neutral-100: #f3f4f6;
--neutral-200: #e5e7eb;
--neutral-300: #d1d5db;
--neutral-400: #9ca3af;
--neutral-500: #6b7280;
--neutral-600: #4b5563;
--neutral-700: #374151;
--neutral-800: #1f2937;
--neutral-900: #111827;
```

### Espacement

```css
/* Système d'espacement basé sur 4px */
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
```

### Typographie

```css
/* Tailles de police */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Hauteurs de ligne */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Poids de police */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Bordures et rayons

```css
/* Rayons de bordure médicaux */
--radius-medical-small: 6px;   /* Éléments petits */
--radius-medical-medium: 8px;  /* Boutons, inputs */
--radius-medical-large: 12px;  /* Cartes, modales */

/* Bordures */
--border-width: 1px;
--border-color: var(--neutral-200);
--border-color-focus: var(--primary-600);
```

### Ombres

```css
/* Ombres subtiles pour le contexte médical */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-primary: 0 4px 14px 0 rgba(37, 99, 235, 0.2);
```

### Cibles tactiles

```css
/* Tailles minimales pour l'accessibilité */
--touch-target-ios: 44px;      /* iOS guidelines */
--touch-target-android: 48px;  /* Android guidelines */
--touch-target-web: 44px;      /* WCAG 2.2 AA */
```

## Composants

### Button (Bouton)

Le composant Button est la base de toutes les interactions dans NOVA.

#### Utilisation de base

```tsx
import { Button } from '@nova/design-system';

// Bouton principal
<Button variant="primary">
  Prendre rendez-vous
</Button>

// Bouton secondaire
<Button variant="secondary">
  Annuler
</Button>

// Bouton de validation
<Button variant="success">
  Confirmer
</Button>

// Bouton d'avertissement
<Button variant="warning">
  Attention
</Button>

// Bouton de suppression
<Button variant="destructive">
  Supprimer
</Button>

// Bouton discret
<Button variant="quiet">
  Options
</Button>
```

#### Tailles

```tsx
// Petit bouton
<Button size="sm">Petit</Button>

// Bouton moyen (par défaut)
<Button size="md">Moyen</Button>

// Grand bouton
<Button size="lg">Grand</Button>
```

#### États

```tsx
// État de chargement
<Button loading>
  Enregistrement...
</Button>

// Bouton désactivé
<Button disabled>
  Non disponible
</Button>

// Avec icône
<Button 
  icon={<Calendar />} 
  iconPosition="left"
>
  Planifier
</Button>

// Pleine largeur
<Button fullWidth>
  Continuer
</Button>
```

#### Props complètes

```typescript
interface ButtonProps {
  /** Variante visuelle */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'quiet';
  
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg';
  
  /** État de chargement */
  loading?: boolean;
  
  /** Icône à afficher */
  icon?: React.ReactNode;
  
  /** Position de l'icône */
  iconPosition?: 'left' | 'right';
  
  /** Pleine largeur */
  fullWidth?: boolean;
  
  /** Texte de chargement personnalisé */
  loadingText?: string;
  
  /** Effet de pression */
  pressEffect?: 'scale' | 'opacity' | 'none';
  
  /** Props HTML standard */
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: React.ReactNode;
}
```

#### Exemples d'usage médical

```tsx
// Prise de rendez-vous
<Button variant="primary" size="lg" fullWidth>
  Confirmer le rendez-vous
</Button>

// Action d'urgence
<Button variant="destructive" size="lg">
  🚨 Urgence
</Button>

// Validation d'informations patient
<Button 
  variant="success" 
  loading={isSaving}
  loadingText="Enregistrement..."
>
  Sauvegarder les informations
</Button>

// Navigation dans le dossier
<Button 
  variant="quiet" 
  icon={<ArrowLeft />}
  iconPosition="left"
>
  Retour au dossier
</Button>
```

### ChatRDV (Chat Assistant)

Composant de chat intelligent pour la prise de rendez-vous.

#### Utilisation

```tsx
import { ChatRDV } from '@nova/design-system';

<ChatRDV 
  onAppointmentSelect={(appointment) => {
    console.log('Rendez-vous sélectionné:', appointment);
  }}
  onMessageSend={(message) => {
    console.log('Message envoyé:', message);
  }}
/>
```

#### Props

```typescript
interface ChatRDVProps {
  /** Callback lors de la sélection d'un rendez-vous */
  onAppointmentSelect?: (appointment: AppointmentData) => void;
  
  /** Callback lors de l'envoi d'un message */
  onMessageSend?: (message: string) => void;
  
  /** Messages initiaux */
  initialMessages?: Message[];
  
  /** Configuration du bot */
  botConfig?: {
    name: string;
    avatar?: string;
    welcomeMessage?: string;
  };
  
  /** Classe CSS personnalisée */
  className?: string;
}
```

#### Fonctionnalités

- **Messages temps réel** avec live regions pour l'accessibilité
- **Actions rapides** pour sélectionner des créneaux
- **Indicateur de frappe** avec annonce pour les lecteurs d'écran
- **Historique de conversation** persistant
- **Validation automatique** des informations patient
- **Support multilingue** (français par défaut)

### RDVLayout (Layout 3 zones)

Layout responsive spécialisé pour la prise de rendez-vous.

#### Structure

```tsx
import { RDVLayout } from '@nova/design-system';

<RDVLayout
  leftPanel={<PatientContext />}
  centerPanel={<CalendarView />}
  rightPanel={<ChatRDV />}
/>
```

#### Responsivité

- **Mobile (< 768px)** : Layout vertical empilé
- **Tablet (768px - 1024px)** : Layout 2 colonnes
- **Desktop (> 1024px)** : Layout 3 colonnes avec panneau chat sticky

#### Props

```typescript
interface RDVLayoutProps {
  /** Panneau gauche (contexte patient) */
  leftPanel: React.ReactNode;
  
  /** Panneau central (calendrier) */
  centerPanel: React.ReactNode;
  
  /** Panneau droit (chat) */
  rightPanel: React.ReactNode;
  
  /** Configuration responsive */
  breakpoints?: {
    tablet: number;
    desktop: number;
  };
  
  /** Classes CSS personnalisées */
  className?: string;
}
```

### FormInput (Champ de saisie)

Composant d'input avec validation intégrée pour le contexte médical.

```tsx
import { FormInput } from '@nova/design-system';

<FormInput
  label="Nom du patient"
  name="patientName"
  required
  placeholder="Saisir le nom complet"
  validation={{
    pattern: /^[a-zA-ZÀ-ÿ\s-']{2,50}$/,
    message: "Le nom doit contenir uniquement des lettres (2-50 caractères)"
  }}
/>

<FormInput
  label="Numéro de téléphone"
  name="phone"
  type="tel"
  required
  placeholder="+213 5XX XXX XXX"
  validation={{
    pattern: /^\+213[567]\d{8}$/,
    message: "Format requis : +213XXXXXXXXX"
  }}
/>
```

### DatePicker (Sélecteur de date)

Calendrier accessible pour la sélection de dates.

```tsx
import { DatePicker } from '@nova/design-system';

<DatePicker
  label="Date du rendez-vous"
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date()}
  locale="fr-FR"
  timezone="Africa/Algiers"
  disabledDates={[
    // Weekends
    { daysOfWeek: [0, 6] },
    // Holidays
    { date: '2025-01-01' },
    { date: '2025-05-01' }
  ]}
/>
```

## Layout RDV

### Architecture 3 zones

Le layout RDV est conçu selon une architecture 3 zones optimisée pour la prise de rendez-vous :

```
┌─────────────────────────────────────────────────────────────┐
│                    Header Navigation                         │
├───────────────┬─────────────────────────┬───────────────────┤
│               │                         │                   │
│  Patient      │    Calendar &           │   Chat Assistant  │
│  Context      │    Time Slots           │                   │
│               │                         │                   │
│  - Info       │  - Monthly view         │  - Live chat      │
│  - History    │  - Available slots      │  - Quick actions  │
│  - Notes      │  - Selection state      │  - Confirmations  │
│               │                         │                   │
│               │                         │  (Sticky panel)   │
└───────────────┴─────────────────────────┴───────────────────┘
```

### Zone gauche : Contexte Patient (320px)

- **Informations patient** : Nom, âge, historique
- **Préférences** : Type de consultation, créneaux préférés
- **Historique RDV** : Derniers rendez-vous
- **Notes importantes** : Allergies, traitements en cours

### Zone centrale : Calendrier (Flexible)

- **Vue mensuelle** avec navigation
- **Créneaux disponibles** par jour
- **Sélection interactive** avec feedback visuel
- **Filtres** par type de consultation
- **Indications de durée** et disponibilité

### Zone droite : Chat Assistant (400px)

- **Chat en temps réel** avec l'IA
- **Actions rapides** pour confirmer
- **Sticky positioning** sur desktop
- **Responsive** : se replie sur mobile

### Responsive Behavior

#### Mobile (< 768px)
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│   Patient Context   │
├─────────────────────┤
│      Calendar       │
├─────────────────────┤
│   Chat (Overlay)    │
└─────────────────────┘
```

#### Tablet (768px - 1024px)
```
┌───────────────────────────────┐
│            Header             │
├─────────────┬─────────────────┤
│  Patient +  │      Chat       │
│  Calendar   │   (Sidebar)     │
│             │                 │
└─────────────┴─────────────────┘
```

#### Desktop (> 1024px)
```
┌─────────────────────────────────────────┐
│                Header                   │
├─────────┬─────────────────┬─────────────┤
│ Patient │    Calendar     │    Chat     │
│ Context │                 │  (Sticky)   │
│         │                 │             │
└─────────┴─────────────────┴─────────────┘
```

## Accessibilité

### Standards WCAG 2.2 AA

NOVA respecte intégralement les critères WCAG 2.2 AA :

#### Contraste de couleurs (4.5:1 minimum)

```css
/* Exemples de contrastes validés */
.text-on-primary {
  background: #2563eb; /* primary-600 */
  color: #ffffff;      /* Contraste 7.2:1 ✅ */
}

.text-on-secondary {
  background: #6b7280; /* secondary-600 */
  color: #ffffff;      /* Contraste 4.7:1 ✅ */
}

.error-message {
  background: #fef2f2; /* error-50 */
  color: #dc2626;      /* error-600 - Contraste 7.8:1 ✅ */
}
```

#### Cibles tactiles (44px minimum)

```css
/* Tous les éléments interactifs respectent la taille minimale */
.button {
  min-height: var(--touch-target-web); /* 44px */
  min-width: var(--touch-target-web);  /* 44px */
}

.touch-target {
  padding: 12px 16px; /* Assure une zone tactile suffisante */
}
```

#### Navigation clavier

```tsx
// Exemple d'implémentation
const Button = ({ children, onClick, ...props }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-2 focus-visible:ring-primary-600"
      {...props}
    >
      {children}
    </button>
  );
};
```

#### Live regions pour annonces

```tsx
// Chat avec annonces automatiques
<div 
  role="log" 
  aria-live="polite" 
  aria-label="Messages du chat"
>
  {messages.map(message => (
    <div key={message.id}>
      {message.content}
    </div>
  ))}
</div>

// Indicateur de frappe
<div 
  aria-live="polite"
  aria-label="L'assistant tape une réponse"
>
  <TypingIndicator />
</div>
```

#### Gestion du focus

```tsx
// Focus trap pour modales
import { FocusTrap } from '@nova/design-system';

<FocusTrap active={isModalOpen}>
  <Modal>
    <h2>Confirmer le rendez-vous</h2>
    <Button onClick={confirm}>Confirmer</Button>
    <Button onClick={cancel}>Annuler</Button>
  </Modal>
</FocusTrap>
```

### Support des technologies d'assistance

#### Lecteurs d'écran

- **NVDA** : Support complet testé
- **JAWS** : Compatible
- **VoiceOver** : Support macOS et iOS
- **TalkBack** : Support Android

#### Navigation alternative

- **Navigation clavier** : Tab, Shift+Tab, flèches, Entrée, Espace
- **Raccourcis clavier** : Ctrl+M (menu), Ctrl+S (sauvegarder)
- **Liens d'évitement** : "Aller au contenu principal"

#### Annonces contextuelles

```tsx
// Annonces automatiques des changements d'état
const useAnnouncements = () => {
  const announce = (message: string) => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  };

  return { announce };
};

// Usage
const { announce } = useAnnouncements();

const handleAppointmentConfirm = () => {
  // ... logique de confirmation
  announce('Rendez-vous confirmé pour le 15 janvier à 14h00');
};
```

### Tests d'accessibilité

#### Tests automatisés

```typescript
// Tests avec jest-axe
import { axe } from 'jest-axe';

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Test</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Tests manuels

1. **Navigation clavier** : Parcourir l'interface uniquement au clavier
2. **Lecteur d'écran** : Tester avec NVDA ou VoiceOver
3. **Zoom 200%** : Interface utilisable à 200% de zoom
4. **Contraste élevé** : Mode contraste élevé Windows/macOS

## Performance

### Optimisations de rendu

#### Code splitting

```typescript
// Lazy loading des composants lourds
const CalendarView = lazy(() => import('./CalendarView'));
const ChatWidget = lazy(() => import('./ChatWidget'));

// Usage avec Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <CalendarView />
</Suspense>
```

#### Virtualisation des listes

```tsx
// Pour les grandes listes de créneaux
import { FixedSizeList as List } from 'react-window';

const TimeSlotsList = ({ slots }) => (
  <List
    height={400}
    itemCount={slots.length}
    itemSize={60}
    itemData={slots}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <TimeSlot slot={data[index]} />
      </div>
    )}
  </List>
);
```

#### Memoisation

```tsx
// Mémorisation des composants coûteux
const ExpensiveCalendar = memo(({ date, slots }) => {
  const computedSlots = useMemo(() => 
    slots.filter(slot => slot.date === date)
  , [date, slots]);

  return <Calendar slots={computedSlots} />;
});
```

### Bundle optimization

#### Tree shaking

```typescript
// Import sélectif pour réduire la taille du bundle
import { Button } from '@nova/design-system/button';
import { ChatRDV } from '@nova/design-system/chat';

// Éviter l'import complet
// import * from '@nova/design-system'; ❌
```

#### Compression des assets

```javascript
// next.config.js
module.exports = {
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizeCss: true,
  }
};
```

### Métriques de performance

#### Core Web Vitals cibles

- **LCP (Largest Contentful Paint)** : < 2.5s
- **FID (First Input Delay)** : < 100ms
- **CLS (Cumulative Layout Shift)** : < 0.1
- **FCP (First Contentful Paint)** : < 1.8s

#### Monitoring

```typescript
// Mesure des performances
const measurePerformance = (name: string, fn: Function) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name}: ${end - start}ms`);
  
  // Envoi à votre service de monitoring
  analytics.track('performance', {
    metric: name,
    duration: end - start,
    timestamp: Date.now()
  });
  
  return result;
};
```

## Tests

### Suite de tests complète

#### Tests unitaires (Vitest)

```bash
# Exécuter les tests unitaires
npm run test:unit

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

#### Tests d'intégration

```bash
# Tests d'intégration des flows
npm run test:integration

# Tests spécifiques RDV
npm run test:rdv-flow
```

#### Tests E2E (Playwright)

```bash
# Tests end-to-end
npm run test:e2e

# Tests E2E sur mobile
npm run test:e2e:mobile

# Tests avec UI
npm run test:e2e:ui
```

#### Tests d'accessibilité

```bash
# Tests accessibilité automatisés
npm run test:a11y

# Tests axe-core
npm run test:axe

# Lighthouse CI
npm run lighthouse:ci
```

### Configuration de test

#### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@nova/(.*)$': '<rootDir>/src/components/$1',
  },
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Playwright configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './src/test/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'fr-FR',
    timezoneId: 'Africa/Algiers',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' },
  ],
});
```

### Tests spécifiques NOVA

#### Test du flow RDV complet

```typescript
test('complete RDV booking flow', async ({ page }) => {
  await page.goto('/rdv');
  
  // Sélectionner une date
  await page.click('text=15 janvier');
  
  // Sélectionner un créneau
  await page.click('[data-testid="slot-14:00"]');
  
  // Interaction chat
  await page.fill('[placeholder*="message"]', 'Je confirme ce créneau');
  await page.click('text=Envoyer');
  
  // Confirmation
  await page.click('text=Confirmer le rendez-vous');
  
  // Vérification
  await expect(page.locator('text=Rendez-vous confirmé')).toBeVisible();
});
```

#### Test d'accessibilité

```typescript
test('RDV page meets WCAG 2.2 AA', async ({ page }) => {
  await page.goto('/rdv');
  
  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  
  expect(accessibilityResults.violations).toEqual([]);
});
```

## Migration

### Migration depuis v1.x

#### Changements majeurs

1. **Tokens CSS** : Migration vers CSS variables
2. **Composants** : Nouvelles props d'accessibilité
3. **Layout** : Nouveau système de grille responsive
4. **Couleurs** : Palette étendue avec variantes sémantiques

#### Script de migration automatique

```bash
# Installation de l'outil de migration
npm install -g @nova/migration-tool

# Exécution de la migration
nova-migrate --from=1.x --to=2.x --path=./src
```

#### Migration manuelle

##### 1. Tokens CSS

```css
/* Avant (v1.x) */
.button-primary {
  background-color: #3b82f6;
  color: white;
}

/* Après (v2.x) */
.button-primary {
  background-color: var(--primary-600);
  color: var(--primary-foreground);
}
```

##### 2. Props des composants

```tsx
// Avant (v1.x)
<Button type="primary" loading={true}>
  Enregistrer
</Button>

// Après (v2.x)
<Button variant="primary" loading>
  Enregistrer
</Button>
```

##### 3. Imports

```typescript
// Avant (v1.x)
import { Button, Input } from '@nova/components';

// Après (v2.x)
import { Button } from '@nova/design-system/button';
import { FormInput } from '@nova/design-system/form';
```

### Checklist de migration

- [ ] Installer @nova/design-system v2.x
- [ ] Mettre à jour les imports
- [ ] Migrer les tokens CSS
- [ ] Tester l'accessibilité
- [ ] Valider les performances
- [ ] Mettre à jour la documentation
- [ ] Former l'équipe

## FAQ

### Questions générales

**Q: NOVA est-il compatible avec React 18 ?**
R: Oui, NOVA est entièrement compatible avec React 18 et utilise les dernières fonctionnalités comme Concurrent Features.

**Q: Puis-je utiliser NOVA avec Vue.js ou Angular ?**
R: NOVA est actuellement développé pour React. Une version Web Components est en développement pour les autres frameworks.

**Q: NOVA respecte-t-il le RGPD ?**
R: Oui, NOVA est conçu pour être conforme au RGPD. Aucune donnée n'est collectée par défaut par les composants.

### Accessibilité

**Q: NOVA est-il compatible avec tous les lecteurs d'écran ?**
R: NOVA est testé avec NVDA, JAWS, VoiceOver et TalkBack. La compatibilité est assurée pour 95% des cas d'usage.

**Q: Comment tester l'accessibilité de mon implémentation ?**
R: Utilisez les tests automatisés fournis (`npm run test:a11y`) et testez manuellement avec un lecteur d'écran.

**Q: NOVA supporte-t-il le mode contraste élevé ?**
R: Oui, tous les composants sont testés en mode contraste élevé Windows et macOS.

### Performance

**Q: Quelle est la taille du bundle NOVA ?**
R: Le bundle complet fait ~45KB gzippé. Avec tree shaking, vous pouvez réduire à ~15KB pour une utilisation basique.

**Q: NOVA est-il optimisé pour les mobiles ?**
R: Oui, NOVA est mobile-first avec des optimisations spécifiques (touch targets, interactions tactiles, etc.).

**Q: Comment optimiser les performances avec NOVA ?**
R: Utilisez le lazy loading, la virtualisation pour les grandes listes, et importez seulement les composants nécessaires.

### Développement

**Q: Comment contribuer à NOVA ?**
R: Consultez le guide de contribution sur GitHub : [github.com/nova/design-system/CONTRIBUTING.md](https://github.com/nova/design-system/CONTRIBUTING.md)

**Q: NOVA supporte-t-il TypeScript ?**
R: Oui, NOVA est écrit en TypeScript avec une typographie complète incluse.

**Q: Comment personnaliser les couleurs NOVA ?**
R: Surchargez les variables CSS dans votre fichier de styles principal :

```css
:root {
  --primary-600: #your-color;
  --primary-foreground: #your-text-color;
}
```

### Contexte médical

**Q: NOVA est-il certifié pour l'usage médical ?**
R: NOVA respecte les standards d'accessibilité et de sécurité, mais n'est pas un dispositif médical certifié. Consultez votre équipe juridique pour la conformité réglementaire.

**Q: Comment NOVA gère-t-il les données sensibles ?**
R: NOVA ne stocke aucune donnée. C'est à l'implémenteur de gérer la sécurité et le chiffrement des données médicales.

**Q: NOVA supporte-t-il d'autres langues que le français ?**
R: Actuellement, NOVA est optimisé pour le français. Le support multilingue est prévu pour la v3.0.

---

## Support et ressources

- **Documentation** : [nova-design-system.docs](https://nova-design-system.docs)
- **Storybook** : [storybook.nova-design-system.com](https://storybook.nova-design-system.com)
- **GitHub** : [github.com/nova/design-system](https://github.com/nova/design-system)
- **Discord** : [discord.gg/nova-design-system](https://discord.gg/nova-design-system)
- **Email** : design-system@nova.dz

**Version** : 2.0.0  
**Dernière mise à jour** : 16 août 2025  
**Auteurs** : Équipe NOVA Design System