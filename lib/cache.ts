import crypto from 'crypto';
import { Card, PricePoint } from '@/types';

const EBAY_TTL_MS   = 24 * 60 * 60 * 1000;
const SIGNAL_TTL_MS = 24 * 60 * 60 * 1000;
const STATS_TTL_MS  = 24 * 60 * 60 * 1000;

// ─── In-memory caches (per serverless instance) ───────────────────────────────
// File-based caching doesn't work in Vercel serverless (read-only filesystem).
// Module-level Maps give us the same TTL behaviour within a warm function's lifetime.

const scanCache    = new Map<string, { result: unknown; cardKey: string; cachedAt: number }>();
const ebayCache    = new Map<string, { listings: unknown; source: string; cachedAt: number }>();
const signalCache  = new Map<string, { signal: unknown; cachedAt: number }>();
const statsCache   = new Map<string, { stats: unknown; cachedAt: number }>();

// ─── Hashing ─────────────────────────────────────────────────────────────────

/** MD5 of the raw base64 string — fast, collision-resistant enough for a local cache. */
export function hashImage(base64: string): string {
  return crypto.createHash('md5').update(base64).digest('hex');
}

/**
 * Stable hash of card fields that affect the signal: changing the price or condition
 * will produce a different hash and bypass the cache.
 */
export function hashCard(card: Card): string {
  const key = `${card.player}|${card.year}|${card.brand}|${card.variation ?? ''}|${card.condition}|${card.purchasePrice}|${card.currentValue}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

// ─── Scan cache ───────────────────────────────────────────────────────────────

export function getCachedScan(imageHash: string): unknown | null {
  return scanCache.get(imageHash)?.result ?? null;
}

export function setCachedScan(imageHash: string, result: unknown, cardKey: string) {
  scanCache.set(imageHash, { result, cardKey, cachedAt: Date.now() });
}

// ─── eBay cache ───────────────────────────────────────────────────────────────

export function getCachedEbay(query: string): { listings: unknown; source: string } | null {
  const entry = ebayCache.get(query);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > EBAY_TTL_MS) { ebayCache.delete(query); return null; }
  return { listings: entry.listings, source: entry.source };
}

export function setCachedEbay(query: string, listings: unknown, source: string) {
  ebayCache.set(query, { listings, source, cachedAt: Date.now() });
}

// ─── Signal cache ─────────────────────────────────────────────────────────────

export function getCachedSignal(cardHash: string): unknown | null {
  const entry = signalCache.get(cardHash);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > SIGNAL_TTL_MS) { signalCache.delete(cardHash); return null; }
  return entry.signal;
}

export function setCachedSignal(cardHash: string, signal: unknown) {
  signalCache.set(cardHash, { signal, cachedAt: Date.now() });
}

// ─── Player stats cache ───────────────────────────────────────────────────────

export function getCachedStats(key: string): unknown | null {
  const entry = statsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > STATS_TTL_MS) { statsCache.delete(key); return null; }
  return entry.stats;
}

export function setCachedStats(key: string, stats: unknown) {
  statsCache.set(key, { stats, cachedAt: Date.now() });
}

// ─── Price history ────────────────────────────────────────────────────────────
// Delegates entirely to Neon DB — no local caching needed.

export function recordPriceHistory(key: string, avgPrice: number) {
  import('@/lib/db').then(({ dbRecordPrice }) => dbRecordPrice(key, avgPrice)).catch(() => {});
}

export function getPriceHistory(key: string): PricePoint[] {
  // Sync fallback — actual reads go through dbGetPriceHistory in the signals route.
  void key;
  return [];
}
