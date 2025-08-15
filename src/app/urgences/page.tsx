// src/app/urgences/page.tsx - Page dédiée aux urgences dentaires
import Navigation from '@/components/landing/Navigation'
import EmergencySection from '@/components/landing/EmergencySection'
import Footer from '@/components/landing/Footer'

export default function UrgencesPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white py-16 mt-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Urgences Dentaires 24h/7j
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Une douleur dentaire ? Un traumatisme ? Notre réseau Nova vous prend en charge 
            rapidement, partout dans le monde, 24 heures sur 24.
          </p>
          
          <div className="mt-8">
            <a 
              href="tel:+33123456789"
              className="inline-flex items-center bg-white text-red-600 px-8 py-4 rounded-lg text-xl font-bold hover:bg-gray-100 transition-colors"
            >
              📞 01 23 45 67 89
            </a>
            <p className="mt-2 text-red-100">Ligne d'urgence internationale</p>
          </div>
        </div>
      </div>
      
      <EmergencySection />
      <Footer />
    </main>
  )
}
