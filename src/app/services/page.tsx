// src/app/services/page.tsx - Page dédiée aux services et tarifs
import Navigation from '@/components/landing/Navigation'
import ServicesAndPricing from '@/components/landing/ServicesAndPricing'
import Footer from '@/components/landing/Footer'

export default function ServicesPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-nova-blue to-blue-700 text-white py-16 mt-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Services & Tarifs
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Découvrez notre gamme complète de soins dentaires avec une tarification 
            transparente et des standards d'excellence internationaux.
          </p>
        </div>
      </div>
      
      <ServicesAndPricing />
      <Footer />
    </main>
  )
}
