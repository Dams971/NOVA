'use client';

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * VisuallyHidden component hides content visually while keeping it accessible to screen readers.
 * This is useful for providing additional context or labels that are not needed visually
 * but are important for accessibility.
 */
export default function VisuallyHidden({ 
  children, 
  as: Component = 'span',
  className = '',
  ...props 
}: VisuallyHiddenProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={`sr-only ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
