# Component Library Specification - NOVA RDV Medical Design System

## Component Architecture Overview

### Design Philosophy
- **Medical-First**: Every component designed for healthcare context
- **Trust-Centric**: Visual patterns that inspire confidence
- **Accessibility-Native**: WCAG 2.2 AA compliance built-in
- **Touch-Optimized**: 48px+ targets for all interactive elements

## Button Component System

### Medical Button Variants

#### Primary Medical Button
```tsx
interface MedicalButtonProps {
  variant: 'medical-primary' | 'medical-secondary' | 'medical-outline' | 'medical-urgent' | 'medical-ghost';
  size: 'sm' | 'md' | 'lg' | 'xl' | 'emergency';
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  href?: string;
  onClick?: () => void;
}

const MedicalButton: React.FC<MedicalButtonProps> = ({
  variant = 'medical-primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  href,
  onClick,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-200
    focus:outline-none focus-visible:ring-3 focus-visible:ring-medical-primary/50
    disabled:opacity-60 disabled:cursor-not-allowed
    rounded-medical-small
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    'medical-primary': `
      bg-medical-primary-600 text-white
      hover:bg-medical-primary-700 active:bg-medical-primary-800
      shadow-medical-card hover:shadow-medical-elevated
    `,
    'medical-secondary': `
      bg-medical-secondary-600 text-white
      hover:bg-medical-secondary-700 active:bg-medical-secondary-800
      shadow-medical-card hover:shadow-medical-elevated
    `,
    'medical-outline': `
      border-2 border-medical-primary-600 text-medical-primary-600
      hover:bg-medical-primary-50 active:bg-medical-primary-100
      focus-visible:ring-medical-primary/30
    `,
    'medical-urgent': `
      bg-emergency-critical text-white
      hover:bg-emergency-critical/90 active:bg-emergency-critical/80
      shadow-medical-error hover:shadow-medical-elevated
      animate-pulse-slow
    `,
    'medical-ghost': `
      text-medical-primary-600 hover:bg-medical-primary-50
      active:bg-medical-primary-100
    `
  };

  const sizes = {
    'sm': 'h-10 px-4 text-sm gap-2 min-w-touch',
    'md': 'h-12 px-6 text-base gap-2 min-w-medical',
    'lg': 'h-14 px-8 text-lg gap-3 min-w-medical-large',
    'xl': 'h-16 px-10 text-xl gap-4 min-w-medical-large',
    'emergency': 'h-20 px-12 text-2xl gap-4 min-w-medical-emergency'
  };

  const className = `${baseClasses} ${variants[variant]} ${sizes[size]}`;

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};
```

#### Button Usage Examples
```tsx
// Primary appointment booking
<MedicalButton 
  variant="medical-primary" 
  size="xl"
  icon={<Calendar className="w-6 h-6" />}
  href="/rdv"
>
  Prendre rendez-vous
</MedicalButton>

// Emergency action
<MedicalButton 
  variant="medical-urgent" 
  size="emergency"
  icon={<Phone className="w-8 h-8" />}
  href="tel:+213555000000"
>
  Urgence: +213 555 000 000
</MedicalButton>

// Secondary action
<MedicalButton 
  variant="medical-outline" 
  size="lg"
  icon={<MapPin className="w-5 h-5" />}
>
  Trouver un cabinet
</MedicalButton>
```

## Card Component System

