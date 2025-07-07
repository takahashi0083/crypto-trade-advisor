const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.11.15:5173'],
  credentials: true
}));

app.use(express.json());

// Discord/Slack Webhook送信エンドポイント
app.post('/api/send-webhook', async (req, res) => {
  const { webhookUrl, message } = req.body;
  
  if (!webhookUrl || !message) {
    return res.status(400).json({ error: 'Webhook URLとメッセージが必要です' });
  }
  
  try {
    let payload;
    
    // Discord webhook
    if (webhookUrl.includes('discord.com')) {
      // 緊急度に応じてメンション回数を調整（スパム判定を避けるため控えめに）
      const isUrgent = message.includes('緊急') || message.includes('売却推奨');
      const mention = '@everyone';
      
      payload = {
        content: `${mention}\n${message}`,
        username: 'Crypto Trade Advisor',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001283.png',
        allowed_mentions: { parse: ['everyone'] },
        tts: true,  // Text-to-Speechを有効化（音声読み上げ）
        embeds: [
          {
            title: isUrgent ? '🚨 緊急通知 🚨' : '📱 通知',
            description: message,
            color: isUrgent ? 0xFF0000 : 0x00FF00,  // 赤色または緑色
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Crypto Trade Advisor',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001283.png'
            }
          }
        ]
      };
    }
    // Slack webhook
    else if (webhookUrl.includes('slack.com')) {
      payload = {
        text: message,
        username: 'Crypto Trade Advisor',
        icon_emoji: ':chart_with_upwards_trend:'
      };
    }
    // その他のwebhook
    else {
      payload = { text: message };
    }
    
    const response = await axios.post(webhookUrl, payload);
    res.json({ success: true, status: response.status });
  } catch (error) {
    console.error('Webhook送信エラー:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Webhook送信に失敗しました',
      details: error.response?.data || error.message 
    });
  }
});

// Webhookテスト送信
app.post('/api/test-webhook', async (req, res) => {
  const { webhookUrl } = req.body;
  
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Webhook URLが必要です' });
  }
  
  // テストメッセージにランダムな要素を追加してスパム判定を回避
  const randomEmojis = ['📱', '🔔', '📲', '📳', '📬', '📨'];
  const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
  const randomId = Math.random().toString(36).substring(7);
  
  const testMessage = `${randomEmoji} テスト通知 #${randomId}\n\nCrypto Trade Advisorから\nWebhook通知のテストです。\n\n設定が正常に完了しました！\n売買タイミングで自動通知します。\n\n${new Date().toLocaleString('ja-JP')}\nID: ${randomId}`;
  
  try {
    let payload;
    
    if (webhookUrl.includes('discord.com')) {
      payload = {
        content: `@everyone\n${testMessage}`,
        username: 'Crypto Trade Advisor',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001283.png',
        allowed_mentions: { parse: ['everyone'] },
        tts: true,  // テスト通知でもTTSを有効化
        embeds: [
          {
            title: '📱 テスト通知',
            description: testMessage,
            color: 0x00FF00,  // 緑色
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Crypto Trade Advisor',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001283.png'
            }
          }
        ]
      };
    } else if (webhookUrl.includes('slack.com')) {
      payload = {
        text: testMessage,
        username: 'Crypto Trade Advisor',
        icon_emoji: ':chart_with_upwards_trend:'
      };
    } else {
      payload = { text: testMessage };
    }
    
    const response = await axios.post(webhookUrl, payload);
    res.json({ success: true, status: response.status });
  } catch (error) {
    console.error('Webhookテスト送信エラー:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'テスト送信に失敗しました',
      details: error.response?.data || error.message 
    });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('LINE通知サーバーが起動しました');
});