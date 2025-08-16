# NOVA RDV - Décisions Techniques Architecture Design System

## Vue d'ensemble

Ce document présente les décisions architecturales clés prises pour le design system médical de NOVA RDV. Chaque décision est documentée selon le format ADR (Architecture Decision Record) avec le contexte, les alternatives considérées, la décision finale et ses conséquences.

**Critères de Décision Principaux:**
- **Accessibilité** : Conformité WCAG AAA obligatoire
- **Performance** : Optimisation mobile-first et bundle size
- **Maintenabilité** : Évolutivité et documentation vivante
- **Adoption** : Facilité d'apprentissage et migration
- **Médical UX** : Spécificités environnement santé français

## ADR-001: Choix du Framework CSS - Tailwind CSS + Tokens Système

### Statut
**Accepté** - 2025-08-16

### Contexte
Le design system NOVA nécessite un système de styling flexible, performant et maintenant la cohérence visuelle à travers toutes les interfaces. Plusieurs approches ont été évaluées.

### Alternatives Considérées

1. **CSS-in-JS (Styled Components/Emotion)**
   - ✅ Scoping automatique, dynamic theming
   - ❌ Runtime overhead, bundle size important
   - ❌ SSR complexe, hydration mismatch potentiel

2. **CSS Modules**
   - ✅ Scoping local, performance native
   - ❌ Maintenance tokens complexe, DX limité
   - ❌ Pas de dynamic theming facile

3. **Vanilla CSS + Custom Properties**
   - ✅ Performance maximale, contrôle total
   - ❌ Productivité réduite, maintenance lourde
   - ❌ Pas d'optimisation automatique

4. **Tailwind CSS + Design Tokens**
   - ✅ Utility-first, purge automatique
   - ✅ Design tokens natifs, DX excellent
   - ✅ Écosystème riche, adoption large

### Décision
**Tailwind CSS avec système de design tokens personnalisé**

**Configuration retenue :**
```typescript
// tailwind.config.ts
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'medical-bg': 'rgb(var(--color-medical-background) / <alpha-value>)',
        'medical-text': 'rgb(var(--color-medical-text) / <alpha-value>)',
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)'
        }
      },
      fontFamily: {
        'medical': 'var(--font-family-primary)'
      },
      spacing: {
        'touch-min': 'var(--spacing-touch-min)',
        'touch-senior': 'var(--spacing-touch-senior)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries')
  ]
}
```

### Conséquences

**Positives :**
- Bundle size optimisé via purge automatique (< 20KB en production)
- DX excellent avec IntelliSense et autocomplétion
- Design tokens intégrés via CSS custom properties
- Responsive design simplifié avec breakpoints médicaux
- Migration progressive possible depuis CSS existant

**Négatives :**
- Courbe d'apprentissage pour équipes habituées à CSS traditionnel
- Dépendance externe à maintenir
- Classe HTML potentiellement verboses

**Mitigation :**
- Formation équipe sur utilities Tailwind
- Extraction composants réutilisables via cva()
- Documentation patterns fréquents

---

## ADR-002: Architecture Composants - Radix UI + shadcn/ui

### Statut
**Accepté** - 2025-08-16

### Contexte
Les composants d'interface doivent garantir l'accessibilité WCAG AAA native tout en permettant la personnalisation visuelle complète. L'écosystème médical nécessite des interactions complexes (modales, sélecteurs, calendriers).

### Alternatives Considérées

1. **Composants from scratch**
   - ✅ Contrôle total, spécialisation médicale
   - ❌ Coût développement énorme, maintenance lourde
   - ❌ Bugs accessibilité potentiels

2. **Material-UI**
   - ✅ Composants complets, accessibilité correcte
   - ❌ Design Google imposé, customisation limitée
   - ❌ Bundle size important

3. **Mantine**
   - ✅ Hooks utiles, theming flexible
   - ❌ Écosystème moins mature
   - ❌ Pas optimisé environnement médical

4. **Radix UI + shadcn/ui**
   - ✅ Accessibilité WCAG AAA native
   - ✅ Headless, personnalisation totale
   - ✅ Tree-shaking optimal, performance

