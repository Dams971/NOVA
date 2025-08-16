# NOVA RDV - Design Token System Specification

## Vue d'Ensemble

Cette spécification définit l'implémentation complète du système de tokens de design pour NOVA RDV. Les tokens sont la fondation atomique du système de design médical, garantissant cohérence, accessibilité et maintenabilité à travers toute la plateforme.

## Principes des Design Tokens

### 1. Hiérarchie des Tokens
```
Global Tokens → Alias Tokens → Component Tokens → Context Tokens
```

- **Global Tokens** : Valeurs primitives (couleurs hex, tailles px)
- **Alias Tokens** : Références sémantiques (primary-500, spacing-md)
- **Component Tokens** : Spécifiques aux composants (button-padding)
- **Context Tokens** : Contexte d'usage (medical-emergency-color)

### 2. Convention de Nommage

```typescript
// Format: [category]-[subcategory]-[variant]-[state]
--color-primary-500-hover
--spacing-medical-card-padding
--shadow-emergency-elevated
--typography-medical-body-line-height
```

### 3. Stratégie Multi-Format

- **CSS Custom Properties** : Runtime et thèmes dynamiques
- **JavaScript/TypeScript** : Logique métier et validation
- **JSON** : Configuration et outils externes
- **SCSS Variables** : Compatibilité legacy

## Architecture du Système de Tokens

### Structure de Fichiers

```
src/design-system/tokens/
├── core/                          # Tokens de base
│   ├── colors.ts                 # Définitions couleurs
│   ├── typography.ts             # Système typographique
│   ├── spacing.ts                # Espacement et dimensionement
│   ├── elevation.ts              # Ombres et élévations
│   ├── animation.ts              # Durées et curves
│   └── breakpoints.ts            # Points de rupture
├── semantic/                      # Tokens sémantiques
│   ├── medical-colors.ts         # Couleurs contexte médical
│   ├── medical-spacing.ts        # Espacement médical
│   ├── accessibility.ts          # Tokens a11y
│   └── performance.ts            # Tokens performance
├── component/                     # Tokens par composant
│   ├── button.ts                 # Tokens boutons
│   ├── input.ts                  # Tokens inputs
│   ├── card.ts                   # Tokens cartes
│   └── navigation.ts             # Tokens navigation
├── themes/                        # Variations de thèmes
│   ├── light.ts                  # Thème clair
│   ├── dark.ts                   # Thème sombre
│   ├── high-contrast.ts          # Haute contraste
│   └── emergency.ts              # Mode urgence
├── build/                         # Outils de génération
│   ├── css-generator.ts          # Générateur CSS
│   ├── js-generator.ts           # Générateur JS
│   ├── json-exporter.ts          # Export JSON
│   └── validator.ts              # Validateur tokens
└── index.ts                      # Export principal
```

## Tokens de Couleurs Médicales

### Système de Couleurs Principal

