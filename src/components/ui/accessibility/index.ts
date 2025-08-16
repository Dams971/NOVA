/**
 * Accessibility Components - NOVA Healthcare Design System
 * 
 * Collection of accessibility-focused components for WCAG 2.2 AA compliance
 * and NHS Digital accessibility standards.
 */

// Enhanced Focus Trap (from existing component)
export { default as FocusTrap } from '../FocusTrap'

// Enhanced Skip Links (from enhanced component)
export { default as SkipLink, SkipLinks, MedicalSkipLinks } from '../SkipLink'

// Live Regions and ARIA Helpers
export {
  AriaLiveRegion,
  MedicalAnnouncer,
  KeyboardNavigation,
  MedicalFieldDescription,
  EmergencyAnnouncer,
  ScreenReaderOnly,
  useFocusAnnouncement,
  useAriaExpanded,
  useAriaSelected,
  useAriaIds,
  announceMedical,
  announceFormError,
  announceFormSuccess
} from './AriaHelpers'

// Keyboard Shortcuts and Navigation
export {
  KeyboardShortcuts,
  KeyboardNavigation as KeyboardNavigationAdvanced,
  MedicalKeyboardShortcutsProvider,
  useMedicalKeyboardShortcuts,
  type KeyboardShortcut
} from './KeyboardShortcuts'

// Existing Accessibility Components
export { default as LiveRegion } from '../LiveRegion'
export { default as VisuallyHidden } from '../VisuallyHidden'
export { Announcer } from '../Announcer'