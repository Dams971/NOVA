// UI components barrel export
export * from './forms';
export { default as Header } from '../layout/Header';
export { default as DatePicker } from './calendar/DatePicker';
export * from './Skeleton';

// Nova Design System components
import { ButtonMedical as ButtonMedicalComponent, buttonVariants as buttonVariantsExport } from './nova/ButtonMedical';
import type { ButtonMedicalProps as ButtonMedicalPropsType } from './nova/ButtonMedical';

export const ButtonMedical = ButtonMedicalComponent;
export const buttonVariants = buttonVariantsExport;
export type ButtonMedicalProps = ButtonMedicalPropsType;

// Utility components - Named exports
export { ErrorMessage, FieldError, FormError } from './ErrorMessage';
export { default as FocusTrap } from './FocusTrap';
export { default as LiveRegion } from './LiveRegion';
export { LoadingSpinner, LoadingOverlay, LoadingButton } from './LoadingSpinner';
// Chat-specific loading components
export { LoadingSpinner as ChatLoadingSpinner, TypingIndicator, MessageSkeleton, ConnectionIndicator, ProgressBar, PulsingDot } from './loading-spinner';
export { default as SkipLink } from './SkipLink';
export { default as SuccessMessage } from './SuccessMessage';
export { default as VisuallyHidden } from './VisuallyHidden';