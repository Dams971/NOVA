// src/app/cabinets/page.tsx - Page dédiée aux cabinets Nova
import CabinetsDetails from '@/components/landing/CabinetsDetails'
import Footer from '@/components/landing/Footer'
import Navigation from '@/components/landing/Navigation'

export default function CabinetsPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-nova-blue to-blue-700 text-white py-16 mt-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Nos Cabinets dans le Monde
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Découvrez notre réseau international de 25+ cabinets dentaires d'excellence, 
            présents dans 12 pays avec les mêmes standards de qualité partout.
          </p>
        </div>
      </div>

      <CabinetsDetails />
      <Footer />
    </main>
  )
}
