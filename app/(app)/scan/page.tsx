'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, RotateCcw } from 'lucide-react';
import PhotoUpload from '@/components/scan/PhotoUpload';
import CardResult from '@/components/scan/CardResult';
import { useStore } from '@/lib/store';
import { IdentifiedCard, EbayListing, Card, Condition, Sport } from '@/types';
import { generateId } from '@/lib/utils';

const CONDITIONS: Condition[] = [
  'Raw', 'PSA 10', 'PSA 9', 'PSA 8', 'PSA 7', 'BGS 9.5', 'BGS 9', 'SGC 10',
];

export default function ScanPage() {
  const router = useRouter();
  const { dispatch } = useStore();

  const [identifying, setIdentifying] = useState(false);
  const [identified, setIdentified] = useState<IdentifiedCard | null>(null);
  const [idError, setIdError] = useState<string | null>(null);

  const [soldListings, setSoldListings] = useState<EbayListing[]>([]);
  const [soldLoading, setSoldLoading] = useState(false);
  const [soldError, setSoldError] = useState<string | undefined>();
  const [soldFromCache, setSoldFromCache] = useState(false);

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

  async function fetchEbayPrices(card: IdentifiedCard) {
    const query = `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim();
    const encoded = encodeURIComponent(query);

    setSoldLoading(true);
    setActiveLoading(true);

    // Fetch sold and active listings in parallel
    const [soldRes, activeRes] = await Promise.allSettled([
      fetch(`/api/ebay-pricing?q=${encoded}`),
      fetch(`/api/ebay-active?q=${encoded}`),
    ]);

    // Sold listings
    try {
      if (soldRes.status === 'fulfilled') {
        const data = await soldRes.value.json();
        if (data.error) setSoldError(data.error);
        setSoldFromCache(data.fromCache ?? false);
        const sold: EbayListing[] = data.listings ?? [];
        setSoldListings(sold);
        if (sold.length > 0) {
          const avg = sold.reduce((sum, l) => sum + l.price, 0) / sold.length;
          setAvgPrice(Math.round(avg));
          setCurrentValue(String(Math.round(avg)));
        }
      }
    } catch {
      setSoldError('Could not load sold listings');
    } finally {
      setSoldLoading(false);
    }

    // Active listings
    try {
      if (activeRes.status === 'fulfilled') {
        const data = await activeRes.value.json();
        if (data.error) setActiveError(data.error);
        setActiveFromCache(data.fromCache ?? false);
        setActiveListings(data.listings ?? []);
      }
    } catch {
      setActiveError('Could not load active listings');
    } finally {
      setActiveLoading(false);
    }
  }

  function handleAddToPortfolio() {
    if (!identified) return;
    setAdding(true);
    const card: Card = {
      id: generateId(),
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
    };
    dispatch({ type: 'ADD_CARD', card });
    router.push('/portfolio');
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
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-accent font-card text-5xl uppercase tracking-widest text-white">Scan a Card</h1>
        <p className="text-chrome-400 mt-1 text-sm font-display">Upload a photo and AI will identify your card and pull live eBay pricing.</p>
      </div>

      {!identified && !identifying && <PhotoUpload onImage={handleImage} />}

      {identifying && (
        <div className="flex flex-col items-center justify-center h-64 chrome-panel gap-4">
          <div className="w-10 h-10 border-2 border-electric border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-display font-black uppercase tracking-widest text-sm">Analyzing card with AI...</p>
          <p className="text-chrome-500 text-xs font-display">This takes a few seconds</p>
        </div>
      )}

      {idError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 text-red-400 text-sm font-display">{idError}</div>
      )}

      {identified && (
        <>
          <CardResult
            card={identified}
            fromCache={fromCache}
            soldListings={soldListings}
            soldLoading={soldLoading}
            soldFromCache={soldFromCache}
            soldError={soldError}
            activeListings={activeListings}
            activeLoading={activeLoading}
            activeFromCache={activeFromCache}
            activeError={activeError}
            avgPrice={avgPrice}
          />
          <div className="chrome-panel p-5 space-y-4">
            <h3 className="font-display font-black text-white uppercase tracking-widest text-sm">Add to Portfolio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-chrome-400 mb-1.5 font-display uppercase tracking-widest">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as Condition)}
                  className="w-full bg-navy-700 border border-[rgba(0,212,255,0.15)] text-white rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-electric transition-colors"
                >
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-chrome-400 mb-1.5 font-display uppercase tracking-widest">Purchase Price ($)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-navy-700 border border-[rgba(0,212,255,0.15)] text-white rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-electric placeholder-chrome-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-chrome-400 mb-1.5 font-display uppercase tracking-widest">
                  Current Value ($){avgPrice && <span className="text-gold-400 ml-1">· eBay avg</span>}
                </label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={currentValue} onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full bg-navy-700 border border-[rgba(0,212,255,0.15)] text-white rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-electric placeholder-chrome-600 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddToPortfolio} disabled={!purchasePrice || adding}
                className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-sm font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={15} />
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 border border-[rgba(0,212,255,0.15)] text-chrome-300 px-5 py-2.5 rounded-sm font-display font-black text-sm uppercase tracking-widest transition-all"
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
