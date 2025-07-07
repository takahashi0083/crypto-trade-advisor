import { useState, useEffect } from 'react';
import { LineNotification } from '../utils/lineNotification';
import './LineNotificationAlert.css';

interface LineNotificationAlertProps {
  message: string;
  onClose: () => void;
}

export const LineNotificationAlert = ({ message, onClose }: LineNotificationAlertProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    const success = await LineNotification.copyToClipboard(message);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  useEffect(() => {
    // 音を鳴らす
    if (localStorage.getItem('enableSound') === 'true') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
      audio.play().catch(() => {});
    }
  }, []);
  
  return (
    <div className="line-notification-alert">
      <div className="alert-content">
        <h3>📱 LINE通知が必要です</h3>
        <p>以下のメッセージをコピーしてLINEで送信してください：</p>
        
        <div className="message-box">
          <pre>{message}</pre>
        </div>
        
        <div className="alert-actions">
          <button 
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✅ コピーしました' : '📋 メッセージをコピー'}
          </button>
          
          <a 
            href="https://line.me/R/"
            target="_blank"
            rel="noopener noreferrer"
            className="line-button"
          >
            LINEを開く
          </a>
          
          <button className="close-button" onClick={onClose}>
            閉じる
          </button>
        </div>
        
        <div className="alert-note">
          <p>💡 ヒント: LINE Notifyの設定をすれば自動通知も可能です</p>
        </div>
      </div>
    </div>
  );
};