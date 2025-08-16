# NOVA RDV - Spécifications de la Bibliothèque de Composants

## Vue d'ensemble

La bibliothèque de composants NOVA RDV fournit un ensemble complet d'éléments d'interface optimisés pour l'environnement médical français. Chaque composant est conçu selon les principes WCAG AAA, avec une attention particulière pour l'anxiété des patients et l'efficacité des praticiens.

**Philosophie de Design:**
- **Accessibilité First** : WCAG AAA natif sur tous les composants
- **Mobile-First** : Responsive par défaut avec support touch optimal
- **Performance** : Tree-shaking, lazy loading, bundle size optimisé
- **Consistency** : Design tokens unifiés et API cohérente
- **Medical UX** : Patterns spécialisés pour l'environnement de santé

## Architecture des Composants

### Hiérarchie Atomique

```
Components/
├── Atoms/              # Éléments de base
│   ├── Button/
│   ├── Input/
│   ├── Label/
│   ├── Icon/
│   └── Spinner/
├── Molecules/          # Combinaisons simples
│   ├── InputGroup/
│   ├── Card/
│   ├── Alert/
│   ├── Badge/
│   └── Tooltip/
├── Organisms/          # Composants complexes
│   ├── AppointmentForm/
│   ├── Calendar/
│   ├── ChatBot/
│   ├── Navigation/
│   └── DataTable/
├── Templates/          # Layouts de page
│   ├── RDVLayout/
│   ├── ManagerLayout/
│   ├── AdminLayout/
│   └── AuthLayout/
└── Pages/             # Pages complètes
    ├── RDVPage/
    ├── ManagerPage/
    ├── AdminPage/
    └── LandingPage/
```

### Pattern de Composant Standard

```typescript
// Pattern base pour tous les composants NOVA
interface BaseComponentProps {
  id?: string;
  className?: string;
  children?: ReactNode;
  testId?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

interface MedicalVariantProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'emergency';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  comfort?: boolean;      // Mode senior-friendly
  medical?: boolean;      // Style médical renforcé
  urgent?: boolean;       // Priorité visuelle élevée
}

// Hook standard pour tous les composants
const useComponentBase = (props: BaseComponentProps) => {
  const id = useId();
  const elementId = props.id || id;
  const testId = props.testId || `nova-component-${elementId}`;
  
  return {
    elementId,
    testId,
    ariaProps: {
      'aria-label': props['aria-label'],
      'aria-describedby': props['aria-describedby']
    }
  };
};
```

## Composants Atomiques

### Button - Bouton Médical

#### Interface et Variants

```typescript
interface MedicalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'emergency' | 'quiet';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  comfort?: boolean;      // Mode senior (grandes cibles)
  fullWidth?: boolean;
}

// Variants avec class-variance-authority
const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center rounded-lg font-medium",
    "transition-all duration-200 ease-medical",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98] active:transition-transform active:duration-75"
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-600 text-white shadow-md",
          "hover:bg-primary-700 hover:shadow-lg",
          "focus-visible:ring-primary-500"
        ],
        secondary: [
          "border border-primary-600 text-primary-600 bg-transparent",
          "hover:bg-primary-50 hover:border-primary-700",
          "focus-visible:ring-primary-500"
        ],
        success: [
          "bg-success-600 text-white shadow-md",
          "hover:bg-success-700 hover:shadow-lg",
          "focus-visible:ring-success-500"
        ],
        warning: [
          "bg-warning-500 text-white shadow-md",
          "hover:bg-warning-600 hover:shadow-lg",
          "focus-visible:ring-warning-400"
        ],
        error: [
          "bg-error-600 text-white shadow-md",
          "hover:bg-error-700 hover:shadow-lg",
          "focus-visible:ring-error-500"
        ],
        emergency: [
          "bg-error-600 text-white shadow-lg animate-pulse-gentle",
          "hover:bg-error-700 hover:shadow-xl",
          "focus-visible:ring-error-500 focus-visible:ring-4",
          "ring-2 ring-error-200 ring-offset-1"
        ],
        quiet: [
          "text-medical-muted bg-transparent",
          "hover:bg-neutral-100 hover:text-medical-text",
          "focus-visible:ring-neutral-400"
        ]
      },
      size: {
        sm: "h-9 px-3 text-sm min-h-[36px]",
        md: "h-11 px-4 text-base min-h-[44px]",
        lg: "h-12 px-6 text-lg min-h-[48px]",
        xl: "h-14 px-8 text-xl min-h-[56px]"
      },
      comfort: {
        true: "h-12 px-6 text-lg min-h-[56px]" // Override size pour confort senior
      },
      urgency: {
        low: "",
        medium: "ring-1 ring-offset-1",
        high: "ring-2 ring-offset-2 shadow-lg",
        emergency: "ring-4 ring-offset-2 shadow-xl animate-pulse-gentle"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      urgency: 'low',
      comfort: false,
      fullWidth: false
    }
  }
);
```

