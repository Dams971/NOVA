'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, Phone, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Détecter si on est sur la homepage ou une page dédiée
  const isHomepage = pathname === '/';

  // Effet de transparence au scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu mobile lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { label: 'Nos Cabinets', href: '/cabinets' },
    { label: 'Services & Tarifs', href: '/services' },
    { label: 'International', href: '/international' },
    { label: 'Urgences', href: '/urgences' },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);

    if (href.startsWith('#')) {
      // Scroll fluide vers la section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      // Navigation vers une autre page
      window.location.href = href;
    }
  };

  const handleCTAClick = () => {
    // Redirection vers l'interface moderne de prise de rendez-vous
    window.location.href = '/rdv';
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHomepage
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <nav className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo Nova */}
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <div className="w-10 h-10 bg-nova-blue rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-heading font-bold ${
                isScrolled || !isHomepage ? 'text-nova-blue' : 'text-white'
              }`}>
                Nova
              </span>
            </motion.div>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className={`font-medium transition-colors duration-200 hover:text-nova-blue ${
                    isScrolled || !isHomepage ? 'text-gray-700' : 'text-white/90'
                  }`}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>

            {/* CTA et menu mobile */}
            <div className="flex items-center space-x-4">
              {/* CTA Desktop */}
              <motion.button
                onClick={handleCTAClick}
                className="hidden md:block btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Prendre RDV
              </motion.button>

              {/* Bouton menu mobile */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  isScrolled || !isHomepage
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Menu mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu content */}
            <motion.div
              className="absolute top-20 left-0 right-0 bg-white shadow-xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="container-custom py-6">
                {/* Navigation mobile */}
                <div className="space-y-4 mb-6">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item.label}
                      onClick={() => handleNavClick(item.href)}
                      className="block w-full text-left py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 hover:text-nova-blue rounded-lg transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </div>

                {/* CTA mobile */}
                <motion.button
                  onClick={handleCTAClick}
                  className="w-full btn-primary justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Prendre RDV
                </motion.button>

                {/* Contact rapide mobile */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3 font-medium">Urgences dentaires</p>
                  <div className="flex space-x-4">
                    <a
                      href="tel:+33123456789"
                      className="flex items-center space-x-2 text-nova-blue hover:text-nova-blue-dark transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Urgences</span>
                    </a>
                    <a
                      href="mailto:urgences@nova-dental.fr"
                      className="flex items-center space-x-2 text-nova-blue hover:text-nova-blue-dark transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Contact</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
