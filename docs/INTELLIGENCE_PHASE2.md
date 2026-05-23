# CardIQ: Market Intelligence Phase 2 — Deep Intelligence Upgrade

## Context

The core intelligence pipeline (per-card SSE signal generation with player stats + news + price history) is working. This plan makes it dramatically more powerful by porting analytical rigor from two reference repos:

- **analyst-toolkit** → Wyckoff regime classification, market heat score, EV framing, confidence-capped-by-data-quality, FACT/SENTIMENT/PROJECTION separation
- **Claude-Agent-Fleet** → Persistent signal history + outcome tracking (self-improvement loop), market narrative synthesis across all cards, quality self-scoring per run

The result: signals go from a one-shot "BUY/SELL/HOLD with 3 paragraphs" to a multi-dimensional analysis with market regime context, EV framing, persistent history, drift detection, cross-card narrative intelligence, and a feedback loop that improves accuracy over time.

No new npm dependencies. Everything uses existing Anthropic SDK, Neon DB, and eBay APIs.

---

## Build Order

Steps must be followed in this exact order due to type and import dependencies.

---

### Step 1: `lib/db.ts` — ADD two new tables + 7 new functions

#### New Tables (add to `initSchema()` after the existing price_alerts indexes):

```sql
-- Signal history (enables drift detection + outcome tracking)
CREATE TABLE IF NOT EXISTS card_signals (
  id                 SERIAL PRIMARY KEY,
  card_id            TEXT NOT NULL,
  player             TEXT NOT NULL,
  card_hash          TEXT NOT NULL,
  signal             TEXT NOT NULL CHECK (signal IN ('BUY','SELL','HOLD')),
  confidence         INTEGER NOT NULL,
  summary            TEXT NOT NULL,
  price_trend        TEXT,
  player_context     TEXT,
  scarcity_note      TEXT,
  price_target       NUMERIC(10,2),
  timeframe          TEXT,
  wyckoff_regime     TEXT,
  market_heat_score  INTEGER,
  ev_per_dollar      NUMERIC(6,4),
  quality_score      INTEGER,
  quality_rationale  TEXT,
  outcome_price      NUMERIC(10,2),
  outcome_pct        NUMERIC(6,2),
  outcome_correct    BOOLEAN,
  outcome_checked_at TIMESTAMPTZ,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_signals_hash
  ON card_signals (card_hash, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_signals_pending_outcome
  ON card_signals (generated_at)
  WHERE outcome_checked_at IS NULL AND price_target IS NOT NULL;

-- Market narrative (portfolio-wide synthesis)
CREATE TABLE IF NOT EXISTS market_narratives (
  id                SERIAL PRIMARY KEY,
  portfolio_hash    TEXT NOT NULL UNIQUE,
  narrative         TEXT NOT NULL,
  themes            JSONB NOT NULL DEFAULT '[]',
  contradictions    JSONB NOT NULL DEFAULT '[]',
  top_opportunity   TEXT,
  top_risk          TEXT,
  regime_summary    TEXT,
  signal_win_rate   NUMERIC(4,1),
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_narratives_hash
  ON market_narratives (portfolio_hash, computed_at DESC);
```

#### New function signatures:

```typescript
// Signal history
export async function dbSaveSignal(s: SignalRow): Promise<void>
export async function dbGetRecentSignals(cardHash: string, limit: number): Promise<SignalRow[]>
export async function dbGetPendingOutcomes(minAgeDays: number, maxAgeDays: number): Promise<SignalRow[]>
export async function dbRecordOutcome(id: number, outcomePrice: number, outcomePct: number, correct: boolean): Promise<void>
export async function dbGetSignalWinRate(days: number): Promise<number | null>  // 0-100 or null

// Market narrative
export async function dbUpsertNarrative(n: NarrativeRow): Promise<void>
export async function dbGetNarrative(portfolioHash: string): Promise<NarrativeRow | null>

// Export interfaces:
export interface SignalRow {
  id?: number; cardId: string; player: string; cardHash: string;
  signal: 'BUY'|'SELL'|'HOLD'; confidence: number; summary: string;
  priceTrend?: string; playerContext?: string; scarcityNote?: string;
  priceTarget?: number; timeframe?: string;
  wyckoffRegime?: string; marketHeatScore?: number; evPerDollar?: number;
  qualityScore?: number; qualityRationale?: string;
  generatedAt?: string;
}
export interface NarrativeRow {
  portfolioHash: string; narrative: string;
  themes: string[]; contradictions: string[];
  topOpportunity?: string; topRisk?: string; regimeSummary?: string;
  signalWinRate?: number; computedAt?: string;
}
```

