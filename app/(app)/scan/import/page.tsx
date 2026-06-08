'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Upload, Download, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card, Condition, Sport } from '@/types';
import { generateId } from '@/lib/utils';
import UpgradeModal from '@/components/upgrade/UpgradeModal';

const TEMPLATE_HEADERS = ['player','year','brand','variation','condition','sport','purchase_price','current_value','card_number'];
const CONDITIONS: Condition[] = ['Raw','PSA 10','PSA 9','PSA 8','PSA 7','BGS 9.5','BGS 9','SGC 10'];
const SPORTS: Sport[]         = ['Baseball','Basketball','Football','Hockey','Soccer','Golf'];

const TEMPLATE_CSV = [
  TEMPLATE_HEADERS.join(','),
  'Patrick Mahomes,2023,Panini Prizm,Silver Refractor,PSA 10,Football,150.00,280.00,88',
  'Victor Wembanyama,2023,Panini Prizm,,Raw,Basketball,50.00,95.00,',
  'Shohei Ohtani,2022,Topps,,Raw,Baseball,30.00,65.00,',
].join('\n');

interface ParsedRow {
  player: string;
  year: string;
  brand: string;
  variation?: string;
  condition?: string;
  sport?: string;
  purchase_price?: string;
  current_value?: string;
  card_number?: string;
  [key: string]: string | undefined;
}

interface PreviewRow {
  player: string;
  year: number;
  brand: string;
  variation?: string;
  condition: Condition;
  sport: Sport;
  purchasePrice: number;
  currentValue: number;
  cardNumber?: string;
  error?: string;
}

function parseRow(raw: ParsedRow): PreviewRow {
  const errors: string[] = [];
  if (!raw.player?.trim()) errors.push('missing player');
  const year = parseInt(raw.year ?? '', 10);
  if (isNaN(year) || year < 1900 || year > 2100) errors.push('invalid year');
  if (!raw.brand?.trim()) errors.push('missing brand');

  const condition = CONDITIONS.includes(raw.condition as Condition)
    ? raw.condition as Condition
    : 'Raw';
  const sport = SPORTS.includes(raw.sport as Sport)
    ? raw.sport as Sport
    : 'Baseball';

  return {
    player:        raw.player?.trim() ?? '',
    year:          isNaN(year) ? 0 : year,
    brand:         raw.brand?.trim() ?? '',
    variation:     raw.variation?.trim() || undefined,
    condition,
    sport,
    purchasePrice: parseFloat(raw.purchase_price ?? '0') || 0,
    currentValue:  parseFloat(raw.current_value  ?? '0') || 0,
    cardNumber:    raw.card_number?.trim() || undefined,
    error:         errors.length ? errors.join(', ') : undefined,
  };
}

