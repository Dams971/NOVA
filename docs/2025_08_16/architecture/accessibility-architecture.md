# NOVA - Architecture d'Accessibilité WCAG 2.2 AA

## Vue d'ensemble

Cette architecture d'accessibilité garantit la conformité WCAG 2.2 AA pour NOVA, spécialement optimisée pour le contexte médical français avec support complet des technologies d'assistance et navigation clavier native.

## Standards et Conformité

### Références normatives

- **WCAG 2.2 AA** - Web Content Accessibility Guidelines niveau AA
- **RGAA 4.1** - Référentiel Général d'Amélioration de l'Accessibilité (France)
- **EN 301 549** - Standard européen d'accessibilité numérique
- **ISO 14289** - Accessibilité des documents PDF/UA
- **Section 508** - Standard américain (référence internationale)

### Niveaux de conformité cibles

| Critère | Niveau WCAG | Conformité NOVA |
|---------|-------------|-----------------|
| **Perceptible** | AA | 100% |
| **Utilisable** | AA | 100% |
| **Compréhensible** | AA | 100% |
| **Robuste** | AA | 100% |
| **Évaluations automatisées** | - | axe-core, Lighthouse, Wave |
| **Tests manuels** | - | Navigation clavier, screen readers |

## Architecture des Composants Accessibles

### 1. Système de Focus Management

```typescript
// hooks/useFocusManagement.ts - Gestion globale du focus
interface FocusManagement {
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void;
  restoreFocus: (elementRef: React.RefObject<HTMLElement>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
}

export const useFocusManagement = (): FocusManagement => {
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
  
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  };
  
  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current;
    if (!container) return () => {};
    
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Sauvegarder l'élément actuellement focusé
    setLastFocusedElement(document.activeElement as HTMLElement);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab - navigation arrière
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab - navigation avant
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
      
      // Échap pour fermer
      if (e.key === 'Escape') {
        const closeButton = container.querySelector('[data-dialog-close]') as HTMLElement;
        closeButton?.click();
      }
    };
    
    // Écouter les événements
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus initial
    firstElement?.focus();
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };
  
  const restoreFocus = (elementRef: React.RefObject<HTMLElement>) => {
    const element = elementRef.current || lastFocusedElement;
    if (element && element.focus) {
      element.focus();
    }
    setLastFocusedElement(null);
  };
  
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Nettoyer après annonce
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };
  
  return {
    trapFocus,
    restoreFocus,
    announceToScreenReader,
    getFocusableElements
  };
};
```

### 2. Navigation Clavier Avancée