---

### Step 2: `types/index.ts` — ADD new fields to existing interfaces + new types

Add to `CardSignal` interface (the existing one — just add these fields):
```typescript
wyckoffRegime?: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
marketHeatScore?: number;      // 0-100
evPerDollar?: number;          // e.g. 0.24 = +24% EV
qualityScore?: number;         // 1-10
qualityRationale?: string;
hasDrift?: boolean;            // true if signal changed vs. last stored value
```

Add new interfaces at end of file:
```typescript
export interface MarketNarrative {
  portfolioHash: string;
  narrative: string;
  themes: string[];
  contradictions: string[];
  topOpportunity?: string;
  topRisk?: string;
  regimeSummary?: string;
  signalWinRate?: number;   // 0-100, null = insufficient history
  computedAt: string;
}
```

---

### Step 3: `lib/ebay-utils.ts` — NEW utility

Extracts velocity intelligence from the raw eBay Browse API response. Called internally from `app/api/signals/route.ts` (no HTTP round-trip).

```typescript
export interface EbayIntel {
  avg: number;
  count: number;
  min: number;
  max: number;
  spreadPct: number;          // (max-min)/avg*100 — liquidity proxy
  priceTrend: 'rising' | 'falling' | 'flat';  // first-half vs second-half avg
  recentFraction: number;     // fraction of items listed in last 3 days (0-1)
  velocityPerDay: number | null;  // avg new listings per day over the sample window
  lastSoldDaysAgo: number | null; // how stale is the most recent comp
}

export function buildEbayIntel(items: Array<{
  price: number;
  listedAt?: string;  // itemCreationDate from eBay Browse API
}>): EbayIntel
```

**priceTrend logic:** Sort items by price ascending, split in half, compare `mean(firstHalf)` vs `mean(secondHalf)`. If second > first by >5% → 'rising', if first > second by >5% → 'falling', else 'flat'. (Note: this measures price distribution skew across the comp set, a proxy for demand pressure.)

**recentFraction:** Count items where `listedAt` is within 72h of now, divide by total count.

**velocityPerDay:** If `listedAt` present on 2+ items, compute `(count-1) / daysBetween(oldest, newest)`. Null if insufficient date data.

Update `app/api/ebay-pricing/route.ts` to pass `listedAt` from each item's `itemCreationDate` field, and return `ebayIntel` in the response alongside the existing `listings` array.

---

### Step 4: `app/api/signals/route.ts` — REWRITE the two Claude prompts + add persistence

This is the largest change. The SSE wire format stays identical — no changes to the streaming protocol.

#### 4a. Add prior signal context builder

```typescript
async function buildPriorContext(cardHash: string): Promise<string> {
  const prior = await dbGetRecentSignals(cardHash, 3).catch(() => []);
  if (prior.length === 0) return 'No prior signals for this card.';
  return prior.map((s, i) => {
    const outcome = s.outcomeCorrect !== null
      ? ` → Outcome: ${s.outcomeCorrect ? 'CORRECT' : 'INCORRECT'} (${s.outcomePct?.toFixed(1)}% actual move)`
      : '';
    return `${i === 0 ? 'Last' : `Prior ${i+1}`}: ${s.signal} ${s.confidence}% — "${s.summary}" [${s.generatedAt?.slice(0,10)}]${outcome}`;
  }).join('\n');
}
```

#### 4b. New eBay intel context builder

