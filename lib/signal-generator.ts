import Anthropic from '@anthropic-ai/sdk';
import { Card, CardSignal, PlayerStats } from '@/types';
import { hashCard, getCachedSignal, setCachedSignal } from './cache';
import { fetchPlayerStats, KNOWN_ACTIVE } from './player-stats';
import { dbGetRecentSignals } from './db';

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

const client = new Anthropic();

export function buildCardDetail(card: Card): string {
  const roi =
    card.purchasePrice === 0
      ? 'N/A'
      : (() => {
          const r = ((card.currentValue - card.purchasePrice) / card.purchasePrice) * 100;
          return `${r >= 0 ? '+' : ''}${r.toFixed(1)}%`;
        })();
  const daysHeld = Math.floor((Date.now() - new Date(card.addedAt).getTime()) / 86400000);
  const grading: Record<string, string> = {
    'PSA 10': 'Gem Mint — top 1-5% of submissions; 3-5× PSA 9 premium',
    'PSA 9': 'Mint — solid, liquid market; eclipsed by PSA 10 in value',
    'PSA 8': 'Near Mint-Mint — moderate discount to PSA 9; slower to flip',
    'PSA 7': 'Near Mint — significantly discounted; limited collector demand',
    'BGS 9.5': 'Gem Mint equivalent — Beckett gold label; preferred by high-end buyers',
    'BGS 9': 'Mint — Beckett standard, respectable grade',
    'SGC 10': 'Pristine — SGC gem mint, growing vintage acceptance',
    Raw: 'Ungraded — grading risk and upside; value depends on submission outcome',
  };
  return [
    `${card.year} ${card.brand} ${card.player}`,
    `  Variation: ${card.variation ?? 'Base'} | Sport: ${card.sport}`,
    `  Condition: ${card.condition} — ${grading[card.condition] ?? card.condition}`,
    `  Purchase: $${card.purchasePrice} | Current: $${card.currentValue} | ROI: ${roi}`,
    `  Days held: ${daysHeld}`,
  ].join('\n');
}

function buildStatsSection(stats: PlayerStats): string {
  const statLine = stats.stats.map((s) => `${s.label}: ${s.value}`).join(' | ');
  const headerLabel = stats.isRetired ? 'CAREER HIGHLIGHTS' : `LIVE ${stats.season} STATS`;
  const lines = [
    `━━━ ${headerLabel} ━━━`,
    `Player: ${stats.playerName}${stats.team ? ` | Team: ${stats.team}` : ''}${stats.source ? ` | Source: ${stats.source}` : ''}`,
    statLine,
  ];
  if (stats.injuryStatus) lines.push(`Injury Status: ${stats.injuryStatus}`);
  if (stats.isRetired) {
    lines.push('NOTE: This player is RETIRED. Stats above are career totals, not current performance.');
    lines.push('For playerContext: emphasize legacy, HOF candidacy, and collectibility over active performance.');
  } else {
    if (stats.knownActive) lines.push('CONFIRMED ACTIVE PLAYER — currently playing, not retired.');
    lines.push('Use these real stats to strengthen the playerContext dimension of your analysis.');
  }
  return lines.join('\n');
}

const FULL_PROMPT = (detail: string, statsSection: string, today: string) =>
  `You are a senior sports card investment analyst. Today: ${today}

━━━ CARD ━━━
${detail}

${statsSection}

Analyze across three dimensions: price trend, player performance, scarcity/grade.
The playerContext dimension MUST incorporate the live stats above if provided.

Return ONLY this JSON object (no markdown, no preamble):
{"player":"Full Name","signal":"BUY|SELL|HOLD","confidence":82,"summary":"one punchy sentence","priceTrend":"2-3 sentences","playerContext":"2-3 sentences referencing actual stats","scarcityNote":"2-3 sentences","priceTarget":350.00,"timeframe":"3-6 months"}`;

/**
 * Non-streaming full signal generation used by the background prefetch.
 * Checks cache first; writes to cache on generation.
 */
export async function generateSignalForCard(card: Card, force = false): Promise<CardSignal | null> {
  const hash = hashCard(card);

  if (!force) {
    // 1. In-memory cache (fast, dies on cold start)
    const cached = getCachedSignal(hash);
    if (cached) {
      const cachedSignal = cached as CardSignal;
      if (cachedSignal.playerStats) return cachedSignal;
      console.log(`[signal] cached signal for "${card.player}" has no playerStats — regenerating`);
    }

    // 2. DB cache (persistent across cold starts — check before calling Claude)
    try {
      const recent = await dbGetRecentSignals(hash, 1);
      if (recent.length > 0) {
        const row = recent[0];
        const ageMs = row.generatedAt ? Date.now() - new Date(row.generatedAt).getTime() : Infinity;
        if (ageMs < 24 * 60 * 60 * 1000) {
          const dbSignal: CardSignal = {
            cardId:           row.cardId,
            player:           row.player,
            signal:           row.signal,
            confidence:       row.confidence,
            summary:          row.summary,
            priceTrend:       row.priceTrend   ?? '',
            playerContext:    row.playerContext ?? '',
            scarcityNote:     row.scarcityNote  ?? '',
            marketContext:    row.marketContext,
            priceTarget:      row.priceTarget,
            timeframe:        row.timeframe,
            wyckoffRegime:    row.wyckoffRegime as CardSignal['wyckoffRegime'],
            marketHeatScore:  row.marketHeatScore,
            evPerDollar:      row.evPerDollar,
            qualityScore:     row.qualityScore,
            qualityRationale: row.qualityRationale,
            generatedAt:      row.generatedAt ?? new Date().toISOString(),
          };
          setCachedSignal(hash, dbSignal);
          return dbSignal;
        }
      }
    } catch {
      // DB unavailable — fall through to Claude generation
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const detail = buildCardDetail(card);

  // Fetch live player stats (non-blocking — signal still generates if stats fail)
  let playerStats: PlayerStats | null = null;
  try {
    playerStats = await fetchPlayerStats(card.player, card.sport);
    if (playerStats) {
      console.log(`[signal] got ${playerStats.stats.length} stats for ${card.player}`);
    }
  } catch (err) {
    console.warn(`[signal] stats fetch skipped for ${card.player}:`, err);
  }

  const isKnownActive = KNOWN_ACTIVE.has(norm(card.player));
  const statsSection = playerStats
    ? buildStatsSection(playerStats)
    : isKnownActive
      ? `━━━ PLAYER STATS ━━━\nCONFIRMED ACTIVE PLAYER — ${card.player} is currently active (not retired). Live stats temporarily unavailable. Do NOT treat as a historical/retired player in your analysis.`
      : '━━━ PLAYER STATS ━━━\nNo live stats available — base analysis on card fundamentals only.';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: FULL_PROMPT(detail, statsSection, today) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const raw = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

  const signal: CardSignal = {
    cardId: card.id,
    player: raw.player ?? card.player,
    signal: raw.signal,
    confidence: raw.confidence,
    summary: raw.summary,
    priceTrend: raw.priceTrend,
    playerContext: raw.playerContext,
    scarcityNote: raw.scarcityNote,
    priceTarget: raw.priceTarget,
    timeframe: raw.timeframe,
    generatedAt: new Date().toISOString(),
    playerStats: playerStats ?? undefined,
  };

  setCachedSignal(hash, signal);
  return signal;
}
