'use client';

import { useEffect, useState, useRef } from 'react';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { CardSignal, MarketNarrative } from '@/types';

interface Props {
  signals: CardSignal[];
}

function winRateColor(rate: number): string {
  if (rate >= 60) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (rate >= 45) return 'text-gold-400 bg-[rgba(245,200,66,0.1)] border-[rgba(245,200,66,0.25)]';
  return 'text-red-400 bg-red-500/10 border-red-500/25';
}

function portfolioHash(signals: CardSignal[]): string {
  const key = signals.map((s) => s.cardId).sort().join(':');
  // Use a simple hash since we're client-side (no crypto module in browser)
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export default function MarketNarrativePanel({ signals }: Props) {
  const [narrative, setNarrative] = useState<MarketNarrative | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedHash = useRef<string | null>(null);

  useEffect(() => {
    if (signals.length === 0) return;

    const hash = portfolioHash(signals);
    if (fetchedHash.current === hash) return; // already fetched for this exact portfolio
    fetchedHash.current = hash;

    setLoading(true);
    fetch('/api/signals/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals, portfolioHash: hash }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ narrative: MarketNarrative }>;
      })
      .then(({ narrative: n }) => setNarrative(n))
      .catch(() => { /* silent — narrative is non-critical */ })
      .finally(() => setLoading(false));
  }, [signals]);

  if (signals.length === 0) return null;

  if (loading) {
    return (
      <div className="chrome-panel p-5 animate-pulse mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-[#1E2D45]" />
          <div className="h-2 bg-[#1E2D45] rounded w-36" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#1E2D45] rounded w-full" />
          <div className="h-3 bg-[#1E2D45] rounded w-5/6" />
          <div className="h-3 bg-[#1E2D45] rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!narrative) return null;

  return (
    <div className="chrome-panel p-5 mb-4 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={12} className="text-gold-400" />
          <span className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">
            Market Narrative
          </span>
        </div>
        {narrative.signalWinRate !== undefined && (
          <span className={`text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${winRateColor(narrative.signalWinRate)}`}>
            {narrative.signalWinRate.toFixed(0)}% win rate
          </span>
        )}
      </div>

      {/* Narrative prose */}
      <p className="text-slate-300 text-sm font-sans leading-relaxed mb-4">
        {narrative.narrative}
      </p>

      {/* Theme pills */}
      {narrative.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {narrative.themes.map((theme) => (
            <span
              key={theme}
              className="text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border text-electric bg-electric/10 border-electric/20"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Opportunity / Risk grid */}
      {(narrative.topOpportunity || narrative.topRisk) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {narrative.topOpportunity && (
            <div className="border border-emerald-500/20 bg-emerald-500/[0.07] rounded-md px-3 py-2.5">
              <p className="text-[8px] font-display font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1">
                <TrendingUp size={8} /> Top Opportunity
              </p>
              <p className="text-xs text-slate-300 font-sans leading-snug">{narrative.topOpportunity}</p>
            </div>
          )}
          {narrative.topRisk && (
            <div className="border border-red-500/20 bg-red-500/[0.07] rounded-md px-3 py-2.5">
              <p className="text-[8px] font-display font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-1">
                <AlertTriangle size={8} /> Top Risk
              </p>
              <p className="text-xs text-slate-300 font-sans leading-snug">{narrative.topRisk}</p>
            </div>
          )}
        </div>
      )}

      {/* Contradictions */}
      {narrative.contradictions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {narrative.contradictions.map((c) => (
            <span
              key={c}
              className="text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border text-amber-400 bg-amber-500/10 border-amber-500/20"
            >
              ⚠ {c}
            </span>
          ))}
        </div>
      )}

      {/* Regime summary footer */}
      {narrative.regimeSummary && (
        <p className="text-[9px] font-display text-chrome-600 uppercase tracking-widest">
          {narrative.regimeSummary}
        </p>
      )}
    </div>
  );
}
