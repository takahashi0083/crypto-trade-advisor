interface NotificationRecord {
  symbol: string;
  type: 'BUY' | 'SELL' | 'PROFIT' | 'LOSS';
  timestamp: number;
  level?: number; // 利益率や損失率
}

export class NotificationCooldown {
  private static notificationHistory: NotificationRecord[] = [];
  
  // クールダウン時間の設定（ミリ秒）
  private static readonly COOLDOWN_PERIODS = {
    BUY: 60 * 60 * 1000,      // 1時間
    SELL: 30 * 60 * 1000,     // 30分
    PROFIT: 4 * 60 * 60 * 1000, // 4時間
    LOSS: 2 * 60 * 60 * 1000    // 2時間
  };
  
  // 通知が可能かチェック
  static canSendNotification(
    symbol: string,
    type: 'BUY' | 'SELL' | 'PROFIT' | 'LOSS',
    level?: number
  ): boolean {
    const now = Date.now();
    const cooldownPeriod = this.COOLDOWN_PERIODS[type];
    
    // 履歴をクリーンアップ（24時間以上前のものを削除）
    this.notificationHistory = this.notificationHistory.filter(
      record => now - record.timestamp < 24 * 60 * 60 * 1000
    );
    
    // 同じシンボル・タイプの最新通知を検索
    const lastNotification = this.notificationHistory
      .filter(record => record.symbol === symbol && record.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastNotification) {
      return true; // 初回通知
    }
    
    // クールダウン期間をチェック
    if (now - lastNotification.timestamp < cooldownPeriod) {
      // 利益・損失の場合、レベルが大幅に変化した場合は通知を許可
      if ((type === 'PROFIT' || type === 'LOSS') && level !== undefined && lastNotification.level !== undefined) {
        const levelDiff = Math.abs(level - lastNotification.level);
        if (levelDiff >= 20) { // 20%以上の変化
          return true;
        }
      }
      return false;
    }
    
    return true;
  }
  
  // 通知を記録
  static recordNotification(
    symbol: string,
    type: 'BUY' | 'SELL' | 'PROFIT' | 'LOSS',
    level?: number
  ): void {
    this.notificationHistory.push({
      symbol,
      type,
      timestamp: Date.now(),
      level
    });
  }
  
  // 通知履歴のサマリーを取得
  static getNotificationSummary(): {
    totalCount: number;
    byType: { [key: string]: number };
    recentNotifications: NotificationRecord[];
  } {
    const now = Date.now();
    const last24Hours = this.notificationHistory.filter(
      record => now - record.timestamp < 24 * 60 * 60 * 1000
    );
    
    const byType = last24Hours.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      totalCount: last24Hours.length,
      byType,
      recentNotifications: last24Hours.slice(-10) // 直近10件
    };
  }
  
  // 残りクールダウン時間を取得（秒）
  static getRemainingCooldown(
    symbol: string,
    type: 'BUY' | 'SELL' | 'PROFIT' | 'LOSS'
  ): number {
    const now = Date.now();
    const cooldownPeriod = this.COOLDOWN_PERIODS[type];
    
    const lastNotification = this.notificationHistory
      .filter(record => record.symbol === symbol && record.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!lastNotification) {
      return 0;
    }
    
    const elapsed = now - lastNotification.timestamp;
    const remaining = cooldownPeriod - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000)); // 秒単位で返す
  }
}