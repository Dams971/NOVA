'use client';

import { motion } from 'framer-motion';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Facebook,
  Shield,
  FileText,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'À propos', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ];

  const legalLinks = [
    { label: 'Mentions légales', href: '#legal' },
    { label: 'Confidentialité', href: '#privacy' },
    { label: 'CGU', href: '#terms' }
  ];

  const socialLinks = [
    { icon: Linkedin, href: 'https://linkedin.com/company/nova-dental', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com/nova_dental', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com/nova.dental', label: 'Facebook' }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter subscription');
    // Logique d'inscription à la newsletter
  };

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="bg-nova-blue-dark text-white">
      <div className="container-custom">
        {/* Section principale - Design naturel */}
        <div className="py-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Nova - Branding */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-nova-blue" />
              </div>
              <span className="text-2xl font-heading font-bold">Nova</span>
            </div>

            <p className="text-white/80 mb-6 leading-relaxed">
              L'IA révolutionnaire qui transforme la gestion des rendez-vous dentaires.
              Automatisation intelligente, disponibilité 24/7, et réduction drastique des no-show.
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <a href="tel:+33123456789" className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors group">
                <Phone className="w-5 h-5 text-yellow-400" />
                <span>01 23 45 67 89</span>
              </a>
              <a href="mailto:contact@nova-dental.fr" className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors group">
                <Mail className="w-5 h-5 text-yellow-400" />
                <span>contact@nova-dental.fr</span>
              </a>
              <div className="flex items-center space-x-3 text-white/80">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <span>Paris, France</span>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-heading font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleLinkClick(link.href)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-heading font-semibold mb-4">Newsletter</h3>
            <p className="text-white/80 text-sm mb-4">
              Recevez nos dernières actualités et conseils d'experts.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/20"></div>

        {/* Footer bottom - Simple et naturel */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
            <span>© {currentYear} Nova. Tous droits réservés.</span>
            {legalLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleLinkClick(link.href)}
                className="hover:text-white/80 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-6 text-sm text-white/60">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Certifié RGPD</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Service opérationnel</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
