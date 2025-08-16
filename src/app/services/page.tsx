import '../globals.css';
import '../../styles/nova-design-system.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services & Tarifs - NOVA Santé Dentaire',
  description: 'Découvrez nos services dentaires complets : soins généraux, urgences, esthétique, chirurgie. Tarifs transparents et prise en charge assurance.',
};

export default function ServicesPage() {
  const services = [
    {
      category: 'Soins Généraux',
      icon: '🦷',
      color: '#E8F4FD',
      borderColor: '#107ACA',
      items: [
        {
          name: 'Consultation',
          description: 'Examen complet et diagnostic',
          price: '3000 DA',
          duration: '30 min',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Détartrage',
          description: 'Nettoyage professionnel des dents',
          price: '4000 DA',
          duration: '45 min',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Traitement de carie',
          description: 'Obturation composite',
          price: '5000-8000 DA',
          duration: '1h',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Dévitalisation',
          description: 'Traitement endodontique',
          price: '12000-15000 DA',
          duration: '1h30',
          coverage: 'Remboursé 70%'
        }
      ]
    },
    {
      category: 'Esthétique Dentaire',
      icon: '✨',
      color: '#F5FAFE',
      borderColor: '#FFB951',
      items: [
        {
          name: 'Blanchiment dentaire',
          description: 'Éclaircissement professionnel',
          price: '25000 DA',
          duration: '1h30',
          coverage: 'Non remboursé'
        },
        {
          name: 'Facettes céramique',
          description: 'Par dent',
          price: '35000 DA',
          duration: '2 séances',
          coverage: 'Non remboursé'
        },
        {
          name: 'Alignement invisible',
          description: 'Traitement complet Invisalign',
          price: '250000 DA',
          duration: '12-18 mois',
          coverage: 'Partiellement remboursé'
        },
        {
          name: 'Couronne céramique',
          description: 'Restauration complète',
          price: '30000 DA',
          duration: '2 séances',
          coverage: 'Remboursé 70%'
        }
      ]
    },
    {
      category: 'Chirurgie Dentaire',
      icon: '🔧',
      color: '#ECFDF5',
      borderColor: '#00C896',
      items: [
        {
          name: 'Extraction simple',
          description: 'Dent de lait ou mobile',
          price: '3000 DA',
          duration: '30 min',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Extraction chirurgicale',
          description: 'Dent de sagesse incluse',
          price: '15000 DA',
          duration: '1h',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Implant dentaire',
          description: 'Pose d\'implant titane',
          price: '80000 DA',
          duration: '3 mois',
          coverage: 'Non remboursé'
        },
        {
          name: 'Greffe osseuse',
          description: 'Augmentation osseuse',
          price: '40000 DA',
          duration: '2h',
          coverage: 'Non remboursé'
        }
      ]
    },
    {
      category: 'Urgences',
      icon: '🚨',
      color: '#FEF2F2',
      borderColor: '#DC2626',
      items: [
        {
          name: 'Consultation urgence',
          description: 'Disponible 24/7',
          price: '5000 DA',
          duration: 'Immédiat',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Traitement douleur',
          description: 'Soulagement immédiat',
          price: '4000 DA',
          duration: '30 min',
          coverage: 'Remboursé 70%'
        },
        {
          name: 'Réparation prothèse',
          description: 'Réparation express',
          price: '8000 DA',
          duration: '1h',
          coverage: 'Remboursé 50%'
        },
        {
          name: 'Antibiotiques',
          description: 'Prescription et suivi',
          price: '2000 DA',
          duration: '15 min',
          coverage: 'Remboursé 65%'
        }
      ]
    }
  ];

  const insurances = [
    { name: 'CNAS', logo: '🏥', coverage: 'Taux de base 70%' },
    { name: 'CASNOS', logo: '🏪', coverage: 'Taux de base 70%' },
    { name: 'Mutuelles', logo: '🤝', coverage: 'Complémentaire jusqu\'à 100%' },
    { name: 'International', logo: '🌍', coverage: 'Selon contrat' }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* Header */}
      <header className="header-nova sticky top-0 z-50">
        <div className="container-nova">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--nova-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V12C2 16.5 4.5 20.74 8.5 22.5L12 24L15.5 22.5C19.5 20.74 22 16.5 22 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M12 8V16M8 12H16" stroke="#107ACA" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                  NOVA
                </div>
                <div className="text-xs" style={{ color: 'var(--nova-text-muted)' }}>
                  Santé dentaire
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Accueil
              </Link>
              <Link href="/cabinets" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Cabinets
              </Link>
              <Link href="/services" className="text-[15px] font-medium" style={{ color: 'var(--nova-primary)' }}>
                Services
              </Link>
              <Link href="/urgences" className="text-[15px] font-medium text-[var(--nova-urgent)]">
                Urgences
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/rdv" className="btn-nova-primary">
                Prendre rendez-vous
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-nova pt-20 pb-16">
        <div className="container-nova">
          <div className="max-w-3xl">
            <h1 className="mb-6" style={{ fontSize: 'var(--text-hero)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)', lineHeight: '1.1' }}>
              Services & Tarifs
            </h1>
            <p className="mb-8 text-lg" style={{ color: 'var(--nova-text-secondary)', lineHeight: '1.7' }}>
              Des soins dentaires complets avec une tarification transparente. 
              Tous nos tarifs sont affichés clairement et nous acceptons les principales assurances.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span style={{ color: 'var(--nova-text-secondary)' }}>Devis gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                <span style={{ color: 'var(--nova-text-secondary)' }}>Paiement échelonné</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                <span style={{ color: 'var(--nova-text-secondary)' }}>Tiers payant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-nova">
          {services.map((category, idx) => (
            <div key={idx} className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" 
                     style={{ background: category.color, border: `2px solid ${category.borderColor}` }}>
                  {category.icon}
                </div>
                <h2 style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                  {category.category}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {category.items.map((service, serviceIdx) => (
                  <div key={serviceIdx} className="card-nova hover:border-[var(--nova-primary)]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1" style={{ fontSize: '18px', color: 'var(--nova-text-primary)' }}>
                          {service.name}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                          {service.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold" style={{ fontSize: '20px', color: 'var(--nova-primary)' }}>
                          {service.price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: 'var(--nova-border)' }}>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#64748B" strokeWidth="1.5"/>
                          <path d="M8 4v4l2.5 2.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                          {service.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge-nova ${service.coverage.includes('Non') ? 'badge-nova-urgent' : 'badge-nova-success'}`}>
                          {service.coverage}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Insurance Section */}
      <section className="py-16" style={{ background: 'white' }}>
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Assurances acceptées
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Nous travaillons avec les principales caisses d'assurance pour faciliter vos remboursements
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {insurances.map((insurance, idx) => (
              <div key={idx} className="text-center card-nova">
                <div className="text-4xl mb-3">{insurance.logo}</div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--nova-text-primary)' }}>
                  {insurance.name}
                </h3>
                <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  {insurance.coverage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16">
        <div className="container-nova">
          <div className="card-nova max-w-4xl mx-auto" style={{ background: 'var(--nova-primary-lighter)' }}>
            <h3 className="text-center mb-8" style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
              Options de paiement flexibles
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" 
                     style={{ background: 'var(--nova-primary)', color: 'white' }}>
                  1
                </div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--nova-text-primary)' }}>
                  Paiement comptant
                </h4>
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                  Espèces, carte bancaire ou chèque
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" 
                     style={{ background: 'var(--nova-primary)', color: 'white' }}>
                  2
                </div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--nova-text-primary)' }}>
                  Paiement échelonné
                </h4>
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                  Jusqu'à 6 mois sans frais
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" 
                     style={{ background: 'var(--nova-primary)', color: 'white' }}>
                  3
                </div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--nova-text-primary)' }}>
                  Tiers payant
                </h4>
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                  Paiement direct assurance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container-nova">
          <div className="text-center">
            <h3 className="mb-4" style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
              Besoin d'un devis personnalisé ?
            </h3>
            <p className="mb-8 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
              Nos praticiens établissent des devis détaillés et gratuits lors de votre consultation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/rdv" className="btn-nova-primary text-lg px-8 py-4">
                Prendre rendez-vous
              </Link>
              <Link href="/contact" className="btn-nova-secondary text-lg px-8 py-4">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-nova">
        <div className="container-nova">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-white">À propos</h4>
              <ul className="space-y-2">
                <li><Link href="/qui-sommes-nous" className="text-sm">Qui sommes-nous</Link></li>
                <li><Link href="/presse" className="text-sm">Presse</Link></li>
                <li><Link href="/carrieres" className="text-sm">Carrières</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Patients</h4>
              <ul className="space-y-2">
                <li><Link href="/rdv" className="text-sm">Prendre RDV</Link></li>
                <li><Link href="/urgences" className="text-sm">Urgences</Link></li>
                <li><Link href="/services" className="text-sm">Services & Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Praticiens</h4>
              <ul className="space-y-2">
                <li><Link href="/espace-pro" className="text-sm">Espace Pro</Link></li>
                <li><Link href="/devenir-partenaire" className="text-sm">Devenir partenaire</Link></li>
                <li><Link href="/logiciel-cabinet" className="text-sm">Logiciel cabinet</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-2">
                <li className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  📞 +213 555 000 000
                </li>
                <li className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  ✉️ contact@nova-sante.dz
                </li>
                <li className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  📍 Alger, Algérie
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
              © 2025 NOVA - Tous droits réservés
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/mentions-legales" className="text-sm">Mentions légales</Link>
              <Link href="/confidentialite" className="text-sm">Confidentialité</Link>
              <Link href="/cgv" className="text-sm">CGV</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}