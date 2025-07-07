import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CryptoApiService } from '../services/cryptoApi';
import type { CryptoAsset } from '../types/crypto';
import './AssetForm.css';

const CRYPTO_OPTIONS = [
  { symbol: 'BTC', name: 'ビットコイン' },
  { symbol: 'ETH', name: 'イーサリアム' },
  { symbol: 'XRP', name: 'リップル' },
  { symbol: 'LTC', name: 'ライトコイン' },
  { symbol: 'BCH', name: 'ビットコインキャッシュ' },
  { symbol: 'ADA', name: 'カルダノ' },
];

export const AssetForm = () => {
  const { addAsset, removeAsset, assets, prices } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  // 日本時間で今日の日付を取得
  const getTodayJST = () => {
    const now = new Date();
    // 日本時間の文字列を作成（YYYY-MM-DD形式）
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [formData, setFormData] = useState({
    symbol: 'BTC',
    amount: '',
    purchaseDate: getTodayJST(),
    purchaseTime: '12:00'
  });
  
  const [priceMode, setPriceMode] = useState<'current' | 'historical'>('current');
  const [historicalPrice, setHistoricalPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  
  // 過去の価格を取得
  const fetchHistoricalPrice = async () => {
    setIsLoadingPrice(true);
    try {
      // 日付と時刻を組み合わせて日本時間でDateオブジェクトを作成
      const dateTime = new Date(`${formData.purchaseDate}T${formData.purchaseTime}:00+09:00`);
      const price = await CryptoApiService.getPriceAtDateTime(formData.symbol, dateTime);
      
      if (price) {
        setHistoricalPrice(price);
        alert(`${dateTime.toLocaleString('ja-JP')}の価格を取得しました: ¥${price.toLocaleString()}`);
      } else {
        alert('指定された日時の価格データが見つかりませんでした。');
      }
    } catch (error) {
      alert('価格の取得に失敗しました。');
      console.error(error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let purchasePrice: number;
    
    if (priceMode === 'current') {
      // 現在価格を使用
      const currentPrice = prices.find(p => p.symbol === formData.symbol);
      if (!currentPrice) {
        alert('現在の価格を取得できません。しばらくお待ちください。');
        return;
      }
      purchasePrice = currentPrice.price;
    } else {
      // 過去の価格を使用
      if (!historicalPrice) {
        alert('過去の価格を取得してください。');
        return;
      }
      purchasePrice = historicalPrice;
    }
    
    const newAsset: CryptoAsset = {
      id: Date.now().toString(),
      symbol: formData.symbol,
      name: CRYPTO_OPTIONS.find(c => c.symbol === formData.symbol)?.name || formData.symbol,
      amount: parseFloat(formData.amount),
      purchasePrice,
      purchaseDate: new Date(`${formData.purchaseDate}T${formData.purchaseTime}:00+09:00`)
    };
    
    addAsset(newAsset);
    
    // フォームリセット
    setFormData({
      symbol: 'BTC',
      amount: '',
      purchaseDate: getTodayJST(),
      purchaseTime: '12:00'
    });
    setHistoricalPrice(null);
    setPriceMode('current');
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
          
          <div className="form-group">
            <label>保有量</label>
            <input
              type="number"
              step="0.00000001"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.001"
              required
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              例: 0.001 BTC
            </small>
          </div>
          
          <div className="form-group">
            <label>価格設定方法</label>
            <div className="price-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${priceMode === 'current' ? 'active' : ''}`}
                onClick={() => {
                  setPriceMode('current');
                  setHistoricalPrice(null);
                }}
              >
                現在価格を使用
              </button>
              <button
                type="button"
                className={`mode-btn ${priceMode === 'historical' ? 'active' : ''}`}
                onClick={() => setPriceMode('historical')}
              >
                過去の価格を取得
              </button>
            </div>
          </div>
          
          {priceMode === 'current' ? (
            <div className="form-group">
              <label>現在価格（アプリ内価格）</label>
              <div className="current-price-display">
                {(() => {
                  const price = prices.find(p => p.symbol === formData.symbol);
                  return price ? (
                    <div>
                      <div className="price-main">
                        ¥{price.price.toLocaleString()}
                      </div>
                      <small style={{ color: '#666' }}>
                        1{formData.symbol}あたりの価格
                      </small>
                    </div>
                  ) : (
                    <div style={{ color: '#999' }}>価格を取得中...</div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="historical-price-section">
              <div className="form-group">
                <label>取得したい価格の時刻</label>
                <input
                  type="time"
                  value={formData.purchaseTime}
                  onChange={(e) => setFormData({ ...formData, purchaseTime: e.target.value })}
                  required
                />
              </div>
              
              <button
                type="button"
                className="fetch-price-button"
                onClick={fetchHistoricalPrice}
                disabled={isLoadingPrice}
              >
                {isLoadingPrice ? '取得中...' : '過去の価格を取得'}
              </button>
              
              {historicalPrice && (
                <div className="historical-price-display">
                  <label>取得した価格</label>
                  <div className="price-main">
                    ¥{historicalPrice.toLocaleString()}
                  </div>
                  <small style={{ color: '#666' }}>
                    {new Date(`${formData.purchaseDate}T${formData.purchaseTime}:00+09:00`).toLocaleString('ja-JP')}時点
                  </small>
                </div>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label>購入日（日本時間）</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              max={getTodayJST()}
              required
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              すべての日時は日本時間（JST）で記録されます
            </small>
          </div>
          
          {formData.amount && (() => {
            const price = prices.find(p => p.symbol === formData.symbol);
            const amount = parseFloat(formData.amount);
            if (price && !isNaN(amount)) {
              const total = price.price * amount;
              return (
                <div className="total-price-display">
                  <label>合計購入金額</label>
                  <div className="total-price">
                    ¥{total.toLocaleString()}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          <button type="submit" className="submit-button">
            {priceMode === 'current' ? '現在価格で記録する' : '選択した価格で記録する'}
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