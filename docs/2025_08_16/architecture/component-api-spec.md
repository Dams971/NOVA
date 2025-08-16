# NOVA - Spécifications API des Composants Médicaux

## Vue d'ensemble

Cette spécification définit l'API complète des composants du design system médical NOVA, garantissant la cohérence, l'accessibilité et la maintenabilité à travers toute l'application.

## Architecture des Props et Variants

### Système de Type Safety

```typescript
// types/medical-ui.ts - Types communs
export type MedicalVariant = 'medical' | 'emergency' | 'administrative';
export type MedicalSize = 'sm' | 'md' | 'lg' | 'medical' | 'medical-large';
export type MedicalElevation = 'none' | 'subtle' | 'card' | 'elevated' | 'modal';
export type MedicalIntent = 'primary' | 'secondary' | 'success' | 'warning' | 'emergency';

export interface BaseMedicalProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
  'aria-label'?: string;
}

export interface AccessibilityProps {
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
}
```

## Composants Atomiques

### Button - Bouton Médical

```typescript
// components/ui/medical/Button.tsx
interface ButtonProps extends BaseMedicalProps, AccessibilityProps {
  // Variantes spécialisées médical
  variant?: 
    | 'primary'           // Action principale (confiance médicale)
    | 'secondary'         // Action secondaire (support)
    | 'success'           // Confirmation positive (validation)
    | 'warning'           // Attention modérée (prudence)
    | 'emergency'         // Urgence critique (danger immédiat)
    | 'ghost'             // Action discrète (navigation)
    | 'outline'           // Action délimitée (alternative)
    | 'link';             // Lien textuel (référence)

  // Tailles avec standards médicaux
  size?: 
    | 'sm'                // 40px - Actions secondaires
    | 'md'                // 56px - Standard médical
    | 'lg'                // 64px - Actions importantes
    | 'medical'           // 56px min-width 56px - Touch médical
    | 'medical-large'     // 64px min-width 64px - Touch médical large
    | 'medical-emergency'; // 72px min-width 72px - Touch urgence

  // Intent contextuel
  intent?: MedicalVariant;
  
  // États interactifs
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  
  // Contenu et iconographie
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  
  // Événements
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  
  // Attributs HTML
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  name?: string;
  value?: string;
  
  // Accessibilité spécialisée
  ariaLabel?: string;
  emergencyAnnouncement?: string; // Pour boutons urgence
}

// Implémentation avec Class Variance Authority
const buttonVariants = cva(
  // Base - Styles communs conformes WCAG 2.2 AA
  [
    "inline-flex items-center justify-center",
    "rounded-medical-small font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "medical-touch-target" // Classe utilitaire pour touch targets
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-trust-primary text-white shadow-medical-subtle",
          "hover:bg-primary-700 hover:shadow-medical-card",
          "active:bg-primary-800 active:scale-[0.98]",
          "focus-visible:ring-trust-primary"
        ],
        secondary: [
          "bg-trust-secondary text-white shadow-medical-subtle",
          "hover:bg-secondary-700 hover:shadow-medical-card",
          "active:bg-secondary-800 active:scale-[0.98]",
          "focus-visible:ring-trust-secondary"
        ],
        success: [
          "bg-trust-accent text-white shadow-medical-success",
          "hover:bg-success-700 hover:shadow-medical-card",
          "active:bg-success-800 active:scale-[0.98]",
          "focus-visible:ring-trust-accent"
        ],
        warning: [
          "bg-warning-600 text-white shadow-medical-warning",
          "hover:bg-warning-700 hover:shadow-medical-card",
          "active:bg-warning-800 active:scale-[0.98]",
          "focus-visible:ring-warning-600"
        ],
        emergency: [
          "bg-emergency-critical text-white shadow-medical-error",
          "hover:bg-error-700 hover:shadow-medical-elevated",
          "active:bg-error-800 active:scale-[0.98]",
          "focus-visible:ring-emergency-critical focus-visible:ring-4",
          "emergency-focus" // Classe utilitaire pour focus urgence
        ],
        ghost: [
          "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
          "active:bg-neutral-200 focus-visible:ring-neutral-600"
        ],
        outline: [
          "border border-trust-primary text-trust-primary bg-transparent",
          "hover:bg-primary-50 hover:border-primary-700",
          "active:bg-primary-100 focus-visible:ring-trust-primary"
        ],
        link: [
          "text-trust-primary underline-offset-4 hover:underline",
          "focus-visible:ring-trust-primary"
        ]
      },
      size: {
        sm: "h-10 px-medical-field-gap text-sm",
        md: "h-medical-button px-4 text-base",
        lg: "h-medical-button-large px-6 text-lg",
        medical: "h-medical-button min-w-medical px-4 text-base",
        'medical-large': "h-medical-button-large min-w-medical-large px-6 text-lg",
        'medical-emergency': "h-medical-emergency min-w-medical-emergency px-8 text-lg font-semibold"
      },
      intent: {
        medical: "medical-focus", // Focus médical standard
        emergency: "emergency-focus", // Focus urgence renforcé
        administrative: "" // Focus standard
      },
      loading: {
        true: "cursor-wait"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      intent: "medical"
    }
  }
);

// Exemple d'utilisation
<Button
  variant="emergency"
  size="medical-emergency"
  intent="emergency"
  leftIcon={<Phone className="w-5 h-5" />}
  emergencyAnnouncement="Appel d'urgence médical"
  onClick={handleEmergencyCall}
>
  Urgence Médicale
</Button>
```

