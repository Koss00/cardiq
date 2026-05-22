'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Trash2, RefreshCw, Loader2, ExternalLink, Camera } from 'lucide-react';
import { Card, CardSignal, EbayListing, SignalType } from '@/types';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import { useStore } from '@/lib/store';
import CardSilhouette from './CardSilhouette';
import PriceSparkline from '@/components/intelligence/PriceSparkline';

const SIGNAL_STYLES: Record<SignalType, { bg: string; text: string; border: string }> = {
  BUY:  { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  SELL: { bg: 'bg-red-500/20',     text: 'text-red-300',     border: 'border-red-500/30'     },
  HOLD: { bg: 'bg-amber-500/20',   text: 'text-amber-300',   border: 'border-amber-500/30'   },
};

const SPORT_THEMES: Record<string, { bg: string; accentColor: string }> = {
  Baseball:   { bg: 'linear-gradient(155deg, #0D3320 0%, #1E6B3C 45%, #0F1A2E 100%)', accentColor: 'rgba(82,183,136,0.12)'  },
  Basketball: { bg: 'linear-gradient(155deg, #3D1200 0%, #A84000 45%, #0F1A2E 100%)', accentColor: 'rgba(244,162,97,0.12)'  },
  Football:   { bg: 'linear-gradient(155deg, #0A1E3D 0%, #1E4080 45%, #0F1A2E 100%)', accentColor: 'rgba(100,160,220,0.12)' },
  Hockey:     { bg: 'linear-gradient(155deg, #001635 0%, #004488 45%, #0F1A2E 100%)', accentColor: 'rgba(144,224,239,0.12)' },
  Soccer:     { bg: 'linear-gradient(155deg, #0A2E18 0%, #1A6635 45%, #0F1A2E 100%)', accentColor: 'rgba(149,213,178,0.12)' },
};

const GRADE_STYLES: Record<string, string> = {
  PSA: 'bg-[#003087] text-white border border-[#C8102E]/60',
  BGS: 'bg-black text-[#F5C842] border border-[#F5C842]/50',
  SGC: 'bg-[#E85D04] text-white border border-[#E85D04]',
};

function parseGrade(condition: string): { grader: string; grade: string } | null {
  const m = condition.match(/^(PSA|BGS|SGC)\s+(.+)$/);
  return m ? { grader: m[1], grade: m[2] } : null;
}

function Divider() {
  return (
    <div
      className="h-px flex-shrink-0 my-2"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.45), transparent)' }}
    />
  );
}

interface Props {
  card: Card;
  signal?: SignalType;
  cardSignal?: CardSignal;
}

