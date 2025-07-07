const SERVER_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

export class LineNotification {
  // 自動で通知を送信（Webhook対応）
  static async sendNotification(message: string): Promise<boolean> {
    const webhookUrl = localStorage.getItem('webhookUrl');
    
    if (!webhookUrl) {
      console.log('Webhook URLが設定されていません');
      return false;
    }
    
    try {
      const response = await fetch(`${SERVER_URL}/api/send-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ webhookUrl, message })
      });
      
      if (response.ok) {
        console.log('通知を送信しました');
        return true;
      } else {
        console.error('通知の送信に失敗しました:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('通知エラー:', error);
      return false;
    }
  }
  
  // LINE通知用のメッセージを生成
  static generateBuyMessage(symbol: string, score: number, reason: string, price?: number): string {
    // タイムスタンプにミリ秒を含めてメッセージを一意にする
    const timestamp = new Date();
    const timeString = `${timestamp.toLocaleTimeString('ja-JP')}.${timestamp.getMilliseconds()}`;
    
    const message = `
🟢 買い推奨アラート

通貨: ${symbol}
スコア: ${score}/100
理由: ${reason}
${price ? `現在価格: ¥${price.toLocaleString()}` : ''}

💡 ${timeString}
Crypto Trade Advisor
    `.trim();
    
    return message;
  }
  
  static generateSellMessage(symbol: string, profitPercent: number, reason: string, currentPrice?: number): string {
    const urgency = profitPercent > 50 ? '🚨🚨🚨 緊急' : '🔴';
    // タイムスタンプに秒を含めてメッセージを一意にする
    const timestamp = new Date();
    const timeString = `${timestamp.toLocaleTimeString('ja-JP')}.${timestamp.getMilliseconds()}`;
    
    const message = `
${urgency} 売却推奨アラート

【重要】${symbol} を売却してください！

利益率: ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%
理由: ${reason}
${currentPrice ? `現在価格: ¥${currentPrice.toLocaleString()}` : ''}

⚠️ 今すぐ確認してください ⚠️
${timeString}
    `.trim();
    
    return message;
  }
  
  static generateProfitTargetMessage(symbol: string, profitPercent: number, target: number): string {
    const message = `
🎯 利益目標達成！

通貨: ${symbol}
現在の利益率: +${profitPercent.toFixed(1)}%
達成目標: +${target}%

利益確定を検討してください
${new Date().toLocaleTimeString('ja-JP')}
    `.trim();
    
    return message;
  }
  
  static generateLossLimitMessage(symbol: string, lossPercent: number, limit: number): string {
    const message = `
⚠️ 損切りライン到達

通貨: ${symbol}
現在の損失: ${lossPercent.toFixed(1)}%
設定ライン: -${limit}%

損切りを検討してください
${new Date().toLocaleTimeString('ja-JP')}
    `.trim();
    
    return message;
  }
  
  // クリップボードにコピー
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
      return false;
    }
  }
}