### Décision
**Radix UI Primitives + shadcn/ui comme base + personnalisation médicale**

**Architecture retenue :**
```typescript
// Couche 1: Radix UI Primitives (comportement + a11y)
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Couche 2: shadcn/ui (styling de base)
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Couche 3: Composants médicaux (logique métier)
import { MedicalDialog } from '@/components/medical/MedicalDialog';

// Utilisation finale
<MedicalDialog urgency="high" medical>
  <AppointmentForm />
</MedicalDialog>
```

### Conséquences

**Positives :**
- Accessibilité WCAG AAA garantie out-of-the-box
- Navigation clavier native sur tous composants
- Bundle size minimal grâce au tree-shaking
- Personnalisation complète via tokens design
- Écosystème mature et bien documenté

**Négatives :**
- Complexité architecture en couches
- Dépendances multiples à gérer
- Courbe d'apprentissage Radix API

**Mitigation :**
- Documentation claire architecture en couches
- Composants médicaux wrapper pour simplifier API
- Formation équipe sur patterns Radix

---

## ADR-003: Gestion d'État - Zustand + React Query

### Statut
**Accepté** - 2025-08-16

### Contexte
L'application NOVA nécessite une gestion d'état pour l'authentification, les préférences utilisateur, et le cache des données serveur. Le dashboard manager a besoin de mises à jour temps réel via WebSocket.

### Alternatives Considérées

1. **Redux Toolkit + RTK Query**
   - ✅ Écosystème mature, DevTools excellents
   - ❌ Boilerplate important, courbe d'apprentissage
   - ❌ Overhead pour app de taille moyenne

2. **Context API + useState**
   - ✅ Natif React, simple à comprendre
   - ❌ Pas de cache intelligent, re-renders excessifs
   - ❌ Pas de persistence/hydration automatique

3. **Jotai + SWR**
   - ✅ Atomic state, performance optimale
   - ❌ Paradigme moins familier à l'équipe
   - ❌ Intégration WebSocket manuelle

4. **Zustand + React Query**
   - ✅ API simple, TypeScript excellent
   - ✅ Cache intelligent, optimizations automatiques
   - ✅ Bundle size minimal

### Décision
**Zustand pour état client + React Query pour état serveur**

**Architecture retenue :**
```typescript
// État client - Zustand
interface AppStore {
  user: AuthUser | null;
  theme: 'light' | 'dark' | 'auto';
  preferences: UserPreferences;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setTheme: (theme: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      theme: 'auto',
      preferences: defaultPreferences,
      
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      updatePreferences: (prefs) => set(state => ({
        preferences: { ...state.preferences, ...prefs }
      }))
    }),
    {
      name: 'nova-app-store',
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences
      })
    }
  )
);

// État serveur - React Query
export const useAppointments = (filters: AppointmentFilters) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsService.getAppointments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true
  });
};
```

### Conséquences

**Positives :**
- Séparation claire état client/serveur
- Cache intelligent avec invalidation automatique
- Performance optimale, re-renders minimaux
- DevTools intégrés pour debug
- TypeScript support excellent

**Négatives :**
- Deux systèmes d'état à maîtriser
- Synchronisation client/serveur à gérer

**Mitigation :**
- Documentation claire responsabilités chaque store
- Hooks personnalisés pour encapsuler logique

---

## ADR-004: Système d'Icônes - Lucide React

### Statut
**Accepté** - 2025-08-16

### Contexte
L'interface médicale nécessite une iconographie cohérente, accessible et optimisée pour l'environnement de santé. Les icônes doivent être compréhensibles pour tous âges et cultures.

### Alternatives Considérées

1. **Heroicons**
   - ✅ Design cohérent, bien documenté
   - ❌ Manque icônes médicales spécialisées
   - ❌ Style unique (outline/solid seulement)

2. **React Icons (Font Awesome + autres)**
   - ✅ Catalogue énorme, icônes médicales
   - ❌ Bundle size important si mal utilisé
   - ❌ Styles inconsistants entre collections