### Input - Champ de Saisie Médical

```typescript
// components/ui/medical/Input.tsx
interface InputProps extends BaseMedicalProps, AccessibilityProps {
  // Contenu et labeling
  label: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  
  // Types spécialisés médical
  type?: 
    | 'text'
    | 'email'
    | 'tel'
    | 'password'
    | 'number'
    | 'date'
    | 'time'
    | 'datetime-local';
  
  // Validation médicale intégrée
  medicalValidation?: 
    | 'phone-france'        // +33 ou 0X XX XX XX XX
    | 'phone-algeria'       // +213 ou 0X XX XX XX XX
    | 'email'               // RFC 5322 compliant
    | 'name'                // Lettres, espaces, tirets, apostrophes
    | 'insurance-number'    // Numéro sécurité sociale français
    | 'nin-algeria'         // NIN algérien
    | 'postal-code-france'  // Code postal français 5 chiffres
    | 'postal-code-algeria'; // Code postal algérien
  
  // États de validation
  error?: string;
  success?: string;
  warning?: string;
  
  // Propriétés de champ
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  
  // Contraintes de saisie
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  
  // Iconographie et addons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  
  // Aide contextuelle
  helpText?: string;
  showCharacterCount?: boolean;
  
  // Événements
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // Tailles et variantes
  size?: 'sm' | 'md' | 'lg' | 'medical';
  variant?: 'default' | 'medical' | 'emergency';
}

// Validation patterns médicaux
const MEDICAL_PATTERNS = {
  'phone-france': /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
  'phone-algeria': /^(?:\+213|0)[567][0-9]{8}$/,
  'insurance-number': /^[12][0-9]{12}[0-9]{2}$/,
  'postal-code-france': /^(?:0[1-9]|[1-8][0-9]|9[0-8])[0-9]{3}$/,
  'postal-code-algeria': /^[0-9]{5}$/,
  'name': /^[a-zA-ZÀ-ÿ\u0600-\u06FF\s'-]+$/,
} as const;

// Exemple d'utilisation
<Input
  label="Numéro de téléphone"
  type="tel"
  medicalValidation="phone-algeria"
  placeholder="06 XX XX XX XX"
  leftIcon={<Phone className="w-4 h-4" />}
  required
  helpText="Format algérien : 06 XX XX XX XX ou +213 6XX XX XX XX"
  error={phoneError}
  onChange={handlePhoneChange}
  aria-describedby="phone-help phone-error"
/>
```

### Card - Carte Médicale

