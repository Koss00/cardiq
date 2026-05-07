'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Zap, Clock } from 'lucide-react';
import { IdentifiedCard, EbayListing } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  card: IdentifiedCard;
  fromCache: boolean;
  soldListings: EbayListing[];
  soldLoading: boolean;
  soldFromCache: boolean;
  soldError?: string;
  activeListings: EbayListing[];
  activeLoading: boolean;
  activeFromCache: boolean;
  activeError?: string;
  avgPrice: number | null;
}


export default function CardResult({
  card,
  fromCache,
  soldListings,
  soldLoading,
  soldFromCache,
  soldError,
  activeListings,
  activeLoading,
  activeFromCache,
  activeError,
  avgPrice,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'sold' | 'active'>('sold');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.add('pack-rip');
    const t = setTimeout(() => el.classList.remove('pack-rip'), 600);
    return () => clearTimeout(t);
  }, []);

  const listings  = tab === 'sold' ? soldListings : activeListings;
  const loading   = tab === 'sold' ? soldLoading  : activeLoading;
  const error     = tab === 'sold' ? soldError    : activeError;
  const isCached  = tab === 'sold' ? soldFromCache : activeFromCache;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Identification result */}
      <div className="chrome-panel p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="text-emerald-400" size={16} />
              <span className="text-emerald-400 text-xs font-display font-black uppercase tracking-widest">Card Identified</span>
              {fromCache && (
                <span className="flex items-center gap-1 text-[10px] bg-gold-400/10 text-gold-400 border border-[rgba(245,200,66,0.25)] px-2 py-0.5 rounded-sm font-black uppercase tracking-wider">
                  <Zap size={9} />
                  Cached
                </span>
              )}
            </div>
            <h2 className="font-card text-3xl text-white uppercase tracking-wide">{card.player}</h2>
            <p className="text-slate-400 text-sm">
              {card.year} {card.brand}
              {card.cardNumber && ` #${card.cardNumber}`}
            </p>
            {card.variation && (
              <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider bg-gold-400/10 text-gold-400 border border-[rgba(245,200,66,0.25)] px-2 py-0.5 rounded-sm">
                {card.variation}
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Confidence</p>
            <p
              className={`font-display font-black text-2xl ${
                card.confidence >= 80
                  ? 'text-emerald-400'
                  : card.confidence >= 60
                  ? 'text-gold-400'
                  : 'text-red-400'
              }`}
            >
              {card.confidence}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-navy-700 border border-[rgba(245,200,66,0.1)] rounded-sm p-3">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Sport</p>
            <p className="text-white font-semibold">{card.sport}</p>
          </div>
          <div className="bg-navy-700 border border-[rgba(245,200,66,0.1)] rounded-sm p-3">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Est. Condition</p>
            <p className="text-white font-semibold">{card.condition}</p>
          </div>
          {avgPrice !== null && (
            <div className="foil bg-navy-700 border border-[rgba(245,200,66,0.25)] rounded-sm p-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Avg Sold Price</p>
              <p className="text-gold-400 font-black font-display text-lg">{formatCurrency(avgPrice)}</p>
            </div>
          )}
        </div>

        {card.description && (
          <p className="mt-3 text-sm text-slate-500 italic">{card.description}</p>
        )}
      </div>

      {/* eBay listings with tabs */}
      <div className="chrome-panel p-5">
        {/* Tab header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 bg-navy-800 rounded-sm p-0.5">
            <button
              onClick={() => setTab('sold')}
              className={`px-3 py-1.5 rounded-sm text-[11px] font-display font-black uppercase tracking-widest transition-all ${
                tab === 'sold'
                  ? 'bg-electric text-navy-900'
                  : 'text-chrome-400 hover:text-white'
              }`}
            >
              Recent Sales
            </button>
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-sm text-[11px] font-display font-black uppercase tracking-widest transition-all ${
                tab === 'active'
                  ? 'bg-electric text-navy-900'
                  : 'text-chrome-400 hover:text-white'
              }`}
            >
              Active Listings
            </button>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            )}
            {!loading && isCached && (
              <span className="flex items-center gap-1 text-[10px] bg-gold-400/10 text-gold-400 border border-[rgba(245,200,66,0.25)] px-2 py-0.5 rounded-sm font-black uppercase tracking-wider">
                <Clock size={9} />
                Cached
              </span>
            )}
          </div>
        </div>

        {/* Tab description */}
        <p className="text-chrome-600 text-[10px] font-display uppercase tracking-widest mb-3">
          {tab === 'sold'
            ? 'Recent comps — newly listed fixed price & auction'
            : 'Active fixed-price listings — what sellers are asking now'}
        </p>

        {error && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-sm p-3">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!loading && listings.length === 0 && !error && (
          <p className="text-slate-500 text-sm">No listings found.</p>
        )}

        {listings.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {listings.map((listing, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-[rgba(0,212,255,0.06)] last:border-0"
              >
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-10 h-14 object-cover rounded-sm border border-[rgba(0,212,255,0.12)] flex-shrink-0 bg-navy-700"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-sm border border-[rgba(0,212,255,0.08)] bg-navy-700 flex-shrink-0" />
                )}

                <p className="text-chrome-300 text-xs line-clamp-2 flex-1 font-display leading-snug">{listing.title}</p>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-white font-display font-black text-sm">
                    {formatCurrency(listing.price)}
                  </span>
                  <span className={`text-[10px] font-display font-black uppercase ${tab === 'sold' ? 'text-gold-400' : 'text-emerald-500'}`}>
                    {tab === 'sold' ? 'Comp' : 'Live'}
                  </span>
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-chrome-600 hover:text-electric transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