```typescript
function buildEbayContext(intel: EbayIntel | null, priceHistory: PricePoint[]): string {
  if (!intel && priceHistory.length < 2) return 'No market data available.';
  const parts: string[] = [];
  if (intel) {
    parts.push(`eBay comps (${intel.count} listings): avg $${intel.avg.toFixed(0)}, range $${intel.min.toFixed(0)}-$${intel.max.toFixed(0)}, spread ${intel.spreadPct.toFixed(0)}%`);
    parts.push(`Market velocity: trend=${intel.priceTrend}, ${(intel.recentFraction*100).toFixed(0)}% listed in last 3 days${intel.velocityPerDay !== null ? `, ${intel.velocityPerDay.toFixed(1)} new/day` : ''}`);
  }
  if (priceHistory.length >= 2) {
    const oldest = priceHistory[0].price, newest = priceHistory[priceHistory.length-1].price;
    const pct = (((newest-oldest)/oldest)*100).toFixed(1);
    parts.push(`Price history (${priceHistory.length} pts): $${oldest.toFixed(0)} → $${newest.toFixed(0)} (${pct}% over tracked period)`);
  }
  return parts.join('\n');
}
```

#### 4c. New Verdict prompt (max_tokens: 200 → **350**)

Replace the existing verdict prompt content with:

```
Sports card investment analyst. Today: ${today}
Win rate (last 30 days): ${winRate !== null ? `${winRate.toFixed(0)}%` : 'insufficient data'}

${detail}
${statsContext}
${newsContext}
${ebayContext}

PRIOR SIGNALS:
${priorContext}

ANALYSIS FRAMEWORK:
1. Wyckoff Regime: classify market phase (ACCUMULATION=early buy zone, MARKUP=uptrend, DISTRIBUTION=sell zone, MARKDOWN=downtrend)
2. Market Heat: score 0-100 (25pts each: price velocity, listing velocity, news momentum, player catalyst)
3. EV: expected move % vs. current value to price target (positive=long, negative=short)
4. Confidence cap: max 60% if price history <3 pts; max 40% if both stats and news are unavailable

Return ONLY this JSON (no other text):
{"signal":"BUY|SELL|HOLD","confidence":82,"summary":"one punchy actionable sentence","priceTarget":350.00,"timeframe":"3-6 months","wyckoffRegime":"MARKUP","marketHeatScore":71,"evPerDollar":0.18,"qualityScore":8,"qualityRationale":"fresh comps, 4 live stats, 2 headlines"}
```

#### 4d. New Analysis prompt (max_tokens: 700 → **1100**) — add 4th section

```
Sports card: ${detail}
${statsContext}
${newsContext}
${ebayContext}
Regime: ${verdict.wyckoffRegime} | Heat: ${verdict.marketHeatScore}/100 | EV: ${(verdict.evPerDollar*100).toFixed(1)}%
Verdict: ${verdict.signal} (${verdict.confidence}% confidence) — "${verdict.summary}"

Provide detailed analysis. Label each claim as [FACT], [SENTIMENT], or [PROJECTION].
Output EXACTLY these four sections:
===PRICE===
[2-3 sentences on price trajectory and eBay velocity — cite specific numbers. Label claims.]
===PLAYER===
[2-3 sentences on player performance citing live stats. Label claims. Mention injury if present.]
===SCARCITY===
[2-3 sentences on grade, print run, market liquidity and spread. Label claims.]
===MARKET===
[2 sentences on Wyckoff regime context and how this card fits the broader collector market right now.]
```

#### 4e. Add `marketContext` to collected fields, SECTION_MARKERS, and the final `signal` object

Add `{ tag: '===MARKET===', field: 'marketContext' }` to SECTION_MARKERS.

Add `marketContext: ''` to `collected`.

Add to the final signal object:
```typescript
marketContext:     collected.marketContext.trim(),
wyckoffRegime:     verdict.wyckoffRegime,
marketHeatScore:   verdict.marketHeatScore,
evPerDollar:       verdict.evPerDollar,
qualityScore:      verdict.qualityScore,
qualityRationale:  verdict.qualityRationale,
hasDrift:          priorSignals.length > 0 && priorSignals[0].signal !== verdict.signal,
```

