# NOVA RDV Design System

## Vue d'ensemble

Le système de design NOVA RDV est une collection complète de composants, tokens de design et directives qui garantissent une expérience utilisateur cohérente, accessible et professionnelle dans l'environnement médical français.

## Philosophie de Design

### Principes Fondamentaux

1. **Accessibilité d'abord** - Conformité WCAG 2.2 AA pour tous les utilisateurs
2. **Confiance médicale** - Design professionnel inspirant la confiance dans le secteur de la santé
3. **Simplicité fonctionnelle** - Interfaces intuitives réduisant la friction cognitive
4. **Cohérence systémique** - Expérience unifiée sur tous les points de contact
5. **Adaptabilité contextuelle** - Flexibilité pour différents cas d'usage médical

### Valeurs de Marque Traduites en Design

| Valeur | Traduction Design | Implémentation |
|--------|-------------------|----------------|
| **Professionnalisme** | Palette sobre, typographie claire | Couleurs primaires bleues, Inter font |
| **Bienveillance** | Coins arrondis, micro-interactions douces | Border-radius cohérents, transitions fluides |
| **Fiabilité** | Hiérarchie visuelle claire, feedback immédiat | États visuels explicites, messages de confirmation |
| **Innovation** | Interface moderne, interactions natives | Composants responsive, dark mode |

## Architecture du Système

### Structure des Tokens

```
Design Tokens
├── Colors/
│   ├── Primitive (couleurs de base)
│   ├── Semantic (rôles fonctionnels)
│   └── Component (spécifiques aux composants)
├── Typography/
│   ├── Families (polices de caractères)
│   ├── Scales (tailles fluides)
│   └── Properties (poids, espacement)
├── Spacing/
│   ├── Base Unit (4px)
│   ├── Scale (progression mathématique)
│   └── Touch Targets (44px minimum)
├── Layout/
│   ├── Grid System
│   ├── Breakpoints
│   └── Container Queries
└── Effects/
    ├── Shadows (élévation)
    ├── Borders (délimitation)
    └── Transitions (animation)
```

## Tokens de Design

### Système de Couleurs

#### Couleurs Primitives

Les couleurs de base du système, définies en valeurs RGB pour supporter les opacités et le mode sombre.

```css
/* Primaire - Bleu Médical (Confiance, Professionnalisme) */
--color-primary-50: 235 245 255;   /* #EBF5FF */
--color-primary-600: 37 99 235;    /* #2563EB - Couleur principale */
--color-primary-700: 29 78 216;    /* #1D4ED8 - Contraste 7:1 */

/* Secondaire - Teal Soins (Innovation, Bien-être) */
--color-secondary-50: 240 253 250;   /* #F0FDFA */
--color-secondary-600: 13 148 136;   /* #0D9488 - Contraste 4.5:1 */

/* Succès - Vert Médical */
--color-success-600: 22 163 74;    /* #16A34A - Validation, réussite */

/* Alerte - Orange Médical */
--color-warning-600: 217 119 6;    /* #D97706 - Attention, précaution */

/* Erreur - Rouge Médical */
--color-error-600: 220 38 38;      /* #DC2626 - Erreurs critiques */
```

#### Couleurs Sémantiques

Mapping des couleurs primitives vers des rôles fonctionnels.

```css
/* Interface */
--color-background: var(--color-white);
--color-foreground: var(--color-neutral-900);
--color-muted: var(--color-neutral-50);
--color-border: var(--color-neutral-200);

/* Interactive */
--color-ring: var(--color-primary-600);      /* Focus states */
--color-destructive: var(--color-error-600); /* Actions destructives */
```

#### Mode Sombre