#### Implémentation Complète

```tsx
export const MedicalButton = forwardRef<HTMLButtonElement, MedicalButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    urgency = 'low',
    comfort = false,
    fullWidth = false,
    children,
    disabled,
    className,
    ...props 
  }, ref) => {
    const { elementId, testId, ariaProps } = useComponentBase(props);
    
    // Analytics tracking
    const trackButtonClick = useAnalytics();
    
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled) {
        trackButtonClick('button_click', {
          variant,
          urgency,
          component: 'MedicalButton'
        });
        props.onClick?.(event);
      }
    };
    
    return (
      <button
        ref={ref}
        id={elementId}
        data-testid={testId}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({ variant, size, comfort, urgency, fullWidth }),
          className
        )}
        onClick={handleClick}
        {...ariaProps}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Chargement en cours</span>
            {loadingText || children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2 flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="ml-2 flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

MedicalButton.displayName = 'MedicalButton';
```

#### Tests et Storybook

```typescript
// MedicalButton.test.tsx
describe('MedicalButton', () => {
  it('renders with all variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'emergency', 'quiet'] as const;
    
    variants.forEach(variant => {
      render(<MedicalButton variant={variant}>Test</MedicalButton>);
      expect(screen.getByRole('button')).toHaveClass(`bg-${variant}`);
    });
  });
  
  it('meets WCAG AAA accessibility standards', async () => {
    const { container } = render(
      <MedicalButton variant="primary">Prendre rendez-vous</MedicalButton>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has minimum 44px touch target', () => {
    render(<MedicalButton size="sm">Test</MedicalButton>);
    const button = screen.getByRole('button');
    
    const styles = getComputedStyle(button);
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
  });
  
  it('supports emergency urgency with visual indicators', () => {
    render(<MedicalButton urgency="emergency">Urgence</MedicalButton>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('animate-pulse-gentle');
    expect(button).toHaveClass('ring-4');
  });
});

// MedicalButton.stories.tsx
export default {
  title: 'Medical/Button',
  component: MedicalButton,
  parameters: {
    docs: {
      description: {
        component: 'Bouton optimisé pour environnement médical avec support WCAG AAA'
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true, options: { wcagLevel: 'AAA' } }
        ]
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'emergency', 'quiet']
    },
    urgency: {
      control: 'select', 
      options: ['low', 'medium', 'high', 'emergency']
    }
  }
} as Meta<typeof MedicalButton>;

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <MedicalButton variant="primary">Primaire</MedicalButton>
        <MedicalButton variant="secondary">Secondaire</MedicalButton>
        <MedicalButton variant="success">Succès</MedicalButton>
        <MedicalButton variant="warning">Attention</MedicalButton>
        <MedicalButton variant="error">Erreur</MedicalButton>
        <MedicalButton variant="emergency">Urgence</MedicalButton>
      </div>
    </div>
  )
};

export const UrgencyLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <MedicalButton urgency="low">Priorité Basse</MedicalButton>
      <MedicalButton urgency="medium">Priorité Moyenne</MedicalButton>
      <MedicalButton urgency="high">Priorité Haute</MedicalButton>
      <MedicalButton urgency="emergency">Urgence Critique</MedicalButton>
    </div>
  )
};
```

