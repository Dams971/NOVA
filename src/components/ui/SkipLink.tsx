'use client';

import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SkipLink component provides a way for keyboard users to skip to main content.
 * This is especially important for users who navigate with keyboards or screen readers,
 * allowing them to bypass repetitive navigation elements.
 */
export default function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        skip-link
        absolute -top-10 left-4 z-50
        bg-blue-600 text-white px-4 py-2 rounded-md
        focus:top-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
        -translate-y-full focus:translate-y-0
        ${className}
      `}
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
  }>;
  className?: string;
}

export function SkipLinks({ links, className = '' }: SkipLinksProps) {
  return (
    <nav aria-label="Liens de navigation rapide" className={`skip-links ${className}`}>
      {links.map((link, index) => (
        <SkipLink key={index} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
}