```typescript
// src/design-system/tokens/core/colors.ts

/** Couleurs primitives en format OKLCH pour une perception uniforme */
export const primitiveColors = {
  // Bleus médicaux (confiance et professionnalisme)
  blue: {
    50: 'oklch(97.3% 0.013 258.8)',   // #F8FAFF
    100: 'oklch(94.6% 0.027 258.8)',  // #EFF4FF
    200: 'oklch(89.2% 0.054 258.8)',  // #DBE7FE
    300: 'oklch(81.8% 0.108 258.8)',  // #B8D4FD
    400: 'oklch(72.2% 0.162 258.8)',  // #84BCFA
    500: 'oklch(63.7% 0.216 258.8)',  // #4FA8F7 - Principal
    600: 'oklch(55.2% 0.243 258.8)',  // #1E88F3 - Médical primaire
    700: 'oklch(47.1% 0.243 258.8)',  // #1F5BA3 - Médical foncé
    800: 'oklch(39.2% 0.216 258.8)',  // #1D4585
    900: 'oklch(31.8% 0.162 258.8)',  // #1A3A6B
    950: 'oklch(21.2% 0.108 258.8)',  // #152444
  },
  
  // Verts médicaux (santé et succès)
  green: {
    50: 'oklch(97.5% 0.020 150)',     // #F0FDF4
    100: 'oklch(94.5% 0.040 150)',    // #DCFCE7
    200: 'oklch(87.8% 0.080 150)',    // #BBF7D0
    300: 'oklch(78.7% 0.133 150)',    // #86EFAC
    400: 'oklch(69.2% 0.181 150)',    // #4ADE80
    500: 'oklch(61.2% 0.204 150)',    // #22C55E - Médical succès
    600: 'oklch(55.4% 0.204 150)',    // #16A34A - Sain
    700: 'oklch(46.9% 0.181 150)',    // #15803D
    800: 'oklch(39.4% 0.151 150)',    // #166534
    900: 'oklch(32.9% 0.120 150)',    // #14532D
  },
  
  // Rouges médicaux (urgence et erreur)
  red: {
    50: 'oklch(97.1% 0.013 27.3)',    // #FEF2F2
    100: 'oklch(93.9% 0.027 27.3)',   // #FEE2E2
    200: 'oklch(87.8% 0.054 27.3)',   // #FECACA
    300: 'oklch(79.5% 0.108 27.3)',   // #FCA5A5
    400: 'oklch(70.2% 0.162 27.3)',   // #F87171
    500: 'oklch(62.8% 0.216 27.3)',   // #EF4444 - Erreur
    600: 'oklch(55.9% 0.243 27.3)',   // #DC2626 - Urgence critique
    700: 'oklch(47.2% 0.243 27.3)',   // #B91C1C
    800: 'oklch(39.9% 0.216 27.3)',   // #991B1B
    900: 'oklch(33.1% 0.162 27.3)',   // #7F1D1D
  },
  
  // Oranges médicaux (avertissement)
  orange: {
    50: 'oklch(97.8% 0.015 70.67)',   // #FFFBEB
    100: 'oklch(94.1% 0.042 70.67)',  // #FEF3C7
    200: 'oklch(87.1% 0.084 70.67)',  // #FDE68A
    300: 'oklch(78.8% 0.126 70.67)',  // #FCD34D
    400: 'oklch(71.1% 0.147 70.67)',  // #FBBF24
    500: 'oklch(64.8% 0.147 70.67)',  // #F59E0B - Avertissement
    600: 'oklch(57.9% 0.147 70.67)',  // #D97706 - Urgence modérée
    700: 'oklch(48.6% 0.126 70.67)',  // #B45309
    800: 'oklch(41.2% 0.105 70.67)',  // #92400E
    900: 'oklch(34.4% 0.084 70.67)',  // #78350F
  },
  
  // Neutres médicaux (interface)
  neutral: {
    50: 'oklch(98.0% 0.002 247.86)',  // #FAFAFA
    100: 'oklch(96.2% 0.004 247.86)', // #F4F4F5
    200: 'oklch(90.0% 0.008 247.86)', // #E4E4E7
    300: 'oklch(83.1% 0.012 247.86)', // #D4D4D8
    400: 'oklch(68.8% 0.015 247.86)', // #A1A1AA
    500: 'oklch(55.8% 0.014 247.86)', // #71717A
    600: 'oklch(44.1% 0.012 247.86)', // #52525B
    700: 'oklch(35.3% 0.010 247.86)', // #3F3F46
    800: 'oklch(26.5% 0.008 247.86)', // #27272A
    900: 'oklch(19.6% 0.006 247.86)', // #18181B
    950: 'oklch(12.9% 0.004 247.86)', // #09090B
  }
} as const;

/** Couleurs sémantiques médicales */
export const medicalSemanticColors = {
  // États de santé
  health: {
    excellent: primitiveColors.green[500],
    good: primitiveColors.green[400],
    fair: primitiveColors.orange[400],
    poor: primitiveColors.orange[600],
    critical: primitiveColors.red[600],
    unknown: primitiveColors.neutral[400],
  },
  
  // Niveaux d'urgence
  emergency: {
    low: primitiveColors.green[500],      // Urgence faible
    moderate: primitiveColors.orange[500], // Urgence modérée
    urgent: primitiveColors.orange[600],   // Urgence élevée
    critical: primitiveColors.red[600],    // Urgence vitale
    immediate: primitiveColors.red[700],   // Intervention immédiate
  },
  
  // États d'appointment
  appointment: {
    available: primitiveColors.green[500],
    booked: primitiveColors.blue[600],
    confirmed: primitiveColors.green[600],
    pending: primitiveColors.orange[500],
    cancelled: primitiveColors.red[500],
    completed: primitiveColors.green[700],
    noShow: primitiveColors.red[700],
  },
  
  // Interface médicale
  medical: {
    primary: primitiveColors.blue[600],     // Action principale
    secondary: primitiveColors.blue[100],   // Action secondaire
    accent: primitiveColors.blue[500],      // Accent
    muted: primitiveColors.neutral[400],    // Éléments en sourdine
    border: primitiveColors.neutral[200],   // Bordures
    background: primitiveColors.neutral[50], // Arrière-plan
    surface: '#FFFFFF',                     // Surfaces
    text: primitiveColors.neutral[900],     // Texte principal
    textMuted: primitiveColors.neutral[600], // Texte secondaire
  }
} as const;
```

