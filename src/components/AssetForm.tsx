import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { CryptoAsset } from '../types/crypto';
import './AssetForm.css';

const CRYPTO_OPTIONS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'MATIC', name: 'Polygon' },
];

export const AssetForm = () => {
  const { addAsset, removeAsset, assets } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'JPY'>('USD');
  const [usdJpyRate, setUsdJpyRate] = useState(150); // デフォルトレート
  // 日本時間で今日の日付を取得
  const getTodayJST = () => {
    const now = new Date();
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstTime = new Date(now.getTime() + (jstOffset - now.getTimezoneOffset()) * 60 * 1000);
    return jstTime.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    symbol: 'BTC',
    amount: '',
    purchasePrice: '',
    purchaseDate: getTodayJST()
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // USD入力の場合は円に変換
    const priceInJpy = currency === 'USD' 
      ? parseFloat(formData.purchasePrice) * usdJpyRate
      : parseFloat(formData.purchasePrice);
    
    const newAsset: CryptoAsset = {
      id: Date.now().toString(),
      symbol: formData.symbol,
      name: CRYPTO_OPTIONS.find(c => c.symbol === formData.symbol)?.name || formData.symbol,
      amount: parseFloat(formData.amount),
      purchasePrice: priceInJpy,
      purchaseDate: new Date(formData.purchaseDate)
    };
    
    addAsset(newAsset);
    
    // フォームリセット
    setFormData({
      symbol: 'BTC',
      amount: '',
      purchasePrice: '',
      purchaseDate: getTodayJST()
    });
    setIsOpen(false);
  };
  
  const handleRemove = (id: string) => {
    if (window.confirm('この資産を削除しますか？')) {
      removeAsset(id);
    }
  };
  
  return (
    <div className="asset-form-container">
      <button 
        className="add-asset-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕ キャンセル' : '＋ 資産を追加'}
      </button>
      
      {isOpen && (
        <form className="asset-form" onSubmit={handleSubmit}>
          <h3>新しい資産を追加</h3>
          
          <div className="form-group">
            <label>通貨</label>
            <select
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              required
            >
              {CRYPTO_OPTIONS.map(crypto => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.symbol} - {crypto.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>保有量</label>
              <input
                type="number"
                step="0.00000001"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="1.5"
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                購入時の1枚あたり価格
                <div className="currency-toggle">
                  <button
                    type="button"
                    className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
                    onClick={() => setCurrency('USD')}
                  >
                    USD
                  </button>
                  <button
                    type="button"
                    className={`currency-btn ${currency === 'JPY' ? 'active' : ''}`}
                    onClick={() => setCurrency('JPY')}
                  >
                    JPY
                  </button>
                </div>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder={currency === 'USD' ? '35000' : '5000000'}
                required
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                {currency === 'USD' 
                  ? `例: 1BTC = $35,000の時は「35000」（レート: 1USD = ${usdJpyRate}円）`
                  : '例: 1BTC = 500万円の時は「5000000」'}
              </small>
            </div>
            
            {currency === 'USD' && (
              <div className="form-group">
                <label>USD/JPY レート</label>
                <input
                  type="number"
                  step="0.01"
                  value={usdJpyRate}
                  onChange={(e) => setUsdJpyRate(parseFloat(e.target.value) || 150)}
                  required
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  現在のレートを入力（デフォルト: 150円）
                </small>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>購入日</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              max={getTodayJST()}
              required
            />
          </div>
          
          <button type="submit" className="submit-button">
            追加する
          </button>
        </form>
      )}
      
      {assets.length > 0 && (
        <div className="asset-list">
          <h3>保有資産一覧</h3>
          {assets.map(asset => (
            <div key={asset.id} className="asset-item">
              <span>{asset.symbol}: {asset.amount}枚</span>
              <button
                className="remove-button"
                onClick={() => handleRemove(asset.id)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};