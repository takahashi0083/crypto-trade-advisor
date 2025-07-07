import { useState } from 'react';
import { LineNotification } from '../utils/lineNotification';
import './LineNotifySetup.css';

export const LineNotifySetup = () => {
  const [token, setToken] = useState(localStorage.getItem('lineNotifyToken') || '');
  const [isSetup, setIsSetup] = useState(!!localStorage.getItem('lineNotifyToken'));
  const [testResult, setTestResult] = useState('');

  const saveToken = () => {
    if (token.trim()) {
      localStorage.setItem('lineNotifyToken', token.trim());
      setIsSetup(true);
      setTestResult('トークンを保存しました');
    }
  };

  const testNotification = async () => {
    const savedToken = localStorage.getItem('lineNotifyToken');
    if (!savedToken) {
      setTestResult('トークンが設定されていません');
      return;
    }

    try {
      const testMessage = `
📱 テスト通知

Crypto Trade Advisorから
LINE通知のテストです。

設定が正常に完了しました！
売買タイミングで自動通知します。

${new Date().toLocaleString('ja-JP')}
      `.trim();
      
      const success = await LineNotification.sendNotification(testMessage);
      if (success) {
        setTestResult('✅ テスト通知を送信しました！LINEを確認してください。');
      } else {
        setTestResult('❌ 送信に失敗しました。トークンを確認してください。');
      }
    } catch (error) {
      setTestResult('エラーが発生しました');
    }
  };

  const resetToken = () => {
    localStorage.removeItem('lineNotifyToken');
    setToken('');
    setIsSetup(false);
    setTestResult('');
  };

  return (
    <div className="line-notify-setup">
      <h3>📱 LINE通知設定</h3>
      
      {!isSetup ? (
        <>
          <div className="setup-steps">
            <h4>設定手順：</h4>
            <ol>
              <li>
                <a href="https://notify-bot.line.me/ja/" target="_blank" rel="noopener noreferrer">
                  LINE Notify
                </a>
                にアクセス
              </li>
              <li>ログインして「マイページ」へ</li>
              <li>「トークンを発行する」をクリック</li>
              <li>トークン名: 「Crypto Trade Advisor」など</li>
              <li>通知送信先: 「1:1でLINE Notifyから通知を受け取る」</li>
              <li>発行されたトークンをコピー</li>
            </ol>
          </div>
          
          <div className="token-input">
            <label>LINE Notifyトークン：</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="発行されたトークンを貼り付け"
            />
            <button onClick={saveToken} disabled={!token.trim()}>
              保存
            </button>
          </div>
        </>
      ) : (
        <div className="setup-complete">
          <p className="success-message">✅ LINE通知設定済み</p>
          <p className="token-info">トークン: {token.substring(0, 10)}...</p>
          <button onClick={testNotification}>テスト送信</button>
          <button onClick={resetToken} className="reset-button">設定をリセット</button>
        </div>
      )}
      
      {testResult && (
        <div className={`test-result ${testResult.includes('エラー') ? 'error' : ''}`}>
          {testResult}
        </div>
      )}
      
      <div className="line-notify-note">
        <h4>💡 自動通知の仕組み：</h4>
        <p>売買シグナルが発生すると、自動的にLINEに通知が送信されます。</p>
        <p>画面を開いたままにしておけば、10秒ごとに価格をチェックし、</p>
        <p>売買タイミングになったら即座にスマホのLINEに通知します。</p>
      </div>
    </div>
  );
};