import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/config';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} — DTCP & RERA Approved Plots in ${site.city}`,
    template: `%s · ${site.name}`,
  },
  description:
    `${site.name} specialises in residential, commercial and farm plots across ${site.city}'s growth corridors. Approved layouts, verified titles, transparent pricing and site visits on request.`,
  keywords: [
    'plots in Chennai', 'DTCP approved plots', 'RERA approved layout Chennai',
    'land for sale Chennai', 'OMR plots', 'ECR beach plots', 'farm land Chennai',
    'residential plots', 'Imperium Realtors',
  ],
  openGraph: {
    title: `${site.name} — ${site.city}'s Land & Plot Specialists`,
    description:
      'Approved layouts, verified titles and honest corridor advice. Find residential, commercial and farm plots across Chennai.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
