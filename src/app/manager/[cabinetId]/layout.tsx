import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de Bord Manager | Nova - Gestion Cabinet Dentaire',
  description: 'Interface de gestion complète pour les managers de cabinets dentaires Nova. KPI, analytics, gestion des rendez-vous et des patients en temps réel.',
  keywords: 'manager, tableau de bord, gestion cabinet, KPI, analytics, Nova, dentaire, dashboard',
  openGraph: {
    title: 'Tableau de Bord Manager Nova',
    description: 'Interface de gestion pour les cabinets dentaires. Analytics et KPI en temps réel.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tableau de Bord Manager Nova',
    description: 'Interface de gestion pour les cabinets dentaires.',
  },
  robots: {
    index: false, // Private manager area
    follow: false,
  },
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}