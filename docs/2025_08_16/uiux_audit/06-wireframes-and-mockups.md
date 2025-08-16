# Wireframes and Visual Specifications - NOVA RDV

## Home Page Redesign

### Current vs. Recommended Layout

#### Current Issues
- CTA button too small for primary action
- Competing visual elements reduce focus
- Inconsistent color system
- Poor mobile hierarchy

#### Recommended Home Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ [LOGO Nova] [Navigation] [Emergency: +213 555 000 000]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ HERO SECTION (80vh)                                         │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐│
│ │ LEFT (60%)          │  │ RIGHT (40%)                     ││
│ │                     │  │                                 ││
│ │ [Trust Badge Row]   │  │ ┌─────────────────────────────┐ ││
│ │ ✓ ISO 9001          │  │ │     APPOINTMENT CARD        │ ││
│ │ ✓ RGPD ✓ 24/7      │  │ │                             │ ││
│ │                     │  │ │  📅 Prochains créneaux      │ ││
│ │ H1: "Votre RDV     │  │ │                             │ ││
│ │ dentaire en        │  │ │  • Aujourd'hui 14h30        │ ││
│ │ 2 minutes"         │  │ │  • Demain 9h15              │ ││
│ │                     │  │ │  • Lundi 16h45              │ ││
│ │ [PRIMARY CTA]       │  │ │                             │ ││
│ │ ┌─────────────────┐ │  │ │  [Voir tous les créneaux]   │ ││
│ │ │ 📅 PRENDRE RDV  │ │  │ └─────────────────────────────┘ ││
│ │ │   MAINTENANT    │ │  │                                 ││
│ │ │    (64px h)     │ │  │                                 ││
│ │ └─────────────────┘ │  │                                 ││
│ │                     │  │                                 ││
│ │ [Secondary Actions] │  │                                 ││
│ │ [🚨 Urgence] [📍]  │  │                                 ││
│ └─────────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SERVICES PREVIEW (Optional)                                 │
│ [Service Cards in Clean Grid]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TRUST SECTION                                               │
│ [Certifications] [Testimonials] [Statistics]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FOOTER                                                      │
│ [Medical White Background with Dark Text]                   │
└─────────────────────────────────────────────────────────────┘
```

### Mobile-First Approach (320px - 768px)

```
┌─────────────────────┐
│ [☰] Nova [📞 URG]   │
├─────────────────────┤
│                     │
│ [Trust Badges]      │
│ ✓ ISO ✓ RGPD ✓ 24/7 │
│                     │
│ H1: "Votre RDV     │
│ dentaire en        │
│ 2 minutes"         │
│                     │
│ ┌─────────────────┐ │
│ │ 📅 PRENDRE RDV  │ │
│ │   MAINTENANT    │ │
│ │   (56px h)      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 🚨 URGENCE      │ │
│ │   DENTAIRE      │ │
│ │   (48px h)      │ │
│ └─────────────────┘ │
│                     │
│ [Appointment Card]  │
│ Next: Today 14h30   │
│                     │
└─────────────────────┘
```

## RDV Page Redesign

### Current Issues
- Split-screen reduces mobile usability
- No clear progress indication
- Chat interface too complex
- Poor touch targets

### Recommended RDV Page Flow

#### Step 1: Welcome Screen
```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS: ●○○○ (1/4)                        [← Retour]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     📅                                      │
│                                                             │
│             H1: "Prenons rendez-vous"                       │
│           H2: "3 étapes simples et sécurisées"              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🦷 CONSULTATION DE ROUTINE             [→]              │ │
│ │    Contrôle • Détartrage • Soins      (64px h)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔧 SOINS SPÉCIALISÉS                   [→]              │ │
│ │    Plombage • Extraction • Prothèse   (64px h)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✨ ESTHÉTIQUE DENTAIRE                 [→]              │ │
│ │    Blanchiment • Orthodontie          (64px h)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ────────────────────────────────────────────────────────────│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🚨 J'AI UNE URGENCE DENTAIRE          [→]              │ │
│ │    Prise en charge immédiate           (64px h)        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Information Collection
```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS: ●●○○ (2/4)                        [← Retour]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           H1: "Vos informations"                            │
│        H2: "Sécurisées et conformes RGPD"                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ Label: Nom complet *                                    │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [👤] Jean Dupont                    (48px h)        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Label: Numéro de téléphone mobile *                     │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [📱] +213 555 123 456               (48px h)        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Info: Format algérien requis                            │ │
│ │                                                         │ │
│ │ Label: Email (optionnel)                                │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [✉️] jean.dupont@email.com           (48px h)        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ☑️ J'accepte les conditions d'utilisation                │ │
│ │ ☑️ J'accepte la politique de confidentialité            │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CONTINUER VERS LES CRÉNEAUX       [→] (56px h)      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Calendar Selection
```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS: ●●●○ (3/4)                        [← Retour]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           H1: "Créneaux disponibles"                        │
│        H2: "Choisissez votre horaire préféré"               │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CALENDRIER                                              │ │
│ │                                                         │ │
│ │     L   M   M   J   V   S   D                           │ │
│ │    ─────────────────────────────                        │ │
│ │    15  16  17  18  19  20  21                           │ │
│ │    22  23  [24] 25  26  27  28                          │ │
│ │         ↑                                               │ │
│ │     Sélectionné                                         │ │
│ │                                                         │ │
│ │ CRÉNEAUX POUR LE 24 AOÛT                                │ │
│ │                                                         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│ │ │    9h00     │ │   14h30     │ │   16h15     │          │ │
│ │ │ Disponible  │ │[SÉLECTIONNÉ]│ │ Disponible  │          │ │
│ │ │  (48px h)   │ │  (48px h)   │ │  (48px h)   │          │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ CONFIRMER CE CRÉNEAU              [✓] (56px h)      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Confirmation
```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS: ●●●● (4/4)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ✅                                     │
│                                                             │
│            H1: "Rendez-vous confirmé"                       │
│         H2: "Nous vous attendons le 24 août"                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RÉCAPITULATIF                                           │ │
│ │                                                         │ │
│ │ 👤 Patient: Jean Dupont                                 │ │
│ │ 📱 Téléphone: +213 555 123 456                          │ │
│ │ 🦷 Soins: Consultation de routine                        │ │
│ │ 📅 Date: Jeudi 24 août 2025                             │ │
│ │ ⏰ Heure: 14h30 - 15h30                                  │ │
│ │ 🏥 Cabinet: Nova Dental Alger                           │ │
│ │ 📍 Adresse: Cité 109, Daboussy El Achour               │ │
│ │                                                         │ │
│ │ ℹ️ INFORMATIONS IMPORTANTES                              │ │
│ │ • Arrivez 15 minutes avant votre RDV                    │ │
│ │ • Apportez votre carte d'identité                       │ │
│ │ • Un rappel SMS sera envoyé 24h avant                   │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ AJOUTER AU CALENDRIER            [📅] (48px h)      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ RETOUR À L'ACCUEIL               [🏠] (48px h)      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Emergency Page Redesign

### Current Issues
- Wrong phone number format
- Small emergency CTA
- Unprofessional emoji usage
- Poor visual hierarchy

### Recommended Emergency Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [← Retour] URGENCES DENTAIRES           [🚨 24/7]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ⚠️                                     │
│                                                             │
│             H1: "Urgence Dentaire"                          │
│      H2: "Prise en charge immédiate • 24h/24"              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📞 APPELER MAINTENANT                               │ │ │
│ │ │                                                     │ │ │
│ │ │     +213 555 000 000                                │ │ │
│ │ │                                                     │ │ │
│ │ │ Ligne directe cabinet • Réponse en 2 min           │ │ │
│ │ │                            (80px h)                │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ 🩺 ÉVALUATION       │ │ 📍 CABINET LE PLUS PROCHE      │ │
│ │    IMMÉDIATE        │ │                                 │ │
│ │                     │ │ Localisation automatique       │ │
│ │ Décrivez vos        │ │ et itinéraire GPS               │ │
│ │ symptômes           │ │                                 │ │
│ │                     │ │ [LOCALISER] (48px h)            │ │
│ │ [DÉMARRER] (48px h) │ │                                 │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────┐ ┌─────────────────────────────────┐ │
│ │ 💬 CHAT D'URGENCE   │ │ 🩹 PREMIERS SECOURS            │ │
│ │                     │ │                                 │ │
│ │ Discussion directe  │ │ Conseils d'attente en           │ │
│ │ avec assistant      │ │ attendant les secours           │ │
│ │ médical             │ │                                 │ │
│ │                     │ │ [VOIR CONSEILS] (48px h)        │ │
│ │ [OUVRIR CHAT]       │ │                                 │ │
│ │        (48px h)     │ │                                 │ │
│ └─────────────────────┘ └─────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Services Page Design

### Recommended Services Layout

```
┌─────────────────────────────────────────────────────────────┐
│ NAVIGATION                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│             H1: "Nos soins dentaires"                       │
│    H2: "Excellence médicale • Standards internationaux"     │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│ │ 🔍 CONSUL-  │ │ 🧽 DÉTAR-   │ │ 🦷 SOINS    │              │
│ │    TATION   │ │    TRAGE    │ │    CONSERV. │              │
│ │             │ │             │ │             │              │
│ │ Examen      │ │ Nettoyage   │ │ Plombages   │              │
│ │ complet     │ │ professionnel│ │ Couronnes   │              │
│ │             │ │             │ │             │              │
│ │ ⏱️ 30 min    │ │ ⏱️ 45 min    │ │ ⏱️ 60 min    │              │
│ │ 💶 50€       │ │ 💶 80€       │ │ 💶 120€      │              │
│ │             │ │             │ │             │              │
│ │ [PRENDRE    │ │ [PRENDRE    │ │ [PRENDRE    │              │
│ │  RDV]       │ │  RDV]       │ │  RDV]       │              │
│ │  (48px h)   │ │  (48px h)   │ │  (48px h)   │              │
│ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│ │ 🔧 EXTRAC-  │ │ ✨ BLANCHI- │ │ 🔗 ORTHODON-│              │
│ │    TION     │ │    MENT     │ │    TIE      │              │
│ │             │ │             │ │             │              │
│ │ Extraction  │ │ Éclaircisse-│ │ Appareils   │              │
│ │ sécurisée   │ │ ment        │ │ dentaires   │              │
│ │             │ │ dentaire    │ │             │              │
│ │ ⏱️ 45 min    │ │ ⏱️ 90 min    │ │ ⏱️ 30 min    │              │
│ │ 💶 80€       │ │ 💶 200€      │ │ 💶 150€      │              │
│ │             │ │             │ │             │              │
│ │ [PRENDRE    │ │ [PRENDRE    │ │ [PRENDRE    │              │
│ │  RDV]       │ │  RDV]       │ │  RDV]       │              │
│ │  (48px h)   │ │  (48px h)   │ │  (48px h)   │              │
│ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ENGAGEMENTS QUALITÉ                                     │ │
│ │                                                         │ │
│ │ 🛡️ Certification ISO 9001 • 🏆 Agréé CNAM • 👥 50k+ patients │ │
│ │                                                         │ │
│ │ "Excellence médicale garantie par nos certifications   │ │
│ │  internationales et la satisfaction de nos patients"    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### Medical Button Variants

