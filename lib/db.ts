import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

// ─── Schema ───────────────────────────────────────────────────────────────────
// Module-level guard: only runs once per warm serverless instance.
// All callers that do `await initSchema()` automatically share the same Promise.

let _schemaInitialized = false;
let _initPromise: Promise<void> | null = null;

export function initSchema(): Promise<void> {
  if (_schemaInitialized) return Promise.resolve();
  if (_initPromise) return _initPromise;
  _initPromise = _runMigrations()
    .then(() => { _schemaInitialized = true; })
    .catch((err) => {
      _initPromise = null; // reset so next call retries
      throw err;
    });
  return _initPromise;
}

async function _runMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL DEFAULT 'legacy',
      player          TEXT NOT NULL,
      year            INTEGER NOT NULL,
      brand           TEXT NOT NULL,
      card_number     TEXT,
      variation       TEXT,
      condition       TEXT NOT NULL,
      sport           TEXT NOT NULL,
      purchase_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
      current_value   NUMERIC(10,2) NOT NULL DEFAULT 0,
      added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_price_update TIMESTAMPTZ
    )
  `;

  // Add user_id column to existing cards table if it doesn't exist yet
  await sql`
    ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'legacy'
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards (user_id, added_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS price_history (
      id         SERIAL PRIMARY KEY,
      query_key  TEXT NOT NULL,
      price      NUMERIC(10,2) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_price_history_query
    ON price_history (query_key, recorded_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id          SERIAL PRIMARY KEY,
      card_id     TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      player      TEXT NOT NULL,
      alert_type  TEXT NOT NULL CHECK (alert_type IN ('SPIKE', 'DROP')),
      old_price   NUMERIC(10,2) NOT NULL,
      new_price   NUMERIC(10,2) NOT NULL,
      pct_change  NUMERIC(6,2)  NOT NULL,
      dismissed   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_price_alerts_active
    ON price_alerts (dismissed, created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_price_alerts_card
    ON price_alerts (card_id, created_at DESC)
  `;

  await sql`
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
      market_context     TEXT,
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
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_card_signals_hash
    ON card_signals (card_hash, generated_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_card_signals_pending_outcome
    ON card_signals (generated_at)
    WHERE outcome_checked_at IS NULL AND price_target IS NOT NULL
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_market_narratives_hash
    ON market_narratives (portfolio_hash, computed_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      welcomed   BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_waitlist_email
    ON waitlist (email)
  `;
}

// ─── Cards CRUD ───────────────────────────────────────────────────────────────

export async function dbGetCards(userId: string) {
  const rows = await sql`
    SELECT * FROM cards WHERE user_id = ${userId} ORDER BY added_at DESC
  `;
  return rows.map(rowToCard);
}

export async function dbUpsertCard(card: CardRow) {
  await sql`
    INSERT INTO cards (
      id, user_id, player, year, brand, card_number, variation,
      condition, sport, purchase_price, current_value,
      added_at, last_price_update
    ) VALUES (
      ${card.id}, ${card.user_id}, ${card.player}, ${card.year}, ${card.brand},
      ${card.card_number ?? null}, ${card.variation ?? null},
      ${card.condition}, ${card.sport},
      ${card.purchase_price}, ${card.current_value},
      ${card.added_at}, ${card.last_price_update ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      player            = EXCLUDED.player,
      year              = EXCLUDED.year,
      brand             = EXCLUDED.brand,
      card_number       = EXCLUDED.card_number,
      variation         = EXCLUDED.variation,
      condition         = EXCLUDED.condition,
      sport             = EXCLUDED.sport,
      purchase_price    = EXCLUDED.purchase_price,
      current_value     = EXCLUDED.current_value,
      last_price_update = EXCLUDED.last_price_update
  `;
}

export async function dbDeleteCard(id: string, userId: string) {
  await sql`DELETE FROM cards WHERE id = ${id} AND user_id = ${userId}`;
  await sql`DELETE FROM price_history WHERE query_key LIKE ${'history:%' + id + '%'}`;
}

// ─── Price history ────────────────────────────────────────────────────────────

export async function dbRecordPrice(queryKey: string, price: number) {
  // Skip if last record for this key was within 4 hours
  const recent = await sql`
    SELECT recorded_at FROM price_history
    WHERE query_key = ${queryKey}
    ORDER BY recorded_at DESC
    LIMIT 1
  `;
  if (recent.length > 0) {
    const ageMs = Date.now() - new Date(recent[0].recorded_at as string).getTime();
    if (ageMs < 4 * 60 * 60 * 1000) return;
  }
  await sql`
    INSERT INTO price_history (query_key, price) VALUES (${queryKey}, ${price})
  `;
}

export async function dbGetPriceHistory(queryKey: string) {
  const rows = await sql`
    SELECT price, recorded_at FROM price_history
    WHERE query_key = ${queryKey}
    ORDER BY recorded_at ASC
    LIMIT 50
  `;
  return rows.map((r) => ({
    price: parseFloat(r.price as string),
    timestamp: r.recorded_at as string,
  }));
}

// ─── Price alerts ─────────────────────────────────────────────────────────────

export interface AlertRow {
  id: number;
  cardId: string;
  player: string;
  alertType: 'SPIKE' | 'DROP';
  oldPrice: number;
  newPrice: number;
  pctChange: number;
  createdAt: string;
}

export async function dbCreateAlert(params: {
  cardId: string;
  player: string;
  alertType: 'SPIKE' | 'DROP';
  oldPrice: number;
  newPrice: number;
  pctChange: number;
}): Promise<void> {
  await sql`
    INSERT INTO price_alerts (card_id, player, alert_type, old_price, new_price, pct_change)
    VALUES (${params.cardId}, ${params.player}, ${params.alertType}, ${params.oldPrice}, ${params.newPrice}, ${params.pctChange})
  `;
}

export async function dbGetActiveAlerts(): Promise<AlertRow[]> {
  const rows = await sql`
    SELECT id, card_id, player, alert_type, old_price, new_price, pct_change, created_at
    FROM price_alerts
    WHERE dismissed = FALSE
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id:        r.id as number,
    cardId:    r.card_id as string,
    player:    r.player as string,
    alertType: r.alert_type as 'SPIKE' | 'DROP',
    oldPrice:  parseFloat(r.old_price as string),
    newPrice:  parseFloat(r.new_price as string),
    pctChange: parseFloat(r.pct_change as string),
    createdAt: r.created_at as string,
  }));
}

export async function dbDismissAlert(id: number): Promise<void> {
  await sql`UPDATE price_alerts SET dismissed = TRUE WHERE id = ${id}`;
}

// ─── Signal history ───────────────────────────────────────────────────────────

export interface SignalRow {
  id?: number;
  cardId: string;
  player: string;
  cardHash: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string;
  priceTrend?: string;
  playerContext?: string;
  scarcityNote?: string;
  marketContext?: string;
  priceTarget?: number;
  timeframe?: string;
  wyckoffRegime?: string;
  marketHeatScore?: number;
  evPerDollar?: number;
  qualityScore?: number;
  qualityRationale?: string;
  outcomePct?: number;
  outcomeCorrect?: boolean | null;
  generatedAt?: string;
}

export async function dbSaveSignal(s: SignalRow): Promise<void> {
  await sql`
    INSERT INTO card_signals (
      card_id, player, card_hash, signal, confidence, summary,
      price_trend, player_context, scarcity_note, market_context,
      price_target, timeframe, wyckoff_regime, market_heat_score,
      ev_per_dollar, quality_score, quality_rationale
    ) VALUES (
      ${s.cardId}, ${s.player}, ${s.cardHash}, ${s.signal}, ${s.confidence}, ${s.summary},
      ${s.priceTrend ?? null}, ${s.playerContext ?? null}, ${s.scarcityNote ?? null}, ${s.marketContext ?? null},
      ${s.priceTarget ?? null}, ${s.timeframe ?? null}, ${s.wyckoffRegime ?? null}, ${s.marketHeatScore ?? null},
      ${s.evPerDollar ?? null}, ${s.qualityScore ?? null}, ${s.qualityRationale ?? null}
    )
  `;
}

export async function dbGetRecentSignals(cardHash: string, limit: number): Promise<SignalRow[]> {
  const rows = await sql`
    SELECT id, card_id, player, card_hash, signal, confidence, summary,
           price_target, timeframe, wyckoff_regime, market_heat_score,
           ev_per_dollar, quality_score, quality_rationale,
           outcome_pct, outcome_correct, generated_at
    FROM card_signals
    WHERE card_hash = ${cardHash}
    ORDER BY generated_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id:               r.id as number,
    cardId:           r.card_id as string,
    player:           r.player as string,
    cardHash:         r.card_hash as string,
    signal:           r.signal as 'BUY' | 'SELL' | 'HOLD',
    confidence:       r.confidence as number,
    summary:          r.summary as string,
    priceTarget:      r.price_target != null ? parseFloat(r.price_target as string) : undefined,
    timeframe:        r.timeframe as string | undefined,
    wyckoffRegime:    r.wyckoff_regime as string | undefined,
    marketHeatScore:  r.market_heat_score as number | undefined,
    evPerDollar:      r.ev_per_dollar != null ? parseFloat(r.ev_per_dollar as string) : undefined,
    qualityScore:     r.quality_score as number | undefined,
    qualityRationale: r.quality_rationale as string | undefined,
    outcomePct:       r.outcome_pct != null ? parseFloat(r.outcome_pct as string) : undefined,
    outcomeCorrect:   r.outcome_correct as boolean | null | undefined,
    generatedAt:      r.generated_at as string,
  }));
}

export async function dbGetPendingOutcomes(minAgeDays: number, maxAgeDays: number): Promise<SignalRow[]> {
  const rows = await sql`
    SELECT id, card_id, player, card_hash, signal, confidence, summary,
           price_target, wyckoff_regime, generated_at
    FROM card_signals
    WHERE outcome_checked_at IS NULL
      AND price_target IS NOT NULL
      AND generated_at < NOW() - (${minAgeDays} || ' days')::INTERVAL
      AND generated_at > NOW() - (${maxAgeDays} || ' days')::INTERVAL
    ORDER BY generated_at ASC
    LIMIT 100
  `;
  return rows.map((r) => ({
    id:          r.id as number,
    cardId:      r.card_id as string,
    player:      r.player as string,
    cardHash:    r.card_hash as string,
    signal:      r.signal as 'BUY' | 'SELL' | 'HOLD',
    confidence:  r.confidence as number,
    summary:     r.summary as string,
    priceTarget: r.price_target != null ? parseFloat(r.price_target as string) : undefined,
    generatedAt: r.generated_at as string,
  }));
}

export async function dbRecordOutcome(
  id: number,
  outcomePrice: number,
  outcomePct: number,
  correct: boolean,
): Promise<void> {
  await sql`
    UPDATE card_signals
    SET outcome_price      = ${outcomePrice},
        outcome_pct        = ${outcomePct},
        outcome_correct    = ${correct},
        outcome_checked_at = NOW()
    WHERE id = ${id}
  `;
}

export async function dbGetSignalWinRate(days: number): Promise<number | null> {
  const rows = await sql`
    SELECT COUNT(*) FILTER (WHERE outcome_correct = TRUE)  AS wins,
           COUNT(*) FILTER (WHERE outcome_correct IS NOT NULL) AS total
    FROM card_signals
    WHERE generated_at > NOW() - (${days} || ' days')::INTERVAL
  `;
  const wins  = parseInt(rows[0].wins  as string, 10);
  const total = parseInt(rows[0].total as string, 10);
  if (total < 3) return null;
  return (wins / total) * 100;
}

// ─── Market narratives ────────────────────────────────────────────────────────

export interface NarrativeRow {
  portfolioHash: string;
  narrative: string;
  themes: string[];
  contradictions: string[];
  topOpportunity?: string;
  topRisk?: string;
  regimeSummary?: string;
  signalWinRate?: number;
  computedAt?: string;
}

export async function dbUpsertNarrative(n: NarrativeRow): Promise<void> {
  await sql`
    INSERT INTO market_narratives (
      portfolio_hash, narrative, themes, contradictions,
      top_opportunity, top_risk, regime_summary, signal_win_rate, computed_at
    ) VALUES (
      ${n.portfolioHash}, ${n.narrative},
      ${JSON.stringify(n.themes)}::jsonb, ${JSON.stringify(n.contradictions)}::jsonb,
      ${n.topOpportunity ?? null}, ${n.topRisk ?? null},
      ${n.regimeSummary ?? null}, ${n.signalWinRate ?? null},
      NOW()
    )
    ON CONFLICT (portfolio_hash) DO UPDATE SET
      narrative       = EXCLUDED.narrative,
      themes          = EXCLUDED.themes,
      contradictions  = EXCLUDED.contradictions,
      top_opportunity = EXCLUDED.top_opportunity,
      top_risk        = EXCLUDED.top_risk,
      regime_summary  = EXCLUDED.regime_summary,
      signal_win_rate = EXCLUDED.signal_win_rate,
      computed_at     = NOW()
  `;
}

export async function dbGetNarrative(portfolioHash: string): Promise<NarrativeRow | null> {
  const rows = await sql`
    SELECT portfolio_hash, narrative, themes, contradictions,
           top_opportunity, top_risk, regime_summary, signal_win_rate, computed_at
    FROM market_narratives
    WHERE portfolio_hash = ${portfolioHash}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    portfolioHash:  r.portfolio_hash as string,
    narrative:      r.narrative as string,
    themes:         r.themes as string[],
    contradictions: r.contradictions as string[],
    topOpportunity: r.top_opportunity as string | undefined,
    topRisk:        r.top_risk as string | undefined,
    regimeSummary:  r.regime_summary as string | undefined,
    signalWinRate:  r.signal_win_rate != null ? parseFloat(r.signal_win_rate as string) : undefined,
    computedAt:     r.computed_at as string,
  };
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the email was newly inserted, false if it already existed.
 */
export async function dbAddToWaitlist(email: string): Promise<{ isNew: boolean; position: number }> {
  // Try inserting; skip if duplicate
  await sql`
    INSERT INTO waitlist (email) VALUES (${email.toLowerCase().trim()})
    ON CONFLICT (email) DO NOTHING
  `;
  // Always return position so we can show it in the welcome email
  const rows = await sql`
    SELECT COUNT(*) AS position FROM waitlist
    WHERE joined_at <= (SELECT joined_at FROM waitlist WHERE email = ${email.toLowerCase().trim()})
  `;
  const position = parseInt(rows[0].position as string, 10);
  // Check if this was a new entry (welcomed = false means brand new)
  const check = await sql`
    SELECT welcomed FROM waitlist WHERE email = ${email.toLowerCase().trim()}
  `;
  const isNew = check.length > 0 && check[0].welcomed === false;
  return { isNew, position };
}

export async function dbMarkWelcomed(email: string): Promise<void> {
  await sql`UPDATE waitlist SET welcomed = TRUE WHERE email = ${email.toLowerCase().trim()}`;
}

export async function dbGetWaitlistCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) AS count FROM waitlist`;
  return parseInt(rows[0].count as string, 10);
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface CardRow {
  id: string;
  user_id: string;
  player: string;
  year: number;
  brand: string;
  card_number?: string;
  variation?: string;
  condition: string;
  sport: string;
  purchase_price: number;
  current_value: number;
  added_at: string;
  last_price_update?: string;
}

function rowToCard(r: Record<string, unknown>) {
  return {
    id:               r.id as string,
    player:           r.player as string,
    year:             r.year as number,
    brand:            r.brand as string,
    cardNumber:       r.card_number as string | undefined,
    variation:        r.variation as string | undefined,
    condition:        r.condition as string,
    sport:            r.sport as string,
    purchasePrice:    parseFloat(r.purchase_price as string),
    currentValue:     parseFloat(r.current_value as string),
    addedAt:          r.added_at as string,
    lastPriceUpdate:  r.last_price_update as string | undefined,
  };
}