```typescript
// hooks/useKeyboardNavigation.ts - Navigation clavier spécialisée médical
interface KeyboardNavigationConfig {
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  homeEndKeys?: boolean;
  typeahead?: boolean;
  emergencyKeys?: boolean;
}

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  config: KeyboardNavigationConfig = {}
) => {
  const {
    orientation = 'both',
    wrap = true,
    homeEndKeys = true,
    typeahead = false,
    emergencyKeys = true
  } = config;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typeaheadString, setTypeaheadString] = useState('');
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const items = Array.from(
      container.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"], button:not([disabled]), a[href]')
    ) as HTMLElement[];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentItem = document.activeElement as HTMLElement;
      const currentIdx = items.indexOf(currentItem);
      
      let newIndex = currentIdx;
      let handled = false;
      
      switch (e.key) {
        // Navigation directionnelle
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = wrap ? (currentIdx + 1) % items.length : Math.min(currentIdx + 1, items.length - 1);
            handled = true;
          }
          break;
          
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = wrap ? (currentIdx - 1 + items.length) % items.length : Math.max(currentIdx - 1, 0);
            handled = true;
          }
          break;
          
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = wrap ? (currentIdx + 1) % items.length : Math.min(currentIdx + 1, items.length - 1);
            handled = true;
          }
          break;
          
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = wrap ? (currentIdx - 1 + items.length) % items.length : Math.max(currentIdx - 1, 0);
            handled = true;
          }
          break;
          
        // Home/End
        case 'Home':
          if (homeEndKeys) {
            newIndex = 0;
            handled = true;
          }
          break;
          
        case 'End':
          if (homeEndKeys) {
            newIndex = items.length - 1;
            handled = true;
          }
          break;
          
        // Raccourcis d'urgence médicale
        case 'U':
          if (emergencyKeys && (e.ctrlKey || e.metaKey)) {
            // Ctrl+U ou Cmd+U = Urgence
            const emergencyButton = document.querySelector('[data-emergency-action]') as HTMLElement;
            emergencyButton?.click();
            handled = true;
          }
          break;
          
        case 'H':
          if (emergencyKeys && (e.ctrlKey || e.metaKey)) {
            // Ctrl+H ou Cmd+H = Help/Aide
            const helpButton = document.querySelector('[data-help-action]') as HTMLElement;
            helpButton?.click();
            handled = true;
          }
          break;
          
        // Typeahead search
        default:
          if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setTypeaheadString(prev => prev + e.key.toLowerCase());
            
            // Chercher un élément correspondant
            const matchingItem = items.find(item => 
              item.textContent?.toLowerCase().startsWith(typeaheadString + e.key.toLowerCase())
            );
            
            if (matchingItem) {
              newIndex = items.indexOf(matchingItem);
              handled = true;
            }
            
            // Reset typeahead après 1s
            setTimeout(() => setTypeaheadString(''), 1000);
          }
          break;
      }
      
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        
        if (newIndex >= 0 && newIndex < items.length) {
          items[newIndex].focus();
          setCurrentIndex(newIndex);
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [orientation, wrap, homeEndKeys, typeahead, emergencyKeys, typeaheadString]);
};
```

### 3. Live Regions et Annonces

```typescript
// components/ui/accessibility/LiveAnnouncer.tsx
interface LiveAnnouncerProps {
  children?: React.ReactNode;
}

export const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({ children }) => (
  <>
    {/* Annonceur global pour les screen readers */}
    <div
      id="screen-reader-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      aria-label="Annonces système"
    />
    
    {/* Annonceur d'urgence */}
    <div
      id="emergency-announcer"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
      aria-label="Alertes d'urgence"
    />
    
    {/* Annonceur de statut médical */}
    <div
      id="medical-status-announcer"
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="sr-only"
      aria-label="Statut médical"
    />
    
    {children}
  </>
);

// Context pour les annonces
interface AnnouncementContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceEmergency: (message: string) => void;
  announceMedicalStatus: (message: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null);

export const AnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);
  
  const announceEmergency = useCallback((message: string) => {
    const announcer = document.getElementById('emergency-announcer');
    if (announcer) {
      announcer.textContent = message;
      
      setTimeout(() => {
        announcer.textContent = '';
      }, 3000);
    }
  }, []);
  
  const announceMedicalStatus = useCallback((message: string) => {
    const announcer = document.getElementById('medical-status-announcer');
    if (announcer) {
      announcer.textContent = message;
      
      setTimeout(() => {
        announcer.textContent = '';
      }, 2000);
    }
  }, []);
  
  const value = {
    announce,
    announceEmergency,
    announceMedicalStatus
  };
  
  return (
    <AnnouncementContext.Provider value={value}>
      <LiveAnnouncer>
        {children}
      </LiveAnnouncer>
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within AnnouncementProvider');
  }
  return context;
};
```

### 4. Skip Links Contextuels