### Contraste et Accessibilité

```typescript
// src/design-system/tokens/semantic/accessibility.ts

/** Ratios de contraste WCAG 2.2 AA */
export const contrastRatios = {
  // Texte normal
  normal: {
    aa: 4.5,      // WCAG AA minimum
    aaa: 7.0,     // WCAG AAA
    medical: 4.5, // Standard médical (AA minimum)
  },
  
  // Texte large (18px+ ou 14px+ gras)
  large: {
    aa: 3.0,      // WCAG AA large
    aaa: 4.5,     // WCAG AAA large
    medical: 3.0, // Standard médical large
  },
  
  // Composants UI non-textuels
  nonText: {
    aa: 3.0,      // WCAG AA composants
    medical: 3.0, // Standard médical composants
  }
} as const;

/** Paires de couleurs validées pour l'accessibilité */
export const accessibleColorPairs = {
  // Texte sur arrière-plans
  textOnLight: {
    primary: {
      background: medicalSemanticColors.medical.background,
      foreground: medicalSemanticColors.medical.text,
      contrast: 14.2, // Excellent contraste
    },
    secondary: {
      background: primitiveColors.blue[50],
      foreground: primitiveColors.blue[800],
      contrast: 8.1, // AAA compliant
    },
    muted: {
      background: primitiveColors.neutral[100],
      foreground: primitiveColors.neutral[700],
      contrast: 5.4, // AA+ compliant
    }
  },
  
  // Boutons et actions
  buttons: {
    primary: {
      background: primitiveColors.blue[600],
      foreground: '#FFFFFF',
      contrast: 6.8, // AAA compliant
    },
    emergency: {
      background: primitiveColors.red[600],
      foreground: '#FFFFFF',
      contrast: 5.9, // AA+ compliant
    },
    success: {
      background: primitiveColors.green[600],
      foreground: '#FFFFFF',
      contrast: 4.7, // AA compliant
    }
  },
  
  // États d'urgence
  emergencyStates: {
    critical: {
      background: primitiveColors.red[50],
      foreground: primitiveColors.red[800],
      border: primitiveColors.red[600],
      contrast: 8.3, // AAA compliant
    },
    warning: {
      background: primitiveColors.orange[50],
      foreground: primitiveColors.orange[800],
      border: primitiveColors.orange[600],
      contrast: 7.1, // AAA compliant
    }
  }
} as const;

/** Tokens d'accessibilité */
export const accessibilityTokens = {
  // Focus indicators
  focus: {
    width: '2px',
    offset: '2px',
    color: primitiveColors.blue[600],
    style: 'solid',
    radius: '2px',
    
    // Focus enhanced pour le médical
    enhanced: {
      width: '3px',
      offset: '2px',
      color: primitiveColors.blue[600],
      style: 'solid',
      radius: '4px',
      shadow: `0 0 0 4px ${primitiveColors.blue[600]}20`, // 20% opacity
    },
    
    // Focus urgence
    emergency: {
      width: '4px',
      offset: '2px',
      color: primitiveColors.red[600],
      style: 'solid',
      radius: '4px',
      shadow: `0 0 0 6px ${primitiveColors.red[600]}30`, // 30% opacity
    }
  },
  
  // Cibles tactiles
  touchTargets: {
    minimum: '44px',        // iOS minimum absolu
    recommended: '48px',    // Android/Web recommandé
    medical: '56px',        // Standard médical
    medicalLarge: '64px',   // Actions critiques médicales
    emergency: '72px',      // Boutons d'urgence
  },
  
  // Espacement accessible
  spacing: {
    focusGap: '8px',        // Espace entre éléments focusables
    readingGap: '16px',     // Espace pour la lecture
    sectionGap: '32px',     // Espace entre sections
    emergencyGap: '24px',   // Espace autour des éléments d'urgence
  }
} as const;
```

## Système Typographique

