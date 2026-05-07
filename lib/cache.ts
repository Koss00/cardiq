import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Card } from '@/types';

// All cache files live in <project-root>/.cache/
const CACHE_DIR = path.join(process.cwd(), '.cache');
const SCANS_FILE = path.join(CACHE_DIR, 'card-scans.json');
const EBAY_FILE = path.join(CACHE_DIR, 'ebay-pricing.json');
const SIGNALS_FILE = path.join(CACHE_DIR, 'signals.json');
const STATS_FILE = path.join(CACHE_DIR, 'player-stats.json');

const EBAY_TTL_MS = 24 * 60 * 60 * 1000;
const SIGNAL_TTL_MS = 24 * 60 * 60 * 1000;
const STATS_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScanEntry {
  result: unknown;
  cardKey: string; // "Player | Year | Brand" — human-readable
  cachedAt: string;
}

interface EbayEntry {
  listings: unknown;
  cachedAt: string;
}

interface SignalEntry {
  signal: unknown;
  cachedAt: string;
}

interface StatsEntry {
  stats: unknown;
  cachedAt: string;
}

type ScanCache = Record<string, ScanEntry>;
type EbayCache = Record<string, EbayEntry>;
type SignalCache = Record<string, SignalEntry>;
type StatsCache = Record<string, StatsEntry>;

// ─── Low-level helpers ────────────────────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** MD5 of the raw base64 string — fast and collision-resistant enough for a local cache. */
export function hashImage(base64: string): string {
  return crypto.createHash('md5').update(base64).digest('hex');
}

export function getCachedScan(imageHash: string): unknown | null {
  const cache = readJson<ScanCache>(SCANS_FILE, {});
  return cache[imageHash]?.result ?? null;
}

export function setCachedScan(imageHash: string, result: unknown, cardKey: string) {
  const cache = readJson<ScanCache>(SCANS_FILE, {});
  cache[imageHash] = { result, cardKey, cachedAt: new Date().toISOString() };
  writeJson(SCANS_FILE, cache);
}

export function getCachedEbay(query: string): unknown | null {
  const cache = readJson<EbayCache>(EBAY_FILE, {});
  const entry = cache[query];
  if (!entry) return null;
  const ageMs = Date.now() - new Date(entry.cachedAt).getTime();
  if (ageMs > EBAY_TTL_MS) return null; // stale — let caller refresh
  return entry.listings;
}

export function setCachedEbay(query: string, listings: unknown) {
  const cache = readJson<EbayCache>(EBAY_FILE, {});
  cache[query] = { listings, cachedAt: new Date().toISOString() };
  writeJson(EBAY_FILE, cache);
}

/**
 * Stable hash of card fields that affect the signal: changing the price or condition
 * will produce a different hash and bypass the cache.
 */
export function hashCard(card: Card): string {
  const key = `${card.player}|${card.year}|${card.brand}|${card.variation ?? ''}|${card.condition}|${card.purchasePrice}|${card.currentValue}`;
  return crypto.createHash('md5').update(key).digest('hex');
}

export function getCachedSignal(cardHash: string): unknown | null {
  const cache = readJson<SignalCache>(SIGNALS_FILE, {});
  const entry = cache[cardHash];
  if (!entry) return null;
  if (Date.now() - new Date(entry.cachedAt).getTime() > SIGNAL_TTL_MS) return null;
  return entry.signal;
}

export function setCachedSignal(cardHash: string, signal: unknown) {
  const cache = readJson<SignalCache>(SIGNALS_FILE, {});
  cache[cardHash] = { signal, cachedAt: new Date().toISOString() };
  writeJson(SIGNALS_FILE, cache);
}

export function getCachedStats(key: string): unknown | null {
  const cache = readJson<StatsCache>(STATS_FILE, {});
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - new Date(entry.cachedAt).getTime() > STATS_TTL_MS) return null;
  return entry.stats;
}

export function setCachedStats(key: string, stats: unknown) {
  const cache = readJson<StatsCache>(STATS_FILE, {});
  cache[key] = { stats, cachedAt: new Date().toISOString() };
  writeJson(STATS_FILE, cache);
}

/** Returns stats for both cache files — handy for debugging. */
export function getCacheStats() {
  const scans = readJson<ScanCache>(SCANS_FILE, {});
  const ebay = readJson<EbayCache>(EBAY_FILE, {});
  return {
    scanEntries: Object.keys(scans).length,
    ebayEntries: Object.keys(ebay).length,
    scansFile: SCANS_FILE,
    ebayFile: EBAY_FILE,
  };
}
