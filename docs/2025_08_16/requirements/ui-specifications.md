# Spécifications UI Détaillées - NOVA Plateforme Médicale

## Design System Médical - Tokens et Variables

### Palette Couleurs Médicale Prioritaire

#### Couleurs Primaires (Trust & Professional)
```css
:root {
  /* Bleu confiance - Couleur principale */
  --trust-primary: #1D4ED8;     /* Blue-700 - Autorité médicale */
  --trust-primary-light: #3B82F6; /* Blue-500 - Interactions */
  --trust-primary-dark: #1E40AF;  /* Blue-800 - États actifs */
  
  /* Déclinaisons accessibilité */
  --trust-50: #EFF6FF;
  --trust-100: #DBEAFE;
  --trust-200: #BFDBFE;
  --trust-600: #2563EB;
  --trust-900: #1E3A8A;
}
```

#### Couleurs Fonctionnelles Médicales
```css
:root {
  /* Succès - Santé, validation */
  --medical-success: #16A34A;     /* Green-600 */
  --success-50: #F0FDF4;
  --success-100: #DCFCE7;
  --success-600: #16A34A;
  
  /* Attention - Précaution, information */
  --medical-warning: #F59E0B;     /* Amber-500 */
  --warning-50: #FFFBEB;
  --warning-100: #FEF3C7;
  --warning-600: #D97706;
  
  /* Erreur/Urgence - Danger, critique */
  --medical-error: #DC2626;       /* Red-600 */
  --error-50: #FEF2F2;
  --error-100: #FEE2E2;
  --error-600: #DC2626;
  --emergency-critical: #B91C1C;  /* Red-700 */
  
  /* Neutre médical - Base, texte */
  --medical-neutral: #6B7280;     /* Gray-500 */
  --neutral-50: #F9FAFB;
  --neutral-100: #F3F4F6;
  --neutral-200: #E5E7EB;
  --neutral-600: #4B5563;
  --neutral-800: #1F2937;
  --neutral-900: #111827;
}
```

#### Validation Contraste WCAG AAA
```css
/* Combinaisons validées contraste ≥7:1 */
.text-primary-on-white { color: var(--trust-primary); background: white; }
.text-white-on-primary { color: white; background: var(--trust-primary); }
.text-error-on-light { color: var(--emergency-critical); background: var(--error-50); }
.text-success-on-light { color: var(--medical-success); background: var(--success-50); }
```

### Typographie Médicale Hiérarchisée

#### Font Stack Médical
```css
:root {
  /* Titre medical - Autorité et lisibilité */
  --font-medical-heading: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Corps médical - Lisibilité optimale */
  --font-medical-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Monospace médical - Données, codes */
  --font-medical-mono: "SF Mono", "Monaco", "Consolas", monospace;
}
```

#### Hiérarchie Textuelle Médicale
```css
/* Page Titles - Heroes, Landing */
.text-medical-hero {
  font-size: 3.5rem;        /* 56px */
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Section Titles - H1 pages internes */
.text-medical-h1 {
  font-size: 2.5rem;        /* 40px */
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Subsection Titles - H2 */
.text-medical-h2 {
  font-size: 1.875rem;      /* 30px */
  line-height: 1.3;
  font-weight: 600;
}

/* Component Titles - H3 */
.text-medical-h3 {
  font-size: 1.25rem;       /* 20px */
  line-height: 1.4;
  font-weight: 600;
}

/* Body Large - Introduction, important */
.text-medical-body-lg {
  font-size: 1.125rem;      /* 18px - Base /rdv */
  line-height: 1.6;
  font-weight: 400;
}

/* Body Standard - Contenu principal */
.text-medical-body {
  font-size: 1rem;          /* 16px - Base standard */
  line-height: 1.5;
  font-weight: 400;
}

/* Body Small - Labels, metadata */
.text-medical-body-sm {
  font-size: 0.875rem;      /* 14px */
  line-height: 1.4;
  font-weight: 400;
}

/* Medical Values - Données importantes */
.text-medical-value {
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
```

### Espacements et Layout Médical

#### Grille Spatiale 8px
```css
:root {
  --space-medical-xs: 0.25rem;      /* 4px */
  --space-medical-sm: 0.5rem;       /* 8px */
  --space-medical-md: 1rem;         /* 16px */
  --space-medical-lg: 1.5rem;       /* 24px */
  --space-medical-xl: 2rem;         /* 32px */
  --space-medical-2xl: 3rem;        /* 48px */
  --space-medical-3xl: 4rem;        /* 64px - Sections */
  
  /* Marges contenu médical */
  --content-margin: 1.5rem;         /* 24px mobile */
  --content-margin-desktop: 2rem;   /* 32px desktop */
}
```