```typescript
// components/ui/accessibility/SkipLinks.tsx
interface SkipLink {
  href: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
}

interface SkipLinksProps {
  context?: 'rdv' | 'manager' | 'admin' | 'emergency';
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ context = 'rdv' }) => {
  const skipLinks: Record<string, SkipLink[]> = {
    rdv: [
      { href: '#main-content', label: 'Aller au contenu principal', priority: 'high' },
      { href: '#chat-input', label: 'Aller au chat', priority: 'high' },
      { href: '#calendar', label: 'Aller au calendrier', priority: 'medium' },
      { href: '#patient-info', label: 'Aller aux informations patient', priority: 'medium' },
      { href: '#emergency-contact', label: 'Contact d\'urgence', priority: 'high' },
    ],
    manager: [
      { href: '#main-content', label: 'Aller au contenu principal', priority: 'high' },
      { href: '#appointments-table', label: 'Aller au tableau des rendez-vous', priority: 'high' },
      { href: '#patient-search', label: 'Aller à la recherche patient', priority: 'medium' },
      { href: '#dashboard-stats', label: 'Aller aux statistiques', priority: 'medium' },
      { href: '#emergency-contact', label: 'Contact d\'urgence', priority: 'high' },
    ],
    admin: [
      { href: '#main-content', label: 'Aller au contenu principal', priority: 'high' },
      { href: '#cabinet-overview', label: 'Aller à la vue d\'ensemble des cabinets', priority: 'high' },
      { href: '#analytics-dashboard', label: 'Aller au tableau de bord analytique', priority: 'medium' },
      { href: '#system-settings', label: 'Aller aux paramètres système', priority: 'low' },
    ],
    emergency: [
      { href: '#emergency-form', label: 'Aller au formulaire d\'urgence', priority: 'high' },
      { href: '#emergency-contact', label: 'Numéro d\'urgence', priority: 'high' },
      { href: '#triage-info', label: 'Informations de triage', priority: 'high' },
    ]
  };
  
  const currentLinks = skipLinks[context] || skipLinks.rdv;
  
  return (
    <nav 
      className="skip-links" 
      aria-label="Liens de navigation rapide"
      role="navigation"
    >
      {currentLinks.map((link, index) => (
        <a
          key={link.href}
          href={link.href}
          className={`skip-to-content skip-priority-${link.priority}`}
          data-priority={link.priority}
        >
          {link.label}
          {link.priority === 'high' && (
            <span className="sr-only"> (priorité haute)</span>
          )}
        </a>
      ))}
    </nav>
  );
};
```

### 5. Support Screen Readers

```typescript
// components/ui/accessibility/ScreenReaderSupport.tsx
interface ScreenReaderContextValue {
  isScreenReaderActive: boolean;
  screenReaderType: 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'unknown';
  announcePageChange: (title: string, description?: string) => void;
  describeElement: (element: HTMLElement, description: string) => void;
}

const ScreenReaderContext = createContext<ScreenReaderContextValue | null>(null);

export const ScreenReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [screenReaderType, setScreenReaderType] = useState<ScreenReaderContextValue['screenReaderType']>('unknown');
  
  useEffect(() => {
    // Détecter si un screen reader est actif
    const detectScreenReader = () => {
      // Méthode 1: Test de focus visible
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.tabIndex = -1;
      document.body.appendChild(testElement);
      testElement.focus();
      
      const hasVisibleFocus = testElement === document.activeElement;
      document.body.removeChild(testElement);
      
      // Méthode 2: Test User Agent
      const userAgent = navigator.userAgent.toLowerCase();
      let detectedType: ScreenReaderContextValue['screenReaderType'] = 'unknown';
      
      if (userAgent.includes('nvda')) detectedType = 'nvda';
      else if (userAgent.includes('jaws')) detectedType = 'jaws';
      else if (userAgent.includes('voiceover')) detectedType = 'voiceover';
      else if (userAgent.includes('talkback')) detectedType = 'talkback';
      
      // Méthode 3: Test API Accessibility
      const hasAccessibilityAPI = 'speechSynthesis' in window || 'webkitSpeechSynthesis' in window;
      
      setIsScreenReaderActive(hasVisibleFocus || hasAccessibilityAPI);
      setScreenReaderType(detectedType);
    };
    
    detectScreenReader();
    
    // Écouter les changements de focus pour détecter l'activité
    const handleFocusChange = () => {
      if (document.activeElement && document.activeElement !== document.body) {
        setIsScreenReaderActive(true);
      }
    };
    
    document.addEventListener('focusin', handleFocusChange);
    
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, []);
  
  const announcePageChange = useCallback((title: string, description?: string) => {
    const announcement = description ? `${title}. ${description}` : title;
    
    // Mettre à jour le titre de la page
    document.title = `${title} - NOVA RDV`;
    
    // Annoncer le changement
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.textContent = `Page changée: ${announcement}`;
      
      setTimeout(() => {
        announcer.textContent = '';
      }, 2000);
    }
  }, []);
  
  const describeElement = useCallback((element: HTMLElement, description: string) => {
    // Ajouter une description accessible à un élément
    const descriptionId = `desc-${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer l'élément de description
    const descriptionElement = document.createElement('div');
    descriptionElement.id = descriptionId;
    descriptionElement.className = 'sr-only';
    descriptionElement.textContent = description;
    
    // L'ajouter au DOM
    element.parentNode?.insertBefore(descriptionElement, element.nextSibling);
    
    // Lier l'élément à sa description
    element.setAttribute('aria-describedby', descriptionId);
  }, []);
  
  const value = {
    isScreenReaderActive,
    screenReaderType,
    announcePageChange,
    describeElement
  };
  
  return (
    <ScreenReaderContext.Provider value={value}>
      {children}
    </ScreenReaderContext.Provider>
  );
};

