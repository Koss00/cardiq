'use client';

import Link from 'next/link';
import { ScanLine, ChevronUp, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import PortfolioStats from '@/components/portfolio/PortfolioStats';
import CardRow from '@/components/portfolio/CardRow';
import TradingCard from '@/components/portfolio/TradingCard';
import { Card, CardSignal, SignalType } from '@/types';
import { calcRoi } from '@/lib/utils';

type SortKey = 'player' | 'purchasePrice' | 'currentValue' | 'roi';
type SortDir = 'asc' | 'desc';

export default function PortfolioPage() {
  const { state } = useStore();
  const { cards, signals } = state;

  const [sortKey, setSortKey] = useState<SortKey>('currentValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const sports = ['All', ...Array.from(new Set(cards.map((c) => c.sport)))];

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  const filtered = cards.filter((c) => sportFilter === 'All' || c.sport === sportFilter);
  const sorted = [...filtered].sort((a, b) => {
    let aVal: number | string, bVal: number | string;
    if (sortKey === 'player')     { aVal = a.player; bVal = b.player; }
    else if (sortKey === 'roi')   { aVal = calcRoi(a.purchasePrice, a.currentValue); bVal = calcRoi(b.purchasePrice, b.currentValue); }
    else                          { aVal = a[sortKey] as number; bVal = b[sortKey] as number; }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronUp size={11} className="text-chrome-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-gold-400" />
      : <ChevronDown size={11} className="text-gold-400" />;
  }

  function signalFor(card: Card): SignalType | undefined {
    return signals.find((s) => s.cardId === card.id)?.signal;
  }

  function cardSignalFor(card: Card): CardSignal | undefined {
    return signals.find((s) => s.cardId === card.id);
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center fade-in-up">
        <h1 className="font-card text-5xl uppercase tracking-widest text-white mb-3">Your Collection</h1>
        <p className="text-slate-400 mb-8 font-sans">Scan your first card to start tracking your collection.</p>
        <Link
          href="/scan"
          className="btn-gold inline-flex items-center gap-2 px-6 py-3 font-display font-black text-sm uppercase tracking-widest"
        >
          <ScanLine size={16} />Scan a Card
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-accent font-card text-5xl uppercase tracking-widest"><span className="title-gold">Collection</span></h1>
          <p className="text-slate-500 text-sm mt-1.5 font-sans">
            {cards.length} card{cards.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[#111D33] border border-[rgba(192,200,216,0.12)] rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gold-400 text-[#060E1C]'
                  : 'text-chrome-500 hover:text-chrome-200 hover:bg-white/[0.04]'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={`px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gold-400 text-[#060E1C]'
                  : 'text-chrome-500 hover:text-chrome-200 hover:bg-white/[0.04]'
              }`}
            >
              <List size={14} />
            </button>
          </div>

          <Link
            href="/scan"
            className="btn-gold flex items-center gap-2 px-4 py-2.5 text-xs font-display font-black uppercase tracking-widest"
          >
            <ScanLine size={14} />Add Card
          </Link>
        </div>
      </div>

      <PortfolioStats cards={cards} />

      {/* ── Sport filter pills ────────────────────────────────────────── */}
      {sports.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => setSportFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                sportFilter === s
                  ? 'bg-gold-400 text-[#060E1C]'
                  : 'bg-[#111D33] border border-[rgba(192,200,216,0.12)] text-chrome-400 hover:text-chrome-100 hover:border-[rgba(192,200,216,0.22)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid view ────────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="portfolio-grid">
          {sorted.map((card) => (
            <TradingCard key={card.id} card={card} signal={signalFor(card)} cardSignal={cardSignalFor(card)} />
          ))}
        </div>
      )}

      {/* ── Table view ───────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="chrome-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(192,200,216,0.07)] bg-[rgba(4,11,22,0.4)]">
                  {[{ key: 'player' as SortKey, label: 'Card' }].map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 cursor-pointer hover:text-chrome-200 select-none uppercase tracking-widest transition-colors duration-200"
                      onClick={() => handleSort(key)}
                    >
                      <span className="flex items-center gap-1">{label} <SortIcon col={key} /></span>
                    </th>
                  ))}
                  <th className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 hidden md:table-cell uppercase tracking-widest">Sport</th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 uppercase tracking-widest">Condition</th>
                  <th
                    className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 cursor-pointer hover:text-chrome-200 select-none uppercase tracking-widest transition-colors duration-200"
                    onClick={() => handleSort('purchasePrice')}
                  >
                    <span className="flex items-center gap-1">Paid <SortIcon col="purchasePrice" /></span>
                  </th>
                  <th
                    className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 cursor-pointer hover:text-chrome-200 select-none uppercase tracking-widest transition-colors duration-200"
                    onClick={() => handleSort('currentValue')}
                  >
                    <span className="flex items-center gap-1">Value <SortIcon col="currentValue" /></span>
                  </th>
                  <th
                    className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 cursor-pointer hover:text-chrome-200 select-none uppercase tracking-widest transition-colors duration-200"
                    onClick={() => handleSort('roi')}
                  >
                    <span className="flex items-center gap-1">ROI <SortIcon col="roi" /></span>
                  </th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 uppercase tracking-widest">Signal</th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-display font-black text-chrome-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((card) => <CardRow key={card.id} card={card} signal={signalFor(card)} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