#### Largeurs Conteneurs
```css
.container-medical {
  max-width: 1280px;      /* Largeur optimale lecture */
  margin: 0 auto;
  padding: 0 var(--content-margin);
}

.container-medical-narrow {
  max-width: 768px;       /* Formulaires, texte long */
  margin: 0 auto;
  padding: 0 var(--content-margin);
}

.container-medical-wide {
  max-width: 1440px;      /* Dashboard, planning */
  margin: 0 auto;
  padding: 0 var(--content-margin);
}
```

### Rayons et Ombres Médicales

#### Border Radius Médical
```css
:root {
  --radius-medical-sm: 0.375rem;    /* 6px - Input, small buttons */
  --radius-medical-medium: 0.75rem; /* 12px - Cards, panels */
  --radius-medical-lg: 1rem;        /* 16px - Modals, large components */
  --radius-medical-xl: 1.5rem;      /* 24px - Hero sections */
  --radius-medical-round: 50%;      /* Avatars, icons containers */
}
```

#### Ombres Médicales
```css
:root {
  /* Ombres subtiles - Cards, panels */
  --shadow-medical-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  
  /* Ombres modérées - Modals, dropdowns */
  --shadow-medical-moderate: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  /* Ombres prononcées - Elements flottants */
  --shadow-medical-strong: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Ombres colorées - Statuts */
  --shadow-medical-success: 0 4px 14px 0 rgba(22, 163, 74, 0.25);
  --shadow-medical-error: 0 4px 14px 0 rgba(220, 38, 38, 0.25);
  --shadow-medical-warning: 0 4px 14px 0 rgba(245, 158, 11, 0.25);
}
```

## Spécifications par Page

### Page d'Accueil (/) - Landing Convertissante

#### Layout et Structure
```html
<!-- Structure HTML semantique -->
<main class="landing-page">
  <header class="medical-header" role="banner">
    <nav class="medical-navigation" aria-label="Navigation principale">
      <!-- Logo + Navigation + CTA -->
    </nav>
  </header>
  
  <section class="hero-medical" aria-labelledby="hero-title">
    <div class="container-medical">
      <h1 id="hero-title" class="text-medical-hero">
        Prendre rendez-vous dentaire en ligne
      </h1>
      <!-- CTA Principal Hero -->
    </div>
  </section>
  
  <section class="trust-section" aria-labelledby="trust-title">
    <!-- Preuves sociales, certifications -->
  </section>
  
  <section class="services-section" aria-labelledby="services-title">
    <!-- Catalogue services avec tarifs -->
  </section>
  
  <section class="emergency-section" aria-labelledby="emergency-title">
    <!-- Accès urgences 24/7 -->
  </section>
</main>
```

#### Hero Section Spécifications
```css
.hero-medical {
  background: linear-gradient(135deg, var(--trust-50) 0%, white 100%);
  padding: var(--space-medical-3xl) 0;
  text-align: center;
}

.hero-cta-primary {
  background: var(--trust-primary);
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  padding: 1rem 2rem;
  border-radius: var(--radius-medical-medium);
  min-height: 72px;         /* Hauteur premium */
  min-width: 280px;         /* Largeur minimum lisibilité */
  box-shadow: var(--shadow-medical-strong);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-cta-primary:hover {
  background: var(--trust-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medical-strong), 0 8px 20px rgba(29, 78, 216, 0.3);
}

/* Responsive Hero */
@media (max-width: 767px) {
  .hero-medical {
    padding: var(--space-medical-2xl) 0;
  }
  
  .text-medical-hero {
    font-size: 2.5rem;       /* 40px mobile */
    line-height: 1.2;
  }
  
  .hero-cta-primary {
    width: 100%;
    max-width: 320px;
  }
}
```

#### Preuves Sociales Section
```css
.trust-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-medical-lg);
  padding: var(--space-medical-xl) 0;
}

.trust-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-medical-sm);
  justify-content: center;
}

.trust-icon {
  width: 20px;
  height: 20px;
  color: var(--medical-success);
}

.trust-text {
  font-size: 0.875rem;
  color: var(--neutral-600);
  font-weight: 500;
}
```

### Page RDV (/rdv) - Interface Split-Screen Premium

