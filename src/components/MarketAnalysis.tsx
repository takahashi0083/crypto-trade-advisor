import { useStore } from '../store/useStore';
import './MarketAnalysis.css';

export const MarketAnalysis = () => {
  const { signals, prices } = useStore();
  
  // 通貨名のマッピング
  const currencyNames: { [key: string]: string } = {
    BTC: 'ビットコイン',
    ETH: 'イーサリアム',
    XRP: 'リップル',
    LTC: 'ライトコイン',
    BCH: 'ビットコインキャッシュ',
    ADA: 'カルダノ'
  };
  
  // 対象通貨のシグナルと価格情報を結合
  const targetCurrencies = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA'];
  
  interface MarketDataItem {
    symbol: string;
    name: string;
    score: number;
    price: number;
    change24h: number;
    status: string;
    statusClass: string;
    recommendation: string;
    rsi: number;
  }
  
  const marketData: MarketDataItem[] = targetCurrencies.map(symbol => {
    const signal = signals.find(s => s.symbol === symbol);
    const price = prices.find(p => p.symbol === symbol);
    
    if (!signal || !price) return null;
    
    // スコアに基づく状態判定
    let status = '';
    let statusClass = '';
    let recommendation = '';
    
    if (signal.score >= 75) {
      status = '買い推奨';
      statusClass = 'buy';
      recommendation = '買い時です！';
    } else if (signal.score >= 70) {
      status = '買い時に近い';
      statusClass = 'near-buy';
      recommendation = `あと${75 - signal.score}ポイントで通知`;
    } else if (signal.score >= 50) {
      status = '中立';
      statusClass = 'neutral';
      recommendation = '様子見';
    } else if (signal.score >= 35) {
      status = '弱気相場';
      statusClass = 'bearish';
      recommendation = '下落傾向';
    } else {
      status = '売り推奨';
      statusClass = 'sell';
      recommendation = '売却検討';
    }
    
    // RSI値を取得
    const rsi = signal.indicators?.rsi || 50;
    
    return {
      symbol,
      name: currencyNames[symbol],
      score: signal.score,
      price: price.price,
      change24h: price.change24h,
      status,
      statusClass,
      recommendation,
      rsi
    };
  }).filter((item): item is MarketDataItem => item !== null);
  
  const lastUpdate = prices.length > 0 ? new Date(prices[0].lastUpdate) : new Date();
  
  return (
    <div className="market-analysis">
      <div className="analysis-header">
        <h3>📊 市場分析ダッシュボード</h3>
        <div className="update-info">
          <span className="update-status">✅ システム稼働中</span>
          <span className="last-update">最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}</span>
        </div>
      </div>
      
      <div className="currency-grid">
        {marketData.map(data => (
          <div key={data.symbol} className={`currency-card ${data.statusClass}`}>
            <div className="currency-header">
              <h4>{data.symbol}</h4>
              <span className="currency-name">{data.name}</span>
            </div>
            
            <div className="score-section">
              <div className="score-main">
                <span className="score-label">スコア</span>
                <span className="score-value">{data.score}/100</span>
              </div>
              <div className={`status-badge ${data.statusClass}`}>
                {data.status}
              </div>
            </div>
            
            <div className="price-info">
              <div className="current-price">
                ¥{data.price.toLocaleString()}
              </div>
              <div className={`price-change ${data.change24h >= 0 ? 'positive' : 'negative'}`}>
                {data.change24h >= 0 ? '▲' : '▼'} {Math.abs(data.change24h).toFixed(2)}%
              </div>
            </div>
            
            <div className="indicators">
              <div className="indicator">
                <span className="indicator-label">RSI</span>
                <span className="indicator-value">{data.rsi}</span>
              </div>
            </div>
            
            <div className="recommendation">
              {data.recommendation}
            </div>
          </div>
        ))}
      </div>
      
      {marketData.length === 0 && (
        <div className="no-data">
          データを読み込み中...
        </div>
      )}
    </div>
  );
};