#### 4f. Persist signal to DB (after `setCachedSignal`, before `ctrl.enqueue(done)`)

```typescript
await dbSaveSignal({
  cardId: safeCard.id, player: safeCard.player, cardHash,
  signal: verdict.signal, confidence: verdict.confidence,
  summary: verdict.summary,
  priceTrend: collected.priceTrend.trim(),
  playerContext: collected.playerContext.trim(),
  scarcityNote: collected.scarcityNote.trim(),
  marketContext: collected.marketContext.trim(),
  priceTarget: verdict.priceTarget,
  timeframe: verdict.timeframe,
  wyckoffRegime: verdict.wyckoffRegime,
  marketHeatScore: verdict.marketHeatScore,
  evPerDollar: verdict.evPerDollar,
  qualityScore: verdict.qualityScore,
  qualityRationale: verdict.qualityRationale,
}).catch(() => {}); // non-blocking, never fail the stream
```

#### 4g. Update buildConfidenceFactors

Add a 5th factor: **Market Velocity** (from `ebayIntel`):
```typescript
{
  label: 'Market Velocity',
  value: intel
    ? (intel.count >= 8 && intel.priceTrend === 'rising' ? 90
       : intel.count >= 4 ? 65
       : intel.count >= 1 ? 40 : 15)
    : 15,
  description: intel
    ? `${intel.count} comps, trend=${intel.priceTrend}, ${(intel.recentFraction*100).toFixed(0)}% recent activity`
    : 'No live eBay comp data',
}
```

---

### Step 5: `app/api/signals/narrative/route.ts` — NEW

`POST /api/signals/narrative` → `MarketNarrative`

**Purpose:** Called from the client after all per-card SSE streams complete. Synthesizes all signals into a single portfolio intelligence narrative.

**Request body:** `{ signals: CardSignal[], portfolioHash: string }`

**portfolioHash:** MD5 of sorted card IDs — computed client-side before calling.

**Logic:**
1. `checkRateLimit(ip, 'narrative', 10)` 
2. Check `dbGetNarrative(portfolioHash)` — return cached if `computedAt` within 6 hours
3. `dbGetSignalWinRate(30)` → include in prompt
4. Build prompt (see below) → single Claude call, `max_tokens: 600`, no streaming
5. Parse JSON, `dbUpsertNarrative(...)`, return

**Prompt:**
```
You are a portfolio intelligence analyst. Synthesize these ${signals.length} sports card market signals into a portfolio narrative.
Win rate (last 30 days): ${winRate !== null ? `${winRate.toFixed(0)}%` : 'insufficient data'}

SIGNALS:
${signals.map(s => `${s.player} (${s.wyckoffRegime ?? '?'}) — ${s.signal} ${s.confidence}% | Heat: ${s.marketHeatScore ?? '?'}/100 | EV: ${s.evPerDollar !== undefined ? (s.evPerDollar*100).toFixed(1)+'%' : '?'} | "${s.summary}"`).join('\n')}

Return ONLY this JSON:
{"narrative":"3-4 sentence portfolio synthesis","themes":["theme1","theme2"],"contradictions":["any cross-signal contradictions"],"topOpportunity":"Player — reason","topRisk":"Player — reason","regimeSummary":"e.g. Portfolio skews MARKUP: 5 BUY / 2 SELL / 3 HOLD"}
```

Rate limit: 10/min. Returns `{ narrative: MarketNarrative }`.

---

### Step 6: `app/api/signals/outcome-check/route.ts` — NEW

`POST /api/signals/outcome-check` → `{ checked: number }`

Protected by `PRICE_REFRESH_SECRET` Bearer token (same pattern as price-refresh).

