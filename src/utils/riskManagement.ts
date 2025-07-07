export interface RiskParameters {
  totalCapital: number;         // 総資本
  riskPerTrade: number;        // 1トレードあたりのリスク率（%）
  maxPositions: number;        // 最大同時ポジション数
  volatilityAdjustment: boolean; // ボラティリティ調整の有無
}

export interface PositionSize {
  amount: number;              // 推奨購入数量
  investmentAmount: number;    // 推奨投資金額
  stopLossPrice: number;       // 推奨損切り価格
  takeProfitPrice: number;     // 推奨利確価格
  riskAmount: number;          // リスク金額
}

export class RiskManagement {
  // ケリー基準によるポジションサイズ計算
  static calculateKellyCriterion(
    winRate: number,        // 勝率（0-1）
    avgWinAmount: number,   // 平均利益額
    avgLossAmount: number   // 平均損失額
  ): number {
    if (avgLossAmount === 0) return 0;
    
    const b = avgWinAmount / avgLossAmount; // 利益/損失比率
    const p = winRate;
    const q = 1 - winRate;
    
    // ケリー基準: f = (b * p - q) / b
    const kelly = (b * p - q) / b;
    
    // 安全のため、ケリー基準の25%を使用（クォーターケリー）
    return Math.max(0, Math.min(0.25, kelly * 0.25));
  }
  
  // ATRベースのストップロス計算
  static calculateATRStopLoss(
    currentPrice: number,
    atr: number,
    multiplier: number = 2
  ): { stopLoss: number; takeProfit: number } {
    const stopLoss = currentPrice - (atr * multiplier);
    const takeProfit = currentPrice + (atr * multiplier * 2); // リスクリワード比 1:2
    
    return {
      stopLoss: Math.max(0, stopLoss),
      takeProfit
    };
  }
  
  // ポジションサイズの計算
  static calculatePositionSize(
    params: RiskParameters,
    currentPrice: number,
    stopLossPrice: number,
    volatility?: number
  ): PositionSize {
    // 基本リスク金額
    let riskAmount = params.totalCapital * (params.riskPerTrade / 100);
    
    // ボラティリティ調整
    if (params.volatilityAdjustment && volatility) {
      // 高ボラティリティ時はポジションサイズを縮小
      const volAdjustment = Math.max(0.5, Math.min(1, 20 / volatility));
      riskAmount *= volAdjustment;
    }
    
    // 最大ポジション数による調整
    const maxRiskPerPosition = params.totalCapital * 0.1; // 総資本の10%まで
    riskAmount = Math.min(riskAmount, maxRiskPerPosition);
    
    // ストップロスまでの価格差
    const priceRisk = currentPrice - stopLossPrice;
    if (priceRisk <= 0) {
      return {
        amount: 0,
        investmentAmount: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmount: 0
      };
    }
    
    // 購入数量の計算
    const amount = riskAmount / priceRisk;
    const investmentAmount = amount * currentPrice;
    
    // 利確価格（リスクリワード比 1:2）
    const takeProfitPrice = currentPrice + (priceRisk * 2);
    
    return {
      amount: Math.max(0, amount),
      investmentAmount: Math.max(0, investmentAmount),
      stopLossPrice,
      takeProfitPrice,
      riskAmount
    };
  }
  
  // ポートフォリオリスクの評価
  static evaluatePortfolioRisk(
    positions: Array<{ symbol: string; value: number; volatility: number }>
  ): {
    totalRisk: number;
    diversificationScore: number;
    recommendations: string[];
  } {
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    if (totalValue === 0) {
      return { totalRisk: 0, diversificationScore: 0, recommendations: [] };
    }
    
    // 各ポジションの重み
    const weights = positions.map(pos => pos.value / totalValue);
    
    // ポートフォリオボラティリティ（簡易計算）
    const portfolioVolatility = positions.reduce((sum, pos, i) => {
      return sum + (weights[i] * pos.volatility);
    }, 0);
    
    // 多様化スコア（ハーフィンダール指数の逆数）
    const herfindahlIndex = weights.reduce((sum, w) => sum + (w * w), 0);
    const diversificationScore = 1 - herfindahlIndex;
    
    const recommendations: string[] = [];
    
    // リスク評価
    if (portfolioVolatility > 30) {
      recommendations.push('ポートフォリオのボラティリティが高いです。リスク分散を検討してください。');
    }
    
    // 集中度チェック
    weights.forEach((weight, i) => {
      if (weight > 0.4) {
        recommendations.push(`${positions[i].symbol}への集中度が高すぎます（${(weight * 100).toFixed(1)}%）。分散を推奨します。`);
      }
    });
    
    // 多様化チェック
    if (diversificationScore < 0.6) {
      recommendations.push('ポートフォリオの多様化が不十分です。異なる通貨への分散を検討してください。');
    }
    
    return {
      totalRisk: portfolioVolatility,
      diversificationScore: diversificationScore * 100,
      recommendations
    };
  }
  
  // 最大ドローダウンの計算
  static calculateMaxDrawdown(priceHistory: number[]): number {
    if (priceHistory.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = priceHistory[0];
    
    for (let i = 1; i < priceHistory.length; i++) {
      if (priceHistory[i] > peak) {
        peak = priceHistory[i];
      } else {
        const drawdown = (peak - priceHistory[i]) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown * 100; // パーセンテージで返す
  }
}