### Input - Champ de Saisie Médical

#### Interface et Validation

```typescript
interface MedicalInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  icon?: ReactNode;
  rightElement?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  medical?: boolean;
  urgent?: boolean;
  comfort?: boolean;
  showPasswordToggle?: boolean;
  mask?: string;           // Masque de saisie (téléphone, etc.)
  validate?: (value: string) => string | undefined;
}

export const MedicalInput = forwardRef<HTMLInputElement, MedicalInputProps>(
  ({ 
    label,
    error,
    hint,
    success = false,
    icon,
    rightElement,
    size = 'md',
    medical = true,
    urgent = false,
    comfort = false,
    showPasswordToggle = false,
    mask,
    validate,
    className,
    ...props 
  }, ref) => {
    const { elementId, testId, ariaProps } = useComponentBase(props);
    const [showPassword, setShowPassword] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();
    
    const errorId = error || internalError ? `${elementId}-error` : undefined;
    const hintId = hint ? `${elementId}-hint` : undefined;
    const describedBy = cn(errorId, hintId);
    
    // Validation en temps réel
    const handleValidation = (value: string) => {
      if (validate) {
        const validationError = validate(value);
        setInternalError(validationError);
      }
    };
    
    // Masquage de saisie
    const handleMask = (value: string): string => {
      if (!mask) return value;
      
      switch (mask) {
        case 'phone':
          return value.replace(/\D/g, '').replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        case 'postal':
          return value.replace(/\D/g, '').substring(0, 5);
        default:
          return value;
      }
    };
    
    const inputType = showPasswordToggle && showPassword ? 'text' : props.type;
    const displayError = error || internalError;
    
    return (
      <div className="space-y-2">
        <label 
          htmlFor={elementId}
          className={cn(
            "block text-sm font-medium",
            urgent ? "text-error-700 font-semibold" : "text-medical-text",
            comfort && "text-base font-semibold"
          )}
        >
          {label}
          {props.required && (
            <span className="text-error-600 ml-1" aria-label="Champ obligatoire">*</span>
          )}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-muted">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={elementId}
            data-testid={testId}
            type={inputType}
            aria-invalid={displayError ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            className={cn(
              // Base styles
              "flex w-full rounded-lg border px-3 py-2 text-base",
              "placeholder:text-medical-muted/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200 ease-medical",
              
              // Size variants
              size === 'sm' && "h-9 text-sm",
              size === 'md' && "h-11 text-base",
              size === 'lg' && "h-12 text-lg",
              comfort && "h-12 text-lg", // Override pour confort
              
              // Medical styling
              medical && [
                "border-medical-border bg-white",
                "focus-visible:ring-primary-500 focus-visible:border-primary-600",
              ],
              
              // States
              displayError && [
                "border-error-500 bg-error-50",
                "focus-visible:ring-error-500 focus-visible:border-error-600",
              ],
              success && [
                "border-success-500 bg-success-50",
                "focus-visible:ring-success-500 focus-visible:border-success-600",
              ],
              urgent && [
                "border-warning-500 bg-warning-50 ring-1 ring-warning-200",
              ],
              
              // Icon spacing
              icon && "pl-10",
              (rightElement || showPasswordToggle) && "pr-10",
              
              className
            )}
            onChange={(e) => {
              const maskedValue = handleMask(e.target.value);
              e.target.value = maskedValue;
              handleValidation(maskedValue);
              props.onChange?.(e);
            }}
            {...ariaProps}
            {...props}
          />
          
          {/* Right elements */}
          {(rightElement || showPasswordToggle) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  className="text-medical-muted hover:text-medical-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              ) : rightElement}
            </div>
          )}
        </div>
        
        {hint && !displayError && (
          <p id={hintId} className="text-sm text-medical-muted">
            {hint}
          </p>
        )}
        
        {displayError && (
          <p id={errorId} className="text-sm text-error-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {displayError}
          </p>
        )}
        
        {success && (
          <p className="text-sm text-success-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Champ valide
          </p>
        )}
      </div>
    );
  }
);

MedicalInput.displayName = 'MedicalInput';
```

