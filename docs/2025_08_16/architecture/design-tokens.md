# NOVA RDV - Système de Design Tokens Médical

## Vue d'ensemble

Le système de design tokens de NOVA RDV définit l'ensemble des valeurs atomiques qui composent l'identité visuelle médicale. Ces tokens garantissent la cohérence, l'accessibilité WCAG AAA et l'évolutivité du design system à travers toutes les interfaces.

**Architecture des Tokens:**
- **Tokens Primitifs** : Valeurs de base (couleurs, tailles, espacements)
- **Tokens Sémantiques** : Rôles fonctionnels (primary, success, error)
- **Tokens Composites** : Combinaisons complexes (ombres, élévations)
- **Tokens Contextuels** : Variantes spécialisées (médical, urgence, senior)

## Architecture Technique

### Formats de Distribution

```bash
tokens/
├── primitives/          # Valeurs de base
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   └── effects.json
├── semantic/           # Rôles fonctionnels
│   ├── interface.json
│   ├── medical.json
│   └── accessibility.json
├── composite/          # Tokens composés
│   ├── shadows.json
│   ├── gradients.json
│   └── animations.json
└── outputs/            # Formats de sortie
    ├── css/
    ├── scss/
    ├── js/
    ├── json/
    └── figma/
```

### Pipeline de Génération

```typescript
// style-dictionary.config.ts
import StyleDictionary from 'style-dictionary';
import { registerTransforms } from '@tokens-studio/sd-transforms';

registerTransforms(StyleDictionary);

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'medical-tokens.css',
        format: 'css/variables',
        options: {
          selector: ':root',
          showFileHeader: true
        }
      }]
    },
    'css-dark': {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'medical-tokens-dark.css',
        format: 'css/variables',
        options: {
          selector: '.dark',
          showFileHeader: true
        }
      }]
    },
    typescript: {
      transformGroup: 'js',
      buildPath: 'dist/ts/',
      files: [{
        destination: 'tokens.ts',
        format: 'typescript/es6-declarations'
      }]
    }
  }
};
```

## Tokens Primitifs

### Système de Couleurs Médical

#### Palette Primaire - Bleu Confiance
```json
{
  "color": {
    "primary": {
      "50": { "value": "#EEF2FF", "type": "color" },
      "100": { "value": "#E0E7FF", "type": "color" },
      "200": { "value": "#C7D2FE", "type": "color" },
      "300": { "value": "#A5B4FC", "type": "color" },
      "400": { "value": "#818CF8", "type": "color" },
      "500": { "value": "#6366F1", "type": "color" },
      "600": { "value": "#2563EB", "type": "color", "description": "Couleur principale - Contraste AA sur blanc" },
      "700": { "value": "#1D4ED8", "type": "color", "description": "Couleur foncée - Contraste AAA sur blanc" },
      "800": { "value": "#1E40AF", "type": "color" },
      "900": { "value": "#1E3A8A", "type": "color" },
      "950": { "value": "#172554", "type": "color" }
    }
  }
}
```

#### Palette Sémantique Médicale
```json
{
  "color": {
    "success": {
      "50": { "value": "#ECFDF5", "type": "color" },
      "600": { "value": "#16A34A", "type": "color", "description": "Validation, confirmation RDV" },
      "700": { "value": "#15803D", "type": "color", "description": "Contraste AAA" }
    },
    "warning": {
      "50": { "value": "#FFFBEB", "type": "color" },
      "500": { "value": "#F59E0B", "type": "color", "description": "Attention, précaution" },
      "600": { "value": "#D97706", "type": "color" }
    },
    "error": {
      "50": { "value": "#FEF2F2", "type": "color" },
      "600": { "value": "#DF3F40", "type": "color", "description": "Erreur, annulation, urgence" },
      "700": { "value": "#B91C1C", "type": "color" }
    },
    "medical": {
      "background": { "value": "#FAFBFF", "type": "color", "description": "Fond cabinet apaisant" },
      "surface": { "value": "#FFFFFF", "type": "color", "description": "Cartes et surfaces" },
      "border": { "value": "#E5E7EB", "type": "color", "description": "Délimitations douces" },
      "text": { "value": "#0B1220", "type": "color", "description": "Texte principal - Contraste 15.3:1" },
      "muted": { "value": "#475467", "type": "color", "description": "Texte secondaire - Contraste 7.1:1" }
    }
  }
}
```

