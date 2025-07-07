import type { TechnicalIndicators } from '../types/crypto';

interface HistoricalData {
  close: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp: number;
}

export class TechnicalAnalysis {
  // RSI計算
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    // 最新のperiod本を使って計算（配列の最後から）
    const startIndex = prices.length - period - 1;
    for (let i = startIndex + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference > 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return Math.round(rsi * 10) / 10; // 小数点1位に丸める
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
  
  // ボリューム加重平均価格（VWAP）
  static calculateVWAP(data: HistoricalData[]): number {
    if (data.length === 0) return 0;
    
    let totalVolume = 0;
    let totalValue = 0;
    
    data.forEach(candle => {
      const typicalPrice = candle.high && candle.low ? 
        (candle.high + candle.low + candle.close) / 3 : candle.close;
      const volume = candle.volume || 0;
      
      totalValue += typicalPrice * volume;
      totalVolume += volume;
    });
    
    return totalVolume > 0 ? totalValue / totalVolume : data[data.length - 1].close;
  }
  
  // OBV（オンバランスボリューム）
  static calculateOBV(data: HistoricalData[]): number[] {
    if (data.length < 2) return [0];
    
    const obv: number[] = [0];
    
    for (let i = 1; i < data.length; i++) {
      const volume = data[i].volume || 0;
      
      if (data[i].close > data[i - 1].close) {
        obv.push(obv[i - 1] + volume);
      } else if (data[i].close < data[i - 1].close) {
        obv.push(obv[i - 1] - volume);
      } else {
        obv.push(obv[i - 1]);
      }
    }
    
    return obv;
  }
  
  // 売買シグナルのスコア計算（重み付け方式）
  static calculateSignalScore(indicators: TechnicalIndicators, currentPrice: number): number {
    // 各指標の重み（合計1.0）
    const weights = {
      rsi: 0.35,
      movingAverage: 0.25,
      bollingerBand: 0.25,
      momentum: 0.15
    };
    
    let totalScore = 0;
    
    // RSIスコア（0-100）
    let rsiScore = 50;
    if (indicators.rsi < 20) rsiScore = 90;
    else if (indicators.rsi < 30) rsiScore = 75;
    else if (indicators.rsi < 40) rsiScore = 60;
    else if (indicators.rsi > 80) rsiScore = 10;
    else if (indicators.rsi > 70) rsiScore = 25;
    else if (indicators.rsi > 60) rsiScore = 40;
    totalScore += rsiScore * weights.rsi;
    
    // 移動平均線スコア
    let maScore = 50;
    const maDiff20 = ((currentPrice - indicators.sma20) / indicators.sma20) * 100;
    const maDiff50 = ((currentPrice - indicators.sma50) / indicators.sma50) * 100;
    
    if (maDiff20 > 5 && maDiff50 > 3) maScore = 80;
    else if (maDiff20 > 2 && maDiff50 > 0) maScore = 65;
    else if (maDiff20 < -5 && maDiff50 < -3) maScore = 20;
    else if (maDiff20 < -2 && maDiff50 < 0) maScore = 35;
    totalScore += maScore * weights.movingAverage;
    
    // ボリンジャーバンドスコア
    let bbScore = 50;
    const bbPosition = (currentPrice - indicators.bollingerLower) / 
                      (indicators.bollingerUpper - indicators.bollingerLower);
    
    if (bbPosition < 0.1) bbScore = 85; // 下限突破
    else if (bbPosition < 0.2) bbScore = 70;
    else if (bbPosition < 0.3) bbScore = 60;
    else if (bbPosition > 0.9) bbScore = 15; // 上限突破
    else if (bbPosition > 0.8) bbScore = 30;
    else if (bbPosition > 0.7) bbScore = 40;
    totalScore += bbScore * weights.bollingerBand;
    
    // モメンタムスコア（価格変動率）
    let momentumScore = 50;
    const priceChange = indicators.priceChange24h || 0;
    if (priceChange < -10) momentumScore = 80;
    else if (priceChange < -5) momentumScore = 65;
    else if (priceChange > 10) momentumScore = 20;
    else if (priceChange > 5) momentumScore = 35;
    totalScore += momentumScore * weights.momentum;
    
    return Math.round(totalScore);
  }
  
  // 動的しきい値の計算
  static calculateDynamicThresholds(historicalScores: number[]): { buy: number; sell: number } {
    if (historicalScores.length < 10) {
      return { buy: 65, sell: 35 }; // デフォルト値
    }
    
    // パーセンタイルベースの動的しきい値
    const sorted = [...historicalScores].sort((a, b) => a - b);
    const p20 = sorted[Math.floor(sorted.length * 0.2)];
    const p80 = sorted[Math.floor(sorted.length * 0.8)];
    
    return {
      buy: Math.max(60, Math.min(75, p80)), // 60-75の範囲に制限
      sell: Math.min(40, Math.max(25, p20)) // 25-40の範囲に制限
    };
  }
}