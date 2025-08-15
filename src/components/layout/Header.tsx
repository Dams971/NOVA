'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest('[data-mobile-menu]')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
    <header 
      className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Skip to main content link - WCAG 2.2 requirement */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   bg-blue-600 text-white px-4 py-2 rounded-md z-[100]
                   focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
      >
        Aller au contenu principal
      </a>
      
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Navigation principale">
          {/* Logo and brand */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          >
            <span className="text-2xl" role="img" aria-label="Dent">🦷</span>
            <span className="font-bold text-xl text-blue-600">NOVA</span>
          </Link>
          
          {/* Mobile menu button - 48dp touch target for Android/44pt for iOS */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 -mr-3 min-w-touch-ios min-h-touch-ios sm:min-w-touch-android sm:min-h-touch-android
                       hover:bg-gray-100 rounded-md transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-controls="mobile-menu"
            data-mobile-menu
          >
            {isMenuOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
          
          {/* Desktop navigation */}
          <ul className="hidden md:flex items-center space-x-6" role="list">
            <li>
              <Link 
                href="/rdv" 
                className="text-gray-700 hover:text-blue-600 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Prendre RDV
              </Link>
            </li>
            <li>
              <Link 
                href="/compte" 
                className="text-gray-700 hover:text-blue-600 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Mon compte
              </Link>
            </li>
            <li>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-blue-600 transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Mobile navigation - hidden by default, shown when menu is open */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden border-t border-gray-200 py-4 animate-slide-down"
            data-mobile-menu
          >
            <ul className="space-y-2" role="list">
              <li>
                <Link 
                  href="/rdv" 
                  className="block py-3 px-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded 
                            min-h-touch-ios sm:min-h-touch-android transition-colors
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Prendre RDV
                </Link>
              </li>
              <li>
                <Link 
                  href="/compte" 
                  className="block py-3 px-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded 
                            min-h-touch-ios sm:min-h-touch-android transition-colors
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon compte
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="block py-3 px-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded 
                            min-h-touch-ios sm:min-h-touch-android transition-colors
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}