3. **Icônes custom SVG**
   - ✅ Contrôle total, optimisation parfaite
   - ❌ Coût création/maintenance énorme
   - ❌ Risque inconsistance

4. **Lucide React**
   - ✅ Design moderne, cohérent et medical-friendly
   - ✅ Tree-shaking optimal, bundle size minimal
   - ✅ Personnalisation complète (size, color, stroke)

### Décision
**Lucide React avec conventions médicales**

**Implémentation :**
```typescript
// Wrapper pour icônes médicales avec conventions
interface MedicalIconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  urgent?: boolean;
  className?: string;
}

export const MedicalIcon = ({ 
  icon: Icon, 
  size = 'md', 
  variant = 'default',
  urgent = false,
  className 
}: MedicalIconProps) => {
  const sizeMap = {
    xs: 12, sm: 16, md: 20, lg: 24, xl: 32
  };
  
  return (
    <Icon 
      size={sizeMap[size]}
      className={cn(
        // Couleurs par variant
        variant === 'primary' && 'text-primary-600',
        variant === 'success' && 'text-success-600',
        variant === 'warning' && 'text-warning-600',
        variant === 'error' && 'text-error-600',
        
        // Style urgent
        urgent && 'animate-pulse-gentle text-error-600',
        
        className
      )}
      strokeWidth={urgent ? 2.5 : 2}
    />
  );
};

// Icônes médicales spécialisées
export const MedicalIcons = {
  // Navigation
  dashboard: LayoutDashboard,
  appointments: Calendar,
  patients: Users,
  analytics: BarChart3,
  
  // Actions médicales
  emergency: AlertTriangle,
  consultation: Stethoscope,
  treatment: Pill,
  xray: Scan,
  
  // États
  confirmed: CheckCircle,
  pending: Clock,
  cancelled: XCircle,
  completed: Check
} as const;
```

### Conséquences

**Positives :**
- Bundle size optimal (2-3KB total en production)
- Cohérence visuelle garantie
- Accessibilité native avec aria-hidden
- Personnalisation complète couleurs/tailles
- Catalogue riche avec icônes médicales appropriées

**Négatives :**
- Dépendance externe à maintenir
- Catalogue potentiellement limité pour besoins très spécifiques

**Mitigation :**
- Wrapper MedicalIcon pour conventions internes
- Système de fallback pour icônes custom si besoin

---

## ADR-005: Animations et Micro-interactions - Framer Motion

### Statut
**Accepté** - 2025-08-16

### Contexte
L'environnement médical nécessite des animations apaisantes pour réduire l'anxiété des patients. Les micro-interactions doivent être subtiles, performantes et respecter les préférences d'accessibilité.

### Alternatives Considérées

1. **CSS Animations pures**
   - ✅ Performance maximale, contrôle total
   - ❌ API verbose, gestion états complexe
   - ❌ Pas de respection automatique prefers-reduced-motion

2. **React Transition Group**
   - ✅ Intégration React native
   - ❌ API limitée, pas d'animations gesture
   - ❌ Bundle size pour fonctionnalités basiques

3. **React Spring**
   - ✅ Animations physics-based naturelles
   - ❌ Courbe d'apprentissage importante
   - ❌ API complexe pour cas simples

4. **Framer Motion**
   - ✅ API déclarative, intuitive
   - ✅ Gestion automatique prefers-reduced-motion
   - ✅ Animations gesture pour touch

### Décision
**Framer Motion avec presets médicaux**

**Configuration :**
```typescript
// Presets d'animations médicales
export const medicalAnimations = {
  // Animation apaisante pour éléments critiques
  gentleFadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] // Easing medical apaisant
    }
  },
  
  // Animation urgence avec pulse subtil
  urgentPulse: {
    animate: { 
      scale: [1, 1.02, 1],
      transition: { 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  
  // Modal médicale avec backdrop blur
  modalEntry: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

// Composant wrapper avec respect accessibility
export const MedicalMotion = ({ 
  children, 
  preset, 
  disabled,
  ...props 
}: MotionProps & { preset?: keyof typeof medicalAnimations }) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion || disabled) {
    return <div {...props}>{children}</div>;
  }
  
  const animation = preset ? medicalAnimations[preset] : props;
  
  return (
    <motion.div {...animation} {...props}>
      {children}
    </motion.div>
  );
};
```