```
PRIMARY BUTTON (medical-primary)
┌─────────────────────────────────┐
│ 📅 PRENDRE RENDEZ-VOUS          │
│                                 │
│ • Height: 48px (md), 56px (lg), │
│   64px (xl), 80px (emergency)   │
│ • Background: #1E40AF           │
│ • Text: White                   │
│ • Focus: 3px blue ring          │
└─────────────────────────────────┘

OUTLINE BUTTON (medical-outline)
┌─────────────────────────────────┐
│ 📍 TROUVER UN CABINET           │
│                                 │
│ • Height: 48px minimum          │
│ • Border: 2px #1E40AF           │
│ • Text: #1E40AF                 │
│ • Hover: Light blue background  │
└─────────────────────────────────┘

URGENT BUTTON (medical-urgent)
┌─────────────────────────────────┐
│ 🚨 URGENCE DENTAIRE             │
│                                 │
│ • Height: 56px minimum          │
│ • Background: #B91C1C           │
│ • Text: White                   │
│ • Animation: Pulse              │
│ • Focus: 4px red ring           │
└─────────────────────────────────┘
```

### Medical Card Layout

```
STANDARD MEDICAL CARD
┌─────────────────────────────────────┐
│ ┌───┐                               │
│ │ 🦷│ CONSULTATION DE ROUTINE        │
│ └───┘                               │
│                                     │
│ Examen complet de la bouche,        │
│ détection précoce des problèmes     │
│ et conseils personnalisés.          │
│                                     │
│ ⏱️ Durée: 30 minutes                 │
│ 💶 Tarif: À partir de 50€           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PRENDRE RENDEZ-VOUS     [📅]   │ │
│ │                (48px h)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ • Padding: 24px                     │
│ • Border radius: 12px               │
│ • Shadow: Subtle elevation          │
│ • Hover: Increased elevation        │
└─────────────────────────────────────┘
```

