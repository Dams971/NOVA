import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Configuration des fonts Nova
const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nova - L'avenir de la dentisterie, aujourd'hui accessible",
  description: "Nova automatise la prise de RDV dentaires en moins de 60 secondes et réduit le taux de no-show par 3. Solution IA révolutionnaire pour cabinets dentaires.",
  keywords: "dentiste, rendez-vous, IA, automatisation, cabinet dentaire, no-show, prise de RDV",
  authors: [{ name: "Nova" }],
  creator: "Nova",
  publisher: "Nova",
  robots: "index, follow",
  openGraph: {
    title: "Nova - L'avenir de la dentisterie, aujourd'hui accessible",
    description: "Nova automatise la prise de RDV dentaires en moins de 60 secondes et réduit le taux de no-show par 3.",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nova - L'avenir de la dentisterie, aujourd'hui accessible",
    description: "Nova automatise la prise de RDV dentaires en moins de 60 secondes et réduit le taux de no-show par 3.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} ${openSans.variable} font-body antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
