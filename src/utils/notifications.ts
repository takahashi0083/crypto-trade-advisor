export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('このブラウザは通知をサポートしていません');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
  
  static async showNotification(title: string, options: NotificationOptions = {}) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;
    
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    // 5秒後に自動で閉じる
    setTimeout(() => notification.close(), 5000);
  }
  
  static showBuySignal(symbol: string, score: number, reason: string) {
    this.showNotification(`🟢 ${symbol} 買い時！`, {
      body: `スコア: ${score}/100\n理由: ${reason}`,
      tag: 'buy-signal',
      requireInteraction: true
    });
  }
  
  static showSellSignal(symbol: string, profitPercent: number, reason: string) {
    this.showNotification(`🔴 ${symbol} 売却推奨`, {
      body: `利益率: +${profitPercent.toFixed(1)}%\n理由: ${reason}`,
      tag: 'sell-signal',
      requireInteraction: true
    });
  }
  
  static showPriceAlert(symbol: string, message: string) {
    this.showNotification(`⚡ ${symbol} 価格アラート`, {
      body: message,
      tag: 'price-alert'
    });
  }
}