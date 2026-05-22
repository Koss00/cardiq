export type Sport = 'Baseball' | 'Basketball' | 'Football' | 'Hockey' | 'Soccer' | 'Golf';
export type Condition = 'Raw' | 'PSA 10' | 'PSA 9' | 'PSA 8' | 'PSA 7' | 'BGS 9.5' | 'BGS 9' | 'SGC 10';
export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface Card {
  id: string;
  player: string;
  year: number;
  brand: string;
  cardNumber?: string;
  variation?: string;
  condition: Condition;
  purchasePrice: number;
  currentValue: number;
  imageUrl?: string;
  sport: Sport;
  addedAt: string;
  lastPriceUpdate?: string;
}

export interface PlayerStat {
  label: string;
  value: string;
}

export interface PlayerStats {
  playerName: string;
  sport: string;
  team?: string;
  season: string;
  stats: PlayerStat[];
  injuryStatus?: string;
  source?: string;
  isRetired?: boolean;
  knownActive?: boolean;
}

export type WyckoffRegime = 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';

export interface CardSignal {
  cardId: string;
  player: string;
  signal: SignalType;
  confidence: number;
  summary: string;
  priceTrend: string;
  playerContext: string;
  scarcityNote: string;
  marketContext?: string;
  timeframe?: string;
  priceTarget?: number;
  generatedAt: string;
  playerStats?: PlayerStats;
  newsItems?: string[];
  priceHistory?: PricePoint[];
  confidenceFactors?: ConfidenceFactor[];
  // Phase 2 intelligence fields
  wyckoffRegime?: WyckoffRegime;
  marketHeatScore?: number;   // 0-100
  evPerDollar?: number;       // e.g. 0.24 = +24% EV
  qualityScore?: number;      // 1-10
  qualityRationale?: string;
  hasDrift?: boolean;         // true if signal changed vs. last stored
  // Legacy field
  reason?: string;
}

export interface IdentifiedCard {
  player: string;
  year: number;
  brand: string;
  cardNumber?: string;
  variation?: string;
  sport: Sport;
  condition: string;
  confidence: number;
  description: string;
}

export interface EbayListing {
  title: string;
  price: number;
  soldDate?: string;
  url: string;
  condition?: string;
  imageUrl?: string;
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface ConfidenceFactor {
  label: string;
  value: number; // 0–100
  description: string;
}

export type AlertType = 'SPIKE' | 'DROP';

export interface PriceAlert {
  id: number;
  cardId: string;
  player: string;
  alertType: AlertType;
  oldPrice: number;
  newPrice: number;
  pctChange: number;
  createdAt: string;
}

export interface CardMetrics {
  cardId: string;
  player: string;
  kelly: number | null;
  sharpe: number | null;
  maxDrawdown: number | null;
  pricePoints: number;
}

export interface PortfolioMetrics {
  portfolioKelly: number | null;
  portfolioSharpe: number | null;
  portfolioMaxDrawdown: number | null;
  cards: CardMetrics[];
  computedAt: string;
}

export interface MarketNarrative {
  portfolioHash: string;
  narrative: string;
  themes: string[];
  contradictions: string[];
  topOpportunity?: string;
  topRisk?: string;
  regimeSummary?: string;
  signalWinRate?: number;  // 0-100, undefined = insufficient history
  computedAt: string;
}

