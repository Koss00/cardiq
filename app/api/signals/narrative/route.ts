import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import { CardSignal, MarketNarrative } from '@/types';
import {
  dbGetNarrative, dbUpsertNarrative, dbGetSignalWinRate, initSchema,
} from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

const client = new Anthropic();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'narrative', 10);
  if (!rl.allowed) return rateLimitResponse(rl.resetIn);

  let body: { signals?: CardSignal[]; portfolioHash?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { signals, portfolioHash } = body;
  if (!signals || signals.length === 0) {
    return NextResponse.json({ error: 'No signals provided' }, { status: 400 });
  }

  // Compute portfolio hash if not provided by client
  const hash = portfolioHash
    ?? crypto.createHash('md5')
        .update(signals.map((s) => s.cardId).sort().join(':'))
        .digest('hex');

  await initSchema().catch(() => {});

  // Return cached narrative if fresh enough
  try {
    const existing = await dbGetNarrative(hash);
    if (existing?.computedAt) {
      const age = Date.now() - new Date(existing.computedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ narrative: { ...existing, portfolioHash: hash } as MarketNarrative });
      }
    }
  } catch {
    // Cache miss — proceed to generate
  }

  // Fetch win rate for calibration context
  const winRate = await dbGetSignalWinRate(30).catch(() => null);
  const winRateStr = winRate !== null ? `${winRate.toFixed(0)}%` : 'insufficient data';

  const signalLines = signals
    .map((s) => {
      const ev  = s.evPerDollar !== undefined ? `${(s.evPerDollar * 100).toFixed(1)}%` : '?';
      const heat = s.marketHeatScore ?? '?';
      const regime = s.wyckoffRegime ?? '?';
      return `${s.player} (${regime}) — ${s.signal} ${s.confidence}% | Heat: ${heat}/100 | EV: ${ev} | "${s.summary}"`;
    })
    .join('\n');

  let narrativeObj: MarketNarrative;

  try {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      system: 'You are a portfolio intelligence analyst. Return only valid JSON, no markdown.',
      messages: [{
        role: 'user',
        content: `Synthesize these ${signals.length} sports card market signals into portfolio intelligence.
Win rate (last 30 days): ${winRateStr}

SIGNALS:
${signalLines}

Return ONLY this JSON object (no markdown, no code blocks):
{"narrative":"3-4 sentence portfolio synthesis covering dominant themes and overall posture","themes":["theme1","theme2","theme3"],"contradictions":["any cross-signal contradictions, or empty array if none"],"topOpportunity":"Player — specific reason","topRisk":"Player — specific reason","regimeSummary":"e.g. Portfolio skews MARKUP: 5 BUY / 2 SELL / 3 HOLD"}`,
      }],
    });

    const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim()) as {
      narrative: string;
      themes: string[];
      contradictions: string[];
      topOpportunity?: string;
      topRisk?: string;
      regimeSummary?: string;
    };

    narrativeObj = {
      portfolioHash: hash,
      narrative:       parsed.narrative ?? '',
      themes:          Array.isArray(parsed.themes) ? parsed.themes : [],
      contradictions:  Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
      topOpportunity:  parsed.topOpportunity,
      topRisk:         parsed.topRisk,
      regimeSummary:   parsed.regimeSummary,
      signalWinRate:   winRate ?? undefined,
      computedAt:      new Date().toISOString(),
    };

    await dbUpsertNarrative({
      portfolioHash:  hash,
      narrative:      narrativeObj.narrative,
      themes:         narrativeObj.themes,
      contradictions: narrativeObj.contradictions,
      topOpportunity: narrativeObj.topOpportunity,
      topRisk:        narrativeObj.topRisk,
      regimeSummary:  narrativeObj.regimeSummary,
      signalWinRate:  winRate ?? undefined,
    }).catch((err) => console.warn('[narrative] dbUpsertNarrative failed:', err instanceof Error ? err.message : String(err)));

  } catch (err) {
    console.error('[narrative] generation failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Narrative generation failed' }, { status: 500 });
  }

  return NextResponse.json({ narrative: narrativeObj });
}