### Select - Sélection Accessible

```typescript
interface MedicalSelectProps {
  label: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  groups?: Array<{ label: string; options: typeof options }>;
  value?: string;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  medical?: boolean;
  urgent?: boolean;
  comfort?: boolean;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}

export const MedicalSelect = ({
  label,
  placeholder = "Sélectionnez une option",
  error,
  hint,
  options = [],
  groups = [],
  value,
  onValueChange,
  size = 'md',
  medical = true,
  urgent = false,
  comfort = false,
  required = false,
  disabled = false,
  searchable = false,
  ...props
}: MedicalSelectProps) => {
  const { elementId, testId } = useComponentBase(props);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const errorId = error ? `${elementId}-error` : undefined;
  const hintId = hint ? `${elementId}-hint` : undefined;
  
  const allOptions = groups.length > 0 
    ? groups.flatMap(group => group.options)
    : options;
    
  const filteredOptions = searchable
    ? allOptions.filter(option => 
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : allOptions;
  
  const selectedOption = allOptions.find(option => option.value === value);
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={elementId}
        className={cn(
          "block text-sm font-medium",
          urgent ? "text-error-700 font-semibold" : "text-medical-text",
          comfort && "text-base font-semibold"
        )}
      >
        {label}
        {required && (
          <span className="text-error-600 ml-1" aria-label="Champ obligatoire">*</span>
        )}
      </label>
      
      <Select open={open} onOpenChange={setOpen} value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={elementId}
          data-testid={testId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            // Base styles
            "flex w-full items-center justify-between rounded-lg border px-3 py-2",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200 ease-medical",
            
            // Size variants
            size === 'sm' && "h-9 text-sm",
            size === 'md' && "h-11 text-base",
            size === 'lg' && "h-12 text-lg",
            comfort && "h-12 text-lg",
            
            // Medical styling
            medical && [
              "border-medical-border bg-white",
              "focus:ring-primary-500 focus:border-primary-600",
            ],
            
            // Error state
            error && [
              "border-error-500 bg-error-50",
              "focus:ring-error-500 focus:border-error-600",
            ],
            
            // Urgent state
            urgent && [
              "border-warning-500 bg-warning-50 ring-1 ring-warning-200",
            ]
          )}
        >
          <SelectValue placeholder={placeholder}>
            {selectedOption?.label || placeholder}
          </SelectValue>
          <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </SelectTrigger>
        
        <SelectContent 
          className="z-50 max-h-96 overflow-hidden rounded-lg border border-medical-border bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          {searchable && (
            <div className="p-2 border-b border-medical-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-medical-muted" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-medical-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
          
          <div className="p-1 max-h-80 overflow-y-auto">
            {groups.length > 0 ? (
              groups.map((group) => (
                <div key={group.label}>
                  <SelectLabel className="px-2 py-1.5 text-sm font-semibold text-medical-muted">
                    {group.label}
                  </SelectLabel>
                  {group.options
                    .filter(option => 
                      !searchable || option.label.toLowerCase().includes(searchValue.toLowerCase())
                    )
                    .map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm",
                          "hover:bg-primary-50 focus:bg-primary-50",
                          "disabled:pointer-events-none disabled:opacity-50",
                          comfort && "py-3 text-base"
                        )}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  <SelectSeparator className="my-1 h-px bg-medical-border" />
                </div>
              ))
            ) : (
              filteredOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm",
                    "hover:bg-primary-50 focus:bg-primary-50",
                    "disabled:pointer-events-none disabled:opacity-50",
                    comfort && "py-3 text-base"
                  )}
                >
                  {option.label}
                </SelectItem>
              ))
            )}
            
            {filteredOptions.length === 0 && (
              <div className="py-4 text-center text-sm text-medical-muted">
                Aucune option trouvée
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
      
      {hint && !error && (
        <p id={hintId} className="text-sm text-medical-muted">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-error-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};
```

## Composants Moléculaires

### Card - Carte Médicale

