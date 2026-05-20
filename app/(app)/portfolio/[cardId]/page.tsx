'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Edit2, Trash2, RefreshCw, Loader2, ExternalLink,
  Camera, ShieldCheck, X, Check,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { EbayListing } from '@/types';
import { formatCurrency, formatPct, calcRoi, roiColor } from '@/lib/utils';
import PriceHistoryChart from '@/components/portfolio/PriceHistoryChart';
import SignalCard from '@/components/intelligence/SignalCard';
import type { PsaCertData } from '@/app/api/psa-pop/route';

const SPORT_THEMES: Record<string, string> = {
  Baseball:   'linear-gradient(155deg, #0D3320 0%, #1E6B3C 45%, #0F1A2E 100%)',
  Basketball: 'linear-gradient(155deg, #3D1200 0%, #A84000 45%, #0F1A2E 100%)',
  Football:   'linear-gradient(155deg, #0A1E3D 0%, #1E4080 45%, #0F1A2E 100%)',
  Hockey:     'linear-gradient(155deg, #001635 0%, #004488 45%, #0F1A2E 100%)',
  Soccer:     'linear-gradient(155deg, #0A2E18 0%, #1A6635 45%, #0F1A2E 100%)',
  Golf:       'linear-gradient(155deg, #1A1A00 0%, #4A4000 45%, #0F1A2E 100%)',
};

const GRADE_STYLES: Record<string, string> = {
  PSA: 'bg-[#003087] text-white border border-[#C8102E]/50',
  BGS: 'bg-black text-[#F5C842] border border-[#F5C842]/40',
  SGC: 'bg-[#E85D04] text-white border border-[#E85D04]',
};

const ACTION_BTN = 'flex items-center gap-1.5 px-4 py-2 rounded-md border text-[10px] font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer';