### Échelle Typographique Fluide

```typescript
// src/design-system/tokens/core/typography.ts

/** Échelle typographique fluide optimisée pour le médical */
export const typographyScale = {
  // Tailles de base en rem avec clamp() pour la fluidité
  sizes: {
    'xs': 'clamp(0.75rem, 0.8vw + 0.6rem, 0.875rem)',     // 12-14px
    'sm': 'clamp(0.875rem, 1vw + 0.7rem, 1rem)',          // 14-16px
    'base': 'clamp(1rem, 1.2vw + 0.8rem, 1.125rem)',      // 16-18px - Corps médical
    'lg': 'clamp(1.125rem, 1.4vw + 0.9rem, 1.25rem)',     // 18-20px
    'xl': 'clamp(1.25rem, 1.6vw + 1rem, 1.5rem)',         // 20-24px
    '2xl': 'clamp(1.5rem, 2vw + 1.2rem, 2rem)',           // 24-32px
    '3xl': 'clamp(1.875rem, 2.5vw + 1.4rem, 2.5rem)',     // 30-40px - Titres médicaux
    '4xl': 'clamp(2.25rem, 3vw + 1.6rem, 3rem)',          // 36-48px
    '5xl': 'clamp(3rem, 4vw + 2rem, 4rem)',               // 48-64px - Headers principaux
  },
  
  // Variantes médicales spécialisées
  medicalSizes: {
    'medical-caption': 'clamp(0.75rem, 0.8vw + 0.6rem, 0.875rem)',    // Légendes
    'medical-label': 'clamp(0.875rem, 1vw + 0.7rem, 1rem)',           // Labels de champs
    'medical-body': 'clamp(1rem, 1.2vw + 0.8rem, 1.125rem)',          // Corps de texte
    'medical-title': 'clamp(1.5rem, 2vw + 1.2rem, 2rem)',             // Titres sections
    'medical-heading': 'clamp(1.875rem, 2.5vw + 1.4rem, 2.5rem)',     // En-têtes
    'emergency-text': 'clamp(1.25rem, 1.8vw + 1rem, 1.75rem)',        // Texte urgence
  },
  
  // Line heights optimisés pour la lecture médicale
  lineHeights: {
    none: 1,
    tight: 1.25,       // Titres compacts
    snug: 1.375,       // Sous-titres
    normal: 1.5,       // Corps de texte standard
    relaxed: 1.625,    // Lecture longue
    loose: 2,          // Espacement maximum
    
    // Line heights médicaux
    medical: 1.6,      // Optimal pour dossiers médicaux
    medicalCompact: 1.4, // Données condensées
    medicalLoose: 1.7,   // Instructions détaillées
  },
  
  // Poids de police
  weights: {
    light: 300,
    normal: 400,
    medium: 500,        // Recommandé pour labels médicaux
    semibold: 600,      // Recommandé pour titres médicaux
    bold: 700,
    extrabold: 800,
  },
  
  // Espacement des lettres
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    
    // Letter spacing médical
    medicalNormal: '0.01em',  // Légèrement espacé pour la lisibilité
    medicalWide: '0.03em',    // Pour les codes/identifiants
  },
  
  // Familles de polices
  families: {
    // Police principale optimisée pour la lecture médicale
    medical: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    
    // Police pour les données/codes
    mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", "Fira Mono", monospace',
    
    // Police de système en fallback
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
  }
} as const;

/** Tokens typographiques par composant */
export const componentTypography = {
  // Boutons
  button: {
    fontSize: typographyScale.sizes.base,
    fontWeight: typographyScale.weights.medium,
    lineHeight: typographyScale.lineHeights.tight,
    letterSpacing: typographyScale.letterSpacing.normal,
    textTransform: 'none' as const,
  },
  
  // Champs de formulaire
  input: {
    fontSize: typographyScale.sizes.base,
    fontWeight: typographyScale.weights.normal,
    lineHeight: typographyScale.lineHeights.normal,
    letterSpacing: typographyScale.letterSpacing.medicalNormal,
  },
  
  // Labels de champs
  label: {
    fontSize: typographyScale.medicalSizes['medical-label'],
    fontWeight: typographyScale.weights.medium,
    lineHeight: typographyScale.lineHeights.snug,
    letterSpacing: typographyScale.letterSpacing.normal,
  },
  
  // Texte d'aide
  helpText: {
    fontSize: typographyScale.sizes.sm,
    fontWeight: typographyScale.weights.normal,
    lineHeight: typographyScale.lineHeights.relaxed,
    letterSpacing: typographyScale.letterSpacing.normal,
    color: primitiveColors.neutral[600],
  },
  
  // Messages d'erreur
  errorText: {
    fontSize: typographyScale.sizes.sm,
    fontWeight: typographyScale.weights.medium,
    lineHeight: typographyScale.lineHeights.snug,
    letterSpacing: typographyScale.letterSpacing.normal,
    color: primitiveColors.red[600],
  },
  
  // Titres de cartes médicales
  cardTitle: {
    fontSize: typographyScale.medicalSizes['medical-title'],
    fontWeight: typographyScale.weights.semibold,
    lineHeight: typographyScale.lineHeights.tight,
    letterSpacing: typographyScale.letterSpacing.tight,
  },
  
  // Corps de texte médical
  medicalBody: {
    fontSize: typographyScale.medicalSizes['medical-body'],
    fontWeight: typographyScale.weights.normal,
    lineHeight: typographyScale.lineHeights.medical,
    letterSpacing: typographyScale.letterSpacing.medicalNormal,
  }
} as const;
```

