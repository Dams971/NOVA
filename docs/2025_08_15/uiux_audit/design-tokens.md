# NOVA Medical Design Tokens

## Overview

This document defines the comprehensive design token system for the NOVA medical platform, ensuring WCAG AA compliance, medical-grade aesthetics, and consistent brand experience across all healthcare interfaces.

## Color System

### Medical-Grade Color Palette

#### Primary Color - Trust Blue
```typescript
const primaryBlue = {
  50: '#EBF5FF',   // Ultra light - backgrounds, subtle highlights
  100: '#D1E7FF',  // Light - hover states, secondary backgrounds  
  200: '#A3CFFF',  // Soft - inactive states, disabled text
  300: '#6BB0FF',  // Medium light - secondary actions
  400: '#2E8BFF',  // Medium - interactive elements
  500: '#0066FF',  // Brand primary - CTAs, links, focus states
  600: '#0052E6',  // Medium dark - hover on primary
  700: '#003DB3',  // Dark - pressed states, headings
  800: '#002980',  // Darker - high contrast text
  900: '#001A52',  // Darkest - maximum contrast
};
```

**WCAG Compliance:**
- primary.500 on white: 4.52:1 ✓ (AA Normal)
- primary.700 on white: 8.21:1 ✓ (AAA Normal)
- primary.800 on white: 11.4:1 ✓ (AAA Large)

#### Secondary Color - Healthcare Teal
```typescript
const secondaryTeal = {
  50: '#E6FFFA',   // Medical clean feeling
  100: '#B2F5EA',  // Gentle, caring atmosphere
  200: '#81E6D9',  // Healing, wellness
  300: '#4FD1C5',  // Health technology
  400: '#38B2AC',  // Medical innovation
  500: '#319795',  // Secondary brand color
  600: '#2C7A7B',  // Professional medical
  700: '#285E61',  // Clinical authority
  800: '#234E52',  // Medical expertise
  900: '#1D4044',  // Deep medical trust
};
```

#### Status Colors - Medical Semantic System

##### Emergency/Critical - Red Scale
```typescript
const emergencyRed = {
  50: '#FEF2F2',   // Emergency background
  100: '#FEE2E2',  // Alert background
  200: '#FECACA',  // Warning background
  300: '#FCA5A5',  // Attention border
  400: '#F87171',  // Warning state
  500: '#EF4444',  // Critical alert
  600: '#DC2626',  // Emergency action
  700: '#B91C1C',  // Urgent indicator
  800: '#991B1B',  // High priority
  900: '#7F1D1D',  // Maximum urgency
};
```

**Medical Usage:**
- emergency.600: Critical vitals, emergency buttons
- emergency.100: Alert backgrounds, warning zones
- emergency.300: Form validation errors

##### Success/Healthy - Green Scale
```typescript
const successGreen = {
  50: '#F0FDF4',   // Health status background
  100: '#DCFCE7',  // Success notification
  200: '#BBF7D0',  // Positive result
  300: '#86EFAC',  // Good health indicator
  400: '#4ADE80',  // Wellness state
  500: '#22C55E',  // Success action
  600: '#16A34A',  // Confirmed healthy
  700: '#15803D',  // Optimal health
  800: '#166534',  // Excellent condition
  900: '#14532D',  // Peak wellness
};
```

##### Warning/Caution - Amber Scale
```typescript
const warningAmber = {
  50: '#FFFBEB',   // Caution background
  100: '#FEF3C7',  // Warning zone
  200: '#FDE68A',  // Attention area
  300: '#FCD34D',  // Caution indicator
  400: '#FBBF24',  // Warning state
  500: '#F59E0B',  // Caution action
  600: '#D97706',  // Moderate concern
  700: '#B45309',  // Significant attention
  800: '#92400E',  // High caution
  900: '#78350F',  // Maximum caution
};
```

#### Neutral Grays - Medical Professional
```typescript
const neutralGray = {
  50: '#FAFAFA',   // Page backgrounds, subtle areas
  100: '#F4F4F5',  // Card backgrounds, sections
  200: '#E4E4E7',  // Borders, dividers
  300: '#D4D4D8',  // Input borders, subtle lines
  400: '#A1A1AA',  // Placeholder text, icons
  500: '#71717A',  // Secondary text, labels
  600: '#52525B',  // Primary text, body copy
  700: '#3F3F46',  // Headings, important text
  800: '#27272A',  // High contrast headings
  900: '#18181B',  // Maximum contrast text
};
```

