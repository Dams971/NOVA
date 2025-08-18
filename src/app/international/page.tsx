// src/app/international/page.tsx - Page dédiée à la présence internationale
import Footer from '@/components/landing/Footer'
import InternationalExpansion from '@/components/landing/InternationalExpansion'
import Navigation from '@/components/landing/Navigation'

export default function InternationalPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 mt-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Nova International
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Un réseau dentaire mondial en expansion constante, présent dans 12 pays 
            avec des plans d&apos;ouverture dans 6 nouveaux marchés d&apos;ici 2025.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">25+</div>
              <p className="text-white/80">Cabinets</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">12</div>
              <p className="text-white/80">Pays</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">150+</div>
              <p className="text-white/80">Praticiens</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">50K+</div>
              <p className="text-white/80">Patients</p>
            </div>
          </div>
        </div>
      </div>

      <InternationalExpansion />
      <Footer />
    </main>
  )
}
