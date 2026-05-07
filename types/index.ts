export type Sport = 'Baseball' | 'Basketball' | 'Football' | 'Hockey' | 'Soccer';
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
}

export interface CardSignal {
  cardId: string;
  player: string;
  signal: SignalType;
  confidence: number;
  // Structured three-dimension analysis (new)
  summary: string;
  priceTrend: string;
  playerContext: string;
  scarcityNote: string;
  timeframe?: string;
  priceTarget?: number;
  generatedAt: string;
  playerStats?: PlayerStats;
  // Legacy field — present on signals generated before the upgrade
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
