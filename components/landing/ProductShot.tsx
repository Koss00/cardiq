'use client';

/**
 * ProductShot — the dashboard in a browser-frame mockup with a soft gold
 * glow. The dashboard is drawn in pure JSX/CSS so it's always crisp and
 * needs no asset; drop a real screenshot at /product/dashboard.png and it
 * replaces the mock automatically.
 */

import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const ROWS = [
  { card: '2020 Justin Herbert Prizm PSA 10', value: '$1,240', roi: '+28.4%', signal: 'BUY', chip: 'bg-emerald-500 text-[#060E1C]' },
  { card: '2018 Luka Dončić Donruss RC', value: '$890', roi: '+2.1%', signal: 'HOLD', chip: 'bg-amber-500 text-[#060E1C]' },
  { card: '2023 Wembanyama Prizm BGS 9.5', value: '$620', roi: '+18.7%', signal: 'BUY', chip: 'bg-emerald-500 text-[#060E1C]' },
];

function MockDashboard() {
  return (
    <div className="bg-[#060E1C] p-5 sm:p-7">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-chrome-200 via-gold-400 to-electric flex items-center justify-center">
            <span className="font-card text-[#060E1C] text-[8px] font-black">IQ</span>
          </div>
          <span className="font-card text-sm tracking-widest text-white">CARDIQ</span>
        </div>
        <div className="flex gap-2">
          {['Portfolio', 'Scan', 'Signals'].map((t, i) => (
            <span key={t} className={`text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded ${i === 0 ? 'bg-[rgba(245,200,66,0.12)] text-gold-400' : 'text-chrome-500'}`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Portfolio Value', v: '$4,280', c: 'text-gold-400' },
          { label: 'Total ROI', v: '+34.2%', c: 'text-electric' },
          { label: 'Active Signals', v: '3 BUY', c: 'text-emerald-400' },
        ].map(({ label, v, c }) => (
          <div key={label} className="stat-card p-3">
            <p className={`font-display font-black text-lg leading-none ${c}`}>{v}</p>
            <p className="text-[8px] text-chrome-600 uppercase tracking-widest font-display mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Value chart */}
      <div className="chrome-panel p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] text-chrome-500 uppercase tracking-widest font-display">Portfolio Value — 90 days</p>
          <span className="text-electric text-[10px] font-display font-bold flex items-center gap-1">
            <TrendingUp size={10} /> +34.2%
          </span>
        </div>
        <svg viewBox="0 0 400 90" className="w-full h-20" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="ps-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(245,200,66,0.35)" />
              <stop offset="100%" stopColor="rgba(245,200,66,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0,72 C40,68 60,60 90,62 C120,64 140,50 170,46 C200,42 220,52 250,40 C280,28 300,34 330,22 C355,13 380,16 400,8 L400,90 L0,90 Z"
            fill="url(#ps-fill)"
          />
          <path
            d="M0,72 C40,68 60,60 90,62 C120,64 140,50 170,46 C200,42 220,52 250,40 C280,28 300,34 330,22 C355,13 380,16 400,8"
            fill="none"
            stroke="#F5C842"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Holdings rows */}
      <div className="space-y-2">
        {ROWS.map(({ card, value, roi, signal, chip }) => (
          <div key={card} className="flex items-center justify-between chrome-panel px-3.5 py-2.5">
            <span className="text-slate-300 text-[11px] font-sans truncate mr-3">{card}</span>
            <span className="flex items-center gap-3 flex-shrink-0">
              <span className="text-white text-[11px] font-display font-black">{value}</span>
              <span className="text-electric text-[10px] font-display font-bold">{roi}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${chip}`}>{signal}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductShot() {
  const [hasShot, setHasShot] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // SSR'd <img> can 404 before hydration attaches onError — re-check here.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setHasShot(false);
  }, []);

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div data-reveal className="text-center mb-14">
          <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-4">The Product</p>
          <h2 className="font-card text-4xl sm:text-5xl uppercase tracking-widest">
            <span className="title-chrome">Your entire collection, priced live</span>
          </h2>
        </div>

        <div
          data-reveal
          className="relative rounded-xl overflow-hidden border border-[#1E2D45]"
          style={{
            boxShadow:
              '0 40px 120px rgba(4,11,22,0.85), 0 0 0 1px rgba(245,200,66,0.1), 0 0 80px rgba(245,200,66,0.08)',
          }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1727] border-b border-[#1E2D45]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-[#060E1C] border border-[#1E2D45] rounded px-3 py-1 text-center">
              <span className="text-chrome-600 text-[10px] font-sans">cardiq.app/dashboard</span>
            </div>
          </div>

          {/* Real screenshot if present, otherwise the CSS mock */}
          {hasShot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src="/product/dashboard.png"
              alt="CardIQ dashboard"
              className="w-full block"
              onError={() => setHasShot(false)}
            />
          ) : (
            <MockDashboard />
          )}
        </div>
      </div>
    </section>
  );
}
