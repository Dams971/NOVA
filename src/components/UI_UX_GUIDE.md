# NOVA UI/UX System Guide

## Overview

This guide documents the comprehensive UI/UX system implemented for the NOVA RDV platform, ensuring full accessibility (WCAG 2.2 AA), responsive design, and optimal performance.

## Architecture

### Core Principles

1. **Accessibility First**: Every component meets WCAG 2.2 AA standards
2. **Mobile First**: Responsive design starting from 320px
3. **Performance Optimized**: Core Web Vitals compliance
4. **Touch Friendly**: 44pt (iOS) / 48dp (Android) minimum touch targets
5. **Keyboard Navigation**: Full keyboard accessibility
6. **Screen Reader Compatible**: Proper ARIA implementation

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4 with custom utilities
- **Components**: React 19 with TypeScript
- **Testing**: Vitest + Jest-axe for accessibility
- **CI/CD**: Lighthouse CI with performance budgets

## Component Library

### Layout Components

#### Header (`/layout/Header.tsx`)
```tsx
import { Header } from '@/components/ui';

function App() {
  return <Header />;
}
```

**Features:**
- Skip link for keyboard users
- Mobile-responsive navigation
- Proper ARIA landmarks
- Touch-friendly targets

### Form Components

#### TextInput (`/forms/TextInput.tsx`)
```tsx
import { TextInput } from '@/components/ui/forms';

function ContactForm() {
  return (
    <TextInput
      label="Email"
      type="email"
      required
      error={errors.email}
      hint="Nous ne partagerons jamais votre email"
    />
  );
}
```

**Features:**
- Automatic ID generation
- ARIA error associations
- Required field indication
- Touch target compliance

#### TelInput (`/forms/TelInput.tsx`)
```tsx
import { TelInput } from '@/components/ui/forms';

function PhoneForm() {
  const [phone, setPhone] = useState('');
  
  return (
    <TelInput
      label="Téléphone"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      onPhoneChange={(validPhone) => console.log(validPhone)}
    />
  );
}
```

**Features:**
- Automatic Algerian number formatting
- Real-time validation
- International format support
- Accessibility compliance

#### Button (`/forms/Button.tsx`)
```tsx
import { Button } from '@/components/ui/forms';

function ActionButton() {
  return (
    <Button
      variant="primary"
      size="lg"
      loading={isSubmitting}
      disabled={!isValid}
    >
      Confirmer le rendez-vous
    </Button>
  );
}
```

**Variants:**
- `primary`: Main action buttons
- `secondary`: Secondary actions
- `outline`: Outlined style
- `ghost`: Minimal style
- `danger`: Destructive actions

### Calendar Components

#### DatePicker (`/calendar/DatePicker.tsx`)
```tsx
import { DatePicker } from '@/components/ui';

function AppointmentForm() {
  const [date, setDate] = useState<Date>();
  
  return (
    <DatePicker
      label="Date du rendez-vous"
      value={date}
      onChange={setDate}
      minDate={new Date()}
      maxDate={addMonths(new Date(), 3)}
    />
  );
}
```

**Features:**
- Full keyboard navigation
- Screen reader support
- Date restrictions
- French localization
- ARIA grid implementation

### Loading & Error States

#### Loading Components
```tsx
import { Skeleton, SkeletonForm } from '@/components/ui';

function LoadingState() {
  return (
    <div>
      <Skeleton className="h-8 w-64 mb-4" />
      <SkeletonForm />
    </div>
  );
}
```

#### Error Boundaries
```tsx
// Automatic error handling in /rdv/error.tsx
// Custom error components available
import { ErrorMessage } from '@/components/ui';
```

## Accessibility Features

### WCAG 2.2 AA Compliance

#### Color Contrast
- Text: ≥ 4.5:1 contrast ratio
- UI Components: ≥ 3:1 contrast ratio
- Focus indicators: High visibility

#### Keyboard Navigation
```css
/* Focus styles */
.focus-visible-ring {
  @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2;
}
```

#### Touch Targets
```css
/* Touch target utilities */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  @apply sm:min-w-[48px] sm:min-h-[48px];
}
```

#### Screen Reader Support
- Proper heading hierarchy
- Landmark regions
- Alternative text
- Live regions for dynamic content