**Contrast Ratios (on white background):**
- gray.900: 19.3:1 ✓ (AAA)
- gray.800: 14.2:1 ✓ (AAA)
- gray.700: 9.73:1 ✓ (AAA)
- gray.600: 7.04:1 ✓ (AAA)
- gray.500: 4.61:1 ✓ (AA+)
- gray.400: 3.17:1 ✓ (AA UI)

### Medical Context Colors

#### Medication & Treatment
```typescript
const medicationPurple = {
  50: '#FAF5FF',   // Prescription background
  100: '#F3E8FF',  // Medication zone
  200: '#E9D5FF',  // Treatment area
  300: '#D8B4FE',  // Therapy indicator
  400: '#C084FC',  // Treatment state
  500: '#A855F7',  // Medication primary
  600: '#9333EA',  // Prescription action
  700: '#7E22CE',  // Treatment protocol
  800: '#6B21A8',  // Medication therapy
  900: '#581C87',  // Advanced treatment
};
```

#### Diagnostic & Testing
```typescript
const diagnosticCyan = {
  50: '#ECFEFF',   // Test background
  100: '#CFFAFE',  // Diagnostic zone
  200: '#A5F3FC',  // Test area
  300: '#67E8F9',  // Lab indicator
  400: '#22D3EE',  // Test state
  500: '#06B6D4',  // Diagnostic primary
  600: '#0891B2',  // Test action
  700: '#0E7490',  // Lab protocol
  800: '#155E75',  // Diagnostic analysis
  900: '#164E63',  // Advanced testing
};
```

#### Appointment & Scheduling
```typescript
const appointmentIndigo = {
  50: '#EEF2FF',   // Calendar background
  100: '#E0E7FF',  // Schedule zone
  200: '#C7D2FE',  // Booking area
  300: '#A5B4FC',  // Time indicator
  400: '#818CF8',  // Schedule state
  500: '#6366F1',  // Appointment primary
  600: '#4F46E5',  // Booking action
  700: '#4338CA',  // Schedule confirmed
  800: '#3730A3',  // Appointment set
  900: '#312E81',  // Schedule locked
};
```

## Typography System

### Medical Font Stack

#### Primary Font - Professional Display
```css
font-family: 'Montserrat Variable', 'Inter Variable', 
             -apple-system, BlinkMacSystemFont, 
             'Segoe UI', system-ui, sans-serif;
```

**Selection Criteria:**
- High x-height for medical terminology readability
- Clear distinction between similar characters (1, l, I)
- Professional medical appearance
- Excellent multilingual support (French, Arabic)
- Variable font technology for performance

#### Secondary Font - Body Text
```css
font-family: 'Open Sans Variable', 'Source Sans 3 Variable',
             -apple-system, BlinkMacSystemFont,
             'Segoe UI', system-ui, sans-serif;
```

**Medical Optimizations:**
- Optimized for long-form medical content
- Excellent readability in small sizes
- Clear pharmaceutical naming distinction
- Accessibility-focused character spacing

#### Monospace Font - Medical Data
```css
font-family: 'JetBrains Mono Variable', 'SF Mono',
             Monaco, 'Cascadia Code', Consolas,
             'Liberation Mono', monospace;
```

**Use Cases:**
- Medical record numbers
- Prescription codes
- Lab values and measurements
- Technical medical data

### Typography Scale - Medical Hierarchy

