import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-medical-small font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-touch",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600",
        secondary: "bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-600",
        outline: "border-2 border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900",
        ghost: "hover:bg-neutral-50 text-neutral-700",
        destructive: "bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-600",
        warning: "bg-warning-600 text-white hover:bg-warning-700 focus-visible:ring-warning-600",
        success: "bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-600",
        emergency: "bg-emergency-critical text-white hover:bg-red-700 focus-visible:ring-emergency-critical shadow-medical-error border-2 border-emergency-critical/20",
        trust: "bg-trust-primary text-white hover:bg-blue-800 focus-visible:ring-trust-primary",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-medical-button px-4 text-base",
        lg: "h-14 px-6 text-lg",
        xl: "h-16 px-8 text-xl", // Pour CTA principaux
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonMedicalProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const ButtonMedical = forwardRef<HTMLButtonElement, ButtonMedicalProps>(
  ({ className, variant, size, leftIcon, rightIcon, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

ButtonMedical.displayName = "ButtonMedical";

export { ButtonMedical, buttonVariants };