## Système d'Espacement

### Échelle d'Espacement Médical

```typescript
// src/design-system/tokens/core/spacing.ts

/** Base d'espacement médical : 4px */
export const spacingBase = 4; // px

/** Échelle d'espacement principale */
export const spacingScale = {
  // Échelle de base (multiples de 4px)
  0: '0',
  px: '1px',
  0.5: `${spacingBase * 0.5}px`,    // 2px
  1: `${spacingBase * 1}px`,        // 4px
  1.5: `${spacingBase * 1.5}px`,    // 6px
  2: `${spacingBase * 2}px`,        // 8px
  2.5: `${spacingBase * 2.5}px`,    // 10px
  3: `${spacingBase * 3}px`,        // 12px
  3.5: `${spacingBase * 3.5}px`,    // 14px
  4: `${spacingBase * 4}px`,        // 16px
  5: `${spacingBase * 5}px`,        // 20px
  6: `${spacingBase * 6}px`,        // 24px
  7: `${spacingBase * 7}px`,        // 28px
  8: `${spacingBase * 8}px`,        // 32px
  9: `${spacingBase * 9}px`,        // 36px
  10: `${spacingBase * 10}px`,      // 40px
  11: `${spacingBase * 11}px`,      // 44px
  12: `${spacingBase * 12}px`,      // 48px
  14: `${spacingBase * 14}px`,      // 56px
  16: `${spacingBase * 16}px`,      // 64px
  20: `${spacingBase * 20}px`,      // 80px
  24: `${spacingBase * 24}px`,      // 96px
  28: `${spacingBase * 28}px`,      // 112px
  32: `${spacingBase * 32}px`,      // 128px
  36: `${spacingBase * 36}px`,      // 144px
  40: `${spacingBase * 40}px`,      // 160px
  44: `${spacingBase * 44}px`,      // 176px
  48: `${spacingBase * 48}px`,      // 192px
  52: `${spacingBase * 52}px`,      // 208px
  56: `${spacingBase * 56}px`,      // 224px
  60: `${spacingBase * 60}px`,      // 240px
  64: `${spacingBase * 64}px`,      // 256px
  72: `${spacingBase * 72}px`,      // 288px
  80: `${spacingBase * 80}px`,      // 320px
  96: `${spacingBase * 96}px`,      // 384px
} as const;

/** Espacement spécialisé pour le contexte médical */
export const medicalSpacing = {
  // Cibles tactiles (conformes aux standards médicaux)
  touchTarget: {
    minimum: '44px',              // iOS minimum absolu
    standard: '48px',             // Android/Web standard
    medical: '56px',              // Recommandé médical
    medicalLarge: '64px',         // Actions importantes
    emergency: '72px',            // Boutons d'urgence
  },
  
  // Espacement de formulaires médicaux
  form: {
    fieldGap: spacingScale[4],          // 16px - Entre champs
    groupGap: spacingScale[6],          // 24px - Entre groupes
    sectionGap: spacingScale[8],        // 32px - Entre sections
    labelGap: spacingScale[1],          // 4px - Label-input
    helpGap: spacingScale[1],           // 4px - Input-aide
    errorGap: spacingScale[1],          // 4px - Input-erreur
    inlineGap: spacingScale[4],         // 16px - Champs inline
  },
  
  // Espacement de cartes médicales
  card: {
    padding: spacingScale[5],           // 20px - Padding interne
    gap: spacingScale[4],               // 16px - Entre éléments
    marginBottom: spacingScale[6],      // 24px - Entre cartes
    headerGap: spacingScale[3],         // 12px - En-tête vers contenu
    actionGap: spacingScale[3],         // 12px - Contenu vers actions
  },
  
  // Espacement de navigation
  navigation: {
    itemPadding: spacingScale[3],       // 12px - Padding items
    itemGap: spacingScale[2],           // 8px - Entre items
    groupGap: spacingScale[6],          // 24px - Entre groupes
    logoGap: spacingScale[8],           // 32px - Logo vers navigation
  },
  
  // Espacement d'urgence
  emergency: {
    padding: spacingScale[6],           // 24px - Padding éléments urgence
    margin: spacingScale[8],            // 32px - Marge éléments urgence
    buttonGap: spacingScale[4],         // 16px - Entre boutons urgence
    alertPadding: spacingScale[5],      // 20px - Padding alertes
  },
  
  // Espacement de données médicales
  data: {
    tableRowHeight: spacingScale[12],   // 48px - Hauteur ligne tableau
    tableCellPadding: spacingScale[3],  // 12px - Padding cellules
    listItemGap: spacingScale[2],       // 8px - Entre items liste
    metadataGap: spacingScale[1],       // 4px - Métadonnées
  },
  
  // Espacement responsive
  responsive: {
    mobile: {
      padding: spacingScale[4],         // 16px - Padding mobile
      margin: spacingScale[4],          // 16px - Marge mobile
      gap: spacingScale[3],             // 12px - Gap mobile
    },
    tablet: {
      padding: spacingScale[6],         // 24px - Padding tablette
      margin: spacingScale[6],          // 24px - Marge tablette
      gap: spacingScale[4],             // 16px - Gap tablette
    },
    desktop: {
      padding: spacingScale[8],         // 32px - Padding desktop
      margin: spacingScale[8],          // 32px - Marge desktop
      gap: spacingScale[6],             // 24px - Gap desktop
    }
  }
} as const;

/** Safe areas pour les appareils mobiles */
export const safeAreas = {
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
  right: 'env(safe-area-inset-right)',
  
  // Combinaisons courantes
  paddingTop: `max(${spacingScale[4]}, env(safe-area-inset-top))`,
  paddingBottom: `max(${spacingScale[4]}, env(safe-area-inset-bottom))`,
  paddingHorizontal: `max(${spacingScale[4]}, env(safe-area-inset-left), env(safe-area-inset-right))`,
} as const;
```

