import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Card, PlayerStats, ConfidenceFactor } from '@/types';
import { hashCard, getCachedSignal, setCachedSignal, getPriceHistory } from '@/lib/cache';
import { buildCardDetail } from '@/lib/signal-generator';
import { fetchPlayerStats } from '@/lib/player-stats';
import { fetchPlayerNews } from '@/lib/player-news';

const client = new Anthropic();

function sse(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

const SECTION_MARKERS = [
  { tag: '===PRICE===',    field: 'priceTrend'    },
  { tag: '===PLAYER===',   field: 'playerContext'  },
  { tag: '===SCARCITY===', field: 'scarcityNote'   },
] as const;

const MAX_TAG_LEN = Math.max(...SECTION_MARKERS.map((m) => m.tag.length));

function buildConfidenceFactors(
  playerStats: PlayerStats | null,
  newsItems: string[],
  priceHistoryLen: number,
  card: Card,
): ConfidenceFactor[] {
  const printRun = card.variation?.match(/\/(\d+)/)?.[1];
  const isNumbered = !!printRun;
  const printRunNum = printRun ? parseInt(printRun, 10) : null;

  return [
    {
      label: 'Price History',
      value: priceHistoryLen >= 7 ? 95
           : priceHistoryLen >= 3 ? 72
           : priceHistoryLen >= 1 ? 48
           : 20,
      description: priceHistoryLen > 0
        ? `${priceHistoryLen} eBay data point${priceHistoryLen > 1 ? 's' : ''} tracked — more improves accuracy`
        : 'No history yet — refreshes build a trend line over time',
    },
    {
      label: 'Player Stats',
      value: playerStats && playerStats.stats.length >= 4 ? 90
           : playerStats && playerStats.stats.length > 0  ? 65
           : 22,
      description: playerStats
        ? `${playerStats.stats.length} live stats fetched (${playerStats.season}${playerStats.team ? ` · ${playerStats.team}` : ''})`
        : 'No live performance data — signal based on card attributes only',
    },
    {
      label: 'News Context',
      value: newsItems.length >= 2 ? 82
           : newsItems.length === 1 ? 60
           : 38,
      description: newsItems.length > 0
        ? `${newsItems.length} recent headline${newsItems.length > 1 ? 's' : ''} factored in`
        : 'No recent news — signal reflects historical data only',
    },
    {
      label: 'Scarcity Data',
      value: isNumbered
        ? (printRunNum !== null && printRunNum <= 25 ? 95 : printRunNum !== null && printRunNum <= 100 ? 82 : 70)
        : card.condition.startsWith('PSA') || card.condition.startsWith('BGS') || card.condition.startsWith('SGC')
        ? 75
        : 50,
      description: isNumbered
        ? `Numbered parallel /${printRun} — precise scarcity known`
        : card.condition !== 'Raw'
        ? `${card.condition} graded — population estimable from grade distribution`
        : 'Raw/ungraded — scarcity based on brand & year data',
    },
  ];
}

export async function POST(req: NextRequest) {
  const { card, force }: { card: Card; force?: boolean } = await req.json();
  if (!card) return new Response('No card', { status: 400 });

  const cardHash = hashCard(card);
  const cached = force ? null : getCachedSignal(cardHash);

  if (cached) {
    return new Response(
      new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(sse({ type: 'done', signal: cached, fromCache: true }));
          ctrl.close();
        },
      }),
      { headers: SSE_HEADERS }
    );
  }

  const today  = new Date().toISOString().split('T')[0];
  const detail = buildCardDetail(card);

  // Build the eBay query the same way ebay-pricing/route.ts does — so history keys match
  const ebayQuery = `${card.year} ${card.brand} ${card.player} ${card.variation ?? ''}`.trim();
  const priceHistory = getPriceHistory(`history:${ebayQuery}`);

  // Fetch stats, news in parallel — failures are safe
  let playerStats: PlayerStats | null = null;
  let newsItems: string[] = [];

  try {
    [playerStats, newsItems] = await Promise.all([
      fetchPlayerStats(card.player, card.sport).catch(() => null),
      fetchPlayerNews(card.player, card.sport).catch(() => [] as string[]),
    ]);
    if (playerStats) console.log(`[signals] ${playerStats.stats.length} stats for ${card.player}`);
    if (newsItems.length) console.log(`[signals] ${newsItems.length} news items for ${card.player}`);
  } catch {
    console.warn(`[signals] parallel data fetch failed for ${card.player}`);
  }

  const confidenceFactors = buildConfidenceFactors(playerStats, newsItems, priceHistory.length, card);

  // Build AI context blocks
  const statsContext = playerStats
    ? `Live ${playerStats.season} stats: ${playerStats.stats.map((s) => `${s.label} ${s.value}`).join(', ')}${playerStats.team ? ` | Team: ${playerStats.team}` : ''}${playerStats.injuryStatus ? ` | INJURY: ${playerStats.injuryStatus}` : ''}`
    : 'No live stats available.';

  const newsContext = newsItems.length > 0
    ? `Recent headlines:\n${newsItems.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    : 'No recent news.';

  const priceContext = priceHistory.length >= 2
    ? (() => {
        const prices = priceHistory.map((p) => p.price);
        const oldest = prices[0];
        const newest = prices[prices.length - 1];
        const pct = (((newest - oldest) / oldest) * 100).toFixed(1);
        return `Price trend (${priceHistory.length} data points): $${oldest.toFixed(0)} → $${newest.toFixed(0)} (${pct}% change over tracked period)`;
      })()
    : 'No price trend data yet.';

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        // Phase 1: Quick verdict
        const verdictRes = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: `Sports card investment analyst. Today: ${today}

