import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { TradeSignals } from './TradeSignals';
import { Portfolio } from './Portfolio';
import { AssetForm } from './AssetForm';
import { Settings } from './Settings';
import { SimpleLineNotify } from './SimpleLineNotify';
import { CryptoApiService } from '../services/cryptoApi';
import { NotificationService } from '../utils/notifications';
import './Dashboard.css';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'signals' | 'portfolio' | 'settings'>('signals');
  const [isLoading, setIsLoading] = useState(false);
  
  const { updatePrices, prices, notificationSettings } = useStore();
  
  // 価格データの定期更新
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      const newPrices = await CryptoApiService.getPrices();
      updatePrices(newPrices);
      setIsLoading(false);
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // 10秒ごと
    
    return () => clearInterval(interval);
  }, [updatePrices]);
  
  // 通知権限のリクエスト
  useEffect(() => {
    if (notificationSettings.enabled) {
      NotificationService.requestPermission();
    }
  }, [notificationSettings.enabled]);
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>💹 Crypto Trade Advisor</h1>
        <div className="header-info">
          {isLoading && <span className="loading">更新中...</span>}
          <span className="last-update">
            最終更新: {prices.length > 0 ? new Date(prices[0].lastUpdate).toLocaleTimeString('ja-JP') : '-'}
          </span>
        </div>
      </header>
      
      <nav className="tab-navigation">
        <button
          className={`tab ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          📊 売買シグナル
        </button>
        <button
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          💰 ポートフォリオ
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 設定
        </button>
      </nav>
      
      <main className="dashboard-content">
        {activeTab === 'signals' && (
          <>
            <SimpleLineNotify />
            <TradeSignals />
          </>
        )}
        {activeTab === 'portfolio' && (
          <>
            <Portfolio />
            <AssetForm />
          </>
        )}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
};