### Typographie Médicale

#### Échelles de Police Fluides
```json
{
  "font": {
    "family": {
      "primary": { 
        "value": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", 
        "type": "fontFamilies",
        "description": "Police principale - Excellente lisibilité médicale"
      },
      "data": { 
        "value": "'JetBrains Mono', 'SF Mono', monospace", 
        "type": "fontFamilies",
        "description": "Données médicales - Distinction chiffres/lettres"
      }
    },
    "size": {
      "xs": { 
        "value": "clamp(0.75rem, 0.9vw + 0.6rem, 0.875rem)", 
        "type": "fontSizes",
        "description": "12-14px - Métadonnées, labels"
      },
      "sm": { 
        "value": "clamp(0.875rem, 1vw + 0.7rem, 1rem)", 
        "type": "fontSizes",
        "description": "14-16px - Texte secondaire"
      },
      "base": { 
        "value": "clamp(1rem, 1.2vw + 0.8rem, 1.125rem)", 
        "type": "fontSizes",
        "description": "16-18px - Texte principal"
      },
      "lg": { 
        "value": "clamp(1.125rem, 1.4vw + 0.9rem, 1.25rem)", 
        "type": "fontSizes",
        "description": "18-20px - Sous-titres"
      },
      "xl": { 
        "value": "clamp(1.25rem, 1.6vw + 1rem, 1.5rem)", 
        "type": "fontSizes",
        "description": "20-24px - Titres section"
      },
      "2xl": { 
        "value": "clamp(1.5rem, 2vw + 1.2rem, 1.875rem)", 
        "type": "fontSizes",
        "description": "24-30px - Titres principaux"
      },
      "3xl": { 
        "value": "clamp(1.875rem, 2.5vw + 1.5rem, 2.25rem)", 
        "type": "fontSizes",
        "description": "30-36px - Titres de page"
      }
    },
    "weight": {
      "light": { "value": "300", "type": "fontWeights" },
      "normal": { "value": "400", "type": "fontWeights" },
      "medium": { "value": "500", "type": "fontWeights" },
      "semibold": { "value": "600", "type": "fontWeights" },
      "bold": { "value": "700", "type": "fontWeights" }
    },
    "lineHeight": {
      "tight": { "value": "1.25", "type": "lineHeights", "description": "Titres" },
      "snug": { "value": "1.375", "type": "lineHeights", "description": "Sous-titres" },
      "normal": { "value": "1.5", "type": "lineHeights", "description": "Texte standard" },
      "relaxed": { "value": "1.625", "type": "lineHeights", "description": "Confort lecture" },
      "loose": { "value": "2", "type": "lineHeights", "description": "Aération maximale" }
    },
    "letterSpacing": {
      "tight": { "value": "-0.025em", "type": "letterSpacing", "description": "Titres" },
      "normal": { "value": "0", "type": "letterSpacing", "description": "Standard" },
      "wide": { "value": "0.025em", "type": "letterSpacing", "description": "Étalement" }
    }
  }
}
```

### Système d'Espacement Médical

