export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: Date;
  currentPrice?: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdate: Date;
}

export interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  score: number; // 0-100
  reasons: string[];
  suggestedAmount?: number;
  suggestedPercentage?: number; // 売却時の保有割合
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
}

export interface TechnicalIndicators {
  rsi: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
}

export interface NotificationSettings {
  enabled: boolean;
  buySignals: boolean;
  sellSignals: boolean;
  priceAlerts: boolean;
  profitTargets: number[]; // [20, 50, 100]
  lossLimits: number[]; // [10, 20]
}

export interface Portfolio {
  assets: CryptoAsset[];
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
}