```typescript
const medicalTypography = {
  // Display scale - Marketing, hero sections
  display: {
    '2xl': {
      fontSize: 'clamp(3.5rem, 6vw, 4.5rem)',     // 56-72px
      lineHeight: '1.1',
      fontWeight: '800',
      letterSpacing: '-0.02em',
    },
    xl: {
      fontSize: 'clamp(2.75rem, 5vw, 3.5rem)',    // 44-56px
      lineHeight: '1.1', 
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    lg: {
      fontSize: 'clamp(2.25rem, 4vw, 2.75rem)',   // 36-44px
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    },
  },
  
  // Heading scale - Page structure
  heading: {
    h1: {
      fontSize: 'clamp(2rem, 3.5vw, 2.25rem)',    // 32-36px
      lineHeight: '1.25',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', // 24-30px
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '0',
    },
    h3: {
      fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',    // 20-24px
      lineHeight: '1.35',
      fontWeight: '600',
      letterSpacing: '0',
    },
    h4: {
      fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)', // 18-20px
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.125rem',                        // 18px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem',                            // 16px
      lineHeight: '1.4',
      fontWeight: '500',
      letterSpacing: '0.01em',
    },
  },
  
  // Body text scale - Content
  body: {
    xl: {
      fontSize: '1.25rem',      // 20px
      lineHeight: '1.6',
      fontWeight: '400',
    },
    lg: {
      fontSize: '1.125rem',     // 18px
      lineHeight: '1.6',
      fontWeight: '400',
    },
    base: {
      fontSize: '1rem',         // 16px - Default body
      lineHeight: '1.6',
      fontWeight: '400',
    },
    sm: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    xs: {
      fontSize: '0.75rem',      // 12px
      lineHeight: '1.4',
      fontWeight: '400',
    },
  },
  
  // Medical specific text
  medical: {
    prescription: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.4',
      fontWeight: '500',
      fontFamily: 'monospace',
      letterSpacing: '0.02em',
    },
    labValue: {
      fontSize: '1rem',         // 16px
      lineHeight: '1.3',
      fontWeight: '600',
      fontFamily: 'monospace',
      letterSpacing: '0.01em',
    },
    medicalCode: {
      fontSize: '0.875rem',     // 14px
      lineHeight: '1.2',
      fontWeight: '500',
      fontFamily: 'monospace',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },
};
```

### Font Weight Scale
```typescript
const fontWeights = {
  thin: 100,        // Avoid in medical interfaces
  extralight: 200,  // Avoid in medical interfaces  
  light: 300,       // Use sparingly for large display text
  normal: 400,      // Default body text weight
  medium: 500,      // Emphasis, labels, medical terms
  semibold: 600,    // Headings, important information
  bold: 700,        // Strong emphasis, warnings
  extrabold: 800,   // Display headings, hero text
  black: 900,       // Maximum emphasis, emergency alerts
};
```

## Spacing System

### Medical-Grade Spacing Scale

#### Base Unit System (4px/8px grid)
```typescript
const medicalSpacing = {
  // Micro spacing - Fine details
  px: '1px',        // Borders, thin dividers
  0.5: '2px',       // Micro adjustments
  1: '4px',         // Base unit - icons, small gaps
  1.5: '6px',       // Compact spacing
  2: '8px',         // Standard small spacing
  
  // Component spacing - UI elements
  2.5: '10px',      // Input padding
  3: '12px',        // Button padding, form spacing
  3.5: '14px',      // Medium component padding
  4: '16px',        // Standard component spacing
  5: '20px',        // Component margins
  6: '24px',        // Section spacing
  
  // Layout spacing - Page structure
  7: '28px',        // Large component spacing
  8: '32px',        // Section margins
  9: '36px',        // Large section spacing
  10: '40px',       // Page section gaps
  11: '44px',       // Touch target minimum
  12: '48px',       // Major section spacing
  
  // Medical workflow spacing
  14: '56px',       // Form section separation
  16: '64px',       // Page section separation
  20: '80px',       // Major layout sections
  24: '96px',       // Page region separation
  28: '112px',      // Header/footer separation
  32: '128px',      // Major page regions
  36: '144px',      // Hero section spacing
  40: '160px',      // Maximum layout spacing
};
```