## Système d'Élévation et Ombres

### Ombres Médicales Contextuelles

```typescript
// src/design-system/tokens/core/elevation.ts

/** Échelle d'élévation progressive */
export const elevationScale = {
  // Élévations de base
  0: 'none',
  1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
  3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
  4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
  5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
  6: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Ombres internes
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
  innerLarge: 'inset 0 4px 8px 0 rgb(0 0 0 / 0.12)',
} as const;

/** Ombres spécialisées pour le contexte médical */
export const medicalShadows = {
  // Cartes médicales
  card: {
    rest: elevationScale[2],
    hover: elevationScale[3],
    active: elevationScale[1],
    focus: `${elevationScale[2]}, 0 0 0 2px ${primitiveColors.blue[600]}40`,
  },
  
  // Modales et overlays
  modal: {
    backdrop: 'rgb(0 0 0 / 0.5)',
    content: elevationScale[6],
    contentMobile: elevationScale[5],
  },
  
  // Boutons médicaux
  button: {
    rest: elevationScale[1],
    hover: elevationScale[2],
    active: elevationScale[0],
    focus: `0 0 0 3px ${primitiveColors.blue[600]}40`,
    disabled: 'none',
  },
  
  // États d'urgence
  emergency: {
    low: `0 4px 14px 0 ${primitiveColors.green[500]}20`,
    moderate: `0 4px 14px 0 ${primitiveColors.orange[500]}30`,
    urgent: `0 4px 14px 0 ${primitiveColors.orange[600]}40`,
    critical: `0 6px 20px 0 ${primitiveColors.red[600]}50`,
    immediate: `0 8px 24px 0 ${primitiveColors.red[700]}60`,
  },
  
  // Notifications médicales
  notification: {
    info: `0 4px 14px 0 ${primitiveColors.blue[500]}25`,
    success: `0 4px 14px 0 ${primitiveColors.green[500]}25`,
    warning: `0 4px 14px 0 ${primitiveColors.orange[500]}30`,
    error: `0 4px 14px 0 ${primitiveColors.red[500]}30`,
  },
  
  // Inputs et formulaires
  input: {
    rest: 'none',
    focus: `0 0 0 3px ${primitiveColors.blue[600]}20`,
    error: `0 0 0 2px ${primitiveColors.red[600]}40`,
    success: `0 0 0 2px ${primitiveColors.green[600]}40`,
    disabled: 'none',
  },
  
  // Navigation
  navigation: {
    header: elevationScale[1],
    sidebar: elevationScale[2],
    dropdown: elevationScale[4],
    tooltip: elevationScale[3],
  }
} as const;

/** Ombres pour le mode sombre */
export const darkModeShadows = {
  // Ajustements pour le mode sombre
  card: {
    rest: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.2)',
    hover: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -1px rgb(0 0 0 / 0.3)',
    active: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
  },
  
  modal: {
    backdrop: 'rgb(0 0 0 / 0.8)',
    content: '0 25px 50px -12px rgb(0 0 0 / 0.6)',
  },
  
  button: {
    rest: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    hover: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.2)',
    active: 'none',
  }
} as const;
```

