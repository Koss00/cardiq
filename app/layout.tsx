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

export const metadata: Metadata = {
  title: 'CardIQ — Sports Card Portfolio Intelligence',
  description:
    'AI-powered sports card portfolio tracker with live eBay pricing and market intelligence signals.',
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