#### Grille Base 8px
```json
{
  "spacing": {
    "0": { "value": "0", "type": "spacing" },
    "px": { "value": "1px", "type": "spacing" },
    "0.5": { "value": "0.125rem", "type": "spacing", "description": "2px - Micro-espacement" },
    "1": { "value": "0.25rem", "type": "spacing", "description": "4px - Espacement minimal" },
    "2": { "value": "0.5rem", "type": "spacing", "description": "8px - Unité de base" },
    "3": { "value": "0.75rem", "type": "spacing", "description": "12px - Espacement serré" },
    "4": { "value": "1rem", "type": "spacing", "description": "16px - Espacement standard" },
    "6": { "value": "1.5rem", "type": "spacing", "description": "24px - Espacement confortable" },
    "8": { "value": "2rem", "type": "spacing", "description": "32px - Séparation sections" },
    "12": { "value": "3rem", "type": "spacing", "description": "48px - Espacement large" },
    "16": { "value": "4rem", "type": "spacing", "description": "64px - Séparation majeure" },
    "touch": {
      "min": { "value": "44px", "type": "spacing", "description": "Cible tactile minimum iOS" },
      "comfort": { "value": "48px", "type": "spacing", "description": "Cible tactile confortable Android" },
      "senior": { "value": "56px", "type": "spacing", "description": "Cible tactile optimisée 65+ ans" },
      "emergency": { "value": "64px", "type": "spacing", "description": "Bouton d'urgence" }
    }
  }
}
```

### Effets et Élévations

#### Ombres Contextuelles
```json
{
  "shadow": {
    "xs": { 
      "value": "0 0 0 1px rgba(0, 0, 0, 0.05)", 
      "type": "boxShadow",
      "description": "Bordure subtile"
    },
    "sm": { 
      "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
      "type": "boxShadow",
      "description": "Élévation minimale"
    },
    "md": { 
      "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", 
      "type": "boxShadow",
      "description": "Cartes standards"
    },
    "lg": { 
      "value": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", 
      "type": "boxShadow",
      "description": "Modales, dropdowns"
    },
    "xl": { 
      "value": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", 
      "type": "boxShadow",
      "description": "Élévation forte"
    },
    "medical": {
      "primary": { 
        "value": "0 10px 40px -10px rgba(37, 99, 235, 0.35)", 
        "type": "boxShadow",
        "description": "Ombre colorée primaire"
      },
      "success": { 
        "value": "0 10px 40px -10px rgba(22, 163, 74, 0.35)", 
        "type": "boxShadow",
        "description": "Ombre colorée succès"
      },
      "error": { 
        "value": "0 10px 40px -10px rgba(223, 63, 64, 0.35)", 
        "type": "boxShadow",
        "description": "Ombre colorée erreur"
      }
    }
  }
}
```

#### Rayons de Bordure
```json
{
  "borderRadius": {
    "none": { "value": "0", "type": "borderRadius" },
    "sm": { "value": "0.125rem", "type": "borderRadius", "description": "2px - Petits éléments" },
    "base": { "value": "0.25rem", "type": "borderRadius", "description": "4px - Standard" },
    "md": { "value": "0.375rem", "type": "borderRadius", "description": "6px - Inputs, badges" },
    "lg": { "value": "0.5rem", "type": "borderRadius", "description": "8px - Boutons, cartes" },
    "xl": { "value": "0.75rem", "type": "borderRadius", "description": "12px - Cartes importantes" },
    "2xl": { "value": "1rem", "type": "borderRadius", "description": "16px - Modales" },
    "3xl": { "value": "1.5rem", "type": "borderRadius", "description": "24px - Éléments majeurs" },
    "full": { "value": "9999px", "type": "borderRadius", "description": "Complètement arrondi" }
  }
}
```

## Tokens Sémantiques

### Interface Médicale

```json
{
  "interface": {
    "background": {
      "primary": { "value": "{color.medical.background}", "type": "color" },
      "secondary": { "value": "{color.neutral.50}", "type": "color" },
      "tertiary": { "value": "{color.neutral.100}", "type": "color" },
      "inverse": { "value": "{color.neutral.900}", "type": "color" }
    },
    "surface": {
      "primary": { "value": "{color.medical.surface}", "type": "color" },
      "secondary": { "value": "{color.neutral.50}", "type": "color" },
      "elevated": { "value": "{color.white}", "type": "color" },
      "overlay": { "value": "rgba(0, 0, 0, 0.5)", "type": "color" }
    },
    "border": {
      "primary": { "value": "{color.medical.border}", "type": "color" },
      "secondary": { "value": "{color.neutral.200}", "type": "color" },
      "focus": { "value": "{color.primary.600}", "type": "color" },
      "error": { "value": "{color.error.600}", "type": "color" }
    },
    "text": {
      "primary": { "value": "{color.medical.text}", "type": "color" },
      "secondary": { "value": "{color.medical.muted}", "type": "color" },
      "tertiary": { "value": "{color.neutral.500}", "type": "color" },
      "inverse": { "value": "{color.white}", "type": "color" },
      "placeholder": { "value": "{color.neutral.400}", "type": "color" }
    }
  }
}
```