### Medical Card Base
```tsx
interface MedicalCardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'urgent';
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

const MedicalCard: React.FC<MedicalCardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  clickable = false,
  onClick,
  ...props
}) => {
  const baseClasses = `
    bg-white border border-medical-border
    rounded-medical-medium transition-all duration-200
    ${clickable ? 'cursor-pointer hover:shadow-medical-elevated focus-visible:ring-3 focus-visible:ring-medical-primary/30' : ''}
  `;

  const variants = {
    'default': 'shadow-medical-card',
    'elevated': 'shadow-medical-elevated',
    'outlined': 'border-2 border-medical-primary-200 shadow-medical-subtle',
    'urgent': 'border-2 border-emergency-urgent shadow-medical-error bg-emergency-critical/5'
  };

  const paddings = {
    'sm': 'p-4',
    'md': 'p-6', 
    'lg': 'p-8'
  };

  const className = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;

  return (
    <div 
      className={className}
      onClick={clickable ? onClick : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Specialized Medical Cards

#### Appointment Card
```tsx
interface AppointmentCardProps {
  appointment: {
    id: string;
    date: Date;
    time: string;
    type: string;
    practitioner: string;
    status: 'confirmed' | 'pending' | 'cancelled';
  };
  onReschedule?: () => void;
  onCancel?: () => void;
}

const MedicalAppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onReschedule,
  onCancel
}) => {
  const statusColors = {
    confirmed: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
    pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    cancelled: 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20'
  };

  return (
    <MedicalCard variant="elevated" padding="lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-medical-primary-100 rounded-medical-round flex items-center justify-center">
            <Calendar className="w-6 h-6 text-medical-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-medical-primary-700">
              {appointment.type}
            </h3>
            <p className="text-medical-neutral-600 text-sm">
              Dr. {appointment.practitioner}
            </p>
          </div>
        </div>
        
        <Badge 
          variant="medical"
          className={statusColors[appointment.status]}
        >
          {appointment.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-medical-neutral-700">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm">
            {format(appointment.date, 'dd/MM/yyyy', { locale: fr })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-medical-neutral-700">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{appointment.time}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <MedicalButton 
          variant="medical-outline" 
          size="sm" 
          onClick={onReschedule}
          className="flex-1"
        >
          Reprogrammer
        </MedicalButton>
        <MedicalButton 
          variant="medical-ghost" 
          size="sm" 
          onClick={onCancel}
          className="flex-1 text-status-cancelled hover:bg-status-cancelled/10"
        >
          Annuler
        </MedicalButton>
      </div>
    </MedicalCard>
  );
};
```

#### Service Card
```tsx
const MedicalServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onBooking
}) => {
  const urgencyIndicator = {
    low: 'border-l-4 border-status-healthy',
    medium: 'border-l-4 border-status-pending',
    high: 'border-l-4 border-emergency-urgent'
  };

  return (
    <MedicalCard 
      variant="default" 
      padding="lg"
      clickable
      onClick={onBooking}
      className={urgencyIndicator[service.urgencyLevel]}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-medical-primary-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
          <service.icon className="w-8 h-8 text-medical-primary-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-medical-primary-700 mb-2">
          {service.title}
        </h3>
        
        <p className="text-medical-neutral-600 mb-4 leading-relaxed">
          {service.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center justify-center gap-1 text-medical-neutral-700">
            <Clock className="w-4 h-4" />
            <span>{service.duration}</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-medical-neutral-700">
            <Euro className="w-4 h-4" />
            <span>{service.price}</span>
          </div>
        </div>
        
        <MedicalButton 
          variant="medical-primary" 
          size="md" 
          fullWidth
          icon={<Calendar className="w-5 h-5" />}
        >
          Prendre RDV
        </MedicalButton>
      </div>
    </MedicalCard>
  );
};
```

## Form Component System

### Medical Input Component
```tsx
interface MedicalInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  size?: 'md' | 'lg';
  error?: string;
  success?: boolean;
  required?: boolean;
  description?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const MedicalInput: React.FC<MedicalInputProps> = ({
  label,
  size = 'md',
  error,
  success,
  required = false,
  description,
  icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${useId()}`;
  const errorId = `${inputId}-error`;
  const descriptionId = `${inputId}-description`;

  const baseClasses = `
    medical-input w-full border transition-all duration-200
    focus:outline-none focus:ring-3 focus:ring-medical-primary/30
    disabled:opacity-60 disabled:cursor-not-allowed
    placeholder:text-medical-neutral-400
  `;

  const sizes = {
    'md': 'h-12 px-4 text-base',
    'lg': 'h-14 px-5 text-lg'
  };

  const states = {
    error: 'border-form-invalid focus:border-form-invalid focus:ring-form-invalid/30',
    success: 'border-form-valid focus:border-form-valid focus:ring-form-valid/30',
    default: 'border-medical-border focus:border-medical-primary-600'
  };

  const currentState = error ? 'error' : success ? 'success' : 'default';
  const inputClasses = `${baseClasses} ${sizes[size]} ${states[currentState]} ${className}`;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-medical-neutral-700"
      >
        {label}
        {required && (
          <span className="text-form-required ml-1" aria-label="obligatoire">
            *
          </span>
        )}
      </label>

      {/* Description */}
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-medical-neutral-600"
        >
          {description}
        </p>
      )}

      {/* Input Container */}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-medical-neutral-400">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`${inputClasses} ${icon && iconPosition === 'left' ? 'pl-12' : ''} ${icon && iconPosition === 'right' ? 'pr-12' : ''}`}
          aria-describedby={`${description ? descriptionId : ''} ${error ? errorId : ''}`.trim()}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-medical-neutral-400">
            {icon}
          </div>
        )}
        
        {/* Status Icon */}
        {(error || success) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {error && <AlertCircle className="w-5 h-5 text-form-invalid" />}
            {success && <CheckCircle className="w-5 h-5 text-form-valid" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p 
          id={errorId}
          className="text-sm text-form-invalid flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
```

### Medical Phone Input (Algeria-specific)
```tsx
const MedicalPhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  ...props
}) => {
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Handle +213 prefix
    if (digits.startsWith('213')) {
      const number = digits.slice(3);
      if (number.length <= 9) {
        return `+213 ${number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim()}`;
      }
    }
    
    // Handle 0 prefix (convert to +213)
    if (digits.startsWith('0')) {
      const number = digits.slice(1);
      if (number.length <= 9) {
        return `+213 ${number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim()}`;
      }
    }
    
    return input;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+213[567]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  return (
    <MedicalInput
      {...props}
      value={value}
      onChange={(e) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange(formatted);
      }}
      placeholder="+213 555 123 456"
      error={error}
      icon={<Phone className="w-5 h-5" />}
      type="tel"
    />
  );
};
```

## Accessibility Patterns

### Focus Management
```tsx
// Medical Focus Trap for Modals
const MedicalFocusTrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trap = createFocusTrap(trapRef.current!, {
      escapeDeactivates: true,
      clickOutsideDeactivates: true,
      returnFocusOnDeactivate: true,
      fallbackFocus: trapRef.current!
    });

    trap.activate();
    return () => trap.deactivate();
  }, []);

  return (
    <div ref={trapRef} className="medical-focus-container">
      {children}
    </div>
  );
};
```

### Screen Reader Announcements
```tsx
// Medical Live Region for Status Updates
const MedicalLiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {message}
    </div>
  );
};
```

## Component Library Usage Guidelines

### ✅ Do's
- Use medical variant buttons for healthcare actions
- Implement proper focus management in forms
- Include descriptive labels and ARIA attributes
- Follow 48px+ touch target requirements
- Use consistent medical color palette

### ❌ Don'ts
- Mix medical and standard button variants
- Use decorative icons without proper alt text
- Implement custom focus styles (use medical-focus)
- Create buttons smaller than 48px
- Use low-contrast color combinations

### Implementation Checklist
- [ ] All components use medical design tokens
- [ ] Touch targets meet 48px minimum
- [ ] Focus indicators are clearly visible
- [ ] Error messages are descriptive and actionable
- [ ] Screen reader compatibility verified
- [ ] Dark mode support implemented
- [ ] Performance optimized (lazy loading, memoization)