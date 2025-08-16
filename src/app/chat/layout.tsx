import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test du Chatbot IA | Nova - Assistant Dentaire Intelligent',
  description: 'Testez notre chatbot IA Nova pour la prise de rendez-vous dentaires. Interface conversationnelle accessible, support multilingue, gestion intelligente des urgences.',
  keywords: 'chatbot, IA, assistant dentaire, test, prise de rendez-vous, Nova, intelligence artificielle',
  openGraph: {
    title: 'Test du Chatbot IA Nova',
    description: 'Interface de test pour le chatbot IA Nova. Conversation naturelle pour prendre rendez-vous.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test du Chatbot IA Nova',
    description: 'Interface de test pour le chatbot IA Nova.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/chat',
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}