**Logic:**
1. `dbGetPendingOutcomes(minAgeDays: 7, maxAgeDays: 45)` — signals with a priceTarget, no outcome yet, aged 7-45 days
2. For each signal: fetch `dbGetPriceHistory('history:${ebayQuery}')`, take the most recent price
3. Compute `outcomePct = ((currentPrice - signalPrice) / signalPrice) * 100`
4. `outcomeCorrect`:
   - BUY: correct if `outcomePct >= -5` (price held or rose)
   - SELL: correct if `outcomePct <= 5` (price held or fell)  
   - HOLD: correct if `Math.abs(outcomePct) < 10` (price stayed stable)
5. `dbRecordOutcome(id, currentPrice, outcomePct, outcomeCorrect)`

**GitHub Actions workflow** (`.github/workflows/outcome-check.yml`): runs daily at 3am EST (after price-refresh at 2am), calls `POST /api/signals/outcome-check` with Bearer token from `PRICE_REFRESH_SECRET` secret.

---

### Step 7: `lib/store.tsx` — ADD narrative state slice

Add to `State` interface:
```typescript
narrative: MarketNarrative | null;
```
Initialize as `null`.

Add actions: `SET_NARRATIVE`

Add reducer case: `SET_NARRATIVE` → `{ ...state, narrative: action.narrative }`

**Do NOT** fetch narrative from store — the `MarketNarrativePanel` component fetches it directly. Store is just for passing down to the panel if needed.

---

### Step 8: `components/intelligence/MarketNarrativePanel.tsx` — NEW

`'use client'` component that accepts `signals: CardSignal[]` prop.

**Behavior:**
- Renders nothing while `signals.length === 0`
- Automatically POSTs to `/api/signals/narrative` when `signals.length > 0` changes (first completion)
- Shows a pulsing skeleton (1 panel, ~60px tall) while fetching
- Once loaded, renders:

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 🧠 MARKET NARRATIVE         [win rate badge if ≥5 signals]│
│                                                           │
│ {narrative prose, 3-4 sentences, text-slate-300}         │
│                                                           │
│ Themes: [pill] [pill] [pill]                             │
│                                                           │
│ ┌──────────────────┐  ┌──────────────────┐              │
│ │ TOP OPPORTUNITY  │  │  TOP RISK        │              │
│ │ Player — reason  │  │  Player — reason │              │
│ └──────────────────┘  └──────────────────┘              │
│                                                           │
│ {contradictions as amber pills if any}                   │
│ {regimeSummary in footer, text-chrome-500}               │
└─────────────────────────────────────────────────────────┘
```

- Theme pills: `text-electric bg-electric/10 border-electric/20`
- Top Opportunity panel: `border-emerald-500/20 bg-emerald-500/[0.07]`
- Top Risk panel: `border-red-500/20 bg-red-500/[0.07]`
- Contradiction pills: `text-amber-400 bg-amber-500/10 border-amber-500/20`
- Win rate badge (only shown if `signalWinRate !== null`): `{rate}% WIN RATE` in emerald if ≥60%, gold if ≥45%, red otherwise

---

### Step 9: `components/intelligence/SignalCard.tsx` — ADD new fields

The streaming `SignalCard` already handles unknown fields gracefully. Add to the **completed** (non-streaming) state only:

**In the header row** (next to signal badge):
- Wyckoff regime badge: `ACCUMULATION` (emerald/30% opacity), `MARKUP` (blue), `DISTRIBUTION` (amber), `MARKDOWN` (red). Small pill, 9px font, same style as condition badges.
- If `hasDrift`: amber `SIGNAL CHANGED` badge (same small pill style)

**In the footer** (next to priceTarget / timeframe):
- `EV: +24.0%` or `EV: -8.5%` — `text-emerald-400` if positive, `text-red-400` if negative
- `Q: 8/10` — `text-chrome-500 text-[9px]` with `qualityRationale` as `title` tooltip

**New 4th analysis section** `marketContext`:
- Rendered below `scarcityNote` section
- Icon: `Globe` (lucide)  
- Label: `Market Context`
- Color: `text-blue-400` / `border-blue-500/20 bg-blue-500/[0.07]`

**Update the `DIMENSIONS` constant in `intelligence/page.tsx`** to add the 4th dimension:
```typescript
{ icon: Globe, label: 'Market Context', color: 'text-blue-400', bg: 'border-blue-500/20 bg-blue-500/[0.07]' }
```

---

### Step 10: `app/(app)/intelligence/page.tsx` — WIRE UP narrative

Add to the completed signals view (`!isGenerating && signals.length > 0` block), **before** the BUY/SELL/HOLD count pills:
```tsx
<MarketNarrativePanel signals={signals} />
```

Also update the `StreamState` interface to include `marketContext` and `activeField` to include `'marketContext'`.

Update `streamToSignal()` to include `marketContext: s.marketContext ?? ''`.

---

## Data Flow Summary

```
Per-card signal generation (unchanged SSE protocol):
  POST /api/signals { card }
    → buildPriorContext (DB read, 3 recent signals for this card hash)
    → buildEbayIntel (from eBay API response: velocity, trend, recency)
    → fetchPlayerStats + fetchPlayerNews (parallel, unchanged)
    → dbGetSignalWinRate(30) (portfolio-wide win rate for prompt context)
    → Stage 1: Claude verdict (350 tokens) → wyckoffRegime, marketHeatScore, evPerDollar, qualityScore
    → SSE 'verdict' event
    → Stage 2: Claude analysis (1100 tokens, streaming) → 4 sections
    → SSE 'chunk' events
    → dbSaveSignal() (async, non-blocking)
    → SSE 'done' event with enriched CardSignal

