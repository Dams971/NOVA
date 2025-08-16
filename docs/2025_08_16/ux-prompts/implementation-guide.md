# Guide d'Implémentation UX NOVA - Transformation Complète

## Vue d'Ensemble

Ce guide orchestre la transformation UX complète de NOVA en utilisant les prompts créés et les agents Claude Code UI. L'objectif est de créer une plateforme médicale exceptionnelle inspirée de Maiia.

## 🎯 Stratégie d'Implémentation

### Phase 1: Foundation (Semaine 1)
1. **Design System Global**
   - Utiliser `claude-code-ui-agents/prompts/ui-design/design-system-generator.md`
   - Adapter la palette Maiia (#4eb3c9, #f68092) au contexte dentaire
   - Créer `src/styles/nova-design-system.ts` avec tous les tokens

2. **Composants de Base**
   - Utiliser `claude-code-ui-agents/prompts/components/react-component-generator.md`
   - Générer: Button, Input, Card, Modal, Toast médicaux
   - Implémenter avec variants urgence/normal/success

### Phase 2: Pages Critiques (Semaine 2)

#### Page d'Accueil (/)
```bash
# Utiliser le prompt home-page-redesign.md avec l'agent
npx claude-code-ui-agent generate --prompt docs/2025_08_16/ux-prompts/home-page-redesign.md --output src/app/page.tsx
```

**Priorités:**
- Hero avec recherche intelligente (spécialité + lieu + date)
- 4 cartes services visuelles (urgences, consultation, prévention, orthodontie)
- Section réassurance avec process 3 étapes
- Témoignages patients avec photos

#### Page RDV (/rdv)
```bash
# Générer l'expérience conversationnelle
npx claude-code-ui-agent generate --prompt docs/2025_08_16/ux-prompts/rdv-page-redesign.md --output src/app/rdv/
```

**Architecture Split-Screen:**
```tsx
<div className="rdv-container max-w-[1440px] grid grid-cols-[60%_40%]">
  <ChatColumn>
    <NovaAssistant />
    <ConversationFlow />
    <SuggestionChips />
  </ChatColumn>
  
  <SummaryColumn>
    <AppointmentSummary />
    <MiniCalendar />
    <QuickSlots />
  </SummaryColumn>
</div>
```

### Phase 3: Expériences Spécialisées (Semaine 3)

#### Page Urgences
- Implémenter triage intelligent avec niveaux (critique/élevé/modéré)
- Géolocalisation cabinets de garde
- Téléconsultation express (<5 min)
- Guide premiers soins interactif

#### Dashboard Manager
- WebSocket pour temps réel
- Widgets personnalisables drag & drop
- KPIs avec sparklines
- Planning multi-praticiens

### Phase 4: Optimisations (Semaine 4)

## 🛠️ Stack Technique Recommandé

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "radix-ui": "latest",
    "recharts": "^2.10.0",
    "socket.io-client": "^4.7.0",
    "react-query": "^3.39.0",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  }
}
```

## 🎨 Design Tokens Unifiés

```typescript
// src/styles/nova-tokens.ts
export const novaTokens = {
  colors: {
    // Palette Maiia adaptée
    primary: {
      50: '#e6f4f7',
      500: '#4eb3c9', // Bleu Maiia
      700: '#3a8ca3'
    },
    accent: {
      50: '#fef1f3',
      500: '#f68092', // Rose Maiia
      700: '#e85670'
    },
    medical: {
      trust: '#4eb3c9',
      urgent: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b'
    }
  },
  
  typography: {
    fonts: {
      heading: "'Outfit', sans-serif",
      body: "'Source Sans 3', sans-serif"
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    }
  },
  
  spacing: {
    base: 8,
    scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
  },
  
  animations: {
    durations: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easings: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
}
```

## 📋 Checklist Qualité

### Accessibilité (WCAG AAA)
- [ ] Contrastes ≥7:1 sur tous les textes importants
- [ ] Navigation 100% clavier
- [ ] ARIA labels sur tous les éléments interactifs
- [ ] Focus visible avec outline 2px minimum
- [ ] Skip links sur toutes les pages
- [ ] Annonces screen reader pour changements d'état

### Performance
- [ ] Lighthouse score ≥95 sur toutes les pages
- [ ] Bundle size <150KB initial
- [ ] TTI <3s sur 3G
- [ ] Images optimisées WebP avec fallback
- [ ] Code splitting par route
- [ ] Prefetch pages critiques

### UX Médicale
- [ ] Ton empathique et rassurant
- [ ] Réassurance continue (badges sécurité, avis)
- [ ] Temps d'attente toujours visibles
- [ ] Actions urgence accessibles <2 clics
- [ ] Mode senior avec texte agrandi
- [ ] Support multilingue FR/AR/EN

### Responsive
- [ ] Mobile-first design
- [ ] Breakpoints: 360/768/1024/1280/1440
- [ ] Touch targets ≥48px (56px urgences)
- [ ] Swipe gestures sur mobile
- [ ] Bottom sheets pour modales mobile
- [ ] Orientation portrait/paysage

## 🚀 Scripts d'Automatisation

```bash
# Installation complète
npm run nova:setup

# Génération composants avec prompts
npm run generate:component -- --prompt medical-button

# Build avec vérifications
npm run build:validate

# Tests accessibilité
npm run test:a11y

# Déploiement staging
npm run deploy:staging
```

## 📊 Métriques de Succès

| Métrique | Baseline | Cible | Mesure |
|----------|----------|-------|---------|
| Conversion RDV | 8% | 15% | Google Analytics |
| Temps booking | 5min | <2min | Hotjar |
| Satisfaction | 3.5/5 | 4.5/5 | NPS |
| Bounce rate | 45% | <25% | GA |
| Page load | 4s | <2s | Lighthouse |
| A11y score | 72 | 100 | axe-core |

## 🔄 Workflow Itératif

1. **Generate** : Utiliser prompts avec agents Claude Code
2. **Implement** : Coder avec les composants générés
3. **Test** : Valider accessibilité et performance
4. **Iterate** : Affiner basé sur feedback
5. **Deploy** : Mise en production progressive

## 💡 Tips d'Implémentation

### Pour la Page RDV
- Commencer par le flow conversationnel basique
- Ajouter progressivement chips et suggestions
- Implémenter WebSocket en dernier
- Tester avec personas (Fatima anxieuse)

### Pour les Urgences
- Priorité absolue sur le temps de chargement
- Bouton appel toujours visible
- Géolocalisation avec fallback manuel
- Cache aggressive pour guides premiers soins

### Pour le Dashboard
- Commencer par KPIs statiques
- Ajouter WebSocket progressivement
- Widgets optionnels au début
- Focus sur temps de réponse <100ms

## 🎯 Prochaines Étapes

1. **Immédiat** : Implémenter design system global
2. **Semaine 1** : Page accueil + composants base
3. **Semaine 2** : Page RDV conversationnelle
4. **Semaine 3** : Urgences + Dashboard
5. **Semaine 4** : Tests, optimisations, déploiement

## 📚 Ressources

- [Prompts UX créés](./docs/2025_08_16/ux-prompts/)
- [Claude Code UI Agents](./claude-code-ui-agents/)
- [Inspiration Maiia](https://www.maiia.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

Ce guide constitue la feuille de route complète pour transformer NOVA en plateforme médicale exceptionnelle. Chaque prompt créé est spécifique et actionnable, prêt à être utilisé avec les agents Claude Code pour générer du code de qualité production.