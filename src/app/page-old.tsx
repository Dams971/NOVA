import type { Metadata } from 'next';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import Testimonials from '@/components/landing/Testimonials';
import CallToAction from '@/components/landing/CallToAction';
import Footer from '@/components/landing/Footer';
import { MedicalKeyboardShortcutsProvider } from '@/components/ui/accessibility';

export const metadata: Metadata = {
  title: 'Nova - Réseau Dentaire International | Excellence & Innovation',
  description: 'Découvrez Nova, le réseau dentaire international d\'excellence. 25+ cabinets dans le monde, soins de qualité supérieure, prise de RDV 24/7. Votre sourire, notre priorité.',
  keywords: 'dentaire, Nova, réseau international, soins dentaires, cabinet dentaire, rendez-vous, orthodontie, implants, blanchiment',
  openGraph: {
    title: 'Nova - Réseau Dentaire International',
    description: 'Excellence dentaire internationale. 25+ cabinets, service 24/7, soins de qualité supérieure.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Nova Dental Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nova - Réseau Dentaire International',
    description: 'Excellence dentaire internationale. 25+ cabinets, service 24/7.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

/**
 * Home Page - Nova Dental Network
 * Features:
 * - SEO optimized with proper metadata
 * - Accessible component structure
 * - Performance optimized
 * - Responsive design
 */
export default function HomePage() {
  return (
    <MedicalKeyboardShortcutsProvider>
      {/* Enhanced structured data for medical SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['Organization', 'MedicalOrganization'],
            name: 'Nova Dental Network',
            description: 'Réseau dentaire international d\'excellence - Soins dentaires certifiés',
            url: 'https://nova-dental.com',
            logo: 'https://nova-dental.com/logo.png',
            medicalSpecialty: 'Dentistry',
            availableService: [
              {
                '@type': 'MedicalProcedure',
                name: 'Consultation dentaire',
                description: 'Examen dentaire complet'
              },
              {
                '@type': 'MedicalProcedure', 
                name: 'Soins dentaires d\'urgence',
                description: 'Prise en charge immédiate 24h/24'
              }
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+213555000000',
              contactType: 'customer service',
              availableLanguage: ['French', 'English'],
              hoursAvailable: '24/7'
            },
            sameAs: [
              'https://www.facebook.com/novadental',
              'https://www.instagram.com/novadental',
              'https://www.linkedin.com/company/novadental',
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '2847',
              bestRating: '5'
            }
          }),
        }}
      />
      
      <main className="min-h-screen" id="main-content">
        <Navigation />
        <Hero />
        <Testimonials />
        <CallToAction />
        <Footer />
      </main>
    </MedicalKeyboardShortcutsProvider>
  );
}
