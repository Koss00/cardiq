'use client';

import { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp, ShieldAlert, AlertCircle } from 'lucide-react';
import { CardSignal, MarketNarrative } from '@/types';

interface Props {
  signals: CardSignal[];
}

function winRateBadge(rate: number) {
  if (rate >= 60) return { label: `${rate.toFixed(0)}% accuracy`, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (rate >= 45) return { label: `${rate.toFixed(0)}% accuracy`, cls: 'text-gold-400 bg-[rgba(245,200,66,0.08)] border-[rgba(245,200,66,0.2)]' };
  return { label: `${rate.toFixed(0)}% accuracy`, cls: 'text-red-400 bg-red-500/10 border-red-500/20' };
}

function portfolioHash(signals: CardSignal[]): string {
  const key = signals.map((s) => s.cardId).sort().join(':');
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
    if (fetchedHash.current === hash) return;
    fetchedHash.current = hash;
    setLoading(true);
    fetch('/api/signals/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals, portfolioHash: hash }),
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ narrative: MarketNarrative }>; })
      .then(({ narrative: n }) => setNarrative(n))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [signals]);

  if (signals.length === 0) return null;

  if (loading) {
    return (
      <div className="chrome-panel mb-5 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[rgba(245,200,66,0.4)] to-transparent" />
        <div className="p-5 animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#1E2D45]" />
            <div className="h-2 bg-[#1E2D45] rounded w-28" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-3 bg-[#1E2D45] rounded w-full" />
            <div className="h-3 bg-[#1E2D45] rounded w-11/12" />
            <div className="h-3 bg-[#1E2D45] rounded w-4/5" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="h-14 bg-[#1E2D45] rounded-md" />
            <div className="h-14 bg-[#1E2D45] rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!narrative) return null;

  const badge = narrative.signalWinRate !== undefined ? winRateBadge(narrative.signalWinRate) : null;

  return (
    <div className="chrome-panel mb-5 overflow-hidden fade-in-up">
      {/* Gold top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[rgba(245,200,66,0.45)] to-transparent" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={11} className="text-gold-400" />
            <span className="text-[10px] font-display font-black uppercase tracking-[0.15em] text-chrome-400">
              Market Narrative
            </span>
          </div>
          {badge && (
            <span className={`text-[9px] font-display font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Narrative prose */}
        <p className="text-[13px] text-slate-300 font-sans leading-[1.65] mb-4">
          {narrative.narrative}
        </p>

        {/* Themes — short pills, truncated */}
        {narrative.themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {narrative.themes.slice(0, 4).map((theme) => (
              <span
                key={theme}
                title={theme}
                className="max-w-[260px] truncate text-[9px] font-display font-black uppercase tracking-widest px-2 py-[3px] rounded-sm border text-electric bg-[rgba(0,212,170,0.06)] border-[rgba(0,212,170,0.15)]"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Opportunity / Risk grid */}
        {(narrative.topOpportunity || narrative.topRisk) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            {narrative.topOpportunity && (
              <div className="rounded-md border border-emerald-500/15 bg-emerald-500/[0.05] px-3.5 py-2.5">
                <p className="flex items-center gap-1.5 text-[9px] font-display font-black uppercase tracking-widest text-emerald-500 mb-1.5">
                  <TrendingUp size={9} />
                  Top Opportunity
                </p>
                <p className="text-[12px] text-slate-300 font-sans leading-snug">
                  {narrative.topOpportunity}
                </p>
              </div>
            )}
            {narrative.topRisk && (
              <div className="rounded-md border border-red-500/15 bg-red-500/[0.05] px-3.5 py-2.5">
                <p className="flex items-center gap-1.5 text-[9px] font-display font-black uppercase tracking-widest text-red-400 mb-1.5">
                  <ShieldAlert size={9} />
                  Top Risk
                </p>
                <p className="text-[12px] text-slate-300 font-sans leading-snug">
                  {narrative.topRisk}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contradictions — subtle inline list, not pill spam */}
        {narrative.contradictions.length > 0 && (
          <div className="mb-4 space-y-1">
            {narrative.contradictions.slice(0, 2).map((c) => (
              <div key={c} className="flex items-start gap-2">
                <AlertCircle size={10} className="text-amber-500/70 mt-[2px] shrink-0" />
                <p className="text-[11px] text-amber-400/70 font-sans leading-snug">{c}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer — regime summary */}
        {narrative.regimeSummary && (
          <div className="pt-3 border-t border-[#1E2D45]">
            <p className="text-[9px] font-display uppercase tracking-[0.12em] text-chrome-600">
              {narrative.regimeSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