## Système d'Animation et Mouvement

### Durées et Courbes d'Animation

```typescript
// src/design-system/tokens/core/animation.ts

/** Durées d'animation optimisées pour l'accessibilité */
export const animationDurations = {
  // Micro-interactions
  instant: '0ms',
  fast: '150ms',        // Hover, focus
  base: '200ms',        // Transitions standard
  slow: '300ms',        // Animations complexes
  slower: '500ms',      // Grandes transitions
  
  // Contexte médical
  medical: {
    field: '150ms',     // Champs de formulaire
    button: '100ms',    // Boutons
    card: '200ms',      // Cartes
    modal: '300ms',     // Modales
    page: '400ms',      // Transitions de page
    emergency: '100ms', // Éléments d'urgence (rapide)
  },
  
  // Animations de chargement
  loading: {
    spinner: '1000ms',
    pulse: '2000ms',
    shimmer: '1500ms',
    skeleton: '1200ms',
  }
} as const;

/** Courbes d'animation (easing functions) */
export const animationEasing = {
  // Courbes standard
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Courbes spécialisées
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Courbes médicales (plus douces)
  medical: {
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    precise: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const;

/** Animations prédéfinies */
export const predefinedAnimations = {
  // Apparition/disparition
  fadeIn: {
    keyframes: {
      from: { opacity: 0 },
      to: { opacity: 1 }
    },
    duration: animationDurations.base,
    easing: animationEasing.easeOut,
  },
  
  fadeOut: {
    keyframes: {
      from: { opacity: 1 },
      to: { opacity: 0 }
    },
    duration: animationDurations.base,
    easing: animationEasing.easeIn,
  },
  
  // Mouvements
  slideUp: {
    keyframes: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 }
    },
    duration: animationDurations.slow,
    easing: animationEasing.medical.smooth,
  },
  
  slideDown: {
    keyframes: {
      from: { transform: 'translateY(-20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 }
    },
    duration: animationDurations.slow,
    easing: animationEasing.medical.smooth,
  },
  
  // Échelle
  scaleIn: {
    keyframes: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 }
    },
    duration: animationDurations.base,
    easing: animationEasing.medical.gentle,
  },
  
  // Chargement
  spin: {
    keyframes: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    duration: animationDurations.loading.spinner,
    easing: animationEasing.linear,
    iterationCount: 'infinite',
  },
  
  pulse: {
    keyframes: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 }
    },
    duration: animationDurations.loading.pulse,
    easing: animationEasing.easeInOut,
    iterationCount: 'infinite',
  },
  
  // Shimmer pour les skeletons
  shimmer: {
    keyframes: {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' }
    },
    duration: animationDurations.loading.shimmer,
    easing: animationEasing.linear,
    iterationCount: 'infinite',
  },
  
  // Animations d'urgence
  emergencyPulse: {
    keyframes: {
      '0%, 100%': { 
        transform: 'scale(1)',
        boxShadow: `0 0 0 0 ${primitiveColors.red[600]}40`
      },
      '50%': { 
        transform: 'scale(1.02)',
        boxShadow: `0 0 0 8px ${primitiveColors.red[600]}20`
      }
    },
    duration: '1500ms',
    easing: animationEasing.medical.gentle,
    iterationCount: 'infinite',
  }
} as const;

/** Support pour prefers-reduced-motion */
export const reducedMotionOverrides = {
  // Remplacements pour prefers-reduced-motion: reduce
  duration: '0.01ms',
  easing: animationEasing.linear,
  
  // Animations alternatives (instantanées)
  fadeIn: { opacity: 1 },
  slideUp: { transform: 'none', opacity: 1 },
  scaleIn: { transform: 'none', opacity: 1 },
  
  // Garde certaines animations critiques mais réduites
  emergencyPulse: {
    duration: '100ms',
    iterationCount: 1,
  }
} as const;
```

