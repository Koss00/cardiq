import type { Metadata } from 'next';
import { Inter, Barlow_Condensed, Bebas_Neue } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-card',
});

export const metadata: Metadata = {
  title: 'CardIQ — Sports Card Portfolio Intelligence',
  description:
    'AI-powered sports card portfolio tracker with live eBay pricing and market intelligence signals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${barlowCondensed.variable} ${bebasNeue.variable} font-sans antialiased bg-[#060E1C] text-slate-100 min-h-screen chrome-texture`}
      >
        {children}
      </body>
    </html>
  );
}