### Conséquences

**Positives :**
- Respect automatique des préférences accessibilité
- API déclarative simple à utiliser
- Animations gesture pour améliorer UX mobile
- Performance optimisée avec GPU acceleration
- Ecosystem riche (layout animations, etc.)

**Négatives :**
- Bundle size supplémentaire (~30KB)
- Complexité pour animations très simples
- Courbe d'apprentissage pour animations avancées

**Mitigation :**
- Lazy loading pour animations complexes
- Presets médicaux pour simplifier usage courant
- Fallback CSS pour animations critiques

---

## ADR-006: Tests Accessibilité - Jest + Testing Library + axe-core

### Statut
**Accepté** - 2025-08-16

### Contexte
La conformité WCAG AAA est obligatoire pour NOVA RDV. Les tests d'accessibilité doivent être automatisés et intégrés dans le workflow de développement.

### Alternatives Considérées

1. **Tests manuels uniquement**
   - ✅ Détection problèmes complexes
   - ❌ Pas de scalabilité, erreurs humaines
   - ❌ Feedback tardif dans le cycle développement

2. **Lighthouse CI uniquement**
   - ✅ Métriques performance + a11y globales
   - ❌ Pas de tests granulaires par composant
   - ❌ Feedback limité sur causes racines

3. **Pa11y + Playwright**
   - ✅ Tests E2E accessibilité réels
   - ❌ Lent, pas adapté développement rapide
   - ❌ Setup complexe CI/CD

4. **Jest + Testing Library + axe-core**
   - ✅ Tests unitaires rapides et fiables
   - ✅ Intégration développement seamless
   - ✅ Couverture granulaire par composant

### Décision
**Jest + Testing Library + axe-core + tests manuels ciblés**

**Configuration :**
```typescript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testEnvironment: 'jsdom'
};

// src/test/setup.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Test helper pour accessibilité
export const testA11y = async (component: ReactElement) => {
  const { container } = render(component);
  const results = await axe(container, {
    rules: {
      // Configuration WCAG AAA
      'color-contrast': { enabled: true, options: { wcagLevel: 'AAA' } },
      'focus-order-semantics': { enabled: true },
      'keyboard-navigation': { enabled: true }
    }
  });
  
  expect(results).toHaveNoViolations();
  return { container, results };
};

// Tests composants médicaux
describe('MedicalButton Accessibility', () => {
  it('meets WCAG AAA standards', async () => {
    await testA11y(
      <MedicalButton variant="primary">
        Prendre rendez-vous
      </MedicalButton>
    );
  });
  
  it('has proper focus management', () => {
    render(<MedicalButton>Test</MedicalButton>);
    const button = screen.getByRole('button');
    
    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveClass('focus-visible:ring-2');
  });
  
  it('supports keyboard navigation', () => {
    const handleClick = jest.fn();
    render(<MedicalButton onClick={handleClick}>Test</MedicalButton>);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Conséquences

**Positives :**
- Détection automatique violations WCAG AAA
- Feedback immédiat pendant développement
- Couverture exhaustive composants individuels
- Intégration CI/CD native
- Métriques qualité trackables

**Négatives :**
- Pas de détection problèmes complexes multi-composants
- Tests limités aux règles automatisables
- Setup initial et formation équipe

**Mitigation :**
- Tests E2E complémentaires avec Playwright
- Tests manuels planifiés avec screen readers
- Documentation patterns accessibilité

---

## ADR-007: Performance Bundle - Vite + SWC + Tree Shaking Aggressive

### Statut
**Accepté** - 2025-08-16

### Contexte
Le design system doit être performant pour les connexions mobiles lentes communes en Algérie. Le bundle size et les temps de chargement sont critiques pour l'adoption.

### Alternatives Considérées

1. **Webpack + Babel**
   - ✅ Écosystème mature, plugins nombreux
   - ❌ Build times lents, configuration complexe
   - ❌ Optimisations manuelles nécessaires

2. **esbuild seul**
   - ✅ Performance compilation maximale
   - ❌ Écosystème plugins limité
   - ❌ Moins de contrôle optimisations avancées

3. **Rollup + Terser**
   - ✅ Tree-shaking excellent, bundle optimal
   - ❌ Configuration complexe pour monorepo
   - ❌ DX moins bon pour développement

4. **Vite + SWC**
   - ✅ HMR ultra-rapide, DX excellent
   - ✅ Optimisations production automatiques
   - ✅ Support moderne tooling out-of-box

### Décision
**Vite + SWC + optimisations bundle agressives**

**Configuration :**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'automatic' }),
    // SWC pour compilation ultra-rapide
    swc.vite({
      jsc: {
        minify: {
          compress: true,
          mangle: true
        }
      }
    })
  ],
  
  build: {
    // Code splitting intelligent
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks optimisés
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'utils-vendor': ['clsx', 'class-variance-authority'],
          
          // Lazy loading pour composants lourds
          'calendar': ['src/components/organisms/Calendar'],
          'chatbot': ['src/components/organisms/ChatBot']
        }
      }
    },
    
    // Tree shaking aggressive
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false
    },
    
    // Optimisations bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  
  // Optimisations développement
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
    exclude: ['@vite/client', '@vite/env']
  }
});

// Bundle analyzer pour monitoring
import { BundleAnalyzerPlugin } from 'rollup-plugin-bundle-analyzer';

if (process.env.ANALYZE) {
  config.plugins.push(
    BundleAnalyzerPlugin({ analyzerMode: 'static' })
  );
}
```

