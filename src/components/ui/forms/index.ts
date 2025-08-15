// Form components barrel export for easy importing
export { default as TextInput } from './TextInput';
export { default as TelInput } from './TelInput';
export { default as Button } from './Button';

// Re-export types
export type { ButtonProps } from './Button';

// Form utilities
export const formClasses = {
  input: `
    block w-full px-3 py-2 border rounded-md shadow-sm text-gray-900
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
    transition-colors duration-200
    min-h-touch-ios sm:min-h-touch-android
  `,
  label: `
    block text-sm font-medium text-gray-700 mb-2
  `,
  error: `
    flex items-start space-x-2 text-red-600 mt-2
  `,
  hint: `
    text-sm text-gray-500 mt-1
  `,
  required: `
    text-red-600 ml-1
  `,
} as const;

// Accessibility utilities
export const a11yProps = {
  skipLink: {
    className: 'skip-link',
    href: '#main-content',
    children: 'Aller au contenu principal',
  },
  landmark: (label: string) => ({
    role: 'region',
    'aria-label': label,
    className: 'landmark',
  }),
  visuallyHidden: {
    className: 'sr-only',
  },
} as const;