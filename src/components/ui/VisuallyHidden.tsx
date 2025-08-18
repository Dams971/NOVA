'use client';

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

/**
 * VisuallyHidden component hides content visually while keeping it accessible to screen readers.
 * This is useful for providing additional context or labels that are not needed visually
 * but are important for accessibility.
 */
export default function VisuallyHidden({ 
  children, 
  as = 'span',
  className = '',
  ...props 
}: VisuallyHiddenProps & React.HTMLAttributes<HTMLElement>) {
  const Component = as as React.ElementType;
  
  return (
    <Component
      className={`sr-only ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
