'use client';

import { useState } from 'react';
import { X, Zap, Check, Loader2 } from 'lucide-react';
import { FREE_CARD_LIMIT } from '@/lib/plan-limits';

interface Props {
  reason: 'CARD_LIMIT' | 'SIGNAL_QUOTA';
  onClose: () => void;
}

const PRO_FEATURES = [
  'Unlimited cards in your portfolio',
  'Unlimited AI signal refreshes',
  'Full Wyckoff regime analysis',
  'Market narrative synthesis',
  'Email price alerts',
  'Priority signal generation',
];

export default function UpgradeModal({ reason, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const headline = reason === 'CARD_LIMIT'
    ? `Free plan is limited to ${FREE_CARD_LIMIT} cards`
    : 'Daily signal limit reached';

  const sub = reason === 'CARD_LIMIT'
    ? 'Upgrade to Pro to track your full collection with unlimited cards.'
    : 'Upgrade to Pro for unlimited AI signal refreshes every day.';

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'modal' }),
      });
      const { url, error } = await res.json() as { url?: string; error?: string };
      if (error) {
        alert(error);
        return;
      }
      if (url) window.location.href = url;
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,14,28,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="chrome-panel w-full max-w-md overflow-hidden fade-in-up">
        {/* Gold top accent */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[rgba(245,200,66,0.6)] to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[rgba(245,200,66,0.12)] border border-[rgba(245,200,66,0.3)] flex items-center justify-center">
                <Zap size={16} className="text-gold-400" />
              </div>
              <div>
                <h2 className="font-display font-black text-white text-base uppercase tracking-widest">
                  Upgrade to Pro
                </h2>
                <p className="text-[11px] text-chrome-500 font-display uppercase tracking-widest mt-0.5">
                  $9 / month
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-chrome-600 hover:text-chrome-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Reason */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-3 mb-5">
            <p className="text-amber-400 text-sm font-display font-black uppercase tracking-widest mb-1">
              {headline}
            </p>
            <p className="text-slate-400 text-xs font-sans leading-relaxed">{sub}</p>
          </div>

          {/* Features */}
          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <Check size={12} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 font-sans">{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 py-3 font-black text-sm uppercase tracking-widest rounded-sm disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
            ) : (
              <><Zap size={14} /> Upgrade to Pro — $9/mo</>
            )}
          </button>

          <p className="text-center text-[10px] text-chrome-600 mt-3 font-display">
            Cancel anytime · Billed monthly
          </p>
        </div>
      </div>
    </div>
  );
}
