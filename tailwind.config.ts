import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ==================== DESIGN TOKENS INTEGRATION ====================
      
      // Colors using CSS custom properties for dark mode support
      colors: {
        // Medical Emergency Colors
        emergency: {
          critical: 'rgb(var(--color-emergency-critical) / <alpha-value>)',
          urgent: 'rgb(var(--color-emergency-urgent) / <alpha-value>)',
          moderate: 'rgb(var(--color-emergency-moderate) / <alpha-value>)',
          low: 'rgb(var(--color-emergency-low) / <alpha-value>)',
        },
        
        // Medical Status Colors
        status: {
          healthy: 'rgb(var(--color-status-healthy) / <alpha-value>)',
          pending: 'rgb(var(--color-status-pending) / <alpha-value>)',
          completed: 'rgb(var(--color-status-completed) / <alpha-value>)',
          cancelled: 'rgb(var(--color-status-cancelled) / <alpha-value>)',
          'no-show': 'rgb(var(--color-status-no-show) / <alpha-value>)',
        },
        
        // Medical Trust Colors
        trust: {
          primary: 'rgb(var(--color-trust-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-trust-secondary) / <alpha-value>)',
          accent: 'rgb(var(--color-trust-accent) / <alpha-value>)',
        },
        
        // Medical Chart Colors
        chart: {
          positive: 'rgb(var(--color-chart-positive) / <alpha-value>)',
          negative: 'rgb(var(--color-chart-negative) / <alpha-value>)',
          neutral: 'rgb(var(--color-chart-neutral) / <alpha-value>)',
          bg: 'rgb(var(--color-chart-bg) / <alpha-value>)',
        },
        
        // Medical Form States
        form: {
          required: 'rgb(var(--color-form-required) / <alpha-value>)',
          optional: 'rgb(var(--color-form-optional) / <alpha-value>)',
          valid: 'rgb(var(--color-form-valid) / <alpha-value>)',
          invalid: 'rgb(var(--color-form-invalid) / <alpha-value>)',
          disabled: 'rgb(var(--color-form-disabled) / <alpha-value>)',
        },
        // NOVA Brand Colors (using RGB space for opacity support)
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary-600) / <alpha-value>)',
          foreground: 'rgb(var(--color-white) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          950: 'rgb(var(--color-secondary-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          foreground: 'rgb(var(--color-white) / <alpha-value>)',
        },
        success: {
          50: 'rgb(var(--color-success-50) / <alpha-value>)',
          100: 'rgb(var(--color-success-100) / <alpha-value>)',
          200: 'rgb(var(--color-success-200) / <alpha-value>)',
          300: 'rgb(var(--color-success-300) / <alpha-value>)',
          400: 'rgb(var(--color-success-400) / <alpha-value>)',
          500: 'rgb(var(--color-success-500) / <alpha-value>)',
          600: 'rgb(var(--color-success-600) / <alpha-value>)',
          700: 'rgb(var(--color-success-700) / <alpha-value>)',
          800: 'rgb(var(--color-success-800) / <alpha-value>)',
          900: 'rgb(var(--color-success-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-success-600) / <alpha-value>)',
          foreground: 'rgb(var(--color-white) / <alpha-value>)',
        },
        warning: {
          50: 'rgb(var(--color-warning-50) / <alpha-value>)',
          100: 'rgb(var(--color-warning-100) / <alpha-value>)',
          200: 'rgb(var(--color-warning-200) / <alpha-value>)',
          300: 'rgb(var(--color-warning-300) / <alpha-value>)',
          400: 'rgb(var(--color-warning-400) / <alpha-value>)',
          500: 'rgb(var(--color-warning-500) / <alpha-value>)',
          600: 'rgb(var(--color-warning-600) / <alpha-value>)',
          700: 'rgb(var(--color-warning-700) / <alpha-value>)',
          800: 'rgb(var(--color-warning-800) / <alpha-value>)',
          900: 'rgb(var(--color-warning-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-warning-600) / <alpha-value>)',
          foreground: 'rgb(var(--color-white) / <alpha-value>)',
        },
        error: {
          50: 'rgb(var(--color-error-50) / <alpha-value>)',
          100: 'rgb(var(--color-error-100) / <alpha-value>)',
          200: 'rgb(var(--color-error-200) / <alpha-value>)',
          300: 'rgb(var(--color-error-300) / <alpha-value>)',
          400: 'rgb(var(--color-error-400) / <alpha-value>)',
          500: 'rgb(var(--color-error-500) / <alpha-value>)',
          600: 'rgb(var(--color-error-600) / <alpha-value>)',
          700: 'rgb(var(--color-error-700) / <alpha-value>)',
          800: 'rgb(var(--color-error-800) / <alpha-value>)',
          900: 'rgb(var(--color-error-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-error-600) / <alpha-value>)',
          foreground: 'rgb(var(--color-white) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        },
        neutral: {
          50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
          600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
          700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
          800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
          900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
          950: 'rgb(var(--color-neutral-950) / <alpha-value>)',
        },
        
        // Semantic Colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },

      // ==================== FLUID TYPOGRAPHY ====================
      
      fontSize: {
        'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-tight)' }],
        'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-snug)' }],
        'base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
        'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-normal)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
      },

      // Font families from design tokens
      fontFamily: {
        heading: 'var(--font-family-heading)',
        body: 'var(--font-family-body)',
        mono: 'var(--font-family-mono)',
        sans: 'var(--font-family-body)',
      },

      // Font weights
      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)',
      },

      // Line heights
      lineHeight: {
        tight: 'var(--line-height-tight)',
        snug: 'var(--line-height-snug)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
        loose: 'var(--line-height-loose)',
      },

      // Letter spacing
      letterSpacing: {
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
      },

      // ==================== SPACING & LAYOUT ====================
      
      spacing: {
        // Design token spacing
        '0': 'var(--spacing-0)',
        'px': 'var(--spacing-px)',
        '0.5': 'var(--spacing-0-5)',
        '1': 'var(--spacing-1)',
        '1.5': 'var(--spacing-1-5)',
        '2': 'var(--spacing-2)',
        '2.5': 'var(--spacing-2-5)',
        '3': 'var(--spacing-3)',
        '3.5': 'var(--spacing-3-5)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '7': 'var(--spacing-7)',
        '8': 'var(--spacing-8)',
        '9': 'var(--spacing-9)',
        '10': 'var(--spacing-10)',
        '11': 'var(--spacing-11)',
        '12': 'var(--spacing-12)',
        '14': 'var(--spacing-14)',
        '16': 'var(--spacing-16)',
        '20': 'var(--spacing-20)',
        '24': 'var(--spacing-24)',
        '28': 'var(--spacing-28)',
        '32': 'var(--spacing-32)',
        '36': 'var(--spacing-36)',
        '40': 'var(--spacing-40)',
        '44': 'var(--spacing-44)',
        '48': 'var(--spacing-48)',
        '52': 'var(--spacing-52)',
        '56': 'var(--spacing-56)',
        '60': 'var(--spacing-60)',
        '64': 'var(--spacing-64)',
        '72': 'var(--spacing-72)',
        '80': 'var(--spacing-80)',
        '96': 'var(--spacing-96)',
        
        // Medical spacing
        'medical-field-gap': 'var(--spacing-medical-field-gap)',
        'medical-group-gap': 'var(--spacing-medical-group-gap)',
        'medical-section-gap': 'var(--spacing-medical-section-gap)',
        'medical-card-padding': 'var(--spacing-medical-card-padding)',
        'medical-card-gap': 'var(--spacing-medical-card-gap)',
        'medical-widget-gap': 'var(--spacing-medical-widget-gap)',
        'medical-content-margin': 'var(--spacing-medical-content-margin)',
        'emergency-padding': 'var(--spacing-emergency-padding)',
        'emergency-margin': 'var(--spacing-emergency-margin)',
        
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // Touch targets and minimum sizes
      minHeight: {
        'touch': 'var(--touch-target-min)',
        'touch-ios': 'var(--touch-target-ios)',
        'touch-android': 'var(--touch-target-android)',
        'medical': 'var(--touch-target-medical)',
        'medical-large': 'var(--touch-target-medical-large)',
        'medical-emergency': 'var(--touch-target-medical-emergency)',
        'dvh': '100dvh',
        'svh': '100svh',
        'lvh': '100lvh',
      },
      minWidth: {
        'touch': 'var(--touch-target-min)',
        'touch-ios': 'var(--touch-target-ios)',
        'touch-android': 'var(--touch-target-android)',
        'medical': 'var(--touch-target-medical)',
        'medical-large': 'var(--touch-target-medical-large)',
        'medical-emergency': 'var(--touch-target-medical-emergency)',
      },
      
      // Medical-specific heights
      height: {
        'medical-input': 'var(--height-medical-input)',
        'medical-select': 'var(--height-medical-select)',
        'medical-button': 'var(--height-medical-button)',
        'medical-button-large': 'var(--height-medical-button-large)',
        'medical-table-row': 'var(--height-medical-table-row)',
        'medical-table-header': 'var(--height-medical-table-header)',
        'dvh': '100dvh',
        'svh': '100svh',
        'lvh': '100lvh',
      },
      
      // Medical card dimensions
      width: {
        'medical-card-min': 'var(--width-medical-card-min)',
        'medical-card-max': 'var(--width-medical-card-max)',
      },

      // ==================== BORDER RADIUS ====================
      
      borderRadius: {
        'none': 'var(--border-radius-none)',
        'sm': 'var(--border-radius-sm)',
        'DEFAULT': 'var(--border-radius-base)',
        'md': 'var(--border-radius-md)',
        'lg': 'var(--border-radius-lg)',
        'xl': 'var(--border-radius-xl)',
        '2xl': 'var(--border-radius-2xl)',
        '3xl': 'var(--border-radius-3xl)',
        'full': 'var(--border-radius-full)',
        
        // Medical border radius
        'medical-small': 'var(--border-radius-medical-small)',
        'medical-medium': 'var(--border-radius-medical-medium)',
        'medical-large': 'var(--border-radius-medical-large)',
        'medical-round': 'var(--border-radius-medical-round)',
      },

      // ==================== SHADOWS ====================
      
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-base)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
        'none': 'var(--shadow-none)',
        
        // Brand shadows
        'primary': 'var(--shadow-primary)',
        'secondary': 'var(--shadow-secondary)',
        'success': 'var(--shadow-success)',
        'error': 'var(--shadow-error)',
        
        // Medical shadows
        'medical-subtle': 'var(--shadow-medical-subtle)',
        'medical-card': 'var(--shadow-medical-card)',
        'medical-elevated': 'var(--shadow-medical-elevated)',
        'medical-modal': 'var(--shadow-medical-modal)',
        'medical-success': 'var(--shadow-medical-success)',
        'medical-warning': 'var(--shadow-medical-warning)',
        'medical-error': 'var(--shadow-medical-error)',
        'medical-info': 'var(--shadow-medical-info)',
      },

      // ==================== TRANSITIONS ====================
      
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'DEFAULT': 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
        'slower': 'var(--transition-slower)',
      },

      transitionTimingFunction: {
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },

      // ==================== ACCESSIBILITY ====================
      
      // Focus ring styles
      ringWidth: {
        'DEFAULT': 'var(--focus-ring-width)',
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },
      ringOffsetWidth: {
        'DEFAULT': 'var(--focus-ring-offset)',
        '0': '0',
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
      },

      // ==================== Z-INDEX ====================
      
      zIndex: {
        'auto': 'var(--z-index-auto)',
        '0': 'var(--z-index-0)',
        '10': 'var(--z-index-10)',
        '20': 'var(--z-index-20)',
        '30': 'var(--z-index-30)',
        '40': 'var(--z-index-40)',
        '50': 'var(--z-index-50)',
        'dropdown': 'var(--z-index-dropdown)',
        'sticky': 'var(--z-index-sticky)',
        'modal': 'var(--z-index-modal)',
        'popover': 'var(--z-index-popover)',
        'tooltip': 'var(--z-index-tooltip)',
        'notification': 'var(--z-index-notification)',
      },

      // ==================== ANIMATIONS ====================
      
      animation: {
        'fade-in': 'fadeIn var(--motion-duration-short) ease-out',
        'slide-up': 'slideUp var(--motion-duration-medium) ease-out',
        'slide-down': 'slideDown var(--motion-duration-medium) ease-out',
        'slide-left': 'slideLeft var(--motion-duration-medium) ease-out',
        'slide-right': 'slideRight var(--motion-duration-medium) ease-out',
        'scale-up': 'scaleUp var(--motion-duration-short) ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        
        // Medical animations
        'medical-pulse': 'medical-pulse var(--motion-emergency-pulse)',
        'medical-spin': 'spin 1s linear infinite',
        'medical-shimmer': 'shimmer 2s linear infinite',
      },

      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          'from': { transform: 'translateY(-20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          'from': { transform: 'translateX(20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          'from': { transform: 'translateX(-20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleUp: {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          'from': { backgroundPosition: '-200% 0' },
          'to': { backgroundPosition: '200% 0' },
        },
      },

      // ==================== CONTAINER QUERIES ====================
      
      containers: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
    // Custom plugin for accessibility and medical utilities
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        '.touch-target': {
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.medical-touch-target': {
          minHeight: theme('minHeight.medical'),
          minWidth: theme('minWidth.medical'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme('spacing.2'),
        },
        '.medical-touch-target-large': {
          minHeight: theme('minHeight.medical-large'),
          minWidth: theme('minWidth.medical-large'),
          padding: theme('spacing.3'),
        },
        '.emergency-touch-target': {
          minHeight: theme('minHeight.medical-emergency'),
          minWidth: theme('minWidth.medical-emergency'),
          padding: theme('spacing.4'),
        },
        '.focus-visible-ring': {
          '&:focus-visible': {
            outline: `${theme('ringWidth.DEFAULT')} solid ${theme('colors.ring')}`,
            outlineOffset: theme('ringOffsetWidth.DEFAULT'),
            borderRadius: theme('borderRadius.sm'),
          },
        },
        '.medical-focus': {
          '&:focus-visible': {
            outline: '3px solid rgb(var(--color-trust-primary))',
            outlineOffset: '2px',
            borderRadius: theme('borderRadius.medical-small'),
          },
        },
        '.emergency-focus': {
          '&:focus-visible': {
            outline: '4px solid rgb(var(--color-emergency-critical))',
            outlineOffset: '2px',
            boxShadow: '0 0 0 4px rgb(var(--color-emergency-critical) / 0.2)',
          },
        },
        '.skip-to-content': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme('colors.background'),
          color: theme('colors.foreground'),
          padding: '8px',
          textDecoration: 'none',
          borderRadius: theme('borderRadius.md'),
          border: `2px solid ${theme('colors.border')}`,
          zIndex: theme('zIndex.notification'),
          '&:focus': {
            top: '6px',
          },
        },
        '.medical-card': {
          background: 'rgb(var(--color-background))',
          border: '1px solid rgb(var(--color-border))',
          borderRadius: theme('borderRadius.medical-medium'),
          padding: 'var(--spacing-medical-card-padding)',
          boxShadow: theme('boxShadow.medical-card'),
          transition: `box-shadow ${theme('transitionDuration.DEFAULT')} ${theme('transitionTimingFunction.out')}`,
        },
        '.medical-button': {
          height: theme('height.medical-button'),
          minWidth: theme('minWidth.medical'),
          padding: `0 ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.medical-small'),
          fontSize: 'var(--font-size-medical-value)',
          fontWeight: theme('fontWeight.medium'),
          transition: `all ${theme('transitionDuration.DEFAULT')} ${theme('transitionTimingFunction.out')}`,
          border: '1px solid transparent',
        },
        '.medical-input': {
          height: theme('height.medical-input'),
          padding: `0 ${theme('spacing.3')}`,
          border: '1px solid rgb(var(--color-border))',
          borderRadius: theme('borderRadius.medical-small'),
          fontSize: 'var(--font-size-medical-value)',
          transition: `border-color ${theme('transitionDuration.DEFAULT')} ${theme('transitionTimingFunction.out')}`,
          backgroundColor: 'rgb(var(--color-input))',
        },
        '.medical-skeleton': {
          background: 'linear-gradient(90deg, rgb(var(--color-muted)) 0%, rgb(var(--color-muted) / 0.8) 50%, rgb(var(--color-muted)) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite linear',
          borderRadius: theme('borderRadius.medical-small'),
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

export default config