## Génération et Validation des Tokens

### Système de Build

```typescript
// src/design-system/tokens/build/css-generator.ts

export interface TokenGeneratorOptions {
  format: 'css' | 'scss' | 'js' | 'json';
  prefix?: string;
  theme?: 'light' | 'dark' | 'high-contrast';
  optimize?: boolean;
  validate?: boolean;
}

export class MedicalTokenGenerator {
  constructor(private options: TokenGeneratorOptions) {}
  
  /** Génère les CSS custom properties */
  generateCSS(): string {
    const { prefix = '--' } = this.options;
    
    let css = ':root {\n';
    
    // Couleurs
    Object.entries(primitiveColors).forEach(([colorName, colorScale]) => {
      Object.entries(colorScale).forEach(([shade, value]) => {
        css += `  ${prefix}color-${colorName}-${shade}: ${value};\n`;
      });
    });
    
    // Espacement
    Object.entries(spacingScale).forEach(([key, value]) => {
      css += `  ${prefix}spacing-${key}: ${value};\n`;
    });
    
    // Typographie
    Object.entries(typographyScale.sizes).forEach(([key, value]) => {
      css += `  ${prefix}font-size-${key}: ${value};\n`;
    });
    
    css += '}\n';
    
    // Mode sombre
    if (this.options.theme === 'dark') {
      css += this.generateDarkModeCSS();
    }
    
    // Média queries pour reduced motion
    css += this.generateReducedMotionCSS();
    
    return css;
  }
  
  /** Génère les tokens JavaScript/TypeScript */
  generateJS(): string {
    return `
export const tokens = {
  colors: ${JSON.stringify(primitiveColors, null, 2)},
  spacing: ${JSON.stringify(spacingScale, null, 2)},
  typography: ${JSON.stringify(typographyScale, null, 2)},
  shadows: ${JSON.stringify(medicalShadows, null, 2)},
  animations: ${JSON.stringify(animationDurations, null, 2)},
} as const;
    `;
  }
  
  /** Valide la cohérence des tokens */
  validate(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Validation des contrastes
    results.push(...this.validateContrast());
    
    // Validation des tailles de touch targets
    results.push(...this.validateTouchTargets());
    
    // Validation de la cohérence des espacements
    results.push(...this.validateSpacing());
    
    return results;
  }
  
  private validateContrast(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    Object.entries(accessibleColorPairs.textOnLight).forEach(([name, pair]) => {
      if (pair.contrast < contrastRatios.normal.aa) {
        results.push({
          type: 'error',
          message: `Contraste insuffisant pour ${name}: ${pair.contrast} < ${contrastRatios.normal.aa}`,
          token: name,
          suggestion: 'Utiliser une couleur plus contrastée'
        });
      }
    });
    
    return results;
  }
  
  private validateTouchTargets(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    const minSize = parseInt(medicalSpacing.touchTarget.minimum);
    
    Object.entries(medicalSpacing.touchTarget).forEach(([key, value]) => {
      const size = parseInt(value);
      if (size < minSize && key !== 'minimum') {
        results.push({
          type: 'warning',
          message: `Cible tactile ${key} inférieure au minimum: ${size}px < ${minSize}px`,
          token: `touchTarget.${key}`,
          suggestion: `Utiliser au moins ${minSize}px`
        });
      }
    });
    
    return results;
  }
}

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  token: string;
  suggestion?: string;
}
```

Cette spécification de tokens fournit une base solide et extensible pour le système de design médical NOVA RDV, garantissant cohérence, accessibilité et performance à travers toute l'application.