'use client';

import { useState } from 'react';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Card, EbayListing, SignalType } from '@/types';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import { useStore } from '@/lib/store';
import CardSilhouette from './CardSilhouette';

const SIGNAL_STYLES: Record<SignalType, { bg: string; text: string }> = {
  BUY:  { bg: 'bg-emerald-500/25', text: 'text-emerald-300' },
  SELL: { bg: 'bg-red-500/25',     text: 'text-red-300'     },
  HOLD: { bg: 'bg-amber-500/25',   text: 'text-amber-300'   },
};

const SPORT_THEMES: Record<string, { bg: string; accentColor: string; svgOpacity: string }> = {
  Baseball:   { bg: 'linear-gradient(155deg, #0D3320 0%, #1E6B3C 45%, #0F1A2E 100%)', accentColor: 'rgba(82,183,136,0.12)',  svgOpacity: 'rgba(100,210,150,0.10)' },
  Basketball: { bg: 'linear-gradient(155deg, #3D1200 0%, #A84000 45%, #0F1A2E 100%)', accentColor: 'rgba(244,162,97,0.12)',  svgOpacity: 'rgba(255,140,60,0.10)'  },
  Football:   { bg: 'linear-gradient(155deg, #0A1E3D 0%, #1E4080 45%, #0F1A2E 100%)', accentColor: 'rgba(100,160,220,0.12)', svgOpacity: 'rgba(120,180,240,0.10)' },
  Hockey:     { bg: 'linear-gradient(155deg, #001635 0%, #004488 45%, #0F1A2E 100%)', accentColor: 'rgba(144,224,239,0.12)', svgOpacity: 'rgba(100,200,240,0.10)' },
  Soccer:     { bg: 'linear-gradient(155deg, #0A2E18 0%, #1A6635 45%, #0F1A2E 100%)', accentColor: 'rgba(149,213,178,0.12)', svgOpacity: 'rgba(100,200,140,0.10)' },
};


// Grade badge styling per grader
const GRADE_STYLES: Record<string, string> = {
  PSA: 'bg-[#003087] text-white border border-[#C8102E]/60',
  BGS: 'bg-black text-[#F5C842] border border-[#F5C842]/50',
  SGC: 'bg-[#E85D04] text-white border border-[#E85D04]',
};

function parseGrade(condition: string): { grader: string; grade: string } | null {
  const m = condition.match(/^(PSA|BGS|SGC)\s+(.+)$/);
  return m ? { grader: m[1], grade: m[2] } : null;
}

interface Props {
  card: Card;
  signal?: SignalType;
}

export default function TradingCard({ card, signal }: Props) {
  const { dispatch } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const roi = calcRoi(card.purchasePrice, card.currentValue);
  const theme = SPORT_THEMES[card.sport] ?? SPORT_THEMES.Baseball;
  const sig = signal ? SIGNAL_STYLES[signal] : null;
  const gradeBadge = parseGrade(card.condition);

  const nameParts = card.player.trim().split(' ');
  const lastName = nameParts.pop() ?? card.player;
  const firstName = nameParts.join(' ');

  async function refreshPrice() {
    setRefreshing(true);
    const query = `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim();
    try {
      const res = await fetch(`/api/ebay-pricing?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.listings?.length > 0) {
        const prices: number[] = data.listings.map((l: EbayListing) => l.price);
        const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        dispatch({ type: 'UPDATE_CARD', id: card.id, updates: { currentValue: Math.round(avg), lastPriceUpdate: new Date().toISOString() } });
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="trading-card group" style={{ aspectRatio: '5 / 7' }}>
      {/* Holo layer + prismatic top strip — activated on hover */}
      <div className="card-holo-layer" />
      <div className="card-top-strip" />

      {/* Card face */}
      <div className="relative z-2 h-full flex flex-col bg-[#0B1828]">

        {/* Top bar: year · brand + grade/variation badge */}
        <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5 flex-shrink-0">
          <span className="text-[8px] font-display font-black uppercase tracking-[0.18em] text-chrome-400">
            {card.year} · {card.brand}
          </span>
          {gradeBadge ? (
            <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${GRADE_STYLES[gradeBadge.grader] ?? 'bg-navy-700 text-chrome-300 border border-chrome-700'}`}>
              {gradeBadge.grader} {gradeBadge.grade}
            </span>
          ) : card.variation ? (
            <span className="text-[7px] font-display font-black uppercase tracking-wider text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded-sm border border-[rgba(245,200,66,0.2)]">
              {card.variation}
            </span>
          ) : null}
        </div>

        {/* Art area — sport gradient + dynamic player silhouette */}
        <div className="flex-1 relative overflow-hidden mx-1.5 rounded-sm" style={{ background: theme.bg }}>
          {/* Dynamic SVG player silhouette */}
          <CardSilhouette player={card.player} sport={card.sport} cardId={card.id} />

          {/* Diagonal light streak overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />

          {/* Accent color wash */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 30% 40%, ${theme.accentColor}, transparent 70%)` }} />

          {/* Player name — overlaid at the bottom of the art area */}
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6 bg-gradient-to-t from-[#0B1828]/90 to-transparent">
            {firstName && (
              <p className="font-display font-black text-[7px] uppercase tracking-[0.2em] text-chrome-300 leading-none mb-0.5">
                {firstName}
              </p>
            )}
            <p className="font-card text-2xl text-white leading-none tracking-wide uppercase">
              {lastName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[7px] font-display font-black uppercase tracking-widest text-chrome-400">
                {card.sport}
              </span>
              {sig && (
                <span className={`text-[7px] font-display font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${sig.bg} ${sig.text}`}>
                  {signal}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-between px-2.5 py-2 flex-shrink-0 border-t border-[rgba(192,200,216,0.08)]">
          <div>
            <p className="text-[7px] font-display font-black uppercase tracking-widest text-chrome-600">Value</p>
            <p className="font-card text-sm text-white leading-tight">{formatCurrency(card.currentValue)}</p>
          </div>
          <div>
            <p className="text-[7px] font-display font-black uppercase tracking-widest text-chrome-600">ROI</p>
            <p className={`font-display font-black text-xs ${roiColor(roi)}`}>{formatPct(roi)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={refreshPrice} disabled={refreshing}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-navy-800 border border-[rgba(0,212,255,0.12)] text-chrome-500 hover:text-electric transition-colors disabled:opacity-40"
            >
              {refreshing ? <Loader2 size={9} className="animate-spin" /> : <RefreshCw size={9} />}
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_CARD', id: card.id })}
              className="w-6 h-6 flex items-center justify-center rounded-sm bg-navy-800 border border-[rgba(255,51,102,0.12)] text-chrome-500 hover:text-prizm-red transition-colors"
            >
              <Trash2 size={9} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
