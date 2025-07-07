# Crypto Trade Advisor - 開発履歴とアプリケーション概要

このドキュメントは、Claude Codeとの開発セッションの記録です。新しいセッションでこのファイルを参照することで、開発の続きができます。

## アプリケーション概要

### 目的
仮想通貨の売買タイミングを自動判定し、Discord/LINEに通知するWebアプリケーション

### 主な機能
1. **リアルタイム価格監視** - 6種類の仮想通貨（BTC, ETH, XRP, LTC, BCH, ADA）
2. **テクニカル分析** - RSI、移動平均線、ボリンジャーバンド
3. **マルチタイムフレーム分析** - 1時間足と4時間足の統合分析
4. **売買シグナル生成** - 重み付けスコアリングと動的しきい値
5. **通知システム** - Discord Webhook、LINE通知、ブラウザ通知
6. **ポートフォリオ管理** - 保有資産の登録と損益計算
7. **リスク管理** - ケリー基準、ATRストップロス（実装済みだが未使用）

## 技術スタック

- **フロントエンド**: React 18.2 + TypeScript + Vite
- **状態管理**: Zustand with persist
- **スタイリング**: CSS Modules
- **API**: Binance API（価格データ）、ExchangeRate API（為替レート）
- **通知**: Discord Webhooks、Web Notification API
- **デプロイ**: Render.com（無料プラン）
- **PWA**: Service Worker実装済み

## 重要な設定値

### 通知条件（2025-07-07時点）
```typescript
// 買い通知
- スコア75以上
- RSI 20以下
- 24時間で-15%以上の下落
- Fear&Greed指数15以下

// 売り通知
- スコア25以下
- RSI 80以上
- 利益率+50%以上または-20%以下
- Fear&Greed指数85以上

// クールダウン
- 買い通知: 6時間
- 売り通知: 3時間
```

### 為替レート
- 履歴データ用固定レート: 157円/USD
- リアルタイムレート: 1時間キャッシュ

## 主要ファイル構成

```
crypto-trade-advisor/
├── src/
│   ├── components/
│   │   ├── TradeSignals.tsx    # メインロジック、売買判定
│   │   ├── AssetForm.tsx       # 資産登録フォーム
│   │   ├── Portfolio.tsx       # ポートフォリオ表示
│   │   ├── Settings.tsx        # 通知設定
│   │   └── MarketAnalysis.tsx  # 市場分析ダッシュボード
│   ├── services/
│   │   └── cryptoApi.ts        # API通信、価格取得
│   ├── utils/
│   │   ├── technicalIndicators.ts    # テクニカル指標計算
│   │   ├── multiTimeframeAnalysis.ts # マルチタイムフレーム分析
│   │   ├── riskManagement.ts         # リスク管理（未使用）
│   │   ├── notificationCooldown.ts   # 通知クールダウン
│   │   └── lineNotification.ts       # LINE通知
│   └── store/
│       └── useStore.ts          # Zustand store
├── server.js                    # Express server（Render用）
├── render.yaml                  # Render.com設定
└── package.json
```

## 実装された主要機能の詳細

### 1. 売買シグナル判定
- **重み付けスコアリング**: RSI(35%), MA(25%), BB(25%), Momentum(15%)
- **動的しきい値**: 過去データから自動調整（デフォルト: buy 60, sell 40）
- **保有資産の考慮**: 追加購入と売却の両方を同時判定可能

### 2. 通知システム
- **Discord通知**: シンプルなテキスト形式（iPhone対応）
- **通知クールダウン**: 同じ通貨の連続通知を防止
- **重要度フィルタ**: 本当に重要なタイミングのみ通知

### 3. データ取得と計算
- **価格更新**: 30秒ごと
- **履歴データ**: 4時間足30本（5日分）
- **RSI計算**: 最新14本から計算、リアルタイム価格反映

## 既知の問題と対策

1. **Render.com無料プランの制限**
   - 15分非アクティブで休止
   - 再起動に50秒程度必要
   - 対策: 有料プランまたは定期的なアクセス

2. **Discord通知のiPhone問題**
   - 4連続通知でスパム扱い
   - 対策: クールダウン機能で制御

3. **為替レート変動の影響**
   - 対策: キャッシュ機能と固定レート併用

## 今後の改善案

1. **機械学習の導入** - より高度な価格予測
2. **バックテスト機能** - 戦略の検証
3. **複数取引所対応** - 価格差を利用した裁定取引
4. **自動売買機能** - 取引所APIとの連携

## デプロイ情報

- **URL**: https://crypto-trade-advisor.onrender.com/
- **GitHub**: https://github.com/takahashi0083/crypto-trade-advisor
- **Render Dashboard**: https://dashboard.render.com/

## セッション再開時の確認事項

1. `npm install` でパッケージをインストール
2. `npm run dev` でローカル開発サーバー起動
3. このファイルを読んで現在の実装状況を把握
4. `git log --oneline -20` で最近の変更を確認

## 最終更新日
2025-07-07

---

このファイルは開発の継続性を保つために作成されました。
新しい機能追加や問題解決の際は、このファイルも更新してください。