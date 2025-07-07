import { CryptoApiService } from '../services/cryptoApi';
import { TechnicalAnalysis } from './technicalIndicators';

export interface TimeframeSignal {
  timeframe: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number; // 0-100
  indicators: {
    rsi: number;
    sma20: number;
    sma50: number;
    bollingerPosition: number; // 0-1 (0=下限, 1=上限)
  };
}

export class MultiTimeframeAnalysis {
  // 複数の時間枠で分析
  static async analyzeMultipleTimeframes(
    symbol: string,
    timeframes: string[] = ['1h', '4h'] // API負荷軽減のため、2つの時間枠に縮小
  ): Promise<TimeframeSignal[]> {
    const results: TimeframeSignal[] = [];
    const USD_TO_JPY = 157;
    
    for (const timeframe of timeframes) {
      try {
        console.log(`  ${symbol} - ${timeframe} データ取得中...`);
        // 各時間枠に応じた本数を取得
        const limit = this.getCandelLimit(timeframe);
        const historicalData = await CryptoApiService.getHistoricalPrices(symbol, timeframe, limit);
        
        if (historicalData.length < 20) {
          continue;
        }
        
        const prices = historicalData.map((d: any) => d.close * USD_TO_JPY);
        
        // テクニカル指標の計算
        const rsi = TechnicalAnalysis.calculateRSI(prices);
        const sma20 = TechnicalAnalysis.calculateSMA(prices, 20);
        const sma50 = prices.length >= 50 ? TechnicalAnalysis.calculateSMA(prices, 50) : sma20;
        const bollinger = TechnicalAnalysis.calculateBollingerBands(prices);
        
        const currentPrice = prices[prices.length - 1];
        const bollingerPosition = (currentPrice - bollinger.lower) / (bollinger.upper - bollinger.lower);
        
        // トレンド判定
        const trend = this.determineTrend(currentPrice, sma20, sma50, rsi);
        const strength = this.calculateTrendStrength(currentPrice, sma20, sma50, rsi, bollingerPosition);
        
        results.push({
          timeframe,
          trend,
          strength,
          indicators: {
            rsi,
            sma20,
            sma50,
            bollingerPosition
          }
        });
      } catch (error) {
        console.error(`${symbol} - ${timeframe}の分析エラー:`, error);
      }
    }
    
    return results;
  }
  
  // 時間枠に応じたローソク足の本数
  private static getCandelLimit(timeframe: string): number {
    switch (timeframe) {
      case '15m': return 96;   // 24時間分
      case '1h': return 72;    // 3日分
      case '4h': return 42;    // 1週間分
      case '1d': return 30;    // 1ヶ月分
      default: return 50;
    }
  }
  
  // トレンド判定
  private static determineTrend(
    price: number,
    sma20: number,
    sma50: number,
    rsi: number
  ): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const aboveSMA20 = price > sma20;
    const aboveSMA50 = price > sma50;
    const sma20AboveSMA50 = sma20 > sma50;
    
    if (aboveSMA20 && aboveSMA50 && sma20AboveSMA50 && rsi > 50) {
      return 'BULLISH';
    } else if (!aboveSMA20 && !aboveSMA50 && !sma20AboveSMA50 && rsi < 50) {
      return 'BEARISH';
    }
    
    return 'NEUTRAL';
  }
  
  // トレンドの強さを計算
  private static calculateTrendStrength(
    price: number,
    sma20: number,
    sma50: number,
    rsi: number,
    bollingerPosition: number
  ): number {
    let strength = 50;
    
    // 移動平均線からの乖離
    const sma20Diff = ((price - sma20) / sma20) * 100;
    const sma50Diff = ((price - sma50) / sma50) * 100;
    
    // 移動平均線の強さ
    if (Math.abs(sma20Diff) > 5) strength += sma20Diff > 0 ? 10 : -10;
    if (Math.abs(sma50Diff) > 10) strength += sma50Diff > 0 ? 15 : -15;
    
    // RSIの強さ
    if (rsi > 70) strength += 15;
    else if (rsi < 30) strength -= 15;
    else if (rsi > 60) strength += 5;
    else if (rsi < 40) strength -= 5;
    
    // ボリンジャーバンドの位置
    if (bollingerPosition > 0.8) strength += 10;
    else if (bollingerPosition < 0.2) strength -= 10;
    
    return Math.max(0, Math.min(100, strength));
  }
  
  // 総合シグナルの生成
  static generateCompositeSignal(signals: TimeframeSignal[]): {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
  } {
    if (signals.length === 0) {
      return { action: 'HOLD', confidence: 0, reasons: ['データ不足'] };
    }
    
    // 時間枠ごとの重み（簡略化）
    const weights: { [key: string]: number } = {
      '15m': 0.1,
      '1h': 0.4,
      '4h': 0.6,
      '1d': 0.3
    };
    
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    
    const reasons: string[] = [];
    
    signals.forEach(signal => {
      const weight = weights[signal.timeframe] || 0.25;
      totalWeight += weight;
      
      if (signal.trend === 'BULLISH') {
        bullishScore += signal.strength * weight;
        if (signal.strength > 70) {
          reasons.push(`${signal.timeframe}: 強い上昇トレンド`);
        }
      } else if (signal.trend === 'BEARISH') {
        bearishScore += signal.strength * weight;
        if (signal.strength > 70) {
          reasons.push(`${signal.timeframe}: 強い下降トレンド`);
        }
      }
    });
    
    // 正規化
    if (totalWeight > 0) {
      bullishScore /= totalWeight;
      bearishScore /= totalWeight;
    }
    
    // アクション決定
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    
    if (bullishScore > 65) {
      action = 'BUY';
      confidence = bullishScore;
      if (reasons.length === 0) reasons.push('複数時間枠で上昇トレンド確認');
    } else if (bearishScore > 65) {
      action = 'SELL';
      confidence = bearishScore;
      if (reasons.length === 0) reasons.push('複数時間枠で下降トレンド確認');
    } else {
      if (reasons.length === 0) reasons.push('明確なトレンドなし');
    }
    
    return { action, confidence, reasons };
  }
}