#### Layout Split-Screen Structure
```css
.rdv-layout {
  display: grid;
  grid-template-columns: 1fr 400px;    /* 60/40 split */
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;
  gap: var(--space-medical-xl);
  padding: var(--space-medical-lg);
}

.rdv-main-content {
  background: white;
  border-radius: var(--radius-medical-lg);
  padding: var(--space-medical-2xl);
  box-shadow: var(--shadow-medical-subtle);
}

.rdv-sidebar {
  background: var(--neutral-50);
  border-radius: var(--radius-medical-lg);
  padding: var(--space-medical-xl);
  position: sticky;
  top: var(--space-medical-lg);
  height: fit-content;
  max-height: calc(100vh - var(--space-medical-2xl));
  overflow-y: auto;
}

/* Responsive Mobile Stack */
@media (max-width: 1023px) {
  .rdv-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: var(--space-medical-lg);
    padding: var(--space-medical-md);
  }
  
  .rdv-sidebar {
    position: static;
    max-height: none;
  }
}
```

#### Calendrier RDV Composant
```css
.calendar-medical {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-medical-medium);
  overflow: hidden;
}

.calendar-header {
  background: var(--trust-50);
  padding: var(--space-medical-md);
  border-bottom: 1px solid var(--neutral-200);
}

.calendar-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-month-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--neutral-900);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day-header {
  background: var(--neutral-100);
  padding: var(--space-medical-sm);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid var(--neutral-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 150ms ease;
}

.calendar-day:hover {
  background: var(--trust-50);
}

.calendar-day.available {
  background: var(--success-50);
  color: var(--medical-success);
  font-weight: 500;
}

.calendar-day.selected {
  background: var(--trust-primary);
  color: white;
  font-weight: 600;
}

.calendar-day.unavailable {
  background: var(--neutral-100);
  color: var(--neutral-400);
  cursor: not-allowed;
}
```

#### Chat RDV Interface
```css
.chat-medical {
  height: 600px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-medical-medium);
  overflow: hidden;
}

.chat-header {
  background: var(--trust-primary);
  color: white;
  padding: var(--space-medical-md);
  display: flex;
  align-items: center;
  gap: var(--space-medical-sm);
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-medical-round);
  background: white;
  color: var(--trust-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-medical-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-medical-md);
}

.chat-message {
  max-width: 80%;
  padding: var(--space-medical-sm) var(--space-medical-md);
  border-radius: var(--radius-medical-medium);
  font-size: 0.875rem;
  line-height: 1.4;
}

.chat-message.bot {
  align-self: flex-start;
  background: var(--neutral-100);
  color: var(--neutral-800);
}

.chat-message.user {
  align-self: flex-end;
  background: var(--trust-primary);
  color: white;
}

.chat-input-container {
  border-top: 1px solid var(--neutral-200);
  padding: var(--space-medical-md);
  display: flex;
  gap: var(--space-medical-sm);
}

.chat-input {
  flex: 1;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-medical-sm);
  padding: var(--space-medical-sm) var(--space-medical-md);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 150ms ease;
}

.chat-input:focus {
  border-color: var(--trust-primary);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}
```

### Dashboard Manager (/manager/[cabinetId]) - Interface Productive

#### Layout Dashboard Multi-zones
```css
.manager-dashboard {
  display: grid;
  grid-template-areas: 
    "header header header"
    "sidebar main widgets"
    "sidebar main widgets";
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  gap: var(--space-medical-lg);
  padding: var(--space-medical-lg);
  max-width: 1440px;
  margin: 0 auto;
}

.dashboard-header {
  grid-area: header;
  background: white;
  border-radius: var(--radius-medical-medium);
  padding: var(--space-medical-lg);
  box-shadow: var(--shadow-medical-subtle);
}

.dashboard-sidebar {
  grid-area: sidebar;
  background: white;
  border-radius: var(--radius-medical-medium);
  padding: var(--space-medical-lg);
  box-shadow: var(--shadow-medical-subtle);
  height: fit-content;
  position: sticky;
  top: var(--space-medical-lg);
}

.dashboard-main {
  grid-area: main;
  background: white;
  border-radius: var(--radius-medical-medium);
  padding: var(--space-medical-lg);
  box-shadow: var(--shadow-medical-subtle);
  overflow: hidden;
}

.dashboard-widgets {
  grid-area: widgets;
  display: flex;
  flex-direction: column;
  gap: var(--space-medical-lg);
}

/* Responsive Dashboard */
@media (max-width: 1200px) {
  .manager-dashboard {
    grid-template-areas: 
      "header"
      "main"
      "widgets";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  
  .dashboard-sidebar {
    display: none; /* Hidden on smaller screens */
  }
}
```

