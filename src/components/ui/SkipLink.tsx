'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'emergency' | 'medical';
  className?: string;
}

/**
 * Enhanced SkipLink component for NOVA medical interface
 * Provides keyboard navigation shortcuts with medical-appropriate styling
 * Follows WCAG 2.2 AA guidelines and NHS Digital accessibility standards
 */
export default function SkipLink({ 
  href, 
  children, 
  variant = 'default',
  className 
}: SkipLinkProps) {
  const variants = {
    default: 'bg-trust-primary text-white focus:ring-trust-primary',
    emergency: 'bg-emergency-critical text-white focus:ring-emergency-critical animate-medical-pulse',
    medical: 'bg-trust-secondary text-white focus:ring-trust-secondary'
  };

  return (
    <a
      href={href}
      className={cn(
        // Base positioning and visibility
        'absolute -top-12 left-4 z-notification',
        'px-4 py-3 rounded-medical-medium font-medium text-sm',
        'transition-all duration-300 ease-out',
        'transform -translate-y-full opacity-0',
        
        // Focus states
        'focus:top-4 focus:translate-y-0 focus:opacity-100',
        'focus:outline-none focus:ring-4 focus:ring-offset-2',
        
        // Variant styling
        variants[variant],
        
        // Medical accessibility enhancements
        'shadow-medical-elevated',
        'min-h-medical touch-target',
        
        className
      )}
      // Announce to screen readers
      aria-label={`Aller directement à ${children}`}
    >
      {children}
    </a>
  );
}

// Component for multiple skip links
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
    variant?: 'default' | 'emergency' | 'medical';
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <nav aria-label="Liens de navigation rapide" className={cn('skip-links', className)}>
      {links.map((link, index) => (
        <SkipLink 
          key={index} 
          href={link.href}
          variant={link.variant}
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
}

// Medical-specific skip links for healthcare interfaces
export function MedicalSkipLinks({ className }: { className?: string }) {
  const medicalLinks = [
    { href: '#main-content', label: 'Contenu principal', variant: 'default' as const },
    { href: '#patient-info', label: 'Informations patient', variant: 'medical' as const },
    { href: '#appointments', label: 'Rendez-vous', variant: 'medical' as const },
    { href: '#emergency-contacts', label: 'Contacts d\'urgence', variant: 'emergency' as const },
    { href: '#navigation', label: 'Navigation principale', variant: 'default' as const },
  ];

  return <SkipLinks links={medicalLinks} className={className} />;
}
