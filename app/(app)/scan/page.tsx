'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, RotateCcw, Camera, CheckCircle, X, PenLine, ScanLine } from 'lucide-react';
import PhotoUpload from '@/components/scan/PhotoUpload';
import CardResult from '@/components/scan/CardResult';
import { useStore } from '@/lib/store';
import { IdentifiedCard, EbayListing, Card, Condition, Sport } from '@/types';
import { generateId } from '@/lib/utils';
import { buildEbayQuery } from '@/lib/ebay-utils';
import UpgradeModal from '@/components/upgrade/UpgradeModal';

const CONDITIONS: Condition[] = [
  'Raw', 'PSA 10', 'PSA 9', 'PSA 8', 'PSA 7', 'BGS 9.5', 'BGS 9', 'SGC 10',
];

const SPORTS: Sport[] = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Golf'];

const INPUT_BASE =
  'w-full bg-[#111D33] border border-[#1E2D45] text-white rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all duration-200 placeholder-chrome-600';

const SELECT_BASE =
  'w-full bg-[#111D33] border border-[#1E2D45] text-white rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all duration-200';

export default function ScanPage() {
  const router = useRouter();
  const { state, dispatch } = useStore();

  const [mode, setMode] = useState<'scan' | 'manual'>('scan');

  // Manual form state
  const [manualPlayer, setManualPlayer]       = useState('');
  const [manualYear, setManualYear]           = useState('');
  const [manualBrand, setManualBrand]         = useState('');
  const [manualNumber, setManualNumber]       = useState('');
  const [manualVariation, setManualVariation] = useState('');
  const [manualSport, setManualSport]         = useState<Sport>('Baseball');
  const [manualCondition, setManualCondition] = useState<Condition>('Raw');
  const [manualPurchase, setManualPurchase]   = useState('');
  const [manualValue, setManualValue]         = useState('');
  const [manualFetching, setManualFetching]   = useState(false);

  const [identifying, setIdentifying] = useState(false);
  const [identified, setIdentified] = useState<IdentifiedCard | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  const [soldListings, setSoldListings] = useState<EbayListing[]>([]);
  const [soldLoading, setSoldLoading] = useState(false);
  const [soldError, setSoldError] = useState<string | undefined>();
  const [soldFromCache, setSoldFromCache] = useState(false);
  const [soldSource, setSoldSource] = useState<'sold' | 'browse'>('browse');

  const [activeListings, setActiveListings] = useState<EbayListing[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState<string | undefined>();
  const [activeFromCache, setActiveFromCache] = useState(false);

  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const [condition, setCondition] = useState<Condition>('Raw');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [adding, setAdding] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [cardPhoto, setCardPhoto] = useState<string | null>(null);     // base64 preview
  const [cardPhotoFile, setCardPhotoFile] = useState<File | null>(null); // original File for upload
  const cardPhotoInputRef = useRef<HTMLInputElement>(null);

  async function handleImage(base64: string, mediaType: string) {
    setIdentifying(true);
    setIdError(null);
    setIdentified(null);
    setSoldListings([]);
    setActiveListings([]);
    setAvgPrice(null);
    setSoldError(undefined);
    setActiveError(undefined);
    setFromCache(false);
    setSoldFromCache(false);
    setActiveFromCache(false);
    setCardPhoto(null);

    try {
      const res = await fetch('/api/identify-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdentified(data);
      setFromCache(data.fromCache ?? false);
      fetchEbayPrices(data);
    } catch (err) {
      setIdError(err instanceof Error ? err.message : 'Failed to identify card');
    } finally {
      setIdentifying(false);
    }
  }

  async function handleManualAdd() {
    if (!manualPlayer.trim() || !manualYear || !manualBrand.trim()) return;
    setManualFetching(true);
    const fake: IdentifiedCard = {
      player:     manualPlayer.trim(),
      year:       parseInt(manualYear),
      brand:      manualBrand.trim(),
      cardNumber: manualNumber.trim() || undefined,
      variation:  manualVariation.trim() || undefined,
      sport:      manualSport,
      condition:  manualCondition,
      confidence: 100,
      description: `${manualYear} ${manualBrand} ${manualPlayer.trim()}`,
    };
    // Set condition/sport from manual form so portfolio form syncs
    setCondition(manualCondition);
    if (manualPurchase) setPurchasePrice(manualPurchase);
    setIdentified(fake);
    fetchEbayPrices(fake);
    setManualFetching(false);
    setMode('scan'); // switch to result view
  }

  async function fetchEbayPrices(card: IdentifiedCard) {
    const query   = buildEbayQuery(card.year, card.brand, card.player, card.variation);
    const encoded = encodeURIComponent(query);

    setSoldLoading(true);
    setActiveLoading(true);

    const playerParam = `&player=${encodeURIComponent(card.player)}`;
    const [soldRes, activeRes] = await Promise.allSettled([
      fetch(`/api/ebay-sold?q=${encoded}${playerParam}`),
      fetch(`/api/ebay-active?q=${encoded}${playerParam}`),
    ]);

    try {
      if (soldRes.status === 'fulfilled') {
        const data = await soldRes.value.json();
        if (data.error) setSoldError(data.error);
        setSoldFromCache(data.fromCache ?? false);
        setSoldSource(data.source ?? 'browse');
        const sold: EbayListing[] = data.listings ?? [];
        setSoldListings(sold);
        if (sold.length > 0) {
          const avg = sold.reduce((sum, l) => sum + l.price, 0) / sold.length;
          setAvgPrice(Math.round(avg));
          setCurrentValue(String(Math.round(avg)));
        }
      }
    } catch { setSoldError('Could not load sold listings'); }
    finally   { setSoldLoading(false); }

    try {
      if (activeRes.status === 'fulfilled') {
        const data = await activeRes.value.json();
        if (data.error) setActiveError(data.error);
        setActiveFromCache(data.fromCache ?? false);
        setActiveListings(data.listings ?? []);
      }
    } catch { setActiveError('Could not load active listings'); }
    finally   { setActiveLoading(false); }
  }

  async function handleAddToPortfolio() {
    if (!identified) return;

    // Duplicate detection
    const duplicate = state.cards.find(
      (c) =>
        c.player.toLowerCase() === identified.player.toLowerCase() &&
        c.year === identified.year &&
        c.brand.toLowerCase() === identified.brand.toLowerCase() &&
        (c.variation ?? '').toLowerCase() === (identified.variation ?? '').toLowerCase() &&
        c.condition === condition,
    );
    if (duplicate && !window.confirm(`"${identified.player}" (${condition}) is already in your portfolio. Add again?`)) {
      return;
    }

    setAdding(true);
    const cardId = generateId();

    // Upload photo to Vercel Blob (non-blocking — card still adds if upload fails)
    let imageUrl: string | undefined;
    if (cardPhotoFile) {
      try {
        const fd = new FormData();
        fd.append('file', cardPhotoFile);
        fd.append('cardId', cardId);
        const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: fd });
        if (uploadRes.ok) {
          const data = await uploadRes.json() as { url: string };
          imageUrl = data.url;
        }
      } catch { /* non-blocking — card still adds without photo */ }
    }

    const card: Card = {
      id: cardId,
      player: identified.player,
      year: identified.year,
      brand: identified.brand,
      cardNumber: identified.cardNumber,
      variation: identified.variation,
      sport: identified.sport as Sport,
      condition,
      purchasePrice: parseFloat(purchasePrice) || 0,
      currentValue: parseFloat(currentValue) || avgPrice || 0,
      addedAt: new Date().toISOString(),
      lastPriceUpdate: new Date().toISOString(),
      imageUrl,
    };
    try {
      // Pre-check the card limit before dispatching (avoids optimistic state pollution)
      const limitCheck = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card }),
      });
      if (limitCheck.status === 402) {
        setAdding(false);
        setShowUpgrade(true);
        return;
      }
      if (!limitCheck.ok) throw new Error(`HTTP ${limitCheck.status}`);
      // Card was saved to DB by the fetch above; now update local store without a second API call
      dispatch({ type: 'ADD_CARD', card });
      router.push('/portfolio');
    } catch (err) {
      console.error('[scan] add to portfolio failed:', err);
      setAdding(false);
    }
  }

  function reset() {
    setIdentified(null);
    setIdError(null);
    setSoldListings([]);
    setActiveListings([]);
    setAvgPrice(null);
    setSoldError(undefined);
    setActiveError(undefined);
    setFromCache(false);
    setSoldFromCache(false);
    setActiveFromCache(false);
    setCondition('Raw');
    setPurchasePrice('');
    setCurrentValue('');
    setAdding(false);
    setCardPhoto(null);
    setCardPhotoFile(null);
    setManualPlayer('');
    setManualYear('');
    setManualBrand('');
    setManualNumber('');
    setManualVariation('');
    setManualSport('Baseball');
    setManualCondition('Raw');
    setManualPurchase('');
    setManualValue('');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in-up">
      {showUpgrade && <UpgradeModal reason="CARD_LIMIT" onClose={() => setShowUpgrade(false)} />}
      <div>
        <h1 className="section-accent font-card text-5xl uppercase tracking-widest"><span className="title-gold">Add a Card</span></h1>
        <p className="text-slate-500 mt-2 text-sm font-sans leading-relaxed">
          Scan a photo for AI identification, or enter card details manually.
        </p>
      </div>

      {/* Mode toggle */}
      {!identified && !identifying && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('scan')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              mode === 'scan'
                ? 'bg-[rgba(245,200,66,0.12)] border border-[rgba(245,200,66,0.35)] text-gold-400'
                : 'bg-[#111D33] border border-[#1E2D45] text-chrome-500 hover:text-chrome-200'
            }`}
          >
            <ScanLine size={12} /> AI Scan
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-display font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              mode === 'manual'
                ? 'bg-[rgba(245,200,66,0.12)] border border-[rgba(245,200,66,0.35)] text-gold-400'
                : 'bg-[#111D33] border border-[#1E2D45] text-chrome-500 hover:text-chrome-200'
            }`}
          >
            <PenLine size={12} /> Manual Entry
          </button>
        </div>
      )}

      {/* Manual entry form */}
      {!identified && !identifying && mode === 'manual' && (
        <div className="chrome-panel p-6 space-y-5">
          <h3 className="font-display font-black text-white uppercase tracking-widest text-sm">Card Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Player Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text" placeholder="e.g. Patrick Mahomes"
                value={manualPlayer} onChange={(e) => setManualPlayer(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number" placeholder="e.g. 2023" min="1900" max={new Date().getFullYear() + 1}
                value={manualYear} onChange={(e) => setManualYear(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Brand / Set <span className="text-red-400">*</span>
              </label>
              <input
                type="text" placeholder="e.g. Topps Prizm"
                value={manualBrand} onChange={(e) => setManualBrand(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Card # (optional)
              </label>
              <input
                type="text" placeholder="e.g. #87"
                value={manualNumber} onChange={(e) => setManualNumber(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Variation (optional)
              </label>
              <input
                type="text" placeholder="e.g. Silver Refractor"
                value={manualVariation} onChange={(e) => setManualVariation(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">Sport</label>
              <select value={manualSport} onChange={(e) => setManualSport(e.target.value as Sport)} className={SELECT_BASE}>
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">Condition</label>
              <select value={manualCondition} onChange={(e) => setManualCondition(e.target.value as Condition)} className={SELECT_BASE}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                Purchase Price ($)
              </label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={manualPurchase} onChange={(e) => setManualPurchase(e.target.value)}
                className={INPUT_BASE}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleManualAdd}
              disabled={manualFetching || !manualPlayer.trim() || !manualYear || !manualBrand.trim()}
              className="btn-gold flex items-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-widest disabled:opacity-40"
            >
              <PlusCircle size={15} />
              {manualFetching ? 'Loading...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {!identified && !identifying && mode === 'scan' && (
        <>
          <PhotoUpload onImage={handleImage} />

          {/* Tips */}
          <div className="chrome-panel px-6 py-5">
            <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-500 mb-4">
              Tips for best results
            </p>
            <ul className="space-y-3">
              {[
                { n: '01', tip: 'Good lighting', detail: 'Natural light or a bright lamp — avoid flash glare directly on the card surface.' },
                { n: '02', tip: 'Lay card flat', detail: 'Place the card on a plain, dark surface. Avoid holding it in your hand to prevent blur.' },
                { n: '03', tip: 'Photograph the back', detail: 'The card back has the most identifying info: set name, card number, and year. AI identifies from the back with highest accuracy.' },
              ].map(({ n, tip, detail }) => (
                <li key={n} className="flex gap-4">
                  <span className="text-[10px] font-card text-gold-500 flex-shrink-0 mt-0.5">{n}</span>
                  <div>
                    <span className="text-sm font-display font-black text-chrome-200 uppercase tracking-wide">{tip}</span>
                    <span className="text-chrome-500 text-sm font-sans"> — {detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Loading state */}
      {identifying && (
        <div className="flex flex-col items-center justify-center h-64 chrome-panel gap-5">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-electric border-t-transparent rounded-full animate-spin" />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.2) 0%, transparent 70%)', filter: 'blur(8px)' }}
            />
          </div>
          <div className="text-center">
            <p className="text-white font-display font-black uppercase tracking-widest text-sm mb-1">
              Analyzing with AI
            </p>
            <p className="text-slate-500 text-xs font-sans">This takes a few seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {idError && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-md p-4 text-red-400 text-sm font-sans leading-relaxed">
          {idError}
        </div>
      )}

      {identified && (
        <>
          <CardResult
            card={identified}
            fromCache={fromCache}
            soldListings={soldListings}
            soldLoading={soldLoading}
            soldFromCache={soldFromCache}
            soldSource={soldSource}
            soldError={soldError}
            activeListings={activeListings}
            activeLoading={activeLoading}
            activeFromCache={activeFromCache}
            activeError={activeError}
            avgPrice={avgPrice}
          />

          {/* Card photo step */}
          <div className="chrome-panel p-6">
            <input
              ref={cardPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCardPhotoFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setCardPhoto(ev.target?.result as string ?? null);
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />

            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display font-black text-white uppercase tracking-widest text-sm">Card Photo</h3>
                <p className="text-slate-500 text-xs font-sans mt-1">
                  Optional — shown on your portfolio card front
                </p>
              </div>
              {cardPhoto && (
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-display font-black uppercase tracking-widest">
                  <CheckCircle size={10} /> Added
                </span>
              )}
            </div>

            {cardPhoto ? (
              <div className="flex items-center gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardPhoto}
                  alt="Card"
                  className="h-28 w-auto object-contain rounded-md border border-[rgba(245,200,66,0.2)]"
                />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => cardPhotoInputRef.current?.click()}
                    className="flex items-center gap-2 text-chrome-400 hover:text-white text-xs font-display font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                  >
                    <Camera size={11} /> Retake Photo
                  </button>
                  <button
                    onClick={() => setCardPhoto(null)}
                    className="flex items-center gap-2 text-chrome-600 hover:text-red-400 text-xs font-display font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                  >
                    <X size={11} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => cardPhotoInputRef.current?.click()}
                className="flex items-center gap-4 w-full group text-left cursor-pointer"
              >
                <div className="w-16 h-16 border-2 border-dashed border-[#1E2D45] rounded-md flex items-center justify-center bg-[#111D33] group-hover:border-[rgba(245,200,66,0.3)] group-hover:bg-[#151F30] transition-all duration-200 flex-shrink-0">
                  <Camera size={22} className="text-chrome-600 group-hover:text-chrome-300 transition-colors duration-200" />
                </div>
                <div>
                  <p className="text-white font-display font-black text-sm uppercase tracking-widest">Add Card Photo</p>
                  <p className="text-slate-500 text-xs font-sans mt-1">JPG or PNG · Optional</p>
                </div>
              </button>
            )}
          </div>

          {/* Portfolio form */}
          <div className="chrome-panel p-6 space-y-5">
            <h3 className="font-display font-black text-white uppercase tracking-widest text-sm">Add to Portfolio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="condition" className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                  Condition
                </label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as Condition)}
                  className={INPUT_BASE}
                >
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="purchasePrice" className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                  Purchase Price ($)
                </label>
                <input
                  id="purchasePrice"
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className={INPUT_BASE}
                />
              </div>
              <div>
                <label htmlFor="currentValue" className="block text-[10px] text-chrome-500 mb-2 font-display font-black uppercase tracking-widest">
                  Current Value ($){avgPrice && <span className="text-gold-400 ml-1.5">· eBay avg</span>}
                </label>
                <input
                  id="currentValue"
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className={INPUT_BASE}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleAddToPortfolio}
                disabled={adding}
                className="btn-gold flex items-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-widest"
              >
                <PlusCircle size={15} />
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </button>
              <button
                onClick={reset}
                className="btn-ghost flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Scan Another
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