After all cards complete (client-side):
  POST /api/signals/narrative { signals, portfolioHash }
    → dbGetNarrative() — return if <6h old
    → Claude synthesis (600 tokens, non-streaming)
    → dbUpsertNarrative()
    → MarketNarrativePanel renders

Nightly (3am EST, after price-refresh):
  POST /api/signals/outcome-check (Bearer token)
    → dbGetPendingOutcomes(7, 45)
    → Per signal: fetch current price → compare to priceTarget
    → dbRecordOutcome() — feeds back into next signal's priorContext
```

---

## Self-Improvement Loop

```
Day 0: Signal generated → "BUY, target $350, confidence 72%" → saved to card_signals
Day 7+: outcome-check runs → price is $380 → outcome_correct=true, pct=+8.6% → recorded
Day 14: Same card analyzed again → priorContext includes "Last: BUY 72% — CORRECT (+8.6%)"
         → winRate = 73% (from dbGetSignalWinRate) → injected into verdict prompt
         → Claude calibrates confidence based on track record
```

Over time: the model sees its own hit rate and past call outcomes per card, enabling genuine self-calibration.

---

## Verification

1. **New DB tables:** Hit any signal endpoint → Neon console shows `card_signals` and `market_narratives` tables
2. **Signal saved:** Generate one signal → `SELECT * FROM card_signals LIMIT 1` → row with wyckoff_regime, market_heat_score, quality_score populated
3. **Prior context works:** Generate signal for same card twice → second time `priorContext` in logs shows the first signal
4. **4th section renders:** Intelligence page → completed SignalCard has "Market Context" section with globe icon
5. **Wyckoff badge:** SignalCard header shows regime pill (e.g., "MARKUP" in blue)
6. **EV in footer:** Footer shows "+18.0%" in emerald or "-5.2%" in red
7. **Drift detection:** Manually update a stored signal's `signal` field in DB to a different value → regenerate → card shows "SIGNAL CHANGED" amber badge
8. **Narrative panel:** Generate signals for 2+ cards → `<MarketNarrativePanel>` appears above the filter row with themes, opportunity/risk grid
9. **Narrative cache:** Call narrative endpoint twice within 6h → `computedAt` identical
10. **Outcome check:** Manually insert a 10-day-old `card_signals` row with `price_target` set → run `POST /api/signals/outcome-check` → `outcome_checked_at` is populated
11. **Win rate badge:** After 5+ outcomes recorded → narrative panel shows win rate badge
12. **eBay velocity in confidence:** `confidenceFactors` array now has 5 entries (added Market Velocity)