### Medical Form Layout

```
ACCESSIBLE MEDICAL FORM
┌─────────────────────────────────────┐
│ Label: Nom complet *                │
│ ┌─────────────────────────────────┐ │
│ │ [👤] Jean Dupont        (48px)  │ │
│ └─────────────────────────────────┘ │
│ ✓ Validation: OK                    │
│                                     │
│ Label: Téléphone mobile *           │
│ ┌─────────────────────────────────┐ │
│ │ [📱] +213 555 123 456   (48px)  │ │
│ └─────────────────────────────────┘ │
│ ℹ️ Info: Format algérien requis     │
│                                     │
│ ☑️ J'accepte les CGU                 │
│ ☑️ J'accepte la politique RGPD       │
│                                     │
│ • All inputs: 48px height minimum   │
│ • Icons: Left aligned, 20px         │
│ • Labels: Above inputs, bold        │
│ • Validation: Real-time feedback    │
│ • Focus: Clear ring indicators      │
└─────────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile First (320px - 768px)
- Single column layout
- 56px minimum touch targets
- Simplified navigation
- Priority to emergency access

### Tablet (768px - 1024px)  
- Two column grid
- 48px touch targets
- Enhanced navigation
- Side-by-side content

### Desktop (1024px+)
- Multi-column layouts
- Hover states active
- Enhanced interactions
- Full feature set

## Accessibility Specifications

### Focus Indicators
```css
.medical-focus:focus-visible {
  outline: 3px solid #1E40AF;
  outline-offset: 2px;
  border-radius: 6px;
}

.emergency-focus:focus-visible {
  outline: 4px solid #B91C1C;
  outline-offset: 2px;
  animation: emergency-pulse 1s infinite;
}
```

### Screen Reader Labels
- All interactive elements have descriptive labels
- Form inputs associated with labels via `for/id`
- Status updates announced via live regions
- Complex components have ARIA descriptions

### Keyboard Navigation
- Tab order follows visual hierarchy
- Skip links for main content and emergency
- Arrow key navigation in calendars
- Enter/Space activation for all buttons

This wireframe specification ensures NOVA RDV delivers a professional, accessible, and user-friendly medical platform that meets international healthcare UX standards.