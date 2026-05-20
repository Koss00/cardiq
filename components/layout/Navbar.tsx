'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ScanLine, Brain, Layers } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, calcRoi } from '@/lib/utils';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: BarChart3 },
  { href: '/scan',         label: 'Scan',         icon: ScanLine  },
  { href: '/portfolio',    label: 'Portfolio',     icon: Layers    },
  { href: '/intelligence', label: 'Intelligence',  icon: Brain     },
];

export default function Navbar() {
  const pathname = usePathname();
  const { state } = useStore();

  const totalValue = state.cards.reduce((s, c) => s + c.currentValue, 0);
  const totalCost  = state.cards.reduce((s, c) => s + c.purchasePrice, 0);
  const roi        = calcRoi(totalCost, totalValue);

  return (
    <header className="border-b border-[rgba(0,212,255,0.08)] bg-[rgba(6,14,28,0.96)] backdrop-blur-xl sticky top-0 z-50 chrome-texture">
      {/* Prismatic top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.5) 30%, rgba(0,212,255,0.5) 60%, transparent 100%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
            aria-label="CardIQ home"
          >
            <div className="relative w-8 h-8 flex items-center justify-center rounded-sm overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-sm font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text select-none">
              CARD<span>IQ</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-widest',
                    'rounded-sm transition-all duration-200 focus-visible:outline-gold',
                    active
                      ? 'text-gold-400'
                      : 'text-chrome-400 hover:text-chrome-100 hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                  {label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-px rounded-full"
                      style={{ background: 'linear-gradient(90deg, transparent, #F5C842, transparent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Portfolio snapshot / CTA */}
          {state.cards.length > 0 ? (
            <Link
              href="/dashboard"
              className="text-right hidden sm:block group cursor-pointer"
              aria-label="View dashboard"
            >
              <p className="font-display font-black text-sm text-white group-hover:text-gold-400 transition-colors duration-200 tabular-nums">
                {formatCurrency(totalValue)}
              </p>
              <p className={`text-xs font-semibold tabular-nums ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
              </p>
            </Link>
          ) : (
            <Link
              href="/scan"
              className="btn-gold text-[11px] px-4 py-2 rounded-sm uppercase tracking-widest font-display font-black"
            >
              Scan Card
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden border-t border-[rgba(0,212,255,0.07)] flex" role="navigation" aria-label="Mobile navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-display font-bold uppercase tracking-wider',
                'transition-all duration-200 relative cursor-pointer min-h-[44px] justify-center',
                active ? 'text-gold-400' : 'text-chrome-500 hover:text-chrome-200',
              ].join(' ')}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
              {active && (
                <span
                  className="absolute bottom-0 left-1/4 right-1/4 h-px rounded-full"
                  style={{ background: '#F5C842' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