### Actions et États

```json
{
  "action": {
    "primary": {
      "background": { "value": "{color.primary.600}", "type": "color" },
      "backgroundHover": { "value": "{color.primary.700}", "type": "color" },
      "backgroundPressed": { "value": "{color.primary.800}", "type": "color" },
      "backgroundDisabled": { "value": "{color.neutral.200}", "type": "color" },
      "text": { "value": "{color.white}", "type": "color" },
      "textDisabled": { "value": "{color.neutral.400}", "type": "color" }
    },
    "secondary": {
      "background": { "value": "transparent", "type": "color" },
      "backgroundHover": { "value": "{color.neutral.100}", "type": "color" },
      "backgroundPressed": { "value": "{color.neutral.200}", "type": "color" },
      "border": { "value": "{color.primary.600}", "type": "color" },
      "text": { "value": "{color.primary.600}", "type": "color" }
    },
    "success": {
      "background": { "value": "{color.success.600}", "type": "color" },
      "backgroundHover": { "value": "{color.success.700}", "type": "color" },
      "text": { "value": "{color.white}", "type": "color" }
    },
    "warning": {
      "background": { "value": "{color.warning.500}", "type": "color" },
      "backgroundHover": { "value": "{color.warning.600}", "type": "color" },
      "text": { "value": "{color.white}", "type": "color" }
    },
    "error": {
      "background": { "value": "{color.error.600}", "type": "color" },
      "backgroundHover": { "value": "{color.error.700}", "type": "color" },
      "text": { "value": "{color.white}", "type": "color" }
    },
    "emergency": {
      "background": { "value": "{color.error.600}", "type": "color" },
      "backgroundHover": { "value": "{color.error.700}", "type": "color" },
      "text": { "value": "{color.white}", "type": "color" },
      "animation": { "value": "pulse-gentle", "type": "animation" },
      "ring": { "value": "2px solid {color.error.200}", "type": "border" }
    }
  }
}
```

### Focus et Navigation

```json
{
  "focus": {
    "ring": {
      "width": { "value": "2px", "type": "borderWidth" },
      "offset": { "value": "2px", "type": "spacing" },
      "color": { "value": "{color.primary.500}", "type": "color" },
      "opacity": { "value": "0.8", "type": "opacity" }
    },
    "medical": {
      "width": { "value": "2px", "type": "borderWidth" },
      "offset": { "value": "2px", "type": "spacing" },
      "color": { "value": "{color.primary.600}", "type": "color" },
      "background": { "value": "{color.white}", "type": "color" },
      "shadow": { 
        "value": "0 0 0 2px {color.white}, 0 0 0 4px {color.primary.500}", 
        "type": "boxShadow" 
      }
    },
    "emergency": {
      "animation": { "value": "focus-pulse", "type": "animation" },
      "shadow": { 
        "value": "0 0 0 2px {color.white}, 0 0 0 4px {color.error.500}, 0 0 8px 4px rgba(223, 63, 64, 0.3)", 
        "type": "boxShadow" 
      }
    }
  }
}
```

## Tokens Composites

### Animations et Transitions