```typescript
// components/ui/medical/Card.tsx
interface CardProps extends BaseMedicalProps {
  // Variantes contextuelles médical
  variant?: 
    | 'default'           // Carte standard
    | 'patient'           // Informations patient
    | 'appointment'       // Rendez-vous
    | 'emergency'         // Urgence
    | 'administrative'    // Gestion administrative
    | 'diagnostic'        // Diagnostic médical
    | 'treatment'         // Plan de traitement
    | 'prescription';     // Ordonnance
  
  // Tailles et espacement
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  // Élévation et ombrage
  elevation?: MedicalElevation;
  
  // États interactifs
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  
  // Événements (si interactive)
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  
  // Accessibilité
  role?: 'button' | 'article' | 'section' | 'region';
  tabIndex?: number;
}

const cardVariants = cva(
  [
    "rounded-medical-medium border bg-background text-foreground",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        default: "border-border bg-background",
        patient: [
          "border-trust-secondary bg-white shadow-medical-card",
          "hover:shadow-medical-elevated"
        ],
        appointment: [
          "border-primary-200 bg-primary-50 shadow-medical-subtle",
          "hover:bg-primary-100"
        ],
        emergency: [
          "border-emergency-urgent bg-error-50 shadow-medical-error",
          "hover:bg-error-100"
        ],
        administrative: "border-neutral-200 bg-neutral-50",
        diagnostic: [
          "border-secondary-200 bg-secondary-50 shadow-medical-subtle"
        ],
        treatment: [
          "border-success-200 bg-success-50 shadow-medical-success"
        ],
        prescription: [
          "border-warning-200 bg-warning-50 shadow-medical-warning"
        ]
      },
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl"
      },
      padding: {
        none: "p-0",
        sm: "p-medical-field-gap",
        md: "p-medical-card-padding",
        lg: "p-medical-section-gap"
      },
      elevation: {
        none: "shadow-none",
        subtle: "shadow-medical-subtle",
        card: "shadow-medical-card",
        elevated: "shadow-medical-elevated",
        modal: "shadow-medical-modal"
      },
      interactive: {
        true: [
          "cursor-pointer medical-focus",
          "hover:shadow-medical-elevated",
          "active:scale-[0.99]"
        ]
      },
      selected: {
        true: "ring-2 ring-trust-primary ring-offset-2"
      },
      disabled: {
        true: "opacity-60 cursor-not-allowed"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      padding: "md",
      elevation: "card"
    }
  }
);

// Sous-composants Card
interface CardHeaderProps extends BaseMedicalProps {
  border?: boolean;
}

interface CardTitleProps extends BaseMedicalProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

interface CardDescriptionProps extends BaseMedicalProps {}

interface CardContentProps extends BaseMedicalProps {}

interface CardFooterProps extends BaseMedicalProps {
  border?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between';
}

// Exemple d'utilisation
<Card 
  variant="patient" 
  interactive 
  selected={selectedPatient?.id === patient.id}
  onClick={() => onSelectPatient(patient)}
  role="button"
  aria-label={`Dossier patient ${patient.name}`}
>
  <CardHeader border>
    <CardTitle level={3}>
      {patient.name}
    </CardTitle>
    <CardDescription>
      Né(e) le {formatDate(patient.birthDate)}
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    <PatientSummary patient={patient} />
  </CardContent>
  
  <CardFooter justify="between">
    <StatusBadge status={patient.status} />
    <Button variant="ghost" size="sm">
      Voir détails
    </Button>
  </CardFooter>
</Card>
```

### Dialog - Modale Médicale

```typescript
// components/ui/medical/Dialog.tsx
interface DialogProps extends BaseMedicalProps {
  // État d'ouverture
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Tailles spécialisées médical
  size?: 
    | 'sm'          // 400px - Confirmations simples
    | 'md'          // 500px - Formulaires standard
    | 'lg'          // 700px - Consultations détaillées
    | 'xl'          // 900px - Analyses complètes
    | 'fullscreen'  // Plein écran - Examens approfondis
    | 'medical';    // Taille optimisée médical (600px)
  
  // Variantes contextuelles
  variant?: 
    | 'default'
    | 'medical'
    | 'emergency'
    | 'confirmation'
    | 'form';
  
  // Comportement modal
  modal?: boolean;
  preventClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  
  // Callbacks
  onClose?: () => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onOverlayClick?: () => void;
  
  // Accessibilité
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

interface DialogContentProps extends BaseMedicalProps {
  size?: DialogProps['size'];
  variant?: DialogProps['variant'];
  showCloseButton?: boolean;
  closeButtonLabel?: string;
}

interface DialogHeaderProps extends BaseMedicalProps {
  border?: boolean;
}

interface DialogTitleProps extends BaseMedicalProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

interface DialogDescriptionProps extends BaseMedicalProps {}

interface DialogBodyProps extends BaseMedicalProps {}

interface DialogFooterProps extends BaseMedicalProps {
  justify?: 'start' | 'center' | 'end' | 'between';
  border?: boolean;
}

// Composant DialogClose pour fermeture
interface DialogCloseProps extends BaseMedicalProps {
  asChild?: boolean;
}

// Composant DialogTrigger pour déclenchement
interface DialogTriggerProps extends BaseMedicalProps {
  asChild?: boolean;
}

// Exemple d'utilisation complète
<Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
  <DialogTrigger asChild>
    <Button variant="emergency" size="medical">
      Annuler le rendez-vous
    </Button>
  </DialogTrigger>
  
  <DialogContent 
    size="medical" 
    variant="emergency"
    aria-labelledby="cancel-title"
    aria-describedby="cancel-description"
  >
    <DialogHeader border>
      <DialogTitle id="cancel-title" level={2}>
        Confirmer l'annulation
      </DialogTitle>
      <DialogDescription id="cancel-description">
        Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.
      </DialogDescription>
    </DialogHeader>
    
    <DialogBody>
      <AppointmentSummary appointment={appointment} />
      <CancellationReasonForm 
        onReasonChange={setCancellationReason}
        required
      />
    </DialogBody>
    
    <DialogFooter justify="between" border>
      <DialogClose asChild>
        <Button variant="ghost">
          Retour
        </Button>
      </DialogClose>
      
      <Button 
        variant="emergency"
        onClick={handleCancellation}
        disabled={!cancellationReason}
        loading={isCancelling}
      >
        Confirmer l'annulation
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Composants de Layout

### Container - Conteneur Responsive

```typescript
// components/ui/medical/Container.tsx
interface ContainerProps extends BaseMedicalProps {
  // Tailles de conteneur
  size?: 
    | 'sm'    // 640px
    | 'md'    // 768px  
    | 'lg'    // 1024px
    | 'xl'    // 1280px - Optimal pour layout 3 zones RDV
    | '2xl'   // 1536px
    | 'full'  // 100%
    | 'medical'; // 1200px - Optimisé contexte médical
  