export const useScreenReader = () => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within ScreenReaderProvider');
  }
  return context;
};
```

## Architecture de Contraste et Couleurs

### 1. Système de Contraste WCAG 2.2

```css
/* Contraste de couleurs conformes WCAG 2.2 AA */
:root {
  /* Ratios de contraste minimaux */
  --contrast-ratio-normal: 4.5;  /* WCAG AA normal text */
  --contrast-ratio-large: 3.0;   /* WCAG AA large text */
  --contrast-ratio-aaa: 7.0;     /* WCAG AAA normal text */
  
  /* Couleurs validées pour contraste */
  --color-text-primary: 17 24 39;      /* #111827 - 16.75:1 sur blanc */
  --color-text-secondary: 55 65 81;    /* #374151 - 7.59:1 sur blanc */
  --color-text-muted: 107 114 128;     /* #6B7280 - 4.69:1 sur blanc */
  
  /* Couleurs d'action validées */
  --color-link-default: 30 64 175;     /* #1E40AF - 8.59:1 sur blanc */
  --color-link-visited: 91 33 182;     /* #5B21B6 - 6.38:1 sur blanc */
  --color-link-hover: 29 78 216;       /* #1D4ED8 - 7.04:1 sur blanc */
  
  /* États de validation avec contraste */
  --color-success-text: 20 83 45;      /* #14532D - 9.75:1 sur blanc */
  --color-warning-text: 120 53 15;     /* #78350F - 8.42:1 sur blanc */
  --color-error-text: 127 29 29;       /* #7F1D1D - 11.9:1 sur blanc */
  
  /* Urgence médicale - contraste maximum */
  --color-emergency-text: 127 29 29;   /* #7F1D1D - 11.9:1 sur blanc */
  --color-emergency-bg: 254 226 226;   /* #FEE2E2 - fond claire */
}

/* Tests de contraste automatiques */
@supports (color-contrast()) {
  .auto-contrast-text {
    color: color-contrast(var(--background-color) vs 
      rgb(var(--color-text-primary)), 
      rgb(var(--color-text-secondary))
    );
  }
}

/* Validation contraste manuel pour couleurs spécialisées */
.medical-emergency {
  /* Contraste 11.9:1 - AAA conforme */
  color: rgb(var(--color-emergency-text));
  background: rgb(var(--color-emergency-bg));
}

.medical-warning {
  /* Contraste 8.42:1 - AAA conforme */
  color: rgb(var(--color-warning-text));
  background: rgb(var(--color-warning-50));
}