const INPUT_BASE =
  'w-full bg-[#0A1628] border border-[rgba(192,200,216,0.14)] rounded-md px-3 py-2.5 text-sm font-sans text-white focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric/30 transition-all duration-200';

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const router     = useRouter();
  const { state, dispatch } = useStore();

  const card   = state.cards.find((c) => c.id === cardId);
  const signal = state.signals.find((s) => s.cardId === cardId);

  const [cardPhoto, setCardPhoto] = useState<string | null>(null);
  const [certInput, setCertInput] = useState('');
  const [psaData, setPsaData]     = useState<PsaCertData | null>(null);
  const [psaLoading, setPsaLoading] = useState(false);

  const [soldListings, setSoldListings]     = useState<EbayListing[]>([]);
  const [activeListings, setActiveListings] = useState<EbayListing[]>([]);
  const [ebayLoading, setEbayLoading]       = useState(false);
  const [refreshing, setRefreshing]         = useState(false);

  const [showEdit, setShowEdit]   = useState(false);
  const [editPaid, setEditPaid]   = useState('');
  const [editValue, setEditValue] = useState('');
  const [showRemove, setShowRemove] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!card) return;
    const photo = localStorage.getItem(`cardiq:photo:${card.id}`);
    if (photo) setCardPhoto(photo);
    const cert = localStorage.getItem(`cardiq:cert:${card.id}`);
    if (cert) setCertInput(cert);
  }, [card]);

  const ebayQuery = card
    ? `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim()
    : '';

  useEffect(() => {
    if (!ebayQuery) return;
    setEbayLoading(true);
    Promise.all([
      fetch(`/api/ebay-pricing?q=${encodeURIComponent(ebayQuery)}`).then((r) => r.json()),
      fetch(`/api/ebay-active?q=${encodeURIComponent(ebayQuery)}`).then((r) => r.json()),
    ])
      .then(([sold, active]) => {
        setSoldListings(sold.listings ?? []);
        setActiveListings(active.listings ?? []);
      })
      .catch(() => {})
      .finally(() => setEbayLoading(false));
  }, [ebayQuery]);

  const refreshPrice = useCallback(async () => {
    if (!card) return;
    setRefreshing(true);
    try {
      const res  = await fetch(`/api/ebay-pricing?q=${encodeURIComponent(ebayQuery)}`);
      const data = await res.json();
      if (data.listings?.length > 0) {
        const prices: number[] = data.listings.map((l: EbayListing) => l.price);
        const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        dispatch({
          type: 'UPDATE_CARD',
          id: card.id,
          updates: { currentValue: Math.round(avg), lastPriceUpdate: new Date().toISOString() },
        });
        setSoldListings(data.listings);
      }
    } catch { /* silent */ }
    finally   { setRefreshing(false); }
  }, [card, ebayQuery, dispatch]);

  function handlePhotoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      localStorage.setItem(`cardiq:photo:${card!.id}`, url);
      setCardPhoto(url);
    };
    reader.readAsDataURL(file);
  }

  async function lookupPsa() {
    const cert = certInput.trim();
    if (!cert || !card) return;
    localStorage.setItem(`cardiq:cert:${card.id}`, cert);
    setPsaLoading(true);
    try {
      const res  = await fetch(`/api/psa-pop?cert=${encodeURIComponent(cert)}`);
      const data = await res.json();
      if (data.data) setPsaData(data.data as PsaCertData);
    } catch { /* silent */ }
    finally   { setPsaLoading(false); }
  }

  function openEdit() {
    if (!card) return;
    setEditPaid(String(card.purchasePrice));
    setEditValue(String(card.currentValue));
    setShowEdit(true);
  }

  function saveEdit() {
    if (!card) return;
    const pp = parseFloat(editPaid);
    const cv = parseFloat(editValue);
    if (!isNaN(pp) && !isNaN(cv)) {
      dispatch({ type: 'UPDATE_CARD', id: card.id, updates: { purchasePrice: pp, currentValue: cv } });
    }
    setShowEdit(false);
  }

  function confirmRemove() {
    if (!card) return;
    localStorage.removeItem(`cardiq:photo:${card.id}`);
    localStorage.removeItem(`cardiq:cert:${card.id}`);
    dispatch({ type: 'REMOVE_CARD', id: card.id });
    router.push('/portfolio');
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-400 mb-5 font-sans">Card not found in your collection.</p>
        <Link href="/portfolio" className="btn-gold px-5 py-2.5 text-xs font-display font-black uppercase tracking-widest">
          Back to Collection
        </Link>
      </div>
    );
  }

  const roi         = calcRoi(card.purchasePrice, card.currentValue);
  const theme       = SPORT_THEMES[card.sport] ?? SPORT_THEMES.Baseball;
  const gradeMatch  = card.condition.match(/^(PSA|BGS|SGC)\s+(.+)$/);
  const grader      = gradeMatch?.[1];
  const grade       = gradeMatch?.[2];
  const hasPriceHistory = signal?.priceHistory && signal.priceHistory.length >= 2;

  return (
    <div className="space-y-6 pb-16 fade-in-up">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePhotoFile(f);
          e.target.value = '';
        }}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs font-display" aria-label="Breadcrumb">
        <Link
          href="/portfolio"
          className="flex items-center gap-1.5 text-chrome-500 hover:text-chrome-200 font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft size={13} />Collection
        </Link>
        <span className="text-chrome-700">/</span>
        <span className="text-chrome-400 truncate font-sans normal-case">{card.player}</span>
      </nav>

      {/* ── Hero panel ──────────────────────────────────────────────── */}
      <div className="chrome-panel overflow-hidden">
        <div className="grid md:grid-cols-[280px_1fr]">

          {/* Card image */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{ background: theme, minHeight: 340 }}
          >
            {cardPhoto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardPhoto}
                  alt={card.player}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D1A30]/50 pointer-events-none" />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-black/60 border border-white/15 text-white/60 hover:text-white text-[9px] font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer backdrop-blur-sm"
                >
                  <Camera size={9} />Change
                </button>
              </>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center gap-3 text-chrome-600 hover:text-chrome-300 transition-colors duration-200 py-14 cursor-pointer"
              >
                <Camera size={34} strokeWidth={1.5} />
                <span className="text-[10px] font-display font-black uppercase tracking-widest">Add Photo</span>
              </button>
            )}
          </div>

          {/* Details */}
          <div className="px-8 py-8 space-y-6 border-l border-[rgba(192,200,216,0.06)]">

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-card text-4xl text-white uppercase tracking-wide leading-tight">
                  {card.player}
                </h1>
                <p className="text-slate-500 text-sm font-sans mt-1.5">
                  {card.year} · {card.brand}
                  {card.cardNumber && ` · #${card.cardNumber}`}
                </p>
                {card.variation && (
                  <span className="inline-block mt-2.5 text-[10px] font-display font-black uppercase tracking-wider text-gold-400 bg-[rgba(245,200,66,0.08)] border border-[rgba(245,200,66,0.18)] px-2.5 py-1 rounded-sm">
                    {card.variation}
                  </span>
                )}
              </div>
              {grader && grade && (
                <div className={`flex-shrink-0 px-4 py-2.5 rounded-md text-center ${GRADE_STYLES[grader] ?? 'bg-[#0D1A30] text-chrome-300 border border-chrome-700'}`}>
                  <p className="text-[8px] font-display font-black uppercase tracking-widest opacity-60 mb-0.5">{grader}</p>
                  <p className="text-2xl font-display font-black leading-tight tabular-nums">{grade}</p>
                </div>
              )}
            </div>

            {/* Financial metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Paid',  value: formatCurrency(card.purchasePrice), cls: 'text-chrome-200', highlight: false },
                { label: 'Value', value: formatCurrency(card.currentValue),  cls: 'text-white',      highlight: true  },
                { label: 'ROI',   value: formatPct(roi),                     cls: roiColor(roi),     highlight: false },
              ].map(({ label, value, cls, highlight }) => (
                <div
                  key={label}
                  className={`rounded-md px-4 py-3.5 text-center ${
                    highlight
                      ? 'bg-[#0A1628] border border-[rgba(0,212,255,0.18)] shadow-electric/5'
                      : 'bg-[#0A1628] border border-[rgba(192,200,216,0.08)]'
                  }`}
                >
                  <p className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-600 mb-1.5">{label}</p>
                  <p className={`font-card text-2xl leading-tight tabular-nums ${cls}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-sans text-chrome-600">
              <span className="font-black uppercase tracking-widest font-display">{card.sport}</span>
              <span className="text-chrome-800">·</span>
              <span>{card.condition}</span>
              {card.lastPriceUpdate && (
                <>
                  <span className="text-chrome-800">·</span>
                  <span>Updated {new Date(card.lastPriceUpdate).toLocaleDateString()}</span>
                </>
              )}
            </div>

            {/* PSA cert lookup */}
            {grader === 'PSA' && (
              <div className="space-y-2.5">
                <p className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-600">
                  PSA Cert Verification
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && lookupPsa()}
                    placeholder="Enter cert number…"
                    aria-label="PSA cert number"
                    className="flex-1 bg-[#0A1628] border border-[rgba(192,200,216,0.12)] rounded-md px-3 py-2 text-xs font-sans text-chrome-300 placeholder:text-chrome-700 focus:outline-none focus:border-electric focus:ring-1 focus:ring-electric/25 transition-all duration-200"
                  />
                  <button
                    onClick={lookupPsa}
                    disabled={!certInput.trim() || psaLoading}
                    className={`${ACTION_BTN} bg-[#0D1A30] border-[rgba(192,200,216,0.14)] text-chrome-400 hover:text-electric disabled:opacity-40`}
                  >
                    {psaLoading ? <Loader2 size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                    Verify
                  </button>
                  {psaData && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-display font-black uppercase tracking-widest">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={refreshPrice}
                disabled={refreshing}
                className={`${ACTION_BTN} bg-[#0D1A30] border-[rgba(192,200,216,0.12)] text-chrome-400 hover:text-electric disabled:opacity-40`}
              >
                {refreshing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                Refresh Price
              </button>
              <button
                onClick={openEdit}
                className={`${ACTION_BTN} bg-[#0D1A30] border-[rgba(192,200,216,0.12)] text-chrome-400 hover:text-white`}
              >
                <Edit2 size={11} />Edit Values
              </button>
              <button
                onClick={() => setShowRemove(true)}
                className={`${ACTION_BTN} bg-[#0D1A30] border-[rgba(255,51,102,0.12)] text-chrome-500 hover:text-red-400 hover:border-red-500/25`}
              >
                <Trash2 size={11} />Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Signal intelligence ─────────────────────────────────────── */}
      {signal && <SignalCard signal={signal} />}
      {!signal && (
        <div className="chrome-panel px-6 py-6 text-center">
          <p className="text-chrome-600 text-sm font-sans italic">
            No intelligence signal yet — visit the Intelligence tab to generate one.
          </p>
        </div>
      )}

      {/* ── Price history ───────────────────────────────────────────── */}
      <div className="chrome-panel px-6 py-6">
        <h2 className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-5">
          Price History
        </h2>
        {hasPriceHistory ? (
          <PriceHistoryChart points={signal!.priceHistory!} cardId={card.id} height={200} />
        ) : (
          <p className="text-chrome-600 text-sm font-sans italic">
            Refresh the price a few times to build a trend line.
          </p>
        )}
      </div>

      {/* ── eBay market ─────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">
        <EbaySection title="eBay Sold Prices"    listings={soldListings}   loading={ebayLoading} valueColor="text-gold-400"  />
        <EbaySection title="Active eBay Listings" listings={activeListings} loading={ebayLoading} valueColor="text-electric" />
      </div>

      {/* ── PSA cert details ────────────────────────────────────────── */}
      {psaData && (
        <div className="chrome-panel px-6 py-6">
          <div className="flex items-center gap-2.5 mb-5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <h2 className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500">
              PSA Cert Verified
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Cert #',  value: psaData.certNumber },
              { label: 'Grade',   value: psaData.grade      },
              { label: 'Subject', value: psaData.subject    },
              { label: 'Year',    value: psaData.year       },
              { label: 'Brand',   value: psaData.brand      },
              { label: 'Card #',  value: psaData.cardNumber },
              ...(psaData.variety ? [{ label: 'Variety', value: psaData.variety }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0A1628] border border-[rgba(192,200,216,0.08)] rounded-md px-3.5 py-3">
                <p className="text-[9px] font-display font-black uppercase tracking-widest text-chrome-600 mb-1">{label}</p>
                <p className="text-chrome-200 text-sm font-sans font-semibold truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit modal ──────────────────────────────────────────────── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060E1C]/90 backdrop-blur-md">
          <div className="chrome-panel w-full max-w-sm p-7 space-y-6 border border-[rgba(0,212,255,0.14)]">
            <div className="flex items-center justify-between">
              <h2 className="font-card text-xl text-white uppercase tracking-wide">Edit Values</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="text-chrome-600 hover:text-chrome-200 transition-colors duration-200 cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Purchase Price ($)', id: 'editPaid',  val: editPaid,  set: setEditPaid  },
                { label: 'Current Value ($)',  id: 'editValue', val: editValue, set: setEditValue  },
              ].map(({ label, id, val, set }) => (
                <div key={id}>
                  <label htmlFor={id} className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-2 block">
                    {label}
                  </label>
                  <input
                    id={id}
                    type="number" min="0" step="0.01"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className={INPUT_BASE}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-2.5 rounded-md bg-[#0D1A30] border border-[rgba(192,200,216,0.12)] text-chrome-400 text-[10px] font-display font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer hover:text-chrome-200"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-2.5 rounded-sm btn-gold text-[10px] font-display font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
              >
                <Check size={11} />Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove modal ────────────────────────────────────────────── */}
      {showRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060E1C]/90 backdrop-blur-md">
          <div className="chrome-panel w-full max-w-sm p-7 space-y-5 border border-red-500/15">
            <h2 className="font-card text-xl text-white uppercase tracking-wide">Remove Card?</h2>
            <p className="text-slate-400 text-sm font-sans leading-relaxed">
              This will permanently remove{' '}
              <span className="text-white font-semibold">{card.player}</span>{' '}
              from your collection. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowRemove(false)}
                className="flex-1 py-2.5 rounded-md bg-[#0D1A30] border border-[rgba(192,200,216,0.12)] text-chrome-400 text-[10px] font-display font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer hover:text-chrome-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-2.5 rounded-md bg-red-500/15 border border-red-500/25 text-red-300 hover:bg-red-500/25 text-[10px] font-display font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={11} />Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EbaySection({
  title, listings, loading, valueColor,
}: {
  title: string; listings: EbayListing[]; loading: boolean; valueColor: string;
}) {
  return (
    <div className="chrome-panel overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(192,200,216,0.06)]">
        <h2 className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500">{title}</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-chrome-700" />
        </div>
      ) : listings.length > 0 ? (
        <div className="divide-y divide-[rgba(192,200,216,0.05)]">
          {listings.slice(0, 5).map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#0F2040] transition-colors duration-200 group cursor-pointer"
            >
              {l.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.imageUrl}
                  alt=""
                  className="w-10 h-10 object-cover rounded-sm flex-shrink-0 opacity-75 group-hover:opacity-100 transition-opacity duration-200"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-chrome-300 text-xs font-sans leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
                  {l.title}
                </p>
                {l.condition && (
                  <p className="text-chrome-600 text-[10px] font-sans mt-0.5">{l.condition}</p>
                )}
              </div>
              <div className={`flex items-center gap-1 ${valueColor} font-sans font-bold text-sm flex-shrink-0 tabular-nums`}>
                {formatCurrency(l.price)}
                <ExternalLink size={9} className="opacity-50" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="px-5 py-6 text-chrome-600 text-sm font-sans italic">No listings found.</p>
      )}
    </div>
  );
}