  // Gestion des marges
  centerContent?: boolean;
  flushOnMobile?: boolean;
  
  // Padding responsif
  padding?: 
    | 'none'
    | 'sm'     // px-4 sm:px-6
    | 'md'     // px-6 sm:px-8
    | 'lg'     // px-8 sm:px-12
    | 'medical'; // Padding médical optimisé
}

// Exemple d'utilisation
<Container size="xl" padding="medical" centerContent>
  <RDVLayout 
    leftPanel={<PatientInfo />}
    centerPanel={<ChatInterface />}
    rightPanel={<CalendarView />}
  />
</Container>
```

### Section - Section Thématique

```typescript
// components/ui/medical/Section.tsx
interface SectionProps extends BaseMedicalProps {
  // Variantes sémantiques
  variant?: 
    | 'default'
    | 'medical'      // Section médicale standard
    | 'emergency'    // Section urgence
    | 'admin'        // Section administrative
    | 'highlight';   // Section mise en avant
  
  // Espacement vertical
  spacing?: 
    | 'none'         // py-0
    | 'sm'           // py-medical-field-gap
    | 'md'           // py-medical-group-gap  
    | 'lg'           // py-medical-section-gap
    | 'xl';          // py-medical-content-margin
  
  // Fond et bordures
  background?: boolean;
  border?: boolean;
  
  // Élément sémantique HTML
  as?: 'div' | 'section' | 'article' | 'aside' | 'main' | 'header' | 'footer';
}

// Exemple d'utilisation
<Section variant="medical" spacing="lg" background border as="section">
  <MedicalContent />
</Section>
```

### Flex et Stack - Layout Helpers

```typescript
// components/ui/medical/Flex.tsx
interface FlexProps extends BaseMedicalProps {
  // Direction
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  
  // Alignement
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  // Espacement
  gap?: 
    | 'none'
    | 'xs'    // gap-1
    | 'sm'    // gap-2 
    | 'md'    // gap-4
    | 'lg'    // gap-6
    | 'xl'    // gap-8
    | 'medical-field'   // gap-medical-field-gap
    | 'medical-card'    // gap-medical-card-gap
    | 'medical-group';  // gap-medical-group-gap
  
  // Wrapping
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  
  // Responsive
  responsive?: boolean;
}

// components/ui/medical/Stack.tsx  
interface StackProps extends BaseMedicalProps {
  // Espacement vertical entre éléments
  spacing?: FlexProps['gap'];
  
  // Alignement horizontal
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  // Répartition verticale
  distribute?: boolean;
}

// Exemple d'utilisation
<Flex direction="row" justify="between" align="center" gap="medical-field">
  <Stack spacing="sm">
    <Heading level={2}>Informations Patient</Heading>
    <Text variant="muted">Dernière mise à jour : {lastUpdate}</Text>
  </Stack>
  <Button variant="outline" size="sm">
    Modifier
  </Button>
