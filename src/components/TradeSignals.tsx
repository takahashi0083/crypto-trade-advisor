import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { TradeSignal } from '../types/crypto';
import { CryptoApiService } from '../services/cryptoApi';
import { TechnicalAnalysis } from '../utils/technicalIndicators';
import { NotificationService } from '../utils/notifications';
import { SoundNotification } from '../utils/soundNotification';
import { LineNotification } from '../utils/lineNotification';
import { LineNotificationAlert } from './LineNotificationAlert';
import { MarketAnalysis } from './MarketAnalysis';
import { MultiTimeframeAnalysis } from '../utils/multiTimeframeAnalysis';
import { NotificationCooldown } from '../utils/notificationCooldown';
import './TradeSignals.css';

export const TradeSignals = () => {
  const { prices, assets, signals, updateSignals, addAlertToHistory, notificationSettings } = useStore();
  const [fearGreedIndex, setFearGreedIndex] = useState<any>(null);
  const [lineAlert, setLineAlert] = useState<{ message: string } | null>(null);
  
  // シグナルの生成
  useEffect(() => {
    const generateSignals = async () => {
      console.log('Generating signals...', { pricesCount: prices.length, assetsCount: assets.length });
      if (prices.length === 0) return;
      
      const newSignals: TradeSignal[] = [];
      
      // Fear & Greed Indexの取得
      const fgi = await CryptoApiService.getFearGreedIndex();
      setFearGreedIndex(fgi);
      
      // 各通貨のシグナルを生成
      for (const price of prices) {
        console.log(`${price.symbol}: マルチタイムフレーム分析開始...`);
        
        // マルチタイムフレーム分析
        let mtfSignals;
        let compositeSignal;
        
        try {
          mtfSignals = await MultiTimeframeAnalysis.analyzeMultipleTimeframes(price.symbol);
          console.log(`${price.symbol} MTF結果:`, mtfSignals);
          compositeSignal = MultiTimeframeAnalysis.generateCompositeSignal(mtfSignals);
          console.log(`${price.symbol} 統合シグナル:`, compositeSignal);
        } catch (error) {
          console.error(`${price.symbol} マルチタイムフレーム分析エラー:`, error);
          // エラー時のデフォルト値
          mtfSignals = [];
          compositeSignal = { action: 'HOLD', confidence: 50, reasons: [] };
        }
        
        // 実際の履歴データを取得（4時間足、30本 = 5日分）
        const historicalData = await CryptoApiService.getHistoricalPrices(price.symbol, '4h', 30);
        
        if (historicalData.length < 20) {
          console.log(`${price.symbol}: 履歴データ不足`);
          continue;
        }
        
        // 履歴データの確認
        console.log(`${price.symbol} 履歴データ:`, {
          データ数: historicalData.length,
          最新価格: historicalData[historicalData.length - 1].close,
          最古価格: historicalData[0].close,
          最新タイムスタンプ: new Date(historicalData[historicalData.length - 1].timestamp).toLocaleString('ja-JP')
        });
        
        // 終値の配列を作成（JPY換算）
        const USD_TO_JPY = 157;
        const historicalPrices = historicalData.map((d: any) => d.close * USD_TO_JPY);
        
        // 最新価格を現在価格に更新（リアルタイム反映）
        historicalPrices[historicalPrices.length - 1] = price.price;
        
        // テクニカル指標の計算
        const rsi = TechnicalAnalysis.calculateRSI(historicalPrices);
        const sma20 = TechnicalAnalysis.calculateSMA(historicalPrices, 20);
        const sma50 = historicalPrices.length >= 50 ? TechnicalAnalysis.calculateSMA(historicalPrices, 50) : sma20;
        const bollinger = TechnicalAnalysis.calculateBollingerBands(historicalPrices);
        
        console.log(`${price.symbol} RSI計算データ:`, {
          価格配列長: historicalPrices.length,
          最新価格: historicalPrices[historicalPrices.length - 1],
          直近5価格: historicalPrices.slice(-5).map((p: number) => Math.round(p))
        });
        
        const indicators = {
          rsi,
          sma20,
          sma50,
          ema12: 0,
          ema26: 0,
          macd: 0,
          bollingerUpper: bollinger.upper,
          bollingerLower: bollinger.lower,
          priceChange24h: price.change24h
        };
        
        const score = TechnicalAnalysis.calculateSignalScore(indicators, price.price);
        
        // 保有資産の確認
        const asset = assets.find(a => a.symbol === price.symbol);
        const profitPercent = asset ? ((price.price - asset.purchasePrice) / asset.purchasePrice) * 100 : 0;
        
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let reasons: string[] = [];
        
        // 過去のスコアから動的しきい値を計算
        // 本来は過去のスコア履歴を保存して使用すべきですが、今回は簡易的に現在の指標から計算
        const mockHistoricalScores = [];
        for (let i = 0; i < 30; i++) {
          // RSIと価格位置からモックスコアを生成
          const mockRsi = 30 + Math.random() * 40; // 30-70の範囲
          const mockIndicators = { ...indicators, rsi: mockRsi };
          mockHistoricalScores.push(TechnicalAnalysis.calculateSignalScore(mockIndicators, price.price));
        }
        const thresholds = TechnicalAnalysis.calculateDynamicThresholds(mockHistoricalScores);
        console.log(`${price.symbol} 動的しきい値:`, thresholds);
        
        // マルチタイムフレーム分析の統合
        const mtfWeight = 0.3; // マルチタイムフレームの重み
        const technicalWeight = 0.7; // テクニカル指標の重み
        const compositeScore = (score * technicalWeight) + (compositeSignal.confidence * mtfWeight);
        
        console.log(`${price.symbol} 指標:`, {
          現在価格: price.price.toLocaleString(),
          RSI: rsi.toFixed(1),
          SMA20: sma20.toLocaleString(),
          ボリンジャー上: bollinger.upper.toLocaleString(),
          ボリンジャー下: bollinger.lower.toLocaleString(),
          単独スコア: score,
          総合スコア: compositeScore.toFixed(1)
        });
        
        // 買いシグナル
        if (!asset) {
          const buyCondition = compositeScore > thresholds.buy || 
                              (compositeSignal.action === 'BUY' && compositeSignal.confidence > 70) ||
                              rsi < 25 || 
                              (fgi && fgi.value < 20);
          
          console.log(`${price.symbol} 買いシグナル判定:`, {
            compositeScore: compositeScore.toFixed(1),
            threshold_buy: thresholds.buy,
            score_over_threshold: compositeScore > thresholds.buy,
            mtf_action: compositeSignal.action,
            mtf_confidence: compositeSignal.confidence,
            mtf_buy_condition: compositeSignal.action === 'BUY' && compositeSignal.confidence > 70,
            rsi,
            rsi_oversold: rsi < 25,
            fgi_value: fgi?.value,
            fgi_fear: fgi && fgi.value < 20,
            final_buy_condition: buyCondition
          });
          
          if (buyCondition) {
            action = 'BUY';
            
            // マルチタイムフレーム分析の理由
            if (compositeSignal.action === 'BUY' && compositeSignal.confidence > 70) {
              reasons.push(...compositeSignal.reasons);
            }
            
            if (rsi < 25) reasons.push(`RSI: ${rsi.toFixed(0)} (極度の売られすぎ)`);
            else if (rsi < 35) reasons.push(`RSI: ${rsi.toFixed(0)} (売られすぎ)`);
            if (price.price < bollinger.lower) reasons.push('ボリンジャーバンド下限突破');
            if (fgi && fgi.value < 20) reasons.push(`市場心理: 極度の恐怖 (${fgi.value})`);
            else if (fgi && fgi.value < 30) reasons.push(`市場心理: ${fgi.classification}`);
            if (price.change24h < -10) reasons.push(`大幅下落: ${price.change24h.toFixed(1)}%`);
            else if (price.change24h < -5) reasons.push(`24h変動: ${price.change24h.toFixed(1)}%`);
            if (compositeScore > 80) reasons.push(`総合スコア: ${compositeScore.toFixed(0)}/100 (非常に強い買いシグナル)`);
            else if (compositeScore > thresholds.buy) reasons.push(`総合スコア: ${compositeScore.toFixed(0)}/100 (買いシグナル)`);
          }
        }
        
        // 売りシグナル
        if (asset) {
          const sellCondition = compositeScore < thresholds.sell || 
                               (compositeSignal.action === 'SELL' && compositeSignal.confidence > 70) ||
                               profitPercent > 30 || 
                               profitPercent < -15 || 
                               rsi > 75;
          
          if (sellCondition) {
            action = 'SELL';
            
            // マルチタイムフレーム分析の理由
            if (compositeSignal.action === 'SELL' && compositeSignal.confidence > 70) {
              reasons.push(...compositeSignal.reasons);
            }
            
            if (rsi > 75) reasons.push(`RSI: ${rsi.toFixed(0)} (極度の買われすぎ)`);
            else if (rsi > 65) reasons.push(`RSI: ${rsi.toFixed(0)} (買われすぎ)`);
            if (profitPercent > 50) reasons.push(`大幅利益 +${profitPercent.toFixed(1)}% (利確推奨)`);
            else if (profitPercent > 30) reasons.push(`利益率 +${profitPercent.toFixed(1)}%達成`);
            if (profitPercent < -15) reasons.push(`損失 ${profitPercent.toFixed(1)}% (損切り推奨)`);
            if (price.price > bollinger.upper) reasons.push('ボリンジャーバンド上限突破');
            if (fgi && fgi.value > 80) reasons.push(`市場心理: 極度の欲望 (${fgi.value})`);
            else if (fgi && fgi.value > 70) reasons.push(`市場心理: ${fgi.classification}`);
            if (compositeScore < 20) reasons.push(`総合スコア: ${compositeScore.toFixed(0)}/100 (非常に強い売りシグナル)`);
            else if (compositeScore < thresholds.sell) reasons.push(`総合スコア: ${compositeScore.toFixed(0)}/100 (売りシグナル)`);
          }
        }
        
        const signal: TradeSignal = {
          symbol: price.symbol,
          action,
          score: Math.round(compositeScore), // 総合スコアを使用
          reasons: [...new Set(reasons)], // 重複を除去
          suggestedAmount: action === 'BUY' ? 50000 : undefined,
          suggestedPercentage: action === 'SELL' ? 30 : undefined,
          confidence: compositeScore > 80 ? 'HIGH' : compositeScore > 60 ? 'MEDIUM' : 'LOW',
          timestamp: new Date(),
          indicators: {
            rsi: Math.round(rsi)
          }
        };
        
        newSignals.push(signal);
        console.log('Signal generated:', { 
          symbol: price.symbol, 
          action, 
          score: Math.round(compositeScore), 
          reasons,
          thresholds: { buy: thresholds.buy, sell: thresholds.sell }
        });
        
        // 通知の送信
        console.log(`${price.symbol} 通知設定:`, notificationSettings);
        
        if (notificationSettings.enabled) {
          // 買いシグナル通知
          console.log(`${price.symbol} 通知判定:`, {
            action,
            compositeScore: compositeScore.toFixed(1),
            over_threshold: compositeScore > thresholds.buy,
            notifications_enabled: notificationSettings.buySignals,
            will_notify: action === 'BUY' && compositeScore > thresholds.buy && notificationSettings.buySignals
          });
          
          if (action === 'BUY' && compositeScore > thresholds.buy && notificationSettings.buySignals) {
            // クールダウンチェック
            if (NotificationCooldown.canSendNotification(price.symbol, 'BUY')) {
              NotificationService.showBuySignal(price.symbol, compositeScore, reasons[0] || '強い買いシグナル');
              SoundNotification.playNotificationSound('buy');
              
              // LINE通知を自動送信
              const lineMessage = LineNotification.generateBuyMessage(
                price.symbol, 
                compositeScore, 
                reasons[0] || '強い買いシグナル',
                price.price
              );
              LineNotification.sendNotification(lineMessage);
              
              // 通知を記録
              NotificationCooldown.recordNotification(price.symbol, 'BUY');
              addAlertToHistory(signal);
            } else {
              const remaining = NotificationCooldown.getRemainingCooldown(price.symbol, 'BUY');
              console.log(`${price.symbol} 買いシグナル通知はクールダウン中（残り${Math.floor(remaining / 60)}分）`);
            }
          }
          
          // 売りシグナル通知（重要度高）
          if (action === 'SELL' && asset && notificationSettings.sellSignals) {
            // クールダウンチェック
            if (NotificationCooldown.canSendNotification(price.symbol, 'SELL')) {
              NotificationService.showSellSignal(price.symbol, profitPercent, reasons[0] || '売却推奨');
              SoundNotification.playNotificationSound('sell');
              
              // LINE通知を自動送信
              const lineMessage = LineNotification.generateSellMessage(
                price.symbol,
                profitPercent,
                reasons[0] || '売却推奨',
                price.price
              );
              LineNotification.sendNotification(lineMessage);
              
              // 通知を記録
              NotificationCooldown.recordNotification(price.symbol, 'SELL');
              addAlertToHistory(signal);
            } else {
              const remaining = NotificationCooldown.getRemainingCooldown(price.symbol, 'SELL');
              console.log(`${price.symbol} 売りシグナル通知はクールダウン中（残り${Math.floor(remaining / 60)}分）`);
            }
          }
          
          // 利益確定ライン到達通知
          if (asset && notificationSettings.profitTargets.some(target => profitPercent >= target)) {
            const reachedTarget = notificationSettings.profitTargets.find(target => profitPercent >= target);
            
            // クールダウンチェック
            if (NotificationCooldown.canSendNotification(price.symbol, 'PROFIT', profitPercent)) {
              NotificationService.showNotification(`🎯 ${price.symbol} 目標達成！`, {
                body: `利益率 +${profitPercent.toFixed(1)}% (目標: +${reachedTarget}%)`,
                requireInteraction: true,
                tag: `profit-${price.symbol}-${reachedTarget}`
              });
              
              // LINE通知を自動送信
              const lineMessage = LineNotification.generateProfitTargetMessage(
                price.symbol,
                profitPercent,
                reachedTarget!
              );
              LineNotification.sendNotification(lineMessage);
              
              // 通知を記録
              NotificationCooldown.recordNotification(price.symbol, 'PROFIT', profitPercent);
            }
          }
          
          // 損切りライン到達通知
          if (asset && notificationSettings.lossLimits.some(limit => profitPercent <= -limit)) {
            const reachedLimit = notificationSettings.lossLimits.find(limit => profitPercent <= -limit);
            
            // クールダウンチェック
            if (NotificationCooldown.canSendNotification(price.symbol, 'LOSS', Math.abs(profitPercent))) {
              NotificationService.showNotification(`⚠️ ${price.symbol} 損切りライン`, {
                body: `損失 ${profitPercent.toFixed(1)}% (設定: -${reachedLimit}%)`,
                requireInteraction: true,
                tag: `loss-${price.symbol}-${reachedLimit}`
              });
              
              // LINE通知を自動送信
              const lineMessage = LineNotification.generateLossLimitMessage(
                price.symbol,
                profitPercent,
                reachedLimit!
              );
              LineNotification.sendNotification(lineMessage);
              
              // 通知を記録
              NotificationCooldown.recordNotification(price.symbol, 'LOSS', Math.abs(profitPercent));
            }
          }
        }
      }
      
      
      updateSignals(newSignals);
      console.log('Final signals:', newSignals);
    };
    
    generateSignals();
  }, [prices, assets, updateSignals, addAlertToHistory, notificationSettings]);
  
  const buySignals = signals.filter(s => s.action === 'BUY').sort((a, b) => b.score - a.score);
  const sellSignals = signals.filter(s => s.action === 'SELL').sort((a, b) => b.score - a.score);
  
  return (
    <div className="trade-signals">
      {lineAlert && (
        <LineNotificationAlert 
          message={lineAlert.message}
          onClose={() => setLineAlert(null)}
        />
      )}
      
      <MarketAnalysis />
      
      {fearGreedIndex && (
        <div className={`fear-greed-index ${fearGreedIndex.value < 25 ? 'fear' : fearGreedIndex.value > 75 ? 'greed' : 'neutral'}`}>
          <h3>市場心理指数</h3>
          <div className="index-value">{fearGreedIndex.value}</div>
          <div className="index-label">{fearGreedIndex.classification}</div>
        </div>
      )}
      
      <div className="signals-grid">
        <div className="signal-section buy-section">
          <h2>🟢 買い推奨</h2>
          {buySignals.length === 0 ? (
            <p className="no-signals">現在買い推奨はありません</p>
          ) : (
            buySignals.slice(0, 3).map(signal => (
              <div key={signal.symbol} className="signal-card buy-signal">
                <div className="signal-header">
                  <h3>{signal.symbol}</h3>
                  <span className={`confidence ${signal.confidence.toLowerCase()}`}>
                    {signal.confidence}
                  </span>
                </div>
                <div className="signal-score">
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${signal.score}%` }} />
                  </div>
                  <span className="score-text">{signal.score}/100</span>
                </div>
                <div className="signal-reasons">
                  {signal.reasons.map((reason, i) => (
                    <div key={i} className="reason">✓ {reason}</div>
                  ))}
                </div>
                {signal.suggestedAmount && (
                  <div className="suggested-amount">
                    推奨購入額: ¥{signal.suggestedAmount.toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="signal-section sell-section">
          <h2>🔴 売却推奨</h2>
          {assets.length === 0 ? (
            <div className="no-assets-message">
              <p>保有資産がありません</p>
              <p className="sub-message">ポートフォリオタブから資産を追加してください</p>
            </div>
          ) : sellSignals.length === 0 ? (
            <div className="hold-recommendations">
              <p className="hold-title">現在は保有継続を推奨</p>
              {assets.map(asset => {
                const price = prices.find(p => p.symbol === asset.symbol);
                if (!price) return null;
                
                const profitPercent = ((price.price - asset.purchasePrice) / asset.purchasePrice) * 100;
                let holdScore = 50;
                let holdReason = '様子見';
                
                if (profitPercent < -20) {
                  holdScore = 20;
                  holdReason = '大幅な含み損。長期保有で回復を待つ';
                } else if (profitPercent < 0) {
                  holdScore = 35;
                  holdReason = '含み損。もう少し待ちましょう';
                } else if (profitPercent < 10) {
                  holdScore = 60;
                  holdReason = '小幅な利益。まだ上昇余地あり';
                } else if (profitPercent < 20) {
                  holdScore = 75;
                  holdReason = '順調に利益が出ています';
                } else {
                  holdScore = 85;
                  holdReason = '良い利益！利確のタイミングを検討';
                }
                
                return (
                  <div key={asset.id} className="hold-signal-card">
                    <div className="hold-header">
                      <h3>{asset.symbol}</h3>
                      <span className={`profit-badge ${profitPercent >= 0 ? 'positive' : 'negative'}`}>
                        {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="hold-score">
                      <label>保有継続スコア</label>
                      <div className="score-bar">
                        <div className="score-fill hold" style={{ width: `${holdScore}%` }} />
                      </div>
                      <span className="score-text">{holdScore}/100</span>
                    </div>
                    <div className="hold-reason">{holdReason}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            sellSignals.map(signal => (
              <div key={signal.symbol} className="signal-card sell-signal">
                <div className="signal-header">
                  <h3>{signal.symbol}</h3>
                  <span className={`confidence ${signal.confidence.toLowerCase()}`}>
                    {signal.confidence}
                  </span>
                </div>
                <div className="signal-score">
                  <div className="score-bar">
                    <div className="score-fill sell" style={{ width: `${signal.score}%` }} />
                  </div>
                  <span className="score-text">{signal.score}/100</span>
                </div>
                <div className="signal-reasons">
                  {signal.reasons.map((reason, i) => (
                    <div key={i} className="reason">✓ {reason}</div>
                  ))}
                </div>
                {signal.suggestedPercentage && (
                  <div className="suggested-amount">
                    推奨売却: 保有量の{signal.suggestedPercentage}%
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};