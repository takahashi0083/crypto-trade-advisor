import { useState } from 'react';
import { NotificationService } from '../utils/notifications';
import './NotificationSetup.css';

export const NotificationSetup = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState('');

  const setupNotifications = async () => {
    try {
      // 通知APIが利用可能かチェック
      if (!('Notification' in window)) {
        setError('このブラウザは通知をサポートしていません');
        return;
      }
      
      // 現在の許可状態を確認
      console.log('Current permission:', Notification.permission);
      
      const permission = await NotificationService.requestPermission();
      if (permission) {
        setIsSetup(true);
        // テスト通知を送信
        NotificationService.showNotification('✅ 通知設定完了', {
          body: '売買タイミングをお知らせします',
        });
      } else {
        // より詳細なエラーメッセージ
        if (Notification.permission === 'denied') {
          setError('通知がブロックされています。ブラウザの設定から許可してください');
        } else {
          setError('通知が許可されませんでした。ホーム画面から起動してください');
        }
      }
    } catch (err) {
      console.error('Notification error:', err);
      setError('通知の設定に失敗しました');
    }
  };

  if (isSetup) {
    return (
      <div className="notification-setup success">
        <h3>✅ 通知設定完了</h3>
        <p>売買タイミングになったらスマホに通知します</p>
      </div>
    );
  }

  return (
    <div className="notification-setup">
      <h3>📱 スマホ通知を設定</h3>
      <p>売買タイミングを逃さないために通知を有効にしましょう</p>
      <button onClick={setupNotifications} className="setup-button">
        通知を有効にする
      </button>
      {error && <p className="error">{error}</p>}
      
      <div className="instructions">
        <h4>設定方法：</h4>
        <ol>
          <li>ホーム画面にアプリを追加（重要！）</li>
          <li>ホーム画面から起動</li>
          <li>通知を許可</li>
        </ol>
        
        <div className="alternative-option">
          <h4>通知が使えない場合：</h4>
          <p>アプリを開いたままにしておくと、売買タイミングで音が鳴ります</p>
          <label>
            <input 
              type="checkbox" 
              onChange={(e) => {
                localStorage.setItem('enableSound', e.target.checked ? 'true' : 'false');
              }}
              defaultChecked={localStorage.getItem('enableSound') === 'true'}
            />
            音での通知を有効にする
          </label>
        </div>
      </div>
    </div>
  );
};