### Skip Links
Every page includes skip navigation:
```tsx
<a href="#main-content" className="skip-link">
  Aller au contenu principal
</a>
```

### Error Handling
Comprehensive error feedback:
```tsx
// Individual field errors
<TextInput error="Ce champ est requis" />

// Form-level error summary
<div role="alert" aria-labelledby="error-summary">
  <h2 id="error-summary">Veuillez corriger les erreurs suivantes:</h2>
  <ul>
    <li><a href="#email">Email invalide</a></li>
  </ul>
</div>
```

## Responsive Design

### Breakpoint Strategy
- Mobile First: 320px base
- Tablet: 768px
- Desktop: 1024px
- Large: 1280px+

### Container Queries
```css
.container-responsive {
  container-type: inline-size;
}

@container (min-width: 640px) {
  .container\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Fluid Typography
```css
.fluid-base {
  font-size: clamp(1rem, 3vw, 1.125rem);
}
```

### Safe Areas
Support for modern devices:
```css
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

## Performance Optimization

### Core Web Vitals Targets
- **LCP**: ≤ 2.5s
- **FID**: ≤ 100ms
- **CLS**: ≤ 0.1
- **INP**: ≤ 200ms

### Performance Monitoring
```tsx
import { initPerformanceMonitoring } from '@/lib/performance';

// Initialize in _app.tsx or layout.tsx
useEffect(() => {
  initPerformanceMonitoring({
    enableLogging: process.env.NODE_ENV === 'development',
    enableAnalytics: process.env.NODE_ENV === 'production',
  });
}, []);
```

### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/cabinet-photo.jpg"
  alt="Cabinet dentaire moderne"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority // For LCP images
/>
```

### Resource Budgets
- JavaScript: ≤ 600KB
- CSS: ≤ 100KB
- Images: ≤ 1MB
- Total: ≤ 2MB

## Testing Strategy

### Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Full test suite
npm test
```

### Lighthouse CI
```bash
# Desktop audit
npm run lighthouse

# Mobile audit
npm run lighthouse:mobile
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements are reachable
- [ ] Focus indicators are visible
- [ ] Skip links work
- [ ] Modal focus trapping works

#### Screen Reader Testing
- [ ] Content is properly announced
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Live regions update correctly

#### Touch Device Testing
- [ ] Touch targets meet size requirements
- [ ] Gestures work on mobile
- [ ] Responsive design adapts properly
- [ ] Safe areas are respected

#### Color & Contrast
- [ ] High contrast mode works
- [ ] Color is not the only differentiator
- [ ] Sufficient contrast ratios
- [ ] Dark mode support (if implemented)

## Development Guidelines

### Component Creation
1. Start with accessibility requirements
2. Implement keyboard navigation
3. Add proper ARIA attributes
4. Test with screen readers
5. Verify touch target sizes
6. Add comprehensive tests

### Code Standards
```tsx
// Good: Accessible component
export function AccessibleButton({ children, ...props }) {
  return (
    <button
      className="focus-visible-ring touch-target"
      {...props}
    >
      {children}
    </button>
  );
}

// Bad: Missing accessibility features
export function Button({ children, ...props }) {
  return <div onClick={props.onClick}>{children}</div>;
}
```

### CSS Utilities
Use provided accessibility utilities:
```css
/* Focus management */
.focus-visible-ring
.focus-ring-inset
.focus-ring-thick

/* Touch targets */
.touch-target
.mobile-tap-target

/* Screen readers */
.sr-only
.sr-only-focusable
.visually-hidden

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled */
}
```

## Deployment

### CI/CD Pipeline
1. Accessibility tests must pass
2. Lighthouse audits meet thresholds
3. Performance budgets enforced
4. Cross-browser testing

### Monitoring
- Core Web Vitals tracking
- Accessibility compliance monitoring
- User experience metrics
- Error tracking

## Resources

### Documentation
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Core Web Vitals](https://web.dev/vitals/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)

### Support
For questions about the UI/UX system:
1. Check this documentation
2. Review component tests
3. Consult accessibility guidelines
4. Test with real users

## Conclusion

This UI/UX system provides a solid foundation for building accessible, performant, and user-friendly interfaces. All components are thoroughly tested and follow established accessibility standards.

Remember: Accessibility is not optional—it's a requirement for inclusive design.