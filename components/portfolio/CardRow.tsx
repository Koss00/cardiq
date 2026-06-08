'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { Card, EbayListing, SignalType } from '@/types';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import { buildEbayQuery } from '@/lib/ebay-utils';
import { useStore } from '@/lib/store';

const SPORT_BG: Record<string, string> = {
  Baseball:   'linear-gradient(155deg, #0D3320, #1E6B3C)',
  Basketball: 'linear-gradient(155deg, #3D1200, #A84000)',
  Football:   'linear-gradient(155deg, #0A1E3D, #1E4080)',
  Hockey:     'linear-gradient(155deg, #001635, #004488)',
  Soccer:     'linear-gradient(155deg, #0A2E18, #1A6635)',
  Golf:       'linear-gradient(155deg, #1A1A00, #4A4000)',
};

function MiniCard({ card }: { card: Card }) {
  const nameParts = card.player.trim().split(' ');
  const lastName = nameParts.pop() ?? card.player;
  const firstName = nameParts[0] ?? '';
  const initials = (firstName ? firstName[0] : '') + lastName[0];
  const bg = SPORT_BG[card.sport] ?? SPORT_BG.Baseball;
  return (
    <div className="w-9 h-[52px] rounded-sm overflow-hidden flex-shrink-0 border border-[#1E2D45]" style={{ background: bg }}>
      <div className="w-full h-full flex flex-col items-center justify-end pb-1 relative">
        <span className="absolute top-1 left-1 right-1 text-[5px] font-display font-black text-white/40 uppercase tracking-widest truncate leading-none">{card.year}</span>
        <span className="font-card text-white leading-none" style={{ fontSize: '1.1rem' }}>{initials}</span>
      </div>
    </div>
  );
}

const SIGNAL_STYLES: Record<SignalType, string> = {
  BUY: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  SELL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HOLD: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

interface Props {
  card: Card;
  signal?: SignalType;
}

export default function CardRow({ card, signal }: Props) {
  const { dispatch } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const roi = calcRoi(card.purchasePrice, card.currentValue);
  const gain = card.currentValue - card.purchasePrice;

  async function refreshPrice() {
    setRefreshing(true);
    const query = buildEbayQuery(card.year, card.brand, card.player, card.variation, card.condition);
    try {
      const res = await fetch(`/api/ebay-pricing?q=${encodeURIComponent(query)}&player=${encodeURIComponent(card.player)}`);
      const data = await res.json();
      if (data.listings?.length > 0) {
        const prices: number[] = data.listings.map((l: EbayListing) => l.price);
        const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        dispatch({
          type: 'UPDATE_CARD',
          id: card.id,
          updates: {
            currentValue: Math.round(avg),
            lastPriceUpdate: new Date().toISOString(),
          },
        });
      }
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <tr className="border-b border-[#1E2D45] hover:bg-[#111D33]/80 transition-colors">
      {/* Card info */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Link href={`/portfolio/${card.id}`} className="flex-shrink-0">
            <MiniCard card={card} />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/portfolio/${card.id}`}
              className="group flex items-center gap-1.5"
            >
              <p className="font-display font-semibold text-base text-white leading-tight group-hover:text-gold-400 transition-colors">{card.player}</p>
              <ExternalLink size={10} className="text-chrome-700 group-hover:text-gold-400 transition-colors flex-shrink-0" />
            </Link>
            <p className="text-chrome-500 text-xs mt-0.5 font-display">
              {card.year} {card.brand}
              {card.cardNumber && ` #${card.cardNumber}`}
            </p>
            {card.variation && (
              <span className="inline-block mt-1 text-[10px] font-display font-black uppercase tracking-wider text-gold-400 bg-gold-400/10 border border-[rgba(245,200,66,0.2)] px-1.5 py-0.5 rounded-sm">
                {card.variation}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Sport */}
      <td className="py-3.5 px-4 text-chrome-400 text-xs font-display font-black uppercase tracking-widest hidden md:table-cell">{card.sport}</td>

      {/* Condition */}
      <td className="py-3.5 px-4">
        <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-chrome-300 bg-[#111D33] border border-[#1E2D45] px-2 py-1 rounded-md">{card.condition}</span>
      </td>

      {/* Purchase Price */}
      <td className="py-3.5 px-4 text-chrome-300 text-sm font-display">{formatCurrency(card.purchasePrice)}</td>

      {/* Current Value */}
      <td className="py-3.5 px-4">
        <p className="text-white font-display font-black text-sm">{formatCurrency(card.currentValue)}</p>
        {card.lastPriceUpdate && (
          <p className="text-chrome-600 text-xs font-display">
            {new Date(card.lastPriceUpdate).toLocaleDateString()}
          </p>
        )}
      </td>

      {/* ROI */}
      <td className="py-3.5 px-4">
        <p className={`font-display font-black text-sm ${roiColor(roi)}`}>{formatPct(roi)}</p>
        <p className={`text-xs font-display ${roiColor(gain)}`}>
          {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
        </p>
      </td>

      {/* Signal */}
      <td className="py-3.5 px-4">
        {signal ? (
          <span className={`text-[10px] font-display font-black uppercase tracking-widest px-2 py-1 rounded-sm ${SIGNAL_STYLES[signal]}`}>
            {signal}
          </span>
        ) : (
          <span className="text-chrome-700 text-xs">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPrice}
            disabled={refreshing}
            title="Refresh eBay price"
            className="w-7 h-7 flex items-center justify-center rounded-md bg-[#111D33] border border-[#1E2D45] hover:border-[rgba(0,212,170,0.3)] text-chrome-400 hover:text-electric transition-colors disabled:opacity-50 cursor-pointer"
          >
            {refreshing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
          </button>
          <button
            onClick={() => dispatch({ type: 'REMOVE_CARD', id: card.id })}
            title="Remove card"
            className="w-7 h-7 flex items-center justify-center rounded-md bg-[#111D33] border border-[rgba(255,77,77,0.15)] hover:border-[rgba(255,77,77,0.4)] text-chrome-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}
