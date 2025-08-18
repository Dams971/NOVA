import { VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, ReactNode } from 'react';

export declare const buttonVariants: any;

export interface ButtonMedicalProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export declare const ButtonMedical: React.ForwardRefExoticComponent<
  ButtonMedicalProps & React.RefAttributes<HTMLButtonElement>
>;