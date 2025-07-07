import type { TechnicalIndicators } from '../types/crypto';

export class TechnicalAnalysis {
  // RSI計算
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference > 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  // 単純移動平均
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }
  
  // 指数移動平均
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }
  
  // ボリンジャーバンド
  static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev)
    };
  }
  
  // 売買シグナルのスコア計算
  static calculateSignalScore(indicators: TechnicalIndicators, currentPrice: number): number {
    let score = 50; // 基準スコア
    
    // RSI
    if (indicators.rsi < 30) score += 20; // 売られすぎ→買い
    else if (indicators.rsi > 70) score -= 20; // 買われすぎ→売り
    
    // 移動平均線
    if (currentPrice > indicators.sma20 && currentPrice > indicators.sma50) score += 15;
    else if (currentPrice < indicators.sma20 && currentPrice < indicators.sma50) score -= 15;
    
    // ボリンジャーバンド
    if (currentPrice < indicators.bollingerLower) score += 15; // 下限突破→買い
    else if (currentPrice > indicators.bollingerUpper) score -= 15; // 上限突破→売り
    
    // スコアを0-100に正規化
    return Math.max(0, Math.min(100, score));
  }
}