```json
{
  "animation": {
    "duration": {
      "fast": { "value": "150ms", "type": "duration", "description": "Micro-interactions" },
      "base": { "value": "200ms", "type": "duration", "description": "Transitions standard" },
      "slow": { "value": "300ms", "type": "duration", "description": "Transitions complexes" },
      "slower": { "value": "500ms", "type": "duration", "description": "Animations d'entrée" }
    },
    "easing": {
      "easeIn": { "value": "cubic-bezier(0.4, 0, 1, 1)", "type": "cubicBezier" },
      "easeOut": { "value": "cubic-bezier(0, 0, 0.2, 1)", "type": "cubicBezier" },
      "easeInOut": { "value": "cubic-bezier(0.4, 0, 0.2, 1)", "type": "cubicBezier" },
      "spring": { "value": "cubic-bezier(0.175, 0.885, 0.32, 1.275)", "type": "cubicBezier" },
      "medical": { "value": "cubic-bezier(0.25, 0.46, 0.45, 0.94)", "type": "cubicBezier", "description": "Apaisant pour patients anxieux" }
    },
    "keyframes": {
      "fadeIn": {
        "value": {
          "0%": { "opacity": "0" },
          "100%": { "opacity": "1" }
        },
        "type": "keyframes"
      },
      "slideUp": {
        "value": {
          "0%": { "transform": "translateY(20px)", "opacity": "0" },
          "100%": { "transform": "translateY(0)", "opacity": "1" }
        },
        "type": "keyframes"
      },
      "pulse-gentle": {
        "value": {
          "0%, 100%": { "opacity": "1" },
          "50%": { "opacity": "0.8" }
        },
        "type": "keyframes",
        "description": "Animation douce pour urgences"
      },
      "focus-pulse": {
        "value": {
          "0%, 100%": { "boxShadow": "0 0 0 2px white, 0 0 0 4px {color.error.500}" },
          "50%": { "boxShadow": "0 0 0 2px white, 0 0 0 6px {color.error.500}" }
        },
        "type": "keyframes"
      }
    }
  }
}
```

### Gradients Médicaux

```json
{
  "gradient": {
    "primary": {
      "value": "linear-gradient(135deg, {color.primary.500} 0%, {color.primary.700} 100%)",
      "type": "gradient",
      "description": "Gradient principal - confiance"
    },
    "success": {
      "value": "linear-gradient(135deg, {color.success.400} 0%, {color.success.600} 100%)",
      "type": "gradient",
      "description": "Gradient validation"
    },
    "medical": {
      "value": "linear-gradient(135deg, {color.primary.500} 0%, {color.secondary.500} 100%)",
      "type": "gradient",
      "description": "Gradient médical - innovation/soin"
    },
    "aurora": {
      "value": "linear-gradient(135deg, {color.primary.400} 0%, {color.primary.500} 50%, {color.secondary.500} 100%)",
      "type": "gradient",
      "description": "Gradient complexe pour éléments premium"
    }
  }
}
```

### Glass Morphism

```json
{
  "glass": {
    "light": {
      "background": { "value": "rgba(255, 255, 255, 0.7)", "type": "color" },
      "backdropFilter": { "value": "blur(12px)", "type": "backdropFilter" },
      "border": { "value": "1px solid rgba(255, 255, 255, 0.3)", "type": "border" }
    },
    "dark": {
      "background": { "value": "rgba(0, 0, 0, 0.7)", "type": "color" },
      "backdropFilter": { "value": "blur(12px)", "type": "backdropFilter" },
      "border": { "value": "1px solid rgba(255, 255, 255, 0.1)", "type": "border" }
    },
    "medical": {
      "background": { "value": "rgba(37, 99, 235, 0.1)", "type": "color" },
      "backdropFilter": { "value": "blur(12px)", "type": "backdropFilter" },
      "border": { "value": "1px solid rgba(37, 99, 235, 0.2)", "type": "border" }
    }
  }
}
```

## Tokens Contextuels

### Accessibilité et Contraste

```json
{
  "accessibility": {
    "contrast": {
      "aa": { "value": "4.5", "type": "number", "description": "Ratio minimum WCAG AA" },
      "aaa": { "value": "7", "type": "number", "description": "Ratio minimum WCAG AAA" },
      "enhanced": { "value": "10", "type": "number", "description": "Contraste renforcé seniors" }
    },
    "motion": {
      "reducedDuration": { "value": "0ms", "type": "duration" },
      "reducedEasing": { "value": "ease", "type": "cubicBezier" }
    },
    "fontSize": {
      "large": { "value": "1.25", "type": "number", "description": "Facteur agrandissement" },
      "extraLarge": { "value": "1.5", "type": "number", "description": "Facteur agrandissement maximal" }
    }
  }
}
```

