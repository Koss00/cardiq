import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

// ─── Schema ───────────────────────────────────────────────────────────────────

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      id              TEXT PRIMARY KEY,
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
}

// ─── Cards CRUD ───────────────────────────────────────────────────────────────

export async function dbGetCards() {
  const rows = await sql`
    SELECT * FROM cards ORDER BY added_at DESC
  `;
  return rows.map(rowToCard);
}

export async function dbUpsertCard(card: CardRow) {
  await sql`
    INSERT INTO cards (
      id, player, year, brand, card_number, variation,
      condition, sport, purchase_price, current_value,
      added_at, last_price_update
    ) VALUES (
      ${card.id}, ${card.player}, ${card.year}, ${card.brand},
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

export async function dbDeleteCard(id: string) {
  await sql`DELETE FROM cards WHERE id = ${id}`;
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

// ─── Internal types ───────────────────────────────────────────────────────────

interface CardRow {
  id: string;
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
