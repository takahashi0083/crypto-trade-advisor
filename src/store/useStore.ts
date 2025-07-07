import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CryptoAsset, CryptoPrice, TradeSignal, NotificationSettings } from '../types/crypto';

interface StoreState {
  // 資産管理
  assets: CryptoAsset[];
  addAsset: (asset: CryptoAsset) => void;
  updateAsset: (id: string, updates: Partial<CryptoAsset>) => void;
  removeAsset: (id: string) => void;
  
  // 価格データ
  prices: CryptoPrice[];
  updatePrices: (prices: CryptoPrice[]) => void;
  
  // トレードシグナル
  signals: TradeSignal[];
  updateSignals: (signals: TradeSignal[]) => void;
  
  // 通知設定
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // アラート履歴
  alertHistory: TradeSignal[];
  addAlertToHistory: (signal: TradeSignal) => void;
  clearAlertHistory: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 初期状態
      assets: [],
      prices: [],
      signals: [],
      alertHistory: [],
      notificationSettings: {
        enabled: true,
        buySignals: true,
        sellSignals: true,
        priceAlerts: true,
        profitTargets: [20, 50, 100],
        lossLimits: [10, 20],
      },
      
      // アクション
      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, asset],
        })),
        
      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          ),
        })),
        
      removeAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        })),
        
      updatePrices: (prices) =>
        set(() => ({
          prices,
        })),
        
      updateSignals: (signals) =>
        set(() => ({
          signals,
        })),
        
      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        })),
        
      addAlertToHistory: (signal) =>
        set((state) => ({
          alertHistory: [signal, ...state.alertHistory].slice(0, 50), // 最新50件を保持
        })),
        
      clearAlertHistory: () =>
        set(() => ({
          alertHistory: [],
        })),
    }),
    {
      name: 'crypto-advisor-storage',
      partialize: (state) => ({
        assets: state.assets,
        notificationSettings: state.notificationSettings,
        alertHistory: state.alertHistory,
      }),
    }
  )
);