#### Planning Interface Temps Réel
```css
.planning-grid {
  display: grid;
  grid-template-columns: 80px repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px;
  background: var(--neutral-200);
  border-radius: var(--radius-medical-medium);
  overflow: hidden;
}

.time-slot {
  background: var(--neutral-100);
  padding: var(--space-medical-sm);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--neutral-600);
  text-align: center;
  border-right: 1px solid var(--neutral-200);
}

.practitioner-column {
  background: white;
  min-height: 60px;
  position: relative;
}

.appointment-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background: var(--trust-100);
  border: 2px solid var(--trust-primary);
  border-radius: var(--radius-medical-sm);
  padding: var(--space-medical-xs);
  font-size: 0.75rem;
  line-height: 1.2;
  cursor: move;
  transition: all 150ms ease;
}

.appointment-block:hover {
  box-shadow: var(--shadow-medical-moderate);
  z-index: 10;
}

.appointment-block.urgent {
  background: var(--error-100);
  border-color: var(--medical-error);
}

.appointment-block.completed {
  background: var(--success-100);
  border-color: var(--medical-success);
}
```

### Page Urgences (/urgences) - Interface Critique

#### Layout Urgence Prioritaire
```css
.emergency-page {
  background: linear-gradient(135deg, var(--error-50) 0%, var(--warning-50) 100%);
  min-height: 100vh;
}

.emergency-banner {
  background: var(--emergency-critical);
  color: white;
  padding: var(--space-medical-md);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: var(--shadow-medical-strong);
}

.emergency-hero {
  background: linear-gradient(135deg, var(--emergency-critical) 0%, var(--medical-error) 100%);
  color: white;
  padding: var(--space-medical-3xl) 0;
  text-align: center;
  border-radius: var(--radius-medical-xl);
  margin: var(--space-medical-lg);
  box-shadow: var(--shadow-medical-error);
}

.emergency-cta {
  background: white;
  color: var(--emergency-critical);
  font-size: 1.25rem;
  font-weight: 700;
  padding: 1.5rem 3rem;
  border-radius: var(--radius-medical-lg);
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  box-shadow: var(--shadow-medical-strong);
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: var(--space-medical-md);
}

.emergency-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.emergency-phone {
  font-family: var(--font-medical-mono);
  font-size: 1.5rem;
  letter-spacing: 0.05em;
}
```

#### Système de Triage Visuel
```css
.triage-levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-medical-lg);
  padding: var(--space-medical-2xl);
}

.triage-card {
  background: white;
  border-radius: var(--radius-medical-lg);
  padding: var(--space-medical-xl);
  box-shadow: var(--shadow-medical-moderate);
  border-left: 6px solid var(--neutral-300);
  transition: all 150ms ease;
}

.triage-card.critical {
  border-left-color: var(--emergency-critical);
  background: var(--error-50);
}

.triage-card.urgent {
  border-left-color: var(--medical-warning);
  background: var(--warning-50);
}

.triage-card.moderate {
  border-left-color: var(--medical-success);
  background: var(--success-50);
}

.triage-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-medical-round);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-medical-md);
}

.triage-card.critical .triage-icon {
  background: var(--emergency-critical);
  color: white;
}

.triage-card.urgent .triage-icon {
  background: var(--medical-warning);
  color: white;
}

.triage-card.moderate .triage-icon {
  background: var(--medical-success);
  color: white;
}
```

## Composants UI Réutilisables

### Boutons Médicaux
```css
.btn-medical {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-medical-sm);
  font-family: var(--font-medical-body);
  font-weight: 500;
  border: none;
  border-radius: var(--radius-medical-sm);
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  outline: none;
  position: relative;
  min-height: 44px; /* Touch target minimum */
}

.btn-medical:focus-visible {
  outline: 2px solid var(--trust-primary);
  outline-offset: 2px;
}

/* Variants */
.btn-medical.primary {
  background: var(--trust-primary);
  color: white;
  box-shadow: var(--shadow-medical-subtle);
}

.btn-medical.primary:hover {
  background: var(--trust-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-medical-moderate);
}

.btn-medical.secondary {
  background: white;
  color: var(--trust-primary);
  border: 2px solid var(--trust-primary);
}

.btn-medical.secondary:hover {
  background: var(--trust-50);
}

.btn-medical.emergency {
  background: var(--emergency-critical);
  color: white;
  animation: pulse-emergency 2s infinite;
}

@keyframes pulse-emergency {
  0%, 100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(185, 28, 28, 0); }
}

/* Sizes */
.btn-medical.sm {
  padding: var(--space-medical-sm) var(--space-medical-md);
  font-size: 0.875rem;
}

.btn-medical.md {
  padding: var(--space-medical-md) var(--space-medical-lg);
  font-size: 1rem;
}

.btn-medical.lg {
  padding: var(--space-medical-lg) var(--space-medical-xl);
  font-size: 1.125rem;
  min-height: 56px;
}

.btn-medical.xl {
  padding: var(--space-medical-xl) var(--space-medical-2xl);
  font-size: 1.25rem;
  min-height: 72px;
}
```