export default function TradingCard({ card, signal, cardSignal }: Props) {
  const { dispatch } = useStore();
  const [flipped, setFlipped]       = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardPhoto, setCardPhoto]   = useState<string | null>(null);
  const photoInputRef               = useRef<HTMLInputElement>(null);

  const roi        = calcRoi(card.purchasePrice, card.currentValue);
  const theme      = SPORT_THEMES[card.sport] ?? SPORT_THEMES.Baseball;
  const sig        = signal ? SIGNAL_STYLES[signal] : null;
  const gradeBadge = parseGrade(card.condition);

  const nameParts = card.player.trim().split(' ');
  const lastName  = nameParts.pop() ?? card.player;
  const firstName = nameParts.join(' ');

  const printRunMatch = card.variation?.match(/\/(\d+)/);
  const printRun = printRunMatch ? `/${printRunMatch[1]}` : null;
  const parallel = card.variation ? card.variation.replace(/\/\d+/, '').trim() || null : null;

  const details: Array<{ label: string; value: string }> = [
    { label: 'Brand',  value: card.brand },
    { label: 'Year',   value: String(card.year) },
    { label: 'Number', value: card.cardNumber ? `#${card.cardNumber}` : '—' },
    { label: 'Sport',  value: card.sport },
    { label: 'Grade',  value: card.condition },
  ];
  if (printRun) details.push({ label: 'Print Run', value: printRun });
  if (parallel) details.push({ label: 'Parallel',  value: parallel });

  useEffect(() => {
    const stored = localStorage.getItem(`cardiq:photo:${card.id}`);
    if (stored) setCardPhoto(stored);
  }, [card.id]);

  function handlePhotoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      localStorage.setItem(`cardiq:photo:${card.id}`, dataUrl);
      setCardPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  const refreshPrice = useCallback(async () => {
    setRefreshing(true);
    const query = `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim();
    try {
      const res  = await fetch(`/api/ebay-pricing?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.listings?.length > 0) {
        const prices: number[] = data.listings.map((l: EbayListing) => l.price);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        dispatch({ type: 'UPDATE_CARD', id: card.id, updates: { currentValue: Math.round(avg), lastPriceUpdate: new Date().toISOString() } });
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, [card.id, card.year, card.brand, card.player, card.variation, dispatch]);

  function handleRemove() {
    localStorage.removeItem(`cardiq:photo:${card.id}`);
    dispatch({ type: 'REMOVE_CARD', id: card.id });
  }

  function handleFlip(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-flip]')) return;
    setIsFlipping(true);
    setFlipped((f) => !f);
    setTimeout(() => setIsFlipping(false), 700);
  }

  return (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoFile(file);
          e.target.value = '';
        }}
      />

      {/* 5:7 ratio matches a real trading card; shorter than previous 5:9 */}
      <div
        className={`card-flip-wrapper${isFlipping ? ' is-flipping' : ''}`}
        style={{ aspectRatio: '5 / 7' }}
        onClick={handleFlip}
      >
        <div className="card-flip-scene">
          <div className={`card-flip-inner${flipped ? ' is-flipped' : ''}`}>

            {/* ── FRONT FACE ─────────────────────────────────────────────── */}
            <div className="card-face card-face-front trading-card">
              <div className="card-holo-layer" />
              <div className="card-top-strip" />

              <div className="relative z-[2] h-full flex flex-col bg-[#0B1828]">
                {/* Top bar */}
                <div className="flex items-center justify-between px-2 pt-2 pb-1 flex-shrink-0">
                  <span style={{ fontSize: '7px' }} className="font-display font-black uppercase tracking-[0.18em] text-chrome-400">
                    {card.year} · {card.brand}
                  </span>
                  {gradeBadge ? (
                    <span style={{ fontSize: '6px' }} className={`font-black uppercase tracking-wider px-1 py-0.5 rounded-sm ${GRADE_STYLES[gradeBadge.grader] ?? 'bg-navy-700 text-chrome-300 border border-chrome-700'}`}>
                      {gradeBadge.grader} {gradeBadge.grade}
                    </span>
                  ) : card.variation ? (
                    <span style={{ fontSize: '6px' }} className="font-display font-black uppercase tracking-wider text-gold-400 bg-gold-400/10 px-1 py-0.5 rounded-sm border border-[rgba(245,200,66,0.2)]">
                      {card.variation}
                    </span>
                  ) : null}
                </div>

                {/* Art area — capped at 220px so it stays proportional in 5-col grid */}
                <div
                  className="relative overflow-hidden mx-1.5 rounded-sm flex-1"
                  style={{ background: theme.bg, maxHeight: '220px' }}
                >
                  {cardPhoto ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardPhoto}
                        alt={card.player}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        data-no-flip
                        onClick={() => photoInputRef.current?.click()}
                        title="Update photo"
                        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-black/60 border border-white/20 rounded-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <Camera size={8} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <button
                      data-no-flip
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-1.5 text-chrome-600 hover:text-chrome-300 transition-colors w-full"
                    >
                      <Camera size={18} />
                      <span style={{ fontSize: '7px' }} className="font-display font-black uppercase tracking-[0.18em]">Add Photo</span>
                    </button>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 30% 40%, ${theme.accentColor}, transparent 70%)` }} />
                  <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '50%', background: 'linear-gradient(to top, #0B1828 0%, rgba(11,24,40,0.55) 40%, transparent 100%)' }} />

                  {/* Player name */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pointer-events-none">
                    {firstName && (
                      <p style={{ fontSize: '6px' }} className="font-display font-black uppercase tracking-[0.2em] text-chrome-300 leading-none mb-0.5">{firstName}</p>
                    )}
                    <p className="font-card text-xl text-white leading-none tracking-wide uppercase">{lastName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span style={{ fontSize: '6px' }} className="font-display font-black uppercase tracking-widest text-chrome-400">{card.sport}</span>
                      {sig && (
                        <span style={{ fontSize: '6px' }} className={`font-display font-black uppercase tracking-widest px-1 py-0.5 rounded-sm ${sig.bg} ${sig.text}`}>{signal}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats footer */}
                <div className="flex items-center justify-between px-2 py-1.5 flex-shrink-0 border-t border-[rgba(192,200,216,0.08)]">
                  <div>
                    <p style={{ fontSize: '6px' }} className="font-display font-black uppercase tracking-widest text-chrome-600">Value</p>
                    <p className="font-card text-xs text-white leading-tight">{formatCurrency(card.currentValue)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '6px' }} className="font-display font-black uppercase tracking-widest text-chrome-600">ROI</p>
                    <p style={{ fontSize: '10px' }} className={`font-display font-black ${roiColor(roi)}`}>{formatPct(roi)}</p>
                  </div>
                  <div className="flex items-center gap-1" data-no-flip>
                    <button onClick={refreshPrice} disabled={refreshing} title="Refresh price"
                      className="w-5 h-5 flex items-center justify-center rounded-sm bg-navy-800 border border-[#1E2D45] text-chrome-500 hover:text-electric transition-colors disabled:opacity-40">
                      {refreshing ? <Loader2 size={8} className="animate-spin" /> : <RefreshCw size={8} />}
                    </button>
                    <button onClick={handleRemove} title="Remove card"
                      className="w-5 h-5 flex items-center justify-center rounded-sm bg-navy-800 border border-[rgba(255,51,102,0.12)] text-chrome-500 hover:text-red-400 transition-colors">
                      <Trash2 size={8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BACK FACE ──────────────────────────────────────────────── */}
            <div className="card-face card-face-back trading-card">
              <div className="card-holo-layer" />
              <div className="card-top-strip" />

              <div className="relative z-[2] h-full flex flex-col bg-[#0A1628] overflow-hidden">

                {/* ── Scrollable body ─────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pt-3 space-y-0">

                  {/* Player name */}
                  <div>
                    <p className="font-card text-lg text-white uppercase leading-tight tracking-wide truncate">{card.player}</p>
                    <p className="font-display font-black uppercase text-chrome-500 mt-0.5" style={{ fontSize: '8px', letterSpacing: '1.5px' }}>
                      {card.year} · {card.brand}
                    </p>
                  </div>

                  <Divider />

                  {/* Card details — 2-column grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {details.map(({ label, value }) => (
                      <div key={label} className="min-w-0">
                        <p className="font-display font-black uppercase text-chrome-500 leading-none mb-0.5" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>{label}</p>
                        <p className="font-display font-bold text-white leading-tight truncate" style={{ fontSize: '14px' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <Divider />

                  {/* Financials */}
                  <div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="rounded-sm px-2 py-1.5 text-center" style={{ background: 'rgba(9,18,36,0.9)', border: '1px solid rgba(192,200,216,0.1)' }}>
                        <p className="font-display font-black uppercase text-chrome-500 mb-0.5" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Paid</p>
                        <p className="font-display font-black text-chrome-300 leading-none" style={{ fontSize: '18px' }}>{formatCurrency(card.purchasePrice)}</p>
                      </div>
                      <div className="rounded-sm px-2 py-1.5 text-center" style={{ background: 'rgba(9,18,36,0.9)', border: '1px solid rgba(0,212,170,0.2)' }}>
                        <p className="font-display font-black uppercase text-chrome-500 mb-0.5" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Value</p>
                        <p className="font-display font-black text-white leading-none" style={{ fontSize: '18px' }}>{formatCurrency(card.currentValue)}</p>
                      </div>
                    </div>

                    {/* ROI */}
                    <div className="text-center mb-2">
                      <p className={`font-display font-black leading-none ${roiColor(roi)}`} style={{ fontSize: '30px' }}>{formatPct(roi)}</p>
                      <p className="font-display font-black uppercase text-chrome-500 mt-0.5" style={{ fontSize: '9px', letterSpacing: '1.5px' }}>Return on Investment</p>
                    </div>

                    {/* Signal */}
                    {sig && signal && (
                      <div className={`rounded-sm py-1.5 px-2 text-center border ${sig.bg} ${sig.border}`}>
                        <p className="font-display font-black uppercase text-chrome-500 mb-0.5" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Signal</p>
                        <p className={`font-display font-black uppercase leading-none ${sig.text}`} style={{ fontSize: '13px' }}>{signal}</p>
                      </div>
                    )}
                  </div>

                  {/* Sparkline */}
                  {cardSignal?.priceHistory && cardSignal.priceHistory.length >= 2 && (
                    <>
                      <Divider />
                      <div data-no-flip>
                        <PriceSparkline
                          points={cardSignal.priceHistory}
                          cardId={card.id}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Bottom padding so last item isn't flush against footer */}
                  <div className="h-2" />
                </div>

                {/* ── Pinned footer ────────────────────────────────── */}
                <div className="flex-shrink-0 px-3 pb-2 pt-1 border-t border-[rgba(245,200,66,0.2)] bg-[#0A1628]">
                  {/* CTA */}
                  <Link
                    href={`/portfolio/${card.id}`}
                    data-no-flip
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-sm btn-gold font-display font-black uppercase mb-1.5"
                    style={{ fontSize: '9px', letterSpacing: '1.5px' }}
                  >
                    <ExternalLink size={9} />
                    View Full Details
                  </Link>

                  {/* Utility */}
                  <div className="flex gap-1.5" data-no-flip>
                    <button
                      onClick={refreshPrice}
                      disabled={refreshing}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-sm bg-navy-800 border border-[#1E2D45] text-chrome-400 hover:text-electric font-display font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                      style={{ fontSize: '8px' }}
                    >
                      {refreshing ? <Loader2 size={7} className="animate-spin" /> : <RefreshCw size={7} />}
                      Refresh
                    </button>
                    <button
                      onClick={handleRemove}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded-sm bg-navy-800 border border-[rgba(255,51,102,0.12)] text-chrome-400 hover:text-red-400 font-display font-black uppercase tracking-widest transition-colors"
                      style={{ fontSize: '8px' }}
                    >
                      <Trash2 size={7} />
                      Remove
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