**Métriques cibles :**
- Bundle principal < 150KB gzipped
- Time to Interactive < 3s sur 3G
- Lighthouse Performance Score > 90

### Conséquences

**Positives :**
- Build times ultra-rapides (HMR < 100ms)
- Bundle size optimal avec tree-shaking agressif
- Code splitting automatique intelligent
- Optimisations production poussées
- DX excellent avec hot reload

**Négatives :**
- Configuration complexe pour cas avancés
- Debugging build issues plus difficile
- Dépendance à tooling moderne

**Mitigation :**
- Bundle analyzer pour monitoring continu
- Métriques performance automatisées CI/CD
- Fallbacks pour environnements anciens

---

## Résumé des Décisions

| ADR | Domaine | Décision | Impact Bundle | Impact DX | Impact A11y |
|-----|---------|----------|---------------|-----------|-------------|
| 001 | CSS Framework | Tailwind + Tokens | 🟢 Excellent | 🟢 Excellent | 🟢 Excellent |
| 002 | Composants | Radix + shadcn/ui | 🟢 Excellent | 🟡 Bon | 🟢 Excellent |
| 003 | État | Zustand + React Query | 🟢 Excellent | 🟢 Excellent | 🟢 Neutre |
| 004 | Icônes | Lucide React | 🟢 Excellent | 🟢 Excellent | 🟢 Excellent |
| 005 | Animations | Framer Motion | 🟡 Acceptable | 🟢 Excellent | 🟢 Excellent |
| 006 | Tests A11y | Jest + axe-core | 🟢 Neutre | 🟢 Excellent | 🟢 Excellent |
| 007 | Build | Vite + SWC | 🟢 Excellent | 🟢 Excellent | 🟢 Neutre |

### Métriques de Performance Attendues

**Bundle Size (gzipped) :**
- Design System Core: ~15KB
- Composants Atomic: ~5KB
- Composants Molecules: ~8KB  
- Composants Organisms: ~25KB (lazy loaded)
- Total Application: ~150KB

**Performance Runtime :**
- Time to Interactive: < 3s (3G)
- First Contentful Paint: < 1.5s
- Cumulative Layout Shift: < 0.1
- Accessibility Score: 100/100

**Developer Experience :**
- HMR: < 100ms
- Build Time: < 30s
- Type Check: < 10s
- Test Suite: < 2min

Ces décisions techniques forment un socle robuste et évolutif pour le design system médical NOVA RDV, optimisé pour la performance, l'accessibilité et l'expérience développeur.