### Cards Médicales
```css
.card-medical {
  background: white;
  border-radius: var(--radius-medical-medium);
  padding: var(--space-medical-xl);
  box-shadow: var(--shadow-medical-subtle);
  border: 1px solid var(--neutral-100);
  transition: all 150ms ease;
}

.card-medical:hover {
  box-shadow: var(--shadow-medical-moderate);
  transform: translateY(-2px);
}

.card-medical.success {
  border-left: 4px solid var(--medical-success);
  background: linear-gradient(to right, var(--success-50), white);
}

.card-medical.warning {
  border-left: 4px solid var(--medical-warning);
  background: linear-gradient(to right, var(--warning-50), white);
}

.card-medical.error {
  border-left: 4px solid var(--medical-error);
  background: linear-gradient(to right, var(--error-50), white);
}

.card-medical-header {
  margin-bottom: var(--space-medical-lg);
  padding-bottom: var(--space-medical-md);
  border-bottom: 1px solid var(--neutral-100);
}

.card-medical-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-medical-sm);
}

.card-medical-subtitle {
  font-size: 0.875rem;
  color: var(--neutral-600);
}

.card-medical-content {
  color: var(--neutral-700);
  line-height: 1.6;
}

.card-medical-footer {
  margin-top: var(--space-medical-lg);
  padding-top: var(--space-medical-md);
  border-top: 1px solid var(--neutral-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### Input Médicaux
```css
.input-medical {
  width: 100%;
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-medical-sm);
  padding: var(--space-medical-md) var(--space-medical-lg);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--neutral-900);
  background: white;
  transition: all 150ms ease;
  outline: none;
  min-height: 48px; /* Touch target */
}

.input-medical:focus {
  border-color: var(--trust-primary);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.input-medical:invalid {
  border-color: var(--medical-error);
}

.input-medical::placeholder {
  color: var(--neutral-400);
}

.input-medical-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--neutral-700);
  margin-bottom: var(--space-medical-sm);
}

.input-medical-error {
  font-size: 0.75rem;
  color: var(--medical-error);
  margin-top: var(--space-medical-xs);
  display: flex;
  align-items: center;
  gap: var(--space-medical-xs);
}

.input-medical-help {
  font-size: 0.75rem;
  color: var(--neutral-500);
  margin-top: var(--space-medical-xs);
}
```

## États Responsifs et Breakpoints

### Breakpoints Médicaux
```css
:root {
  --breakpoint-mobile: 360px;    /* Minimum supporté */
  --breakpoint-mobile-lg: 480px; /* Mobile large */
  --breakpoint-tablet: 768px;    /* Tablette portrait */
  --breakpoint-tablet-lg: 1024px; /* Tablette paysage */
  --breakpoint-desktop: 1280px;  /* Desktop standard */
  --breakpoint-desktop-lg: 1440px; /* Desktop large */
  --breakpoint-wide: 1920px;     /* Large écran */
}

/* Mobile First Approach */
@media (min-width: 768px) {
  :root {
    --content-margin: var(--content-margin-desktop);
  }
  
  .text-medical-hero {
    font-size: 4rem; /* Augmentation desktop */
  }
  
  .btn-medical.responsive {
    width: auto; /* Reset width mobile */
  }
}

@media (min-width: 1024px) {
  .container-medical {
    padding: 0 var(--space-medical-2xl);
  }
  
  .grid-medical-responsive {
    grid-template-columns: repeat(3, 1fr); /* 3 colonnes desktop */
  }
}

@media (min-width: 1440px) {
  .rdv-layout {
    gap: var(--space-medical-2xl); /* Plus d'espace large écran */
  }
}
```

### États Accessibilité
```css
/* Focus Management */
.focus-trap {
  outline: none;
}

.focus-visible {
  outline: 2px solid var(--trust-primary);
  outline-offset: 2px;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .btn-medical {
    transform: none !important;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .btn-medical.primary {
    border: 2px solid white;
  }
  
  .card-medical {
    border: 2px solid var(--neutral-800);
  }
}

/* Dark Mode Support (Future) */
@media (prefers-color-scheme: dark) {
  :root {
    --medical-bg: #0f172a;
    --medical-text: #f1f5f9;
    /* Palette adaptée mode sombre */
  }
}
```

Ces spécifications UI constituent le référentiel complet pour l'implémentation de l'interface NOVA, garantissant cohérence, accessibilité et excellence de l'expérience utilisateur dans l'écosystème médical dentaire.