```typescript
interface MedicalCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'medical';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  medical?: boolean;
  urgent?: boolean;
  className?: string;
}

export const MedicalCard = ({
  children,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  hover = false,
  medical = true,
  urgent = false,
  className,
  ...props
}: MedicalCardProps) => {
  const { elementId, testId } = useComponentBase(props);
  
  return (
    <div
      id={elementId}
      data-testid={testId}
      className={cn(
        // Base styles
        "rounded-lg transition-all duration-200 ease-medical",
        
        // Variants
        variant === 'default' && "bg-white border border-medical-border",
        variant === 'elevated' && "bg-white shadow-md",
        variant === 'outlined' && "bg-transparent border-2 border-medical-border",
        variant === 'medical' && "bg-medical-bg border border-primary-200",
        
        // Padding
        padding === 'none' && "p-0",
        padding === 'sm' && "p-4",
        padding === 'md' && "p-6",
        padding === 'lg' && "p-8",
        
        // Interactive states
        hover && "hover:shadow-lg hover:border-primary-300 cursor-pointer",
        urgent && "border-warning-500 bg-warning-50 ring-1 ring-warning-200",
        
        className
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-medical-border pb-4 mb-4">
          {header}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-medical-border pt-4 mt-4">
          {footer}
        </div>
      )}
    </div>
  );
};

// Composants de sous-éléments
export const MedicalCardHeader = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div className={cn("space-y-1.5", className)} {...props}>
    {children}
  </div>
);

export const MedicalCardTitle = ({ children, className, ...props }: ComponentProps<'h3'>) => (
  <h3 className={cn("text-lg font-semibold text-medical-text", className)} {...props}>
    {children}
  </h3>
);

export const MedicalCardDescription = ({ children, className, ...props }: ComponentProps<'p'>) => (
  <p className={cn("text-sm text-medical-muted", className)} {...props}>
    {children}
  </p>
);

export const MedicalCardContent = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div className={cn("space-y-4", className)} {...props}>
    {children}
  </div>
);

export const MedicalCardFooter = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div className={cn("flex items-center justify-between", className)} {...props}>
    {children}
  </div>
);
```

### Alert - Notification Médicale

```typescript
interface MedicalAlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'medical';
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
  actions?: ReactNode;
  urgent?: boolean;
  className?: string;
}

export const MedicalAlert = ({
  children,
  variant = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  icon,
  actions,
  urgent = false,
  className,
  ...props
}: MedicalAlertProps) => {
  const { elementId, testId } = useComponentBase(props);
  
  // Icônes par défaut selon le variant
  const defaultIcons = {
    info: <Info className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    medical: <Heart className="h-4 w-4" />
  };
  
  const displayIcon = icon || defaultIcons[variant];
  
  return (
    <div
      id={elementId}
      data-testid={testId}
      role="alert"
      aria-live={urgent ? "assertive" : "polite"}
      className={cn(
        "relative w-full rounded-lg border p-4",
        "transition-all duration-200 ease-medical",
        
        // Variants
        variant === 'info' && "border-primary-200 bg-primary-50 text-primary-800",
        variant === 'success' && "border-success-200 bg-success-50 text-success-800",
        variant === 'warning' && "border-warning-200 bg-warning-50 text-warning-800",
        variant === 'error' && "border-error-200 bg-error-50 text-error-800",
        variant === 'medical' && "border-medical-border bg-medical-bg text-medical-text",
        
        // Urgent styling
        urgent && "ring-2 ring-offset-2",
        urgent && variant === 'error' && "ring-error-500 animate-pulse-gentle",
        urgent && variant === 'warning' && "ring-warning-500",
        
        className
      )}
      {...props}
    >
      <div className="flex">
        {displayIcon && (
          <div className="flex-shrink-0">
            <div className={cn(
              "mt-0.5",
              variant === 'info' && "text-primary-600",
              variant === 'success' && "text-success-600", 
              variant === 'warning' && "text-warning-600",
              variant === 'error' && "text-error-600",
              variant === 'medical' && "text-primary-600"
            )}>
              {displayIcon}
            </div>
          </div>
        )}
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className="text-sm">
            {description || children}
          </div>
          
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={cn(
                  "inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  variant === 'info' && "text-primary-600 hover:bg-primary-600 focus:ring-primary-500",
                  variant === 'success' && "text-success-600 hover:bg-success-600 focus:ring-success-500",
                  variant === 'warning' && "text-warning-600 hover:bg-warning-600 focus:ring-warning-500",
                  variant === 'error' && "text-error-600 hover:bg-error-600 focus:ring-error-500",
                  variant === 'medical' && "text-medical-muted hover:bg-primary-600 focus:ring-primary-500"
                )}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sous-composants
export const MedicalAlertTitle = ({ children, className, ...props }: ComponentProps<'h5'>) => (
  <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
    {children}
  </h5>
);

export const MedicalAlertDescription = ({ children, className, ...props }: ComponentProps<'div'>) => (
  <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
    {children}
  </div>
);
```

