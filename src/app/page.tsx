import './globals.css';
import '../styles/nova-design-system.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NOVA - Plateforme de santé dentaire en Algérie',
  description: 'Prenez rendez-vous avec les meilleurs dentistes. Consultations, urgences et téléconsultation disponibles 24/7.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* Header minimaliste style Doctolib */}
      <header className="header-nova sticky top-0 z-50">
        <div className="container-nova">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo simple et médical */}
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

            {/* Navigation simple */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/praticiens" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Praticiens
              </Link>
              <Link href="/cabinets" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Cabinets
              </Link>
              <Link href="/services" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Services
              </Link>
              <Link href="/urgences" className="text-[15px] font-medium text-[var(--nova-urgent)]">
                Urgences
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/connexion" className="hidden md:block text-[15px] font-medium px-4 py-2 hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Se connecter
              </Link>
              <Link href="/rdv" className="btn-nova-primary">
                Prendre rendez-vous
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Style Maiia mais mieux */}
      <section className="hero-nova pt-20 pb-24">
        <div className="container-nova">
          <div className="max-w-3xl">
            <h1 className="mb-6" style={{ fontSize: 'var(--text-hero)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)', lineHeight: '1.1' }}>
              Vos soins dentaires<br />
              <span style={{ color: 'var(--nova-primary)' }}>simplifiés</span>
            </h1>
            
            <p className="mb-8 text-lg" style={{ color: 'var(--nova-text-secondary)', lineHeight: '1.7' }}>
              Trouvez et réservez rapidement un rendez-vous avec un dentiste. 
              Plus de 500 praticiens disponibles partout en Algérie.
            </p>

            {/* Barre de recherche style Doctolib */}
            <div className="bg-white rounded-xl p-2 shadow-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Spécialité, praticien..."
                    className="input-nova"
                    style={{ border: 'none', paddingLeft: '44px' }}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 icon-medical" viewBox="0 0 20 20" fill="none">
                    <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Où ? (ville, adresse...)"
                    className="input-nova"
                    style={{ border: 'none', paddingLeft: '44px' }}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 icon-medical" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fill="currentColor" fillOpacity="0.3"/>
                  </svg>
                </div>

                <button className="btn-nova-primary px-8">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 17A8 8 0 109 1a8 8 0 000 16zM19 19l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Rechercher
                </button>
              </div>
            </div>

            {/* Tags de recherche rapide */}
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>Recherches fréquentes :</span>
              {['Détartrage', 'Carie', 'Implant', 'Orthodontie', 'Blanchiment'].map(term => (
                <button key={term} className="tag-specialty">
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Stats en ligne style Doctolib */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl">
            <div>
              <div className="stat-nova-value">500+</div>
              <div className="stat-nova-label">Praticiens</div>
            </div>
            <div>
              <div className="stat-nova-value">48h</div>
              <div className="stat-nova-label">Délai moyen</div>
            </div>
            <div>
              <div className="stat-nova-value">150K</div>
              <div className="stat-nova-label">Patients</div>
            </div>
            <div>
              <div className="stat-nova-value">4.8</div>
              <div className="stat-nova-label">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services - Style épuré Maiia */}
      <section className="py-20">
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Nos services dentaires
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Des soins complets pour toute la famille, de la prévention aux interventions spécialisées
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: '🦷',
                title: 'Soins généraux',
                description: 'Consultations, caries, détartrage',
                color: '#E8F4FD'
              },
              {
                icon: '🚨',
                title: 'Urgences',
                description: 'Disponible 24/7',
                color: '#FEF2F2'
              },
              {
                icon: '✨',
                title: 'Esthétique',
                description: 'Blanchiment, facettes',
                color: '#F5FAFE'
              },
              {
                icon: '🔧',
                title: 'Chirurgie',
                description: 'Implants, extractions',
                color: '#ECFDF5'
              }
            ].map((service, idx) => (
              <div key={idx} className="card-nova group cursor-pointer">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-2xl" style={{ background: service.color }}>
                  {service.icon}
                </div>
                <h3 className="font-semibold mb-2" style={{ fontSize: '17px', color: 'var(--nova-text-primary)' }}>
                  {service.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  {service.description}
                </p>
                <Link href="/services" className="inline-flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: 'var(--nova-primary)' }}>
                  En savoir plus
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche - Style Maiia */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Simple et rapide
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Prenez rendez-vous en quelques clics, sans création de compte
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Recherchez',
                description: 'Trouvez un praticien près de chez vous selon vos besoins'
              },
              {
                step: '2',
                title: 'Choisissez',
                description: 'Sélectionnez un créneau qui vous convient dans l&apos;agenda'
              },
              {
                step: '3',
                title: 'Confirmez',
                description: 'Validez votre RDV et recevez un SMS de rappel'
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold" 
                     style={{ background: 'var(--nova-primary-light)', color: 'var(--nova-primary)' }}>
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2" style={{ fontSize: '18px', color: 'var(--nova-text-primary)' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/rdv" className="btn-nova-primary text-lg px-8 py-4">
              Prendre rendez-vous maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Témoignages - Style épuré */}
      <section className="py-20">
        <div className="container-nova">
          <h2 className="text-center mb-12" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Ils nous font confiance
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Amira B.',
                location: 'Alger',
                comment: 'Service excellent, j&apos;ai trouvé un dentiste en urgence un dimanche. L&apos;interface est très simple à utiliser.',
                rating: 5
              },
              {
                name: 'Karim M.',
                location: 'Oran',
                comment: 'Plus besoin d&apos;appeler pour prendre RDV ! Je réserve en 2 minutes et je reçois un SMS de rappel.',
                rating: 5
              },
              {
                name: 'Sarah L.',
                location: 'Constantine',
                comment: 'Parfait pour gérer les RDV de toute la famille. Les praticiens sont professionnels et ponctuels.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="card-nova">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white" 
                       style={{ background: 'var(--nova-primary)' }}>
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--nova-text-primary)' }}>
                      {testimonial.name}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                      {testimonial.location}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="#FFB951">
                      <path d="M8 1l2.09 4.26L15 6.03l-3.64 3.54L12.18 15 8 12.77 3.82 15l.82-5.43L1 6.03l4.91-.77L8 1z"/>
                    </svg>
                  ))}
                </div>
                
                <p className="text-sm" style={{ color: 'var(--nova-text-secondary)', lineHeight: '1.6' }}>
                  &ldquo;{testimonial.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Urgences */}
      <section className="py-16">
        <div className="container-nova">
          <div className="rounded-2xl p-12 text-center" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)' }}>
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="mb-4" style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
              Urgence dentaire ?
            </h3>
            <p className="mb-8 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
              Notre service d&apos;urgence est disponible 24h/24 et 7j/7. 
              Un praticien de garde vous prendra en charge rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/urgences" className="btn-nova-urgent">
                📞 Appeler le service d&apos;urgence
              </Link>
              <Link href="/urgences" className="btn-nova-secondary">
                💬 Chat avec un dentiste
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer simple style Doctolib */}
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
                <li><Link href="/aide" className="text-sm">Centre d&apos;aide</Link></li>
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
              <Link href="/cookies" className="text-sm">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}