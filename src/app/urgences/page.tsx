import '../globals.css';
import '../../styles/nova-design-system.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Urgences Dentaires 24/7 - NOVA',
  description: 'Service d\'urgence dentaire disponible 24h/24 et 7j/7. Consultation immédiate, cabinets de garde, premiers soins.',
};

export default function UrgencesPage() {
  const urgencyLevels = [
    {
      level: 'Critique',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      icon: '🚨',
      symptoms: [
        'Traumatisme facial sévère',
        'Hémorragie incontrôlable',
        'Infection avec fièvre élevée',
        'Douleur insupportable'
      ],
      action: 'Appel immédiat',
      delay: 'Immédiat'
    },
    {
      level: 'Élevé',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: '⚠️',
      symptoms: [
        'Dent cassée ou expulsée',
        'Abcès dentaire',
        'Douleur aiguë persistante',
        'Gonflement du visage'
      ],
      action: 'Consultation sous 2h',
      delay: '< 2 heures'
    },
    {
      level: 'Modéré',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: '💊',
      symptoms: [
        'Douleur modérée',
        'Plombage perdu',
        'Sensibilité dentaire',
        'Saignement des gencives'
      ],
      action: 'RDV dans la journée',
      delay: '< 24 heures'
    }
  ];

  const emergencyCenters = [
    {
      name: 'Cabinet de Garde Alger Centre',
      address: 'Boulevard Mohamed V',
      phone: '+213 555 911 911',
      waitTime: '15 min',
      distance: '2.3 km',
      available: true,
      openNow: true
    },
    {
      name: 'Urgences CHU Mustapha',
      address: 'Place du 1er Mai',
      phone: '+213 21 23 55 55',
      waitTime: '45 min',
      distance: '4.7 km',
      available: true,
      openNow: true
    },
    {
      name: 'Clinique El Azhar',
      address: 'Dely Ibrahim',
      phone: '+213 555 123 456',
      waitTime: '30 min',
      distance: '6.2 km',
      available: false,
      openNow: true
    }
  ];

  const firstAidTips = [
    {
      category: 'Dent expulsée',
      icon: '🦷',
      steps: [
        'Récupérer la dent par la couronne',
        'Rincer délicatement à l\'eau',
        'Conserver dans du lait ou salive',
        'Consulter dans l\'heure'
      ]
    },
    {
      category: 'Hémorragie',
      icon: '🩸',
      steps: [
        'Comprimer avec une gaze stérile',
        'Maintenir pression 15 minutes',
        'Position semi-assise',
        'Ne pas rincer'
      ]
    },
    {
      category: 'Douleur aiguë',
      icon: '💊',
      steps: [
        'Paracétamol 1g max',
        'Compresse froide externe',
        'Éviter l\'aspirine',
        'Bain de bouche antiseptique'
      ]
    },
    {
      category: 'Abcès',
      icon: '🔴',
      steps: [
        'Ne pas percer',
        'Bain de bouche salé tiède',
        'Anti-inflammatoire si possible',
        'Consultation urgente'
      ]
    }
  ];

  const emergencyNumbers = [
    { service: 'SAMU', number: '15', icon: '🚑' },
    { service: 'Protection Civile', number: '14', icon: '🚒' },
    { service: 'Police', number: '17', icon: '👮' },
    { service: 'Numéro Européen', number: '112', icon: '🆘' }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* Header */}
      <header className="header-nova sticky top-0 z-50">
        <div className="container-nova">
          <div className="flex items-center justify-between h-[72px]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--nova-urgent)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7V12C2 16.5 4.5 20.74 8.5 22.5L12 24L15.5 22.5C19.5 20.74 22 16.5 22 12V7L12 2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M12 8V16M8 12H16" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
                  NOVA
                </div>
                <div className="text-xs" style={{ color: 'var(--nova-urgent)' }}>
                  Urgences 24/7
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
              <Link href="/services" className="text-[15px] font-medium hover:text-[var(--nova-primary)] transition-colors" style={{ color: 'var(--nova-text-secondary)' }}>
                Services
              </Link>
              <Link href="/urgences" className="text-[15px] font-medium" style={{ color: 'var(--nova-urgent)' }}>
                Urgences
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <a href="tel:+213555911911" className="btn-nova-urgent flex items-center gap-2">
                <span className="text-xl">📞</span>
                Appel Urgence
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Hero */}
      <section className="pt-12 pb-8" style={{ background: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 50%, #FEF2F2 100%)' }}>
        <div className="container-nova">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" 
                 style={{ background: 'white', boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)', animation: 'pulse-urgent 2s infinite' }}>
              <span className="text-4xl">🚨</span>
            </div>
            <h1 className="mb-4" style={{ fontSize: 'var(--text-hero)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
              Urgence Dentaire?
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
              Service disponible 24h/24 et 7j/7. Évaluation immédiate de votre situation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+213555911911" className="btn-nova-urgent text-lg px-8 py-4 flex items-center justify-center gap-3">
                <span>📞</span>
                <span>+213 555 911 911</span>
              </a>
              <Link href="/rdv?urgence=true" className="btn-nova-secondary text-lg px-8 py-4 flex items-center justify-center gap-3">
                <span>💬</span>
                Chat immédiat
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Levels */}
      <section className="py-16">
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Évaluez votre urgence
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Identifiez rapidement le niveau de votre urgence pour recevoir les soins appropriés
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {urgencyLevels.map((level, idx) => (
              <div key={idx} className="card-nova hover:border-current transition-all" style={{ borderColor: level.color }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" 
                       style={{ background: level.bgColor }}>
                    {level.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: level.color }}>
                      Urgence {level.level}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                      {level.delay}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {level.symptoms.map((symptom, symptomIdx) => (
                    <li key={symptomIdx} className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                        <path d="M6 8l2 2 4-4" stroke={level.color} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                        {symptom}
                      </span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90" 
                        style={{ background: level.bgColor, color: level.color }}>
                  {level.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Centers */}
      <section className="py-16" style={{ background: 'white' }}>
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Centres d'urgence à proximité
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Cabinets de garde et services d'urgence ouverts maintenant
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {emergencyCenters.map((center, idx) => (
              <div key={idx} className={`card-nova ${center.available ? '' : 'opacity-75'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--nova-text-primary)' }}>
                      {center.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                      {center.address}
                    </p>
                  </div>
                  {center.openNow && (
                    <span className="badge-nova badge-nova-success">
                      Ouvert
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="#64748B" strokeWidth="1.5"/>
                      <path d="M8 4v4l2.5 2.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm" style={{ color: center.available ? 'var(--nova-secondary)' : 'var(--nova-text-muted)' }}>
                      {center.waitTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2C5 2 2 5 2 8c0 4 6 8 6 8s6-4 6-8c0-3-3-6-6-6zm0 8c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" fill="#64748B" fillOpacity="0.3"/>
                    </svg>
                    <span className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                      {center.distance}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${center.phone}`} 
                     className={`flex-1 text-center py-2 rounded-lg font-medium transition-all ${
                       center.available 
                         ? 'bg-[var(--nova-urgent)] text-white hover:opacity-90' 
                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                     }`}>
                    📞 Appeler
                  </a>
                  <button className="flex-1 py-2 rounded-lg font-medium border transition-all hover:bg-gray-50" 
                          style={{ borderColor: 'var(--nova-border)', color: 'var(--nova-text-secondary)' }}>
                    📍 Itinéraire
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="btn-nova-secondary">
              Voir tous les centres de garde →
            </button>
          </div>
        </div>
      </section>

      {/* First Aid Tips */}
      <section className="py-16">
        <div className="container-nova">
          <h2 className="text-center mb-4" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Premiers soins
          </h2>
          <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--nova-text-secondary)' }}>
            Gestes essentiels en attendant la consultation
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {firstAidTips.map((tip, idx) => (
              <div key={idx} className="card-nova">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl" 
                       style={{ background: 'var(--nova-primary-lighter)' }}>
                    {tip.icon}
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--nova-text-primary)' }}>
                    {tip.category}
                  </h3>
                </div>

                <ol className="space-y-2">
                  {tip.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex gap-2 text-sm">
                      <span className="font-bold" style={{ color: 'var(--nova-primary)' }}>
                        {stepIdx + 1}.
                      </span>
                      <span style={{ color: 'var(--nova-text-secondary)' }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Numbers Grid */}
      <section className="py-16" style={{ background: 'white' }}>
        <div className="container-nova">
          <h2 className="text-center mb-12" style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
            Numéros d'urgence
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {emergencyNumbers.map((emergency, idx) => (
              <a key={idx} href={`tel:${emergency.number}`} 
                 className="card-nova text-center hover:border-[var(--nova-urgent)] transition-all group">
                <div className="text-4xl mb-3">{emergency.icon}</div>
                <div className="font-bold text-2xl mb-1 group-hover:text-[var(--nova-urgent)] transition-colors" 
                     style={{ color: 'var(--nova-text-primary)' }}>
                  {emergency.number}
                </div>
                <div className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  {emergency.service}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16">
        <div className="container-nova">
          <div className="card-nova" style={{ background: 'var(--nova-primary-lighter)' }}>
            <h3 className="mb-6" style={{ fontSize: 'var(--text-h3)', fontFamily: 'var(--font-heading)', color: 'var(--nova-text-primary)' }}>
              💡 Conseils importants
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--nova-text-primary)' }}>
                  À faire
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-secondary)' }}>✅</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Garder son calme et évaluer la situation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-secondary)' }}>✅</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Conserver une dent expulsée dans du lait
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-secondary)' }}>✅</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Appliquer une compresse froide en cas de gonflement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-secondary)' }}>✅</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Prendre des antalgiques selon prescription
                    </span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3" style={{ color: 'var(--nova-text-primary)' }}>
                  À éviter
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-urgent)' }}>❌</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Toucher une dent expulsée par la racine
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-urgent)' }}>❌</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Appliquer de l'aspirine directement sur la dent
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-urgent)' }}>❌</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Percer un abcès soi-même
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--nova-urgent)' }}>❌</span>
                    <span className="text-sm" style={{ color: 'var(--nova-text-secondary)' }}>
                      Attendre si traumatisme facial sévère
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link href="/rdv?urgence=true" 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
              style={{ background: 'var(--nova-urgent)' }}>
          <span className="text-2xl">💬</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="footer-nova">
        <div className="container-nova">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-white">Urgences</h4>
              <ul className="space-y-2">
                <li><a href="tel:+213555911911" className="text-sm">📞 Ligne urgence 24/7</a></li>
                <li><Link href="/urgences#garde" className="text-sm">Cabinets de garde</Link></li>
                <li><Link href="/urgences#soins" className="text-sm">Premiers soins</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/rdv" className="text-sm">Prendre RDV</Link></li>
                <li><Link href="/cabinets" className="text-sm">Nos cabinets</Link></li>
                <li><Link href="/services" className="text-sm">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Aide</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-sm">FAQ</Link></li>
                <li><Link href="/contact" className="text-sm">Contact</Link></li>
                <li><Link href="/assurance" className="text-sm">Assurances</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact Urgence</h4>
              <ul className="space-y-2">
                <li className="text-sm" style={{ color: 'var(--nova-urgent)' }}>
                  🚨 +213 555 911 911
                </li>
                <li className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  ✉️ urgences@nova-sante.dz
                </li>
                <li className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
                  📍 Service 24/7
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm" style={{ color: 'var(--nova-text-muted)' }}>
              © 2025 NOVA Urgences - Service disponible 24h/24 et 7j/7
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/mentions-legales" className="text-sm">Mentions légales</Link>
              <Link href="/confidentialite" className="text-sm">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