### Responsive et Breakpoints

```json
{
  "breakpoint": {
    "xs": { "value": "360px", "type": "dimension", "description": "Petit mobile" },
    "sm": { "value": "640px", "type": "dimension", "description": "Mobile standard" },
    "md": { "value": "768px", "type": "dimension", "description": "Tablette" },
    "lg": { "value": "1024px", "type": "dimension", "description": "Desktop cabinet" },
    "xl": { "value": "1280px", "type": "dimension", "description": "Large desktop manager" },
    "2xl": { "value": "1440px", "type": "dimension", "description": "Ultra-wide cabinet" }
  },
  "container": {
    "xs": { "value": "100%", "type": "dimension" },
    "sm": { "value": "640px", "type": "dimension" },
    "md": { "value": "768px", "type": "dimension" },
    "lg": { "value": "1024px", "type": "dimension" },
    "xl": { "value": "1280px", "type": "dimension" },
    "2xl": { "value": "1400px", "type": "dimension" }
  }
}
```

### Z-Index et Couches

```json
{
  "zIndex": {
    "auto": { "value": "auto", "type": "number" },
    "base": { "value": "0", "type": "number" },
    "docked": { "value": "10", "type": "number", "description": "Éléments ancrés" },
    "dropdown": { "value": "1000", "type": "number", "description": "Menus déroulants" },
    "sticky": { "value": "1020", "type": "number", "description": "Navigation collante" },
    "modal": { "value": "1030", "type": "number", "description": "Modales" },
    "popover": { "value": "1040", "type": "number", "description": "Popovers" },
    "tooltip": { "value": "1050", "type": "number", "description": "Tooltips" },
    "notification": { "value": "1060", "type": "number", "description": "Notifications toast" },
    "emergency": { "value": "9999", "type": "number", "description": "Urgences critiques" }
  }
}
```

## Mode Sombre

### Adaptation Couleurs

```json
{
  "dark": {
    "color": {
      "medical": {
        "background": { "value": "#0B1220", "type": "color" },
        "surface": { "value": "#1E293B", "type": "color" },
        "border": { "value": "#334155", "type": "color" },
        "text": { "value": "#F8FAFC", "type": "color" },
        "muted": { "value": "#94A3B8", "type": "color" }
      },
      "primary": {
        "600": { "value": "#3B82F6", "type": "color", "description": "Plus clair en mode sombre" }
      },
      "success": {
        "600": { "value": "#22C55E", "type": "color" }
      },
      "error": {
        "600": { "value": "#EF4444", "type": "color" }
      }
    },
    "shadow": {
      "sm": { "value": "0 1px 2px 0 rgba(0, 0, 0, 0.3)", "type": "boxShadow" },
      "md": { "value": "0 4px 6px -1px rgba(0, 0, 0, 0.4)", "type": "boxShadow" },
      "lg": { "value": "0 10px 15px -3px rgba(0, 0, 0, 0.5)", "type": "boxShadow" }
    }
  }
}
```

## Génération CSS

