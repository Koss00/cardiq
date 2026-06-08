'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Check, Brain, BarChart3, ScanLine, Bell, Zap, Loader2 } from 'lucide-react';


const FREE_FEATURES = [
  'Up to 5 cards in your portfolio',
  'AI card identification via photo scan',
  'Manual card entry + CSV import',
  'Live eBay market pricing',
  'Portfolio ROI tracking',
  '20 AI signal refreshes per day',
  'Price history charts',
];

const PRO_FEATURES = [
  'Unlimited cards',
  'Unlimited AI intelligence signals',
  'Priority signal generation (no queue)',
  'Price spike & drop alerts',
  'Market Narrative — portfolio synthesis',
  'Wyckoff regime analysis',
  'Expected return projections',
  'Signal outcome tracking (self-improving AI)',
  'CSV data export',
  'Email support',
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ source: 'pricing' }),
      });
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) { alert(error); return; }
      if (url) window.location.href = url;
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060E1C] text-slate-100">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1E2D45] bg-[rgba(6,14,28,0.95)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 flex items-center justify-center rounded-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-chrome-200 via-gold-400 to-electric" />
              <span className="relative font-card text-[#060E1C] text-xs font-black tracking-tight z-10">IQ</span>
            </div>
            <span className="font-card text-xl tracking-widest chrome-text select-none">CARD<span>IQ</span></span>
          </Link>
          <Link href="/dashboard" className="btn-gold flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest">
            Launch App <ChevronRight size={12} />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-card text-5xl uppercase tracking-widest text-white mb-4">
            Simple <span className="title-gold">Pricing</span>
          </h1>
          <p className="text-slate-400 text-base font-sans max-w-xl mx-auto leading-relaxed">
            Start free and upgrade when you're ready. No credit card required to get started.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="chrome-panel p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-3">Free</p>
              <div className="flex items-end gap-2">
                <span className="font-card text-5xl text-white">$0</span>
                <span className="text-chrome-500 font-sans text-sm mb-1.5">/month</span>
              </div>
              <p className="text-slate-500 text-sm font-sans mt-2">Perfect for getting started</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={13} className="text-electric mt-0.5 flex-shrink-0" />
                  <span className="text-slate-400 text-sm font-sans">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm bg-[#111D33] border border-[rgba(192,200,216,0.18)] text-chrome-200 font-display font-black text-xs uppercase tracking-widest hover:border-[rgba(192,200,216,0.35)] hover:text-white transition-all duration-200"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative chrome-panel p-8 flex flex-col border border-[rgba(245,200,66,0.3)] overflow-hidden">
            {/* Gold glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.08) 0%, transparent 65%)' }}
            />
            <div
              className="absolute top-0 left-4 right-4 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #F5C842, transparent)' }}
            />

            <div className="mb-6 relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500">Pro</p>
                <span className="text-[9px] font-display font-black uppercase tracking-widest px-2.5 py-1 rounded-sm bg-[rgba(245,200,66,0.12)] border border-[rgba(245,200,66,0.3)] text-gold-400">
                  Most Popular
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-card text-5xl text-white">$9</span>
                <span className="text-chrome-500 font-sans text-sm mb-1.5">/month</span>
              </div>
              <p className="text-slate-500 text-sm font-sans mt-2">For serious collectors</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1 relative">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={13} className="text-gold-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm font-sans">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 py-3 rounded-sm btn-gold font-display font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <><Loader2 size={12} className="animate-spin" /> Redirecting…</> : <><Zap size={12} /> Upgrade to Pro</>}
            </button>
          </div>
        </div>

        {/* Feature comparison blurb */}
        <div className="mt-16 text-center">
          <p className="text-chrome-500 text-xs uppercase tracking-widest font-display font-black mb-8">Everything in the free plan includes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: ScanLine, label: 'AI Card Scanner' },
              { icon: BarChart3, label: 'Live Portfolio Tracker' },
              { icon: Brain,     label: 'Market Intelligence' },
              { icon: Bell,      label: 'Price Alerts' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="chrome-panel px-4 py-5 text-center">
                <Icon size={18} className="text-electric mx-auto mb-2" />
                <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-xl mx-auto">
          <h2 className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 text-center mb-6">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need a credit card to sign up?',
                a: 'No. The free plan requires only an email address and is free forever.',
              },
              {
                q: 'What happens when I exceed the free plan limits?',
                a: 'You\'ll be prompted to upgrade to Pro. Existing data is never deleted.',
              },
              {
                q: 'Is my portfolio data private?',
                a: 'Yes. Your portfolio is private to your account. See our Privacy Policy for details.',
              },
              {
                q: 'When will Pro launch?',
                a: 'We\'re building it now. Email us to get on the early access list and get a launch discount.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="chrome-panel px-6 py-5">
                <p className="text-white font-semibold font-sans text-sm mb-2">{q}</p>
                <p className="text-slate-500 text-sm font-sans leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1E2D45] py-8 px-4 text-center">
        <p className="text-chrome-700 text-xs uppercase tracking-widest">
          <Link href="/" className="hover:text-gold-400 transition-colors">CardIQ</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-gold-400 transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-gold-400 transition-colors">Terms</Link>
          {' · '}
          <Link href="/pricing" className="hover:text-gold-400 transition-colors">Pricing</Link>
        </p>
      </footer>
    </div>
  );
}