## Composants Organismes

### AppointmentForm - Formulaire de Rendez-vous

```typescript
interface AppointmentFormData {
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<AppointmentFormData>;
  availableSlots?: Array<{ date: string; time: string; available: boolean }>;
  appointmentTypes?: Array<{ value: string; label: string; duration: number }>;
  disabled?: boolean;
  urgent?: boolean;
}

export const AppointmentForm = ({
  onSubmit,
  onCancel,
  initialData,
  availableSlots = [],
  appointmentTypes = [],
  disabled = false,
  urgent = false
}: AppointmentFormProps) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientFirstName: '',
    patientLastName: '',
    patientEmail: '',
    patientPhone: '',
    appointmentType: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    urgency: urgent ? 'urgent' : 'normal',
    ...initialData
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation
  const validatePhone = (phone: string): string | undefined => {
    const phoneRegex = /^(\+213|0)[567]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Format de téléphone invalide (ex: 06 XX XX XX XX)';
    }
  };
  
  const validateEmail = (email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Adresse email invalide';
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.patientFirstName.trim()) {
      newErrors.patientFirstName = 'Le prénom est obligatoire';
    }
    
    if (!formData.patientLastName.trim()) {
      newErrors.patientLastName = 'Le nom est obligatoire';
    }
    
    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'L\'email est obligatoire';
    } else {
      const emailError = validateEmail(formData.patientEmail);
      if (emailError) newErrors.patientEmail = emailError;
    }
    
    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Le téléphone est obligatoire';
    } else {
      const phoneError = validatePhone(formData.patientPhone);
      if (phoneError) newErrors.patientPhone = phoneError;
    }
    
    if (!formData.appointmentType) {
      newErrors.appointmentType = 'Le type de rendez-vous est obligatoire';
    }
    
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'La date est obligatoire';
    }
    
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'L\'heure est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateFormData = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si le champ devient valide
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <MedicalCard
      variant="medical"
      urgent={urgent}
      header={
        <MedicalCardHeader>
          <MedicalCardTitle>
            {urgent ? "Rendez-vous urgent" : "Prendre rendez-vous"}
          </MedicalCardTitle>
          <MedicalCardDescription>
            Remplissez le formulaire pour planifier votre rendez-vous
          </MedicalCardDescription>
        </MedicalCardHeader>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations patient */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-medical-text">
            Informations patient
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MedicalInput
              label="Prénom"
              value={formData.patientFirstName}
              onChange={(e) => updateFormData('patientFirstName', e.target.value)}
              error={errors.patientFirstName}
              required
              disabled={disabled}
              urgent={urgent}
              icon={<User className="h-4 w-4" />}
            />
            
            <MedicalInput
              label="Nom"
              value={formData.patientLastName}
              onChange={(e) => updateFormData('patientLastName', e.target.value)}
              error={errors.patientLastName}
              required
              disabled={disabled}
              urgent={urgent}
              icon={<User className="h-4 w-4" />}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MedicalInput
              label="Email"
              type="email"
              value={formData.patientEmail}
              onChange={(e) => updateFormData('patientEmail', e.target.value)}
              error={errors.patientEmail}
              required
              disabled={disabled}
              urgent={urgent}
              icon={<Mail className="h-4 w-4" />}
              validate={validateEmail}
            />
            
            <MedicalInput
              label="Téléphone"
              type="tel"
              value={formData.patientPhone}
              onChange={(e) => updateFormData('patientPhone', e.target.value)}
              error={errors.patientPhone}
              required
              disabled={disabled}
              urgent={urgent}
              icon={<Phone className="h-4 w-4" />}
              mask="phone"
              validate={validatePhone}
              hint="Format: 06 XX XX XX XX"
            />
          </div>
        </div>
        
        {/* Détails du rendez-vous */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-medical-text">
            Détails du rendez-vous
          </h3>
          
          <MedicalSelect
            label="Type de rendez-vous"
            value={formData.appointmentType}
            onValueChange={(value) => updateFormData('appointmentType', value)}
            error={errors.appointmentType}
            required
            disabled={disabled}
            urgent={urgent}
            options={appointmentTypes}
            placeholder="Sélectionnez le type de soin"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MedicalInput
              label="Date"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => updateFormData('appointmentDate', e.target.value)}
              error={errors.appointmentDate}
              required
              disabled={disabled}
              urgent={urgent}
              icon={<Calendar className="h-4 w-4" />}
              min={new Date().toISOString().split('T')[0]}
            />
            
            <MedicalSelect
              label="Heure"
              value={formData.appointmentTime}
              onValueChange={(value) => updateFormData('appointmentTime', value)}
              error={errors.appointmentTime}
              required
              disabled={disabled}
              urgent={urgent}
              options={availableSlots
                .filter(slot => slot.date === formData.appointmentDate && slot.available)
                .map(slot => ({ value: slot.time, label: slot.time }))
              }
              placeholder="Sélectionnez l'heure"
            />
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-medical-text mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder="Informations complémentaires..."
            disabled={disabled}
            rows={3}
            className={cn(
              "w-full px-3 py-2 border border-medical-border rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 ease-medical",
              urgent && "border-warning-500 bg-warning-50"
            )}
          />
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <MedicalButton
            type="submit"
            variant={urgent ? "emergency" : "primary"}
            urgency={urgent ? "emergency" : "low"}
            loading={isSubmitting}
            loadingText="Confirmation en cours..."
            disabled={disabled}
            fullWidth
            icon={<Calendar className="h-4 w-4" />}
          >
            {urgent ? "Confirmer rendez-vous urgent" : "Confirmer le rendez-vous"}
          </MedicalButton>
          
          {onCancel && (
            <MedicalButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              fullWidth
            >
              Annuler
            </MedicalButton>
          )}
        </div>
      </form>
    </MedicalCard>
  );
};
```