export default function ImportPage() {
  const router = useRouter();
  const { dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview]       = useState<PreviewRow[]>([]);
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleFile(file: File) {
    Papa.parse<ParsedRow>(file, {
      header:            true,
      skipEmptyLines:    true,
      transformHeader:   (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: ({ data }) => {
        setPreview(data.map(parseRow));
        setResult(null);
      },
    });
  }

  const validRows  = preview.filter((r) => !r.error);
  const invalidRows = preview.filter((r) => r.error);

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);

    const now = new Date().toISOString();
    const cards: Card[] = validRows.map((r) => ({
      id:              generateId(),
      player:          r.player,
      year:            r.year,
      brand:           r.brand,
      variation:       r.variation,
      condition:       r.condition,
      sport:           r.sport,
      purchasePrice:   r.purchasePrice,
      currentValue:    r.currentValue,
      cardNumber:      r.cardNumber,
      addedAt:         now,
      lastPriceUpdate: now,
    }));

    try {
      const res = await fetch('/api/portfolio/bulk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cards }),
      });

      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }

      const data = await res.json() as {
        imported: number; skipped: number; errors: string[];
        upgradeRequired?: boolean;
      };

      if (data.upgradeRequired) {
        setShowUpgrade(true);
        return;
      }

      // Dispatch imported cards to local store (bulk API already saved them to DB,
      // so we use a raw dispatch — not syncDispatch — to avoid a second round of API calls)
      const importedCards = cards.slice(0, data.imported);
      importedCards.forEach((card) => dispatch({ type: 'ADD_CARD', card }));

      setResult({ imported: data.imported, skipped: data.skipped, errors: data.errors });

      if (data.imported > 0) {
        setTimeout(() => router.push('/portfolio'), 2000);
      }
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ['Network error — please try again.'] });
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'cardiq-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in-up">
      {showUpgrade && <UpgradeModal reason="CARD_LIMIT" onClose={() => setShowUpgrade(false)} />}

      <div>
        <Link href="/scan" className="flex items-center gap-1.5 text-chrome-500 hover:text-chrome-300 text-xs font-display uppercase tracking-widest mb-4 transition-colors">
          <ArrowLeft size={11} /> Back to Scan
        </Link>
        <h1 className="section-accent font-card text-5xl uppercase tracking-widest">
          <span className="title-gold">Import Cards</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-sans">
          Upload a CSV to add up to 200 cards at once.
        </p>
      </div>

      {/* Step 1 — download template */}
      <div className="chrome-panel p-5">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400 mb-3">
          Step 1 — Download Template
        </p>
        <p className="text-sm text-slate-400 font-sans mb-4 leading-relaxed">
          Start with our template CSV. Fill in your cards, then upload below.
          Condition must be one of: {CONDITIONS.join(', ')}.
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 btn-ghost px-4 py-2 font-black text-xs uppercase tracking-widest rounded-sm"
        >
          <Download size={13} /> Download Template
        </button>
      </div>

      {/* Step 2 — upload */}
      <div className="chrome-panel p-5">
        <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400 mb-3">
          Step 2 — Upload Your CSV
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 w-full border-2 border-dashed border-[#1E2D45] hover:border-[rgba(245,200,66,0.3)] rounded-md p-6 text-left transition-all duration-200 cursor-pointer group"
        >
          <Upload size={22} className="text-chrome-600 group-hover:text-chrome-300 transition-colors flex-shrink-0" />
          <div>
            <p className="text-white font-display font-black text-sm uppercase tracking-widest">
              {preview.length > 0 ? `${preview.length} rows loaded — click to replace` : 'Click to upload CSV'}
            </p>
            <p className="text-chrome-500 text-xs font-sans mt-0.5">CSV format · max 200 rows</p>
          </div>
        </button>
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="chrome-panel overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1E2D45] flex items-center justify-between">
            <p className="text-[10px] font-display font-black uppercase tracking-widest text-chrome-400">
              Preview — {validRows.length} valid · {invalidRows.length} errors
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-[#1E2D45]">
                  {['Player','Year','Brand','Variation','Condition','Sport','Purchase $','Current $'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[9px] font-display font-black uppercase tracking-widest text-chrome-500">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className={`border-b border-[#1E2D45] ${row.error ? 'bg-red-500/[0.05]' : ''}`}>
                    <td className="px-3 py-2 text-white font-medium">{row.player || '—'}</td>
                    <td className="px-3 py-2 text-chrome-400">{row.year || '—'}</td>
                    <td className="px-3 py-2 text-chrome-400">{row.brand || '—'}</td>
                    <td className="px-3 py-2 text-chrome-500">{row.variation || '—'}</td>
                    <td className="px-3 py-2 text-chrome-400">{row.condition}</td>
                    <td className="px-3 py-2 text-chrome-400">{row.sport}</td>
                    <td className="px-3 py-2 text-chrome-400">${row.purchasePrice.toFixed(0)}</td>
                    <td className="px-3 py-2 text-chrome-400">${row.currentValue.toFixed(0)}</td>
                    <td className="px-3 py-2">
                      {row.error
                        ? <span className="text-red-400 text-[10px]">{row.error}</span>
                        : <CheckCircle size={12} className="text-emerald-400" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="px-5 py-2 text-[10px] text-chrome-600 font-display">
                …and {preview.length - 20} more rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import button */}
      {validRows.length > 0 && !result && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="btn-gold flex items-center justify-center gap-2 w-full py-3 font-black text-sm uppercase tracking-widest rounded-sm disabled:opacity-50"
        >
          {importing
            ? <><Loader2 size={14} className="animate-spin" /> Importing…</>
            : <><Upload size={14} /> Import {validRows.length} Card{validRows.length !== 1 ? 's' : ''}</>
          }
        </button>
      )}

      {/* Result */}
      {result && (
        <div className={`chrome-panel p-5 ${result.imported > 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.imported > 0
              ? <CheckCircle size={14} className="text-emerald-400" />
              : <AlertCircle size={14} className="text-red-400" />
            }
            <p className="font-display font-black text-sm uppercase tracking-widest">
              {result.imported > 0
                ? `${result.imported} card${result.imported !== 1 ? 's' : ''} imported — redirecting to portfolio…`
                : 'Import failed'
              }
            </p>
          </div>
          {result.skipped > 0 && (
            <p className="text-amber-400 text-xs font-sans">{result.skipped} cards skipped (plan limit reached)</p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i} className="text-red-400 text-xs font-sans">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