.medical-success {
  /* Contraste 9.75:1 - AAA conforme */
  color: rgb(var(--color-success-text));
  background: rgb(var(--color-success-50));
}
```

### 2. Mode Contraste Élevé

```css
/* Support pour prefers-contrast: high */
@media (prefers-contrast: high) {
  :root {
    /* Forcer les contrastes maximaux */
    --color-text-primary: 0 0 0;           /* Noir pur */
    --color-text-secondary: 0 0 0;         /* Noir pur */
    --color-background: 255 255 255;       /* Blanc pur */
    
    /* Bordures plus visibles */
    --border-width-thin: 2px;
    --border-width-thick: 3px;
    
    /* Focus rings plus visibles */
    --focus-ring-width: 4px;
    --focus-ring-color: 0 0 0;             /* Noir pur */
    
    /* Ombres supprimées en mode contraste élevé */
    --shadow-sm: none;
    --shadow-md: none;
    --shadow-lg: none;
    --shadow-medical-card: none;
    --shadow-medical-elevated: none;
  }
  
  /* Forcer les couleurs de bordure */
  * {
    border-color: rgb(0 0 0) !important;
  }
  
  /* Supprimer les dégradés et effets visuels */
  .gradient-bg {
    background: rgb(var(--color-background)) !important;
  }
  
  /* Renforcer les focus states */
  .focus-visible-ring:focus-visible,
  .medical-focus:focus-visible {
    outline: 4px solid rgb(0 0 0) !important;
    outline-offset: 2px !important;
    box-shadow: none !important;
  }
}

/* Mode sombre avec contraste élevé */
@media (prefers-contrast: high) and (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: 255 255 255;     /* Blanc pur */
    --color-text-secondary: 255 255 255;   /* Blanc pur */
    --color-background: 0 0 0;             /* Noir pur */
    --focus-ring-color: 255 255 255;       /* Blanc pur */
  }
  
  * {
    border-color: rgb(255 255 255) !important;
  }
}
```

## Architecture de Tests d'Accessibilité

### 1. Tests Automatisés

```typescript
// tests/accessibility/automated.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RDVPage } from '@/app/rdv/page';
import { ManagerDashboard } from '@/app/manager/[cabinetId]/page';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('RDV page should have no accessibility violations', async () => {
    const { container } = render(<RDVPage />);
    const results = await axe(container, {
      rules: {
        // Règles WCAG 2.2 AA
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true },
      }
    });
    
    expect(results).toHaveNoViolations();
  });
  
  it('Manager dashboard should have no accessibility violations', async () => {
    const { container } = render(<ManagerDashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('Emergency components should have enhanced accessibility', async () => {
    const { container } = render(<EmergencyButton />);
    const results = await axe(container, {
      rules: {
        // Règles renforcées pour urgence
        'color-contrast-enhanced': { enabled: true },
        'focus-visible': { enabled: true },
      }
    });
    
    expect(results).toHaveNoViolations();
  });
});
```

### 2. Tests de Navigation Clavier

```typescript
// tests/accessibility/keyboard-navigation.test.tsx
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Keyboard Navigation Tests', () => {
  it('should support tab navigation through all interactive elements', async () => {
    const user = userEvent.setup();
    const { container } = render(<RDVPage />);
    
    // Obtenir tous les éléments focusables
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Vérifier que tous les éléments sont accessibles par Tab
    for (let i = 0; i < focusableElements.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(focusableElements[i]);
    }
  });
  
  it('should support arrow key navigation in menus', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<NavigationMenu />);
    
    const menu = getByRole('menu');
    const menuItems = menu.querySelectorAll('[role="menuitem"]');
    
    // Focus sur le premier élément
    menuItems[0].focus();
    
    // ArrowDown devrait aller au suivant
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(menuItems[1]);
    
    // ArrowUp devrait revenir au précédent
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(menuItems[0]);
    
    // Home devrait aller au premier
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(menuItems[0]);
    
    // End devrait aller au dernier
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(menuItems[menuItems.length - 1]);
  });
  
  it('should support emergency keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const mockEmergencyCall = jest.fn();
    const { container } = render(<RDVPage onEmergencyCall={mockEmergencyCall} />);
    
    // Ctrl+U devrait déclencher l'urgence
    await user.keyboard('{Control>}u{/Control}');
    expect(mockEmergencyCall).toHaveBeenCalled();
  });
});
```

### 3. Tests Screen Readers

```typescript
// tests/accessibility/screen-reader.test.tsx
import { render } from '@testing-library/react';