Support automatique via `prefers-color-scheme` et classe `.dark`.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--color-neutral-950);
    --color-foreground: var(--color-neutral-50);
    --color-muted: var(--color-neutral-900);
    --color-border: var(--color-neutral-800);
  }
}
```

### Typographie Fluide

#### Familles de Polices

```css
--font-family-heading: 'Inter', system-ui, sans-serif;
--font-family-body: 'Inter', system-ui, sans-serif;
--font-family-mono: 'JetBrains Mono', monospace;
```

**Justification du choix** : Inter offre une excellente lisibilité médicale avec des caractères distinctifs pour éviter les confusions (0/O, I/l).

#### Échelle Fluide

Utilisation de `clamp()` pour une typographie responsive native.

```css
--font-size-xs: clamp(0.75rem, 0.9vw + 0.6rem, 0.875rem);      /* 12-14px */
--font-size-sm: clamp(0.875rem, 1vw + 0.7rem, 1rem);           /* 14-16px */
--font-size-base: clamp(1rem, 1.2vw + 0.8rem, 1.125rem);       /* 16-18px */
--font-size-lg: clamp(1.125rem, 1.4vw + 0.9rem, 1.25rem);      /* 18-20px */
--font-size-xl: clamp(1.25rem, 1.6vw + 1rem, 1.5rem);          /* 20-24px */
```

#### Hiérarchie Sémantique

| Niveau | Usage | Taille | Poids | Espacement |
|--------|-------|--------|-------|------------|
| **H1** | Titre de page | `--font-size-3xl` | 700 | `--letter-spacing-tight` |
| **H2** | Section principale | `--font-size-2xl` | 600 | `--letter-spacing-tight` |
| **H3** | Sous-section | `--font-size-xl` | 600 | `--letter-spacing-normal` |
| **Body** | Texte principal | `--font-size-base` | 400 | `--letter-spacing-normal` |
| **Caption** | Texte secondaire | `--font-size-sm` | 400 | `--letter-spacing-wide` |

### Système d'Espacement

#### Unité de Base

Basé sur une grille de **4px** pour la cohérence et l'alignement pixel-perfect.

```css
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-6: 1.5rem;     /* 24px */
--spacing-8: 2rem;       /* 32px */
```

#### Cibles Tactiles

Respect des directives d'accessibilité pour les interfaces tactiles.

```css
--touch-target-ios: 44px;      /* Minimum iOS */
--touch-target-android: 48px;  /* Minimum Android */
--touch-target-min: var(--touch-target-ios);
```

### Effets et Élévation

#### Ombres Contextuelles

```css
/* Élévations de base */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Ombres colorées pour la marque */
--shadow-primary: 0 10px 40px -10px rgb(var(--color-primary-500) / 0.35);
--shadow-error: 0 10px 40px -10px rgb(var(--color-error-500) / 0.35);
```

#### Rayons de Bordure

```css
--border-radius-sm: 0.125rem;    /* 2px - Petits éléments */
--border-radius-base: 0.25rem;   /* 4px - Défaut */
--border-radius-lg: 0.5rem;      /* 8px - Cartes, boutons */
--border-radius-xl: 0.75rem;     /* 12px - Modales */
```

## Composants

### Architecture des Composants

Chaque composant suit une structure cohérente :

1. **Props Interface** - TypeScript strict avec JSDoc
2. **Variants** - Système de variantes visuelles
3. **States** - États interactifs (hover, focus, disabled)
4. **Accessibility** - ARIA et navigation clavier
5. **Responsive** - Adaptation aux différentes tailles
6. **Dark Mode** - Support automatique

### Button - Composant de Base

#### Variants

```typescript
type ButtonVariant = 
  | 'primary'      // Action principale
  | 'secondary'    // Action secondaire  
  | 'success'      // Confirmation positive
  | 'warning'      // Action de précaution
  | 'destructive'  // Action destructive
  | 'quiet';       // Action discrète
```

#### Implémentation

```tsx
<Button
  variant="primary"
  size="md"
  loading={isSubmitting}
  loadingText="Confirmation en cours..."
  icon={<Calendar />}
  iconPosition="left"
>
  Confirmer le rendez-vous
</Button>
```

#### États Visuels

| État | Description | Style |
|------|-------------|-------|
| **Default** | État de repos | Couleurs de base |
| **Hover** | Survol souris | Assombrissement 100 |
| **Active** | Appui/clic | Assombrissement 200 + scale(0.98) |
| **Focus** | Focus clavier | Ring 2px + offset 2px |
| **Loading** | Action en cours | Spinner + texte SR |
| **Disabled** | Non interactif | Opacité 60% |

### Input - Saisie de Données

#### Features d'Accessibilité

- **Labeling** : Association explicite label/input via `htmlFor`
- **Validation** : Messages d'erreur via `aria-describedby`
- **État** : `aria-invalid` pour les erreurs
- **Instructions** : Texte d'aide accessible aux lecteurs d'écran

#### Variantes de Validation

```tsx
<Input
  label="Numéro de téléphone"
  placeholder="06 XX XX XX XX"
  error="Format invalide. Utilisez 06 XX XX XX XX"
  leftIcon={<Phone />}
  showPasswordToggle={false}
  required
