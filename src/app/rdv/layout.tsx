import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prendre Rendez-vous | Assistant IA Nova - Cabinet Dentaire',
  description: 'Prenez rendez-vous facilement avec notre assistant IA Nova 24/7. Consultation, urgence dentaire, détartrage, soins. Cabinet dentaire à Daboussy El Achour, Alger.',
  keywords: 'rendez-vous dentaire, assistant IA, consultation dentaire, urgence dentaire, Alger, Daboussy El Achour, Nova, dentiste',
  openGraph: {
    title: 'Prendre Rendez-vous | Assistant IA Nova',
    description: 'Assistant IA disponible 24/7 pour vos rendez-vous dentaires. Langage naturel, réponse instantanée.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prendre Rendez-vous | Assistant IA Nova',
    description: 'Assistant IA disponible 24/7 pour vos rendez-vous dentaires.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/rdv',
  },
};

export default function RDVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}