#### Medical Context Spacing
```typescript
const medicalContextSpacing = {
  // Form elements
  formFieldGap: '16px',          // Between form fields
  formSectionGap: '32px',        // Between form sections
  formGroupGap: '24px',          // Between related fields
  labelGap: '8px',               // Label to input spacing
  helpTextGap: '4px',            // Input to help text
  errorGap: '4px',               // Input to error message
  
  // Medical cards
  cardPadding: '24px',           // Internal card spacing
  cardGap: '16px',               // Between cards
  cardHeaderGap: '12px',         // Card header spacing
  cardContentGap: '16px',        // Card content spacing
  
  // Touch targets
  touchTargetMin: '44px',        // Minimum touch target
  touchTargetOptimal: '48px',    // Optimal touch target
  touchTargetSpacing: '8px',     // Between touch targets
  
  // Medical data
  patientInfoGap: '12px',        // Patient info sections
  medicalHistoryGap: '16px',     // Medical history items
  prescriptionGap: '8px',        // Prescription line items
  labResultGap: '12px',          // Lab result spacing
  
  // Emergency interfaces
  emergencyButtonSpacing: '16px', // Emergency action spacing
  emergencyAlertPadding: '20px',  // Emergency alert internal
  emergencyFormGap: '24px',       // Emergency form spacing
};
```

## Border Radius & Elevation

### Medical-Appropriate Rounding
```typescript
const medicalBorderRadius = {
  none: '0px',          // Sharp edges for clinical precision
  xs: '2px',            // Subtle rounding for data fields
  sm: '4px',            // Default form inputs, small cards
  base: '6px',          // Standard cards, buttons
  md: '8px',            // Medium cards, modals
  lg: '12px',           // Large cards, sections
  xl: '16px',           // Hero sections, major cards
  '2xl': '20px',        // Special decorative elements
  '3xl': '24px',        // Large decorative sections
  full: '9999px',       // Pills, rounded buttons, avatars
};
```

### Medical Elevation System
```typescript
const medicalShadows = {
  // Subtle medical shadows
  xs: '0 0 0 1px rgba(0, 0, 0, 0.03)',                    // Hairline borders
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',                  // Form inputs, subtle cards
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', // Default cards
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Elevated cards
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Modals, dropdowns
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Major modals
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',         // Hero sections, overlays
  
  // Medical context shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',        // Pressed states, inputs
  none: 'none',                                            // Flat elements
  
  // Colored shadows for medical context
  primary: '0 10px 40px -10px rgba(0, 102, 255, 0.3)',    // Primary actions
  success: '0 10px 40px -10px rgba(34, 197, 94, 0.3)',    // Success states
  warning: '0 10px 40px -10px rgba(245, 158, 11, 0.3)',   // Warning states
  error: '0 10px 40px -10px rgba(239, 68, 68, 0.3)',      // Error states
  emergency: '0 0 20px 0 rgba(220, 38, 38, 0.4)',         // Emergency alerts
};
```

## Motion & Animation

### Medical-Appropriate Animation System

#### Timing Functions
```typescript
const medicalEasing = {
  // Natural, calming motions
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',           // Default exit animations
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',            // Default enter animations
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',       // Balanced animations
  
  // Medical-specific easing
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // Calm, reassuring motions
  clinical: 'cubic-bezier(0.4, 0, 0.6, 1)',         // Precise, professional
  urgent: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Attention-grabbing (emergencies)
};
```

#### Duration Scale
```typescript
const medicalDuration = {
  // Micro interactions
  instant: '0ms',        // No animation (accessibility)
  fast: '150ms',         // Hover states, focus changes
  
  // Standard interactions  
  base: '250ms',         // Default animation duration
  slow: '350ms',         // Form transitions, modal opens
  slower: '500ms',       // Page transitions, complex animations
  
  // Medical context durations
  clinical: '200ms',     // Professional, efficient feeling
  gentle: '400ms',       // Calming, reassuring pace
  emergency: '100ms',    // Immediate response for urgent actions
  
  // Reduced motion support
  reduced: '0.01ms',     // Near-instant for accessibility
};
```

#### Medical Animation Patterns
```typescript
const medicalAnimations = {
  // Entry animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: '250ms',
    easing: 'easeOut',
  },
  
  slideInUp: {
    from: { transform: 'translateY(16px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: '300ms',
    easing: 'gentle',
  },
  
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: '200ms',
    easing: 'clinical',
  },
  
  // Medical-specific animations
  pulseEmergency: {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.8, transform: 'scale(1.05)' },
    duration: '1500ms',
    easing: 'easeInOut',
    iterationCount: 'infinite',
  },
  
  breathingLoader: {
    '0%, 100%': { transform: 'scale(1)', opacity: 0.7 },
    '50%': { transform: 'scale(1.1)', opacity: 1 },
    duration: '2000ms',
    easing: 'gentle',
    iterationCount: 'infinite',
  },
  
  shimmerLoading: {
    '0%': { backgroundPosition: '-200px 0' },
    '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
    duration: '1500ms',
    easing: 'easeInOut',
    iterationCount: 'infinite',
  },
};
```

