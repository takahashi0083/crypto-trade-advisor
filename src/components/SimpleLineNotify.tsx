import { useState } from 'react';
import './SimpleLineNotify.css';

export const SimpleLineNotify = () => {
  return (
    <div className="simple-line-notify">
      <h3>📱 スマホ通知設定</h3>
      
      <div className="webhook-option">
        <h4>🔔 Discord通知（推奨）</h4>
        <p>売買タイミングをDiscordでスマホに通知します。</p>
        <details open>
          <summary>設定方法</summary>
          <ol>
            <li>Discordサーバーの設定 → 連携サービス → Webhook作成</li>
            <li>Webhook URLをコピー</li>
            <li>下記のWebhook URL欄に貼り付け</li>
            <li style={{ fontWeight: 'bold', color: '#ff0066', marginTop: '0.5rem' }}>
              ⚠️ Discord通知制限について：
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#666' }}>
                短時間に4回以上テスト通知を送信すると、Discordのスパム対策により一時的に通知が届かなくなります。
                この場合は5分程度待ってから再度お試しください。
              </p>
            </li>
            <li style={{ fontWeight: 'bold', color: '#ff4444' }}>重要: Discordアプリで以下を必ず確認：
              <ul style={{ marginTop: '0.5rem' }}>
                <li>サーバーのミュートがOFFになっているか</li>
                <li>該当チャンネルの通知が「すべてのメッセージ」になっているか</li>
                <li>@everyoneメンションの通知がONになっているか</li>
                <li>自分のステータスが「オンライン」になっているか</li>
                <li>iPhoneの設定 → 通知 → DiscordがONになっているか</li>
                <li>Discordアプリが最新版にアップデートされているか</li>
              </ul>
            </li>
            <li style={{ fontWeight: 'bold', color: '#0066cc', marginTop: '1rem' }}>
              通知が届かない場合の対処法：
              <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <li>Discordアプリを一度完全に終了して再起動</li>
                <li>iPhoneを再起動</li>
                <li>Discordでサーバーから一度退出して再参加</li>
                <li>別のチャンネルでWebhookを作成し直す</li>
              </ul>
            </li>
          </ol>
        </details>
        
        <h4 style={{ marginTop: '1.5rem' }}>🔧 その他の通知方法</h4>
        <p>Slack、Telegramなどにも対応しています。</p>
        
        <WebhookSetup />
      </div>
    </div>
  );
};

// Webhook設定コンポーネント
const WebhookSetup = () => {
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('webhookUrl') || '');
  const [testResult, setTestResult] = useState('');

  const saveWebhook = () => {
    if (webhookUrl.trim()) {
      localStorage.setItem('webhookUrl', webhookUrl.trim());
      setTestResult('Webhook URLを保存しました');
    }
  };

  const testWebhook = async () => {
    const url = localStorage.getItem('webhookUrl');
    if (!url) {
      setTestResult('Webhook URLが設定されていません');
      return;
    }

    try {
      const serverUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${serverUrl}/api/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url })
      });
      
      if (response.ok) {
        setTestResult('✅ テスト通知を送信しました');
      } else {
        const error = await response.json();
        console.error('送信エラー:', error);
        setTestResult(`❌ 送信に失敗しました: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('通信エラー:', error);
      setTestResult(`エラー: ${error instanceof Error ? error.message : 'サーバーに接続できません'}`);
    }
  };

  return (
    <div className="webhook-setup">
      <input
        type="url"
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
      />
      <div className="webhook-actions">
        <button onClick={saveWebhook}>保存</button>
        <button onClick={testWebhook}>テスト送信</button>
      </div>
      {testResult && <p className="test-result">{testResult}</p>}
    </div>
  );
};