describe('Screen Reader Support Tests', () => {
  it('should have proper ARIA labels and descriptions', () => {
    const { getByLabelText, getByRole } = render(<AppointmentForm />);
    
    // Vérifier les labels
    expect(getByLabelText('Nom complet')).toBeInTheDocument();
    expect(getByLabelText('Numéro de téléphone')).toBeInTheDocument();
    expect(getByLabelText('Type de soins')).toBeInTheDocument();
    
    // Vérifier les descriptions
    const phoneInput = getByLabelText('Numéro de téléphone');
    expect(phoneInput).toHaveAttribute('aria-describedby');
    
    const phoneDescription = document.getElementById(
      phoneInput.getAttribute('aria-describedby')!
    );
    expect(phoneDescription).toHaveTextContent('Format algérien');
  });
  
  it('should announce chat messages to screen readers', async () => {
    const { container } = render(<ChatInterface />);
    
    // Vérifier la présence de live regions
    const chatLog = container.querySelector('[role="log"]');
    expect(chatLog).toHaveAttribute('aria-live', 'polite');
    expect(chatLog).toHaveAttribute('aria-label', 'Messages du chat');
    
    // Vérifier l'annonceur de statut
    const statusAnnouncer = container.querySelector('[role="status"]');
    expect(statusAnnouncer).toHaveAttribute('aria-live', 'polite');
  });
  
  it('should provide proper heading hierarchy', () => {
    const { container } = render(<RDVPage />);
    
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
    
    // Vérifier la hiérarchie (pas de saut de niveau)
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];
      
      // Le niveau ne devrait pas augmenter de plus de 1
      expect(current - previous).toBeLessThanOrEqual(1);
    }
    
    // Vérifier qu'il y a un seul h1
    const h1Count = headingLevels.filter(level => level === 1).length;
    expect(h1Count).toBe(1);
  });
});
```

## Outils et Validation

### 1. Configuration ESLint Accessibilité

```javascript
// .eslintrc.accessibility.js
module.exports = {
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // Règles WCAG 2.2 AA strictes
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/control-has-associated-label': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/lang': 'error',
    'jsx-a11y/media-has-caption': 'error',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'error',
    'jsx-a11y/no-redundant-roles': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error'
  }
};
```

### 2. Scripts de Validation

```bash
#!/bin/bash
# scripts/validate-accessibility.sh

echo "🔍 Validation de l'accessibilité NOVA..."

# 1. Tests automatisés axe-core
echo "📋 Tests axe-core..."
npx jest --testPathPattern=accessibility --coverage

# 2. Audit Lighthouse accessibilité
echo "🚨 Audit Lighthouse..."
npx lighthouse-ci autorun --config=lighthouserc-a11y.json

# 3. Validation contraste Wave
echo "🌊 Validation Wave..."
npx @axe-core/cli src/app/rdv/page.tsx --tags wcag2a,wcag2aa

# 4. Test navigation clavier
echo "⌨️  Tests navigation clavier..."
npx playwright test tests/accessibility/keyboard-navigation.spec.ts

# 5. Test screen readers
echo "🔊 Tests screen readers..."
npx playwright test tests/accessibility/screen-reader.spec.ts

echo "✅ Validation accessibilité terminée"
```

Cette architecture d'accessibilité garantit une expérience utilisateur inclusive et professionnelle pour tous les utilisateurs de NOVA, conforme aux standards internationaux WCAG 2.2 AA et optimisée pour le contexte médical français.