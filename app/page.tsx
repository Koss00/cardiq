import Link from 'next/link';
import {
  ArrowRight, ChevronRight, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import ImmersiveHero from '@/components/landing/ImmersiveHero';
import SoundToggle from '@/components/landing/SoundToggle';
import CinematicScroll from '@/components/landing/CinematicScroll';
import VideoBackdrop from '@/components/landing/VideoBackdrop';
import ScrubHero from '@/components/landing/ScrubHero';
import PinnedFeatures from '@/components/landing/PinnedFeatures';
import MetricsCounters from '@/components/landing/MetricsCounters';
import ProductShot from '@/components/landing/ProductShot';
import PricingTiers from '@/components/landing/PricingTiers';
import FAQAccordion from '@/components/landing/FAQAccordion';

export default function LandingPage() {
  return (
    <CinematicScroll>
    <div className="min-h-screen bg-[#060E1C] text-slate-100 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1E2D45] bg-[rgba(6,14,28,0.95)] backdrop-blur-xl">
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,200,66,0.6) 30%, rgba(250,224,122,0.8) 50%, rgba(245,200,66,0.6) 70%, transparent 100%)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-xs font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text select-none">CARD<span>IQ</span></span>
          </div>
          <div className="flex items-center gap-3">
            <SoundToggle />
            <Link
              href="/dashboard"
              className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest"
            >
              Launch App <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Act 0 — scroll-scrubbed particle assembly (activates when
             /video/hero-assembly.mp4 exists) ─────────────────────────────── */}
      <ScrubHero />

      {/* ── Act 1 — interactive hero: the assembled card, now touchable ──── */}
      <ImmersiveHero />

      {/* ── Signal ticker strip ──────────────────────────────────────────── */}
      <div className="border-y border-[#1E2D45] bg-[#060E1C] py-4 overflow-hidden">
        <div className="flex items-center justify-center gap-8 px-4 flex-wrap">
          <span className="text-[9px] text-chrome-700 uppercase tracking-widest font-display flex-shrink-0">Sample signals</span>
          {[
            { label: 'PSA 10 Mahomes RC', signal: 'BUY', price: '$4,200', change: '+12.4%', icon: TrendingUp },
            { label: 'Luka Dončić Prizm', signal: 'HOLD', price: '$890', change: '+2.1%', icon: Minus },
            { label: '2019 Trout Auto /25', signal: 'SELL', price: '$1,150', change: '-8.3%', icon: TrendingDown },
            { label: 'Wemby RC BGS 9.5', signal: 'BUY', price: '$620', change: '+18.7%', icon: TrendingUp },
          ].map(({ label, signal, price, change, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5 flex-shrink-0">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                signal === 'BUY' ? 'bg-emerald-500 text-[#060E1C]' :
                signal === 'SELL' ? 'bg-red-500 text-white' :
                'bg-amber-500 text-[#060E1C]'
              }`}>{signal}</span>
              <span className="text-chrome-400 text-xs font-display font-semibold hidden sm:inline">{label}</span>
              <span className="text-white text-xs font-display font-black">{price}</span>
              <span className={`text-xs font-display font-bold flex items-center gap-0.5 ${
                change.startsWith('+') ? 'text-electric' : 'text-red-400'
              }`}>
                <Icon size={10} />
                {change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Act 2 — SCAN · TRACK · SIGNAL pinned over the signal footage ─── */}
      <PinnedFeatures />

      {/* ── Honest numbers ───────────────────────────────────────────────── */}
      <MetricsCounters />

      {/* ── The product, framed ──────────────────────────────────────────── */}
      <ProductShot />

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <PricingTiers />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQAccordion />

      {/* ── Act 3 — the calm: final CTA over the collector-desk footage ──── */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <VideoBackdrop src="/video/collector-desk.mp4" fallbackSrc="/video/vault-gold.mp4" opacity={0.4} />
        <div data-reveal className="relative z-10 max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl" style={{
            background: 'linear-gradient(145deg, rgba(19,30,52,0.92) 0%, rgba(13,23,39,0.92) 50%, rgba(19,30,52,0.92) 100%)',
            border: '1px solid rgba(245,200,66,0.2)',
            boxShadow: '0 0 0 1px rgba(245,200,66,0.08), 0 24px 80px rgba(4,11,22,0.7), 0 0 60px rgba(245,200,66,0.06)',
            backdropFilter: 'blur(12px)',
          }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(245,200,66,0.14) 0%, transparent 65%)',
            }} />
            <div className="absolute inset-x-0 top-0 h-px" style={{
              background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.8) 30%, rgba(250,224,122,1) 50%, rgba(245,200,66,0.8) 70%, transparent)',
            }} />

            <div className="relative px-10 py-16 text-center">
              <p className="text-gold-400 text-[11px] font-black uppercase tracking-widest mb-6">
                Built for serious collectors
              </p>
              <h2 className="font-card text-5xl sm:text-6xl mb-5 uppercase tracking-widest leading-none">
                <span className="title-gold">Start tracking smarter today</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 font-sans leading-relaxed max-w-lg mx-auto">
                Join collectors using CardIQ to make better buy and sell decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="btn-gold inline-flex items-center justify-center gap-2 px-9 py-4 font-black text-sm uppercase tracking-widest"
                >
                  Launch App Free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/pricing"
                  className="btn-ghost inline-flex items-center justify-center gap-2 px-9 py-4 font-bold text-sm uppercase tracking-widest"
                >
                  See Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E2D45] py-10 px-4 bg-[rgba(4,11,22,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-[10px] font-black z-10">IQ</span>
            </div>
            <span className="font-card text-base tracking-widest chrome-text select-none">CARDIQ</span>
          </div>
          <p className="text-chrome-700 text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} CardIQ.{' '}
            <Link href="/pricing" className="hover:text-gold-400 transition-colors">Pricing</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-gold-400 transition-colors">Privacy</Link>
            {' · '}
            <Link href="/terms" className="hover:text-gold-400 transition-colors">Terms</Link>
          </p>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-gold-400 transition-colors duration-200 flex items-center gap-1 uppercase tracking-widest font-semibold"
          >
            Launch App <ChevronRight size={11} />
          </Link>
        </div>
      </footer>
    </div>
    </CinematicScroll>
  );
}
