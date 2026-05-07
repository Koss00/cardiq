'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ScanLine, Brain, Layers } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, calcRoi } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/scan', label: 'Scan', icon: ScanLine },
  { href: '/portfolio', label: 'Portfolio', icon: Layers },
  { href: '/intelligence', label: 'Intelligence', icon: Brain },
];

export default function Navbar() {
  const pathname = usePathname();
  const { state } = useStore();

  const totalValue = state.cards.reduce((s, c) => s + c.currentValue, 0);
  const totalCost = state.cards.reduce((s, c) => s + c.purchasePrice, 0);
  const roi = calcRoi(totalCost, totalValue);

  return (
    <header className="border-b border-[rgba(0,212,255,0.1)] bg-navy-950/95 backdrop-blur-md sticky top-0 z-50 chrome-texture">
      {/* Prismatic top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-electric to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Chrome/foil logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-navy-900 text-sm font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text">
              CARD<span>IQ</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-display font-bold uppercase tracking-widest transition-all relative ${
                    active
                      ? 'text-electric'
                      : 'text-chrome-400 hover:text-chrome-200 hover:bg-navy-700'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-electric to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Portfolio snapshot */}
          {state.cards.length > 0 ? (
            <div className="text-right hidden sm:block">
              <p className="font-display font-black text-sm text-white">{formatCurrency(totalValue)}</p>
              <p className={`text-xs font-semibold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
              </p>
            </div>
          ) : (
            <Link
              href="/scan"
              className="btn-gold text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-display font-black"
            >
              Scan Card
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-[rgba(0,212,255,0.08)] flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-display font-bold uppercase tracking-wider transition-all relative ${
                active ? 'text-electric' : 'text-chrome-500 hover:text-chrome-200'
              }`}
            >
              <Icon size={16} />
              {label}
              {active && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-px bg-electric" />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