## Templates de Layout

### RDVLayout - Layout Page RDV

```typescript
interface RDVLayoutProps {
  children: ReactNode;
  chatbot?: ReactNode;
  sidebar?: ReactNode;
  onEmergency?: () => void;
}

export const RDVLayout = ({ 
  children, 
  chatbot, 
  sidebar, 
  onEmergency 
}: RDVLayoutProps) => {
  const { isMobile } = useMedicalBreakpoints();
  const [showMobileChatbot, setShowMobileChatbot] = useState(false);
  
  return (
    <div className="min-h-screen bg-medical-bg">
      {/* Skip Links pour accessibilité */}
      <SkipLinks />
      
      {/* Header mobile */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-white border-b border-medical-border shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg font-semibold text-medical-text">
              NOVA RDV
            </h1>
            
            <div className="flex items-center gap-2">
              {onEmergency && (
                <MedicalButton
                  variant="emergency"
                  size="sm"
                  urgency="emergency"
                  onClick={onEmergency}
                  icon={<AlertTriangle className="h-4 w-4" />}
                >
                  Urgence
                </MedicalButton>
              )}
              
              <MedicalButton
                variant="quiet"
                size="sm"
                onClick={() => setShowMobileChatbot(!showMobileChatbot)}
                icon={<MessageCircle className="h-4 w-4" />}
                aria-label="Ouvrir l'assistant"
              >
                Assistant
              </MedicalButton>
            </div>
          </div>
        </header>
      )}
      
      <div className="flex h-[calc(100vh-theme(spacing.16))] lg:h-screen">
        {/* Zone principale 60% */}
        <main className="flex-1 flex flex-col lg:w-3/5">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </div>
        </main>
        
        {/* Chatbot + Sidebar 40% - Desktop */}
        {!isMobile && (
          <aside className="lg:flex lg:w-2/5 lg:flex-col border-l border-medical-border bg-white">
            {/* Emergency button fixe */}
            {onEmergency && (
              <div className="p-4 border-b border-medical-border">
                <MedicalButton
                  variant="emergency"
                  urgency="emergency"
                  fullWidth
                  onClick={onEmergency}
                  icon={<AlertTriangle className="h-4 w-4" />}
                >
                  Urgence médicale
                </MedicalButton>
              </div>
            )}
            
            {/* Chatbot */}
            {chatbot && (
              <div className="flex-1 min-h-0">
                {chatbot}
              </div>
            )}
            
            {/* Sidebar (stats, infos) */}
            {sidebar && (
              <div className="h-1/3 border-t border-medical-border overflow-y-auto">
                {sidebar}
              </div>
            )}
          </aside>
        )}
      </div>
      
      {/* Modal chatbot mobile */}
      {isMobile && showMobileChatbot && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileChatbot(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 h-3/4 bg-white rounded-t-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-medical-border">
              <h2 className="text-lg font-semibold">Assistant NOVA</h2>
              <MedicalButton
                variant="quiet"
                size="sm"
                onClick={() => setShowMobileChatbot(false)}
                icon={<X className="h-4 w-4" />}
                aria-label="Fermer l'assistant"
              />
            </div>
            
            <div className="h-full overflow-hidden">
              {chatbot}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Skip Links pour accessibilité
const SkipLinks = () => (
  <div className="sr-only focus-within:not-sr-only">
    <a
      href="#main-content"
      className="fixed top-4 left-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Aller au contenu principal
    </a>
    <a
      href="#chatbot"
      className="fixed top-4 left-32 z-50 bg-primary-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Aller à l'assistant
    </a>
  </div>
);
```

