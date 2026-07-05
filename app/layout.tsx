import type { Metadata } from 'next';
import { Inter, Outfit, Bebas_Neue } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-card',
  display: 'swap',
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'CardIQ — Sports Card Portfolio Intelligence',
  description:
    'See the market coming. AI-powered sports card portfolio tracker with live eBay pricing and BUY / SELL / HOLD market intelligence signals.',
  openGraph: {
    title: 'CardIQ — See the market coming.',
    description:
      'Scan any card, track live eBay value, and get AI BUY / SELL / HOLD signals with confidence scores.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardIQ — See the market coming.',
    description:
      'Scan any card, track live eBay value, and get AI BUY / SELL / HOLD signals with confidence scores.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${outfit.variable} ${bebasNeue.variable} font-sans antialiased bg-[#060E1C] text-slate-100 min-h-screen chrome-texture`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