</Flex>
```

## Composants de Données

### Table - Tableau Médical

```typescript
// components/ui/medical/Table.tsx
interface TableProps extends BaseMedicalProps {
  // Variante contextuelle
  variant?: 'default' | 'medical' | 'appointment' | 'patient';
  
  // Taille et espacement
  size?: 'sm' | 'md' | 'lg';
  
  // Fonctionnalités
  sortable?: boolean;
  selectable?: boolean;
  hoverable?: boolean;
  
  // Responsive
  responsive?: boolean;
  stackOnMobile?: boolean;
}

interface TableHeaderProps extends BaseMedicalProps {
  sticky?: boolean;
}

interface TableRowProps extends BaseMedicalProps {
  selected?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
}

interface TableCellProps extends BaseMedicalProps {
  // Alignement du contenu
  align?: 'left' | 'center' | 'right';
  
  // Type de données (pour tri)
  dataType?: 'text' | 'number' | 'date' | 'time' | 'status';
  
  // Largeur
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl' | string;
  
  // Tri
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (direction: 'asc' | 'desc') => void;
}

// Exemple d'utilisation
<Table variant="appointment" size="md" sortable hoverable>
  <TableHeader sticky>
    <TableRow>
      <TableCell sortable dataType="time" onSort={handleTimeSort}>
        Heure
      </TableCell>
      <TableCell sortable dataType="text" onSort={handlePatientSort}>
        Patient
      </TableCell>
      <TableCell dataType="text">
        Type de soins
      </TableCell>
      <TableCell dataType="status">
        Statut
      </TableCell>
      <TableCell align="right">
        Actions
      </TableCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    {appointments.map((appointment) => (
      <TableRow 
        key={appointment.id}
        onClick={() => onSelectAppointment(appointment)}
        selected={selectedId === appointment.id}
      >
        <TableCell>{formatTime(appointment.time)}</TableCell>
        <TableCell>{appointment.patient.name}</TableCell>
        <TableCell>{appointment.careType}</TableCell>
        <TableCell>
          <StatusBadge status={appointment.status} />
        </TableCell>
        <TableCell align="right">
          <AppointmentActions appointment={appointment} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### StatusBadge - Badge de Statut

```typescript
// components/ui/medical/StatusBadge.tsx
interface StatusBadgeProps extends BaseMedicalProps {
  // Statuts médicaux prédéfinis
  status: 
    | 'scheduled'     // Programmé
    | 'confirmed'     // Confirmé
    | 'in-progress'   // En cours
    | 'completed'     // Terminé
    | 'cancelled'     // Annulé
    | 'no-show'       // Absent
    | 'emergency'     // Urgence
    | 'waiting'       // En attente
    | 'rescheduled';  // Reporté
  
  // Tailles
  size?: 'sm' | 'md' | 'lg';
  
  // Variantes visuelles
  variant?: 'solid' | 'outline' | 'soft';
  
  // Icône
  showIcon?: boolean;
  customIcon?: React.ReactNode;
  
  // Interaction
  interactive?: boolean;
  onClick?: () => void;
}

// Mapping statuts vers couleurs et icônes
const statusConfig = {
  scheduled: {
    color: 'status-pending',
    icon: Clock,
    label: 'Programmé'
  },
  confirmed: {
    color: 'trust-primary', 
    icon: CheckCircle,
    label: 'Confirmé'
  },
  'in-progress': {
    color: 'warning-600',
    icon: Activity,
    label: 'En cours'
  },
  completed: {
    color: 'status-completed',
    icon: Check,
    label: 'Terminé'
  },
  cancelled: {
    color: 'status-cancelled',
    icon: X,
    label: 'Annulé'
  },
  'no-show': {
    color: 'status-no-show',
    icon: AlertTriangle,
    label: 'Absent'
  },
  emergency: {
    color: 'emergency-critical',
    icon: AlertCircle,
    label: 'Urgence'
  },
  waiting: {
    color: 'neutral-500',
    icon: Clock,
    label: 'En attente'
  },
  rescheduled: {
    color: 'secondary-600',
    icon: Calendar,
    label: 'Reporté'
  }
} as const;

// Exemple d'utilisation
<StatusBadge 
  status="confirmed" 
  size="md" 
  variant="solid" 
  showIcon 
  interactive
  onClick={() => handleStatusChange('confirmed')}
/>
```

Cette spécification API garantit une expérience développeur cohérente et une interface utilisateur professionnelle adaptée au contexte médical, avec une accessibilité WCAG 2.2 AA native et des performances optimisées.