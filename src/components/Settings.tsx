import { useStore } from '../store/useStore';
import { NotificationService } from '../utils/notifications';
import './Settings.css';

export const Settings = () => {
  const { notificationSettings, updateNotificationSettings, alertHistory, clearAlertHistory } = useStore();
  
  const handleNotificationToggle = async () => {
    if (!notificationSettings.enabled) {
      const permission = await NotificationService.requestPermission();
      if (permission) {
        updateNotificationSettings({ enabled: true });
      }
    } else {
      updateNotificationSettings({ enabled: false });
    }
  };
  
  const handleProfitTargetChange = (index: number, value: string) => {
    const newTargets = [...notificationSettings.profitTargets];
    newTargets[index] = parseFloat(value) || 0;
    updateNotificationSettings({ profitTargets: newTargets });
  };
  
  const handleLossLimitChange = (index: number, value: string) => {
    const newLimits = [...notificationSettings.lossLimits];
    newLimits[index] = parseFloat(value) || 0;
    updateNotificationSettings({ lossLimits: newLimits });
  };
  
  return (
    <div className="settings">
      <div className="settings-section">
        <h2>通知設定</h2>
        
        <div className="setting-item">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationSettings.enabled}
              onChange={handleNotificationToggle}
            />
            <span className="toggle-slider"></span>
            プッシュ通知を有効にする
          </label>
        </div>
        
        {notificationSettings.enabled && (
          <>
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.buySignals}
                  onChange={(e) => updateNotificationSettings({ buySignals: e.target.checked })}
                />
                買いシグナル通知
              </label>
            </div>
            
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.sellSignals}
                  onChange={(e) => updateNotificationSettings({ sellSignals: e.target.checked })}
                />
                売りシグナル通知
              </label>
            </div>
            
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={notificationSettings.priceAlerts}
                  onChange={(e) => updateNotificationSettings({ priceAlerts: e.target.checked })}
                />
                価格アラート通知
              </label>
            </div>
          </>
        )}
      </div>
      
      <div className="settings-section">
        <h2>利益確定・損切り設定</h2>
        
        <div className="target-settings">
          <h3>利益確定ライン</h3>
          {notificationSettings.profitTargets.map((target, index) => (
            <div key={index} className="target-item">
              <span>+</span>
              <input
                type="number"
                value={target}
                onChange={(e) => handleProfitTargetChange(index, e.target.value)}
                min="0"
                step="10"
              />
              <span>%で通知</span>
            </div>
          ))}
        </div>
        
        <div className="target-settings">
          <h3>損切りライン</h3>
          {notificationSettings.lossLimits.map((limit, index) => (
            <div key={index} className="target-item">
              <span>-</span>
              <input
                type="number"
                value={limit}
                onChange={(e) => handleLossLimitChange(index, e.target.value)}
                min="0"
                step="5"
              />
              <span>%で警告</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="settings-section">
        <h2>通知履歴</h2>
        <div className="alert-history">
          {alertHistory.length === 0 ? (
            <p className="no-history">通知履歴はありません</p>
          ) : (
            <>
              <div className="history-header">
                <span>最新{alertHistory.length}件の通知</span>
                <button 
                  className="clear-button"
                  onClick={clearAlertHistory}
                >
                  履歴をクリア
                </button>
              </div>
              <div className="history-list">
                {alertHistory.slice(0, 10).map((alert, index) => (
                  <div key={index} className={`history-item ${alert.action.toLowerCase()}`}>
                    <div className="history-time">
                      {new Date(alert.timestamp).toLocaleString('ja-JP')}
                    </div>
                    <div className="history-content">
                      <strong>{alert.symbol}</strong> - {alert.action}シグナル
                      {alert.reasons.length > 0 && (
                        <span className="history-reason"> ({alert.reasons[0]})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};