${detail}
${statsContext}
${newsContext}
${priceContext}

Data confidence: Price history (${priceHistory.length} pts), Stats (${playerStats ? 'available' : 'none'}), News (${newsItems.length} items)

Return ONLY this JSON (no other text):
{"signal":"BUY|SELL|HOLD","confidence":82,"summary":"one punchy actionable sentence","priceTarget":350.00,"timeframe":"3-6 months"}`,
            },
          ],
        });

        const verdictText =
          verdictRes.content[0].type === 'text' ? verdictRes.content[0].text : '{}';
        const verdict = JSON.parse(verdictText.replace(/```json\n?|\n?```/g, '').trim());

        ctrl.enqueue(sse({ type: 'verdict', ...verdict }));

        // Phase 2: Streaming analysis
        const collected: Record<string, string> = {
          priceTrend: '',
          playerContext: '',
          scarcityNote: '',
        };
        let buf = '';
        let activeField: string | null = null;

        const analysisStream = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          stream: true,
          messages: [
            {
              role: 'user',
              content: `Sports card: ${detail}
${statsContext}
${newsContext}
${priceContext}
Verdict: ${verdict.signal} (${verdict.confidence}% confidence) — "${verdict.summary}"

Provide detailed analysis. Output EXACTLY these three sections:
===PRICE===
[2-3 sentences on price trajectory, ROI sustainability, and the tracked price trend if available]
===PLAYER===
[2-3 sentences on player performance citing live stats; mention any injury or news impact]
===SCARCITY===
[2-3 sentences on grade, print run, market liquidity, and population context]`,
            },
          ],
        });

        for await (const event of analysisStream) {
          if (event.type !== 'content_block_delta' || event.delta.type !== 'text_delta') continue;
          buf += event.delta.text;

          let foundMarker = true;
          while (foundMarker) {
            foundMarker = false;
            for (const { tag, field } of SECTION_MARKERS) {
              const idx = buf.indexOf(tag);
              if (idx === -1) continue;

              const before = buf.slice(0, idx).replace(/^\n+/, '');
              if (activeField && before) {
                collected[activeField] += before;
                ctrl.enqueue(sse({ type: 'chunk', field: activeField, text: before }));
              }

              activeField = field;
              buf = buf.slice(idx + tag.length).replace(/^\n/, '');
              foundMarker = true;
              break;
            }
          }

          if (activeField && buf.length > MAX_TAG_LEN) {
            const emit = buf.slice(0, -MAX_TAG_LEN);
            if (emit) {
              collected[activeField] += emit;
              ctrl.enqueue(sse({ type: 'chunk', field: activeField, text: emit }));
              buf = buf.slice(-MAX_TAG_LEN);
            }
          }
        }

        if (activeField && buf.trim()) {
          const flush = buf.replace(/\n+$/, '');
          collected[activeField] += flush;
          ctrl.enqueue(sse({ type: 'chunk', field: activeField, text: flush }));
        }

        const signal = {
          cardId:            card.id,
          player:            card.player,
          signal:            verdict.signal,
          confidence:        verdict.confidence,
          summary:           verdict.summary,
          priceTrend:        collected.priceTrend.trim(),
          playerContext:     collected.playerContext.trim(),
          scarcityNote:      collected.scarcityNote.trim(),
          priceTarget:       verdict.priceTarget,
          timeframe:         verdict.timeframe,
          generatedAt:       new Date().toISOString(),
          playerStats:       playerStats ?? undefined,
          newsItems:         newsItems.length > 0 ? newsItems : undefined,
          priceHistory:      priceHistory.length > 0 ? priceHistory : undefined,
          confidenceFactors,
        };

        setCachedSignal(cardHash, signal);
        ctrl.enqueue(sse({ type: 'done', signal }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('signals stream error:', message);
        ctrl.enqueue(sse({ type: 'error', message }));
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