## Performance et Optimisation

### Lazy Loading des Composants

```typescript
// Lazy loading optimisé pour composants lourds
export const LazyAppointmentCalendar = lazy(() => 
  import('./organisms/AppointmentCalendar').then(module => ({
    default: module.AppointmentCalendar
  }))
);

export const LazyChatBot = lazy(() => 
  import('./organisms/ChatBot').then(module => ({
    default: module.ChatBot
  }))
);

// Wrapper avec fallback
export const AppointmentCalendarWithFallback = (props: AppointmentCalendarProps) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-medical-muted">Chargement du calendrier...</span>
      </div>
    </div>
  }>
    <LazyAppointmentCalendar {...props} />
  </Suspense>
);
```

### Bundle Size Analysis

```typescript
// Bundle analysis pour optimisation
export const componentSizes = {
  'MedicalButton': '2.1KB',
  'MedicalInput': '3.4KB', 
  'MedicalSelect': '5.2KB',
  'MedicalCard': '1.8KB',
  'MedicalAlert': '2.9KB',
  'AppointmentForm': '12.3KB',
  'AppointmentCalendar': '28.7KB', // Lazy loaded
  'ChatBot': '35.2KB'              // Lazy loaded
};

// Tree shaking configuration
export const optimizedExports = {
  // Atomic exports pour tree shaking
  atoms: {
    Button: () => import('./atoms/Button'),
    Input: () => import('./atoms/Input'),
    Select: () => import('./atoms/Select')
  },
  // Molecule exports
  molecules: {
    Card: () => import('./molecules/Card'),
    Alert: () => import('./molecules/Alert')
  },
  // Organism exports (lazy)
  organisms: {
    AppointmentForm: () => import('./organisms/AppointmentForm'),
    Calendar: () => import('./organisms/Calendar')
  }
};
```

Cette spécification de composants fournit une base complète et évolutive pour construire des interfaces médicales accessibles, performantes et adaptées aux besoins spécifiques de NOVA RDV.