### CSS Custom Properties
```css
/* Généré automatiquement depuis tokens JSON */
:root {
  /* Couleurs primitives */
  --color-primary-50: #EEF2FF;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  
  /* Couleurs sémantiques */
  --color-medical-background: #FAFBFF;
  --color-medical-text: #0B1220;
  --color-interface-background-primary: var(--color-medical-background);
  --color-interface-text-primary: var(--color-medical-text);
  
  /* Typographie */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: clamp(1rem, 1.2vw + 0.8rem, 1.125rem);
  --font-weight-medium: 500;
  --line-height-normal: 1.5;
  
  /* Espacement */
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-touch-min: 44px;
  --spacing-touch-senior: 56px;
  
  /* Effets */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --border-radius-lg: 0.5rem;
  
  /* Focus */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-color: var(--color-primary-500);
  
  /* Animations */
  --animation-duration-base: 200ms;
  --animation-easing-medical: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Mode sombre */
.dark {
  --color-medical-background: #0B1220;
  --color-medical-surface: #1E293B;
  --color-medical-text: #F8FAFC;
  --color-primary-600: #3B82F6;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}

/* Contraste élevé */
.high-contrast {
  --color-interface-text-primary: var(--color-primary-900);
  --color-interface-border-primary: var(--color-neutral-400);
}

/* Préférences utilisateur */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration-base: 0ms;
    --animation-easing-medical: ease;
  }
}

@media (prefers-contrast: high) {
  :root {
    --color-interface-text-primary: #000000;
    --color-interface-border-primary: #374151;
  }
}
```

### Utility Classes Tailwind

```css
/* Configuration Tailwind générée depuis tokens */
module.exports = {
  theme: {
    extend: {
      colors: {
        'medical-bg': 'var(--color-medical-background)',
        'medical-text': 'var(--color-medical-text)',
        'primary': {
          50: 'var(--color-primary-50)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)'
        }
      },
      fontFamily: {
        'primary': 'var(--font-family-primary)'
      },
      fontSize: {
        'medical-base': 'var(--font-size-base)'
      },
      spacing: {
        'touch-min': 'var(--spacing-touch-min)',
        'touch-senior': 'var(--spacing-touch-senior)'
      },
      boxShadow: {
        'medical': 'var(--shadow-md)'
      },
      borderRadius: {
        'medical': 'var(--border-radius-lg)'
      },
      animation: {
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite'
      },
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      }
    }
  }
}
```

## Outils et Workflow

### Validation des Tokens

```typescript
// Token validation schema
import { z } from 'zod';

const ColorTokenSchema = z.object({
  value: z.string().regex(/^#[0-9A-F]{6}$/i, 'Format hexadécimal requis'),
  type: z.literal('color'),
  description: z.string().optional()
});

const ContrastValidation = (foreground: string, background: string) => {
  const ratio = calculateContrastRatio(foreground, background);
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    ratio
  };
};

// Validation automatique
export const validateMedicalTokens = (tokens: any) => {
  // Vérifier contraste AAA pour texte principal
  const textContrast = ContrastValidation(
    tokens.color.medical.text.value,
    tokens.color.medical.background.value
  );
  
  if (!textContrast.aaa) {
    throw new Error(`Contraste insuffisant: ${textContrast.ratio} (requis: 7.0)`);
  }
  
  // Vérifier cibles tactiles
  const touchTargets = [
    tokens.spacing.touch.min.value,
    tokens.spacing.touch.comfort.value,
    tokens.spacing.touch.senior.value
  ];
  
  touchTargets.forEach(target => {
    const px = parseInt(target.replace('px', ''));
    if (px < 44) {
      throw new Error(`Cible tactile trop petite: ${px}px (minimum: 44px)`);
    }
  });
};
```

### Export Multi-Format

```bash
# Scripts de génération
npm run tokens:build        # Génération tous formats
npm run tokens:css          # CSS custom properties
npm run tokens:scss         # Variables SCSS
npm run tokens:js           # Modules JavaScript/TypeScript
npm run tokens:json         # JSON pour tooling
npm run tokens:figma        # Format Figma Tokens
npm run tokens:android      # Format Android XML
npm run tokens:ios          # Format iOS Swift

# Validation
npm run tokens:validate     # Validation contraste + accessibilité
npm run tokens:lint         # Lint format tokens
npm run tokens:test         # Tests automatisés

# Synchronisation
npm run tokens:sync-figma   # Sync vers Figma
npm run tokens:sync-docs    # Sync documentation
```

Ce système de design tokens fournit une base solide et évolutive pour maintenir la cohérence visuelle et l'accessibilité de NOVA RDV à travers toutes les interfaces et dispositifs.