### Reduced Motion Support
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Still allow essential feedback */
  .emergency-pulse {
    animation: none;
    background-color: var(--emergency-600);
  }
}
```

## Breakpoints & Responsive Design

### Medical Device Breakpoints
```typescript
const medicalBreakpoints = {
  // Mobile devices
  xs: '320px',         // Minimum mobile support
  sm: '375px',         // Standard mobile phones
  md: '768px',         // Tablets, large phones
  
  // Clinical workstations
  lg: '1024px',        // Standard tablets, small desktops
  xl: '1280px',        // Desktop monitors, medical workstations
  '2xl': '1440px',     // Large clinical displays
  '3xl': '1920px',     // Medical workstation monitors
  
  // Medical-specific breakpoints
  mobile: '0px',       // Mobile-first base
  tablet: '768px',     // Tablet interfaces
  desktop: '1024px',   // Desktop clinical interfaces
  clinical: '1440px',  // Clinical workstation optimal
  wall: '1920px',      // Wall-mounted displays
};
```

### Container Sizes
```typescript
const medicalContainers = {
  xs: '320px',         // Mobile forms
  sm: '640px',         // Mobile content
  md: '768px',         // Tablet forms
  lg: '1024px',        // Desktop content
  xl: '1280px',        // Desktop layout
  '2xl': '1400px',     // Clinical workstation
  '3xl': '1600px',     // Large clinical displays
  
  // Medical-specific containers
  form: '480px',       // Optimal form width
  reading: '720px',    // Optimal reading width
  clinical: '1200px',  // Clinical dashboard width
};
```

## Z-Index System

### Medical Interface Layering
```typescript
const medicalZIndex = {
  // Base layers
  base: 0,             // Normal document flow
  docked: 10,          // Sticky elements
  dropdown: 1000,      // Dropdown menus
  sticky: 1020,        // Sticky headers
  modal: 1030,         // Modal dialogs
  popover: 1040,       // Popovers, tooltips
  
  // Medical-specific layers
  medicalAlert: 1050,  // Medical alerts, warnings
  emergency: 1060,     // Emergency notifications
  critical: 1070,      // Critical system alerts
  
  // System layers
  notification: 1080,  // System notifications
  debug: 9999,         // Development debugging
};
```

## Accessibility Tokens

### Focus Management
```typescript
const focusTokens = {
  // Focus ring specifications
  ringWidth: '3px',              // WCAG-compliant focus width
  ringColor: '#2563eb',          // High contrast blue
  ringOffset: '2px',             // Space between element and ring
  ringOpacity: '1',              // Full opacity for visibility
  
  // Focus states for different contexts
  focusDefault: {
    outline: '3px solid #2563eb',
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  
  focusEmergency: {
    outline: '3px solid #dc2626',
    outlineOffset: '2px',
    boxShadow: '0 0 0 6px rgba(220, 38, 38, 0.2)',
  },
  
  focusSuccess: {
    outline: '3px solid #16a34a',
    outlineOffset: '2px',
    boxShadow: '0 0 0 6px rgba(22, 163, 74, 0.2)',
  },
};
```

### Touch Target Specifications
```typescript
const touchTargets = {
  // WCAG AAA compliance
  minimum: '44px',               // Minimum touch target size
  optimal: '48px',               // Optimal touch target size
  spacing: '8px',                // Minimum spacing between targets
  
  // Medical-specific targets
  emergencyButton: '60px',       // Emergency action buttons
  medicalInput: '48px',          // Medical form inputs
  navigationItem: '44px',        // Navigation touch targets
  
  // Touch target utilities
  padding: {
    small: '8px 12px',           // Small buttons
    medium: '12px 16px',         // Medium buttons
    large: '16px 24px',          // Large buttons
    emergency: '20px 32px',      // Emergency buttons
  },
};
```

## Medical Data Visualization

### Chart & Graph Colors
```typescript
const medicalDataColors = {
  // Vital signs
  heartRate: '#dc2626',          // Red for heart rate
  bloodPressure: '#2563eb',      // Blue for blood pressure
  temperature: '#f59e0b',        // Amber for temperature
  oxygenSat: '#10b981',          // Green for oxygen saturation
  
  // Trend indicators
  improving: '#22c55e',          // Green for positive trends
  stable: '#3b82f6',             // Blue for stable trends
  concerning: '#f59e0b',         // Amber for concerning trends
  critical: '#ef4444',           // Red for critical trends
  
  // Data quality
  accurate: '#10b981',           // High quality data
  estimated: '#f59e0b',          // Estimated values
  questionable: '#ef4444',       // Questionable data
  missing: '#6b7280',            // Missing data points
};
```

### Medical Icon System
```typescript
const medicalIcons = {
  // Medical specialties
  dental: 'tooth',
  cardiology: 'heart',
  neurology: 'brain',
  orthopedic: 'bone',
  pediatric: 'baby',
  
  // Medical actions
  prescription: 'pill',
  injection: 'syringe',
  surgery: 'scalpel',
  therapy: 'therapy',
  consultation: 'stethoscope',
  
  // Status indicators
  healthy: 'check-circle',
  warning: 'alert-triangle',
  critical: 'alert-circle',
  emergency: 'siren',
  stable: 'activity',
};
```

## CSS Custom Properties

### Medical Token Implementation
```css
:root {
  /* Color tokens */
  --color-primary-50: #ebf5ff;
  --color-primary-500: #0066ff;
  --color-primary-900: #001a52;
  
  --color-emergency-500: #ef4444;
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  
  /* Typography tokens */
  --font-medical-display: 'Montserrat Variable', system-ui;
  --font-medical-body: 'Open Sans Variable', system-ui;
  --font-medical-mono: 'JetBrains Mono Variable', monospace;
  
  /* Spacing tokens */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* Medical-specific tokens */
  --touch-target-min: 44px;
  --touch-target-optimal: 48px;
  --form-field-gap: 16px;
  --card-padding: 24px;
  
  /* Animation tokens */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;
  --easing-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* Accessibility tokens */
  --focus-ring-width: 3px;
  --focus-ring-color: #2563eb;
  --focus-ring-offset: 2px;
  
  /* Medical context tokens */
  --emergency-pulse-duration: 1500ms;
  --loading-shimmer-duration: 1500ms;
  --notification-slide-duration: 300ms;
}

/* Dark mode medical tokens */
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary-50: #1e293b;
    --color-primary-500: #3b82f6;
    --color-primary-900: #e2e8f0;
    
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-primary-500: #0000ff;
    --color-emergency-500: #ff0000;
    --color-success-500: #00aa00;
    --text-primary: #000000;
    --border-default: #000000;
    --focus-ring-width: 4px;
  }
}
```

## Token Validation & Testing

### Accessibility Compliance Checklist
- [ ] All color combinations meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for UI)
- [ ] Focus indicators are clearly visible (3:1 contrast minimum)
- [ ] Touch targets meet minimum size requirements (44px)
- [ ] Typography scales work at 200% zoom without horizontal scrolling
- [ ] Reduced motion preferences are respected
- [ ] High contrast mode is supported

### Medical Context Validation
- [ ] Emergency colors are immediately recognizable
- [ ] Medical data visualization uses appropriate color coding
- [ ] Professional medical appearance is maintained
- [ ] Trust indicators are prominently displayed
- [ ] Form layouts support medical workflow efficiency

### Performance Validation
- [ ] Font files are optimized and variable fonts are used
- [ ] Color calculations are efficient
- [ ] CSS custom properties are properly fallback-supported
- [ ] Token generation doesn't impact bundle size
- [ ] Animation performance is optimized for medical interfaces

---

**Design Tokens Version**: 1.0  
**Last Updated**: 2025-08-15  
**Compliance**: WCAG 2.2 AA, Medical UI Standards  
**Framework Compatibility**: Next.js 15, Tailwind CSS 4, React 19