/>
```

### Dialog - Modales Accessibles

#### Gestion du Focus

1. **Ouverture** : Focus sur le premier élément focusable
2. **Navigation** : Trap de focus dans la modale
3. **Fermeture** : Retour sur l'élément déclencheur
4. **Échappement** : Support de la touche Escape

#### Structure Recommandée

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Ouvrir</Button>
  </DialogTrigger>
  
  <DialogContent size="md" showCloseButton>
    <DialogHeader>
      <DialogTitle>Confirmer le rendez-vous</DialogTitle>
      <DialogDescription>
        Voulez-vous confirmer ce rendez-vous pour le 15 mars à 14h30 ?
      </DialogDescription>
    </DialogHeader>
    
    <DialogBody>
      {/* Contenu de la modale */}
    </DialogBody>
    
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="quiet">Annuler</Button>
      </DialogClose>
      <Button variant="primary">Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select - Sélection Accessible

#### Navigation Clavier

- **Espace/Entrée** : Ouvrir/fermer
- **Flèches** : Navigation dans les options
- **Échap** : Fermeture avec retour focus
- **Tab** : Sortie du composant

#### Groupement d'Options

```tsx
<SelectGroup
  label="Type de consultation"
  error={errors.consultationType}
  required
>
  <Select value={type} onValueChange={setType}>
    <SelectTrigger>
      <span>Sélectionnez le type de soin</span>
    </SelectTrigger>
    
    <SelectContent>
      <SelectLabel>Soins courants</SelectLabel>
      <SelectItem value="checkup">Contrôle de routine</SelectItem>
      <SelectItem value="cleaning">Détartrage</SelectItem>
      
      <SelectSeparator />
      
      <SelectLabel>Soins spécialisés</SelectLabel>
      <SelectItem value="extraction">Extraction</SelectItem>
      <SelectItem value="root-canal">Traitement de canal</SelectItem>
    </SelectContent>
  </Select>
</SelectGroup>
```

## Responsive Design

### Breakpoints

```css
--breakpoint-xs: 475px;    /* Petits mobiles */
--breakpoint-sm: 640px;    /* Mobiles */
--breakpoint-md: 768px;    /* Tablettes */
--breakpoint-lg: 1024px;   /* Desktop */
--breakpoint-xl: 1280px;   /* Large desktop */
--breakpoint-2xl: 1536px;  /* Extra large */
```

### Container Queries

Utilisation des container queries pour des composants adaptatifs :

```css
.card-component {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### Stratégie Mobile-First

1. **Base** : Design mobile (320px+)
2. **Enhancement** : Tablette (768px+)
3. **Optimization** : Desktop (1024px+)

## Accessibilité

### Standards de Conformité

- **WCAG 2.2 AA** pour l'accessibilité web
- **RGAA 4.1** pour la conformité française
- **EN 301 549** pour l'accessibilité européenne

### Contraste de Couleurs

| Niveau | Ratio Minimum | Usage |
|--------|---------------|-------|
| **AA Normal** | 4.5:1 | Texte normal (18px+) |
| **AA Large** | 3:1 | Texte large (24px+) |
| **AAA Normal** | 7:1 | Éléments critiques |

### Focus Management

#### Ring de Focus Visible

```css
.focus-visible-ring:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--border-radius-sm);
}
```

#### Skip Links

```html
<a href="#main-content" class="skip-to-content">
  Aller au contenu principal
</a>
```

### Support des Technologies d'Assistance

#### Lecteurs d'Écran

- **ARIA labels** explicites pour tous les éléments interactifs
- **Live regions** pour les notifications dynamiques
- **Descriptions** contextuelles via `aria-describedby`

#### Navigation Clavier

- **Tab order** logique et prévisible
- **Focus traps** dans les modales
- **Shortcuts** cohérents (Échap, Entrée, Espace)

## Dark Mode

### Activation

Le mode sombre est activé automatiquement selon les préférences système ou manuellement via une classe CSS.

```css
/* Automatique */
@media (prefers-color-scheme: dark) { ... }

/* Manuel */
.dark { ... }
```

### Adaptation des Couleurs

```css
.dark {
  --color-background: var(--color-neutral-950);
  --color-foreground: var(--color-neutral-50);
  --color-muted: var(--color-neutral-900);
  --color-border: var(--color-neutral-800);
  
  /* Ombres adaptées */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
}
```

## Performance

### Optimisations CSS

#### Variables Natives

Utilisation des custom properties CSS pour une performance optimale :

```css
/* ✅ Performant */
.button {
  background: rgb(var(--color-primary-600) / <alpha-value>);
}

/* ❌ Éviter */
.button {
  background: rgba(37, 99, 235, 0.8);
}
```

#### Sélecteurs Efficaces

```css
/* ✅ Spécifique et performant */
.nova-button--primary {
  background: var(--color-primary);
}

/* ❌ Trop générique */
button.primary {
  background: blue;
}
```

### Bundle Size

#### Tree Shaking

Les composants sont exportés individuellement pour permettre le tree shaking :

```typescript
// ✅ Import spécifique
import { Button } from '@/components/ui/forms/Button';

// ❌ Import global
import * as UI from '@/components/ui';
```

#### Code Splitting

Les composants lourds (Dialog, Select) utilisent le lazy loading :

```typescript
const Dialog = lazy(() => import('@/components/ui/Dialog'));
```

## Guidelines d'Utilisation

### Composition de Layouts

#### Grid System

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Contenu 1</Card>
  <Card>Contenu 2</Card>
  <Card>Contenu 3</Card>
</div>
```

#### Flexbox Utilities

```tsx
<div className="flex flex-col md:flex-row items-center justify-between gap-4">
  <Title>Mes rendez-vous</Title>
  <Button variant="primary">Nouveau RDV</Button>
</div>
```

### États d'Interface

#### Loading States

```tsx
{isLoading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="animate-spin" size={16} />
    <span>Chargement des créneaux...</span>
  </div>
) : (
  <AppointmentsList />
)}
```

#### Empty States

```tsx
<div className="text-center py-12">
  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
  <h3 className="mt-4 text-lg font-semibold">Aucun rendez-vous</h3>
  <p className="mt-2 text-muted-foreground">
    Vous n'avez pas encore de rendez-vous programmé.
  </p>
  <Button className="mt-4" variant="primary">
    Prendre rendez-vous
  </Button>
</div>
```

#### Error States

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Erreur de connexion</AlertTitle>
  <AlertDescription>
    Impossible de charger vos rendez-vous. 
    <Button variant="quiet" size="sm" onClick={retry}>
      Réessayer
    </Button>
  </AlertDescription>
</Alert>
```

## Testing et Validation

### Tests d'Accessibilité

#### Outils Automatisés

- **axe-core** pour les tests unitaires
- **Lighthouse** pour les audits de performance
- **Wave** pour l'évaluation web

#### Tests Manuels

- Navigation au clavier uniquement
- Test avec lecteur d'écran (NVDA, JAWS)
- Validation des contrastes
- Test en mode daltonien

### Tests de Performance

#### Métriques Cibles

- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **First Input Delay** : < 100ms

#### Monitoring

```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
```

## Migration et Évolution

### Versioning

Le design system suit le versioning sémantique :

- **Major** : Changements cassants (API, tokens)
- **Minor** : Nouveaux composants, nouvelles features
- **Patch** : Corrections de bugs, améliorations mineures

### Rétrocompatibilité

#### Deprecated Features

```typescript
/**
 * @deprecated Use variant="destructive" instead
 */
export interface ButtonProps {
  /** @deprecated */
  danger?: boolean;
  variant?: 'primary' | 'destructive';
}
```

#### Migration Scripts

```bash
# Script de migration automatique
npx nova-migrate v2-to-v3
```

### Documentation Vivante

#### Storybook Integration

Chaque composant inclut :

- **Stories** pour tous les variants
- **Controls** pour l'interaction temps réel
- **Docs** générés automatiquement
- **A11y addon** pour les tests d'accessibilité

#### Usage Analytics

Tracking de l'utilisation des composants pour guider l'évolution :

```typescript
// Telemetry non-invasive
trackComponentUsage('Button', { variant: 'primary', size: 'md' });
```

## Ressources et Outils

### Design Tokens Export

Les tokens sont exportables dans multiples formats :

```bash
# CSS Custom Properties
npm run tokens:css

# SCSS Variables  
npm run tokens:scss

# JavaScript/TypeScript
npm run tokens:js

# JSON
npm run tokens:json

# Figma Tokens
npm run tokens:figma
```

### Outils de Développement

#### VS Code Extension

Extension personnalisée pour :

- Autocomplétion des classes Tailwind
- Snippets de composants NOVA
- Validation des props TypeScript
- Aperçu des couleurs et espacements

#### Figma Plugin

Plugin pour synchroniser :

- Tokens de design depuis le code
- Composants entre Figma et code
- États d'accessibilité
- Spécifications de développement

### Formation et Support

#### Documentation Interactive

- **Playground** pour tester les composants
- **Guidelines** visuelles avec exemples
- **Best Practices** avec do/don't
- **A11y Checklist** par composant

#### Support Communauté

- **GitHub Issues** pour les bugs
- **Discussions** pour les questions
- **RFC Process** pour les évolutions majeures
- **Contributing Guide** pour les contributions

---

*Ce design system évolue continuellement pour servir au mieux les besoins des utilisateurs de NOVA RDV tout en maintenant les plus hauts standards de qualité, d'accessibilité et de performance.*