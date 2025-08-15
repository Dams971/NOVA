// src/app/page.tsx - Homepage Nova simplifiée (Best Practices UX)
import Navigation from '@/components/landing/Navigation'
import Hero from '@/components/landing/Hero'
import Testimonials from '@/components/landing/Testimonials'
import CallToAction from '@/components/landing/CallToAction'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Testimonials />
      <CallToAction />
      <Footer />
    </main>
  )
}
