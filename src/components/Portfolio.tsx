import { useStore } from '../store/useStore';
import './Portfolio.css';

export const Portfolio = () => {
  const { assets, prices } = useStore();
  
  // ポートフォリオの計算
  const portfolioData = assets.map(asset => {
    const currentPrice = prices.find(p => p.symbol === asset.symbol)?.price || asset.purchasePrice;
    const currentValue = asset.amount * currentPrice;
    const purchaseValue = asset.amount * asset.purchasePrice;
    const profitLoss = currentValue - purchaseValue;
    const profitLossPercent = ((currentValue - purchaseValue) / purchaseValue) * 100;
    
    return {
      ...asset,
      currentPrice,
      currentValue,
      purchaseValue,
      profitLoss,
      profitLossPercent
    };
  });
  
  const totalCurrentValue = portfolioData.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalPurchaseValue = portfolioData.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const totalProfitLoss = totalCurrentValue - totalPurchaseValue;
  const totalProfitLossPercent = totalPurchaseValue > 0 
    ? ((totalCurrentValue - totalPurchaseValue) / totalPurchaseValue) * 100 
    : 0;
  
  if (assets.length === 0) {
    return (
      <div className="portfolio-empty">
        <p>まだ資産が登録されていません</p>
        <p>下の「資産を追加」から始めましょう</p>
      </div>
    );
  }
  
  return (
    <div className="portfolio">
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>総資産価値</h3>
          <div className="summary-value">
            ¥{Math.round(totalCurrentValue).toLocaleString()}
          </div>
        </div>
        <div className="summary-card">
          <h3>総投資額</h3>
          <div className="summary-value">
            ¥{Math.round(totalPurchaseValue).toLocaleString()}
          </div>
        </div>
        <div className={`summary-card ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
          <h3>損益</h3>
          <div className="summary-value">
            {totalProfitLoss >= 0 ? '+' : ''}¥{Math.round(totalProfitLoss).toLocaleString()}
            <span className="percent">
              ({totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="assets-table">
        <table>
          <thead>
            <tr>
              <th>通貨</th>
              <th>保有量</th>
              <th>購入価格</th>
              <th>現在価格</th>
              <th>評価額</th>
              <th>損益</th>
            </tr>
          </thead>
          <tbody>
            {portfolioData.map(asset => (
              <tr key={asset.id}>
                <td className="symbol">{asset.symbol}</td>
                <td>{asset.amount.toFixed(8)}</td>
                <td>¥{Math.round(asset.purchasePrice).toLocaleString()}</td>
                <td>¥{Math.round(asset.currentPrice).toLocaleString()}</td>
                <td>¥{Math.round(asset.currentValue).toLocaleString()}</td>
                <td className={asset.profitLoss >= 0 ? 'profit' : 'loss'}>
                  {asset.profitLoss >= 0 ? '+' : ''}¥{Math.round(asset.profitLoss).toLocaleString()}
                  <br />
                  <span className="percent">
                    ({asset.profitLossPercent >= 0 ? '+' : ''}{asset.profitLossPercent.toFixed(1)}%)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};