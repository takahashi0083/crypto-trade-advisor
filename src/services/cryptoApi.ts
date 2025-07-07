import axios from 'axios';
import type { CryptoPrice } from '../types/crypto';

const BINANCE_API = 'https://api.binance.com/api/v3';
// BinanceにはJPYペアがないため、USDTペアを使用
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'LTCUSDT', 'BCHUSDT', 'ADAUSDT'];

export class CryptoApiService {
  // リアルタイムの為替レートを取得
  static async getUSDJPYRate(): Promise<number> {
    try {
      // 無料の為替レートAPI（日次更新）
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      const rate = response.data.rates.JPY;
      console.log('Current USD/JPY rate:', rate);
      return rate;
    } catch (error) {
      console.error('為替レート取得エラー、デフォルト値を使用:', error);
      return 157; // フォールバック値
    }
  }

  static async getPrices(): Promise<CryptoPrice[]> {
    try {
      console.log('Fetching prices from Binance API...');
      // 並列で取得
      const [tickerResponse, usdJpyRate] = await Promise.all([
        axios.get(`${BINANCE_API}/ticker/24hr`),
        this.getUSDJPYRate()
      ]);
      const allTickers = tickerResponse.data;
      console.log('Received tickers:', allTickers.length);
      
      return SYMBOLS.map(symbol => {
        const ticker = allTickers.find((t: any) => t.symbol === symbol);
        if (!ticker) return null;
        
        const baseSymbol = symbol.replace('USDT', '');
        const priceInUSD = parseFloat(ticker.lastPrice);
        
        // デバッグ情報
        if (baseSymbol === 'XRP') {
          console.log(`XRP Debug - USD Price: ${priceInUSD}, JPY Rate: ${usdJpyRate}, Final: ${priceInUSD * usdJpyRate}`);
        }
        
        return {
          symbol: baseSymbol,
          price: priceInUSD * usdJpyRate, // リアルタイム為替レートで変換
          change24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(ticker.volume),
          lastUpdate: new Date()
        };
      }).filter(Boolean) as CryptoPrice[];
    } catch (error) {
      console.error('価格データの取得に失敗:', error);
      return [];
    }
  }
  
  static async getHistoricalPrices(symbol: string, interval: string = '1h', limit: number = 24) {
    try {
      const response = await axios.get(`${BINANCE_API}/klines`, {
        params: {
          symbol: `${symbol}USDT`,
          interval,
          limit
        }
      });
      
      return response.data.map((candle: any[]) => ({
        time: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
    } catch (error) {
      console.error('履歴データの取得に失敗:', error);
      return [];
    }
  }
  
  // 特定の日時の価格を取得
  static async getPriceAtDateTime(symbol: string, dateTime: Date): Promise<number | null> {
    try {
      // 指定日時の前後1時間のデータを取得
      const endTime = dateTime.getTime() + 60 * 60 * 1000; // 1時間後
      const startTime = dateTime.getTime() - 60 * 60 * 1000; // 1時間前
      
      const response = await axios.get(`${BINANCE_API}/klines`, {
        params: {
          symbol: `${symbol}USDT`,
          interval: '1m', // 1分足で精度を高める
          startTime,
          endTime,
          limit: 120 // 2時間分
        }
      });
      
      if (response.data.length === 0) {
        // データがない場合は日足で再試行
        const dayResponse = await axios.get(`${BINANCE_API}/klines`, {
          params: {
            symbol: `${symbol}USDT`,
            interval: '1d',
            startTime: dateTime.getTime() - 7 * 24 * 60 * 60 * 1000, // 7日前から
            endTime: dateTime.getTime() + 24 * 60 * 60 * 1000, // 1日後まで
            limit: 10
          }
        });
        
        if (dayResponse.data.length > 0) {
          const closestCandle = dayResponse.data[0];
          const priceInUSD = parseFloat(closestCandle[4]); // 終値
          const usdJpyRate = await this.getUSDJPYRate();
          return priceInUSD * usdJpyRate;
        }
        return null;
      }
      
      // 指定時刻に最も近いデータを探す
      const targetTime = dateTime.getTime();
      let closestCandle = response.data[0];
      let minDiff = Math.abs(closestCandle[0] - targetTime);
      
      for (const candle of response.data) {
        const diff = Math.abs(candle[0] - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestCandle = candle;
        }
      }
      
      const priceInUSD = parseFloat(closestCandle[4]); // 終値を使用
      const usdJpyRate = await this.getUSDJPYRate();
      
      console.log(`${symbol} at ${dateTime.toLocaleString()}: $${priceInUSD} × ¥${usdJpyRate} = ¥${priceInUSD * usdJpyRate}`);
      
      return priceInUSD * usdJpyRate;
    } catch (error) {
      console.error('過去の価格取得エラー:', error);
      return null;
    }
  }
  
  // Fear & Greed Index (Alternative.me API)
  static async getFearGreedIndex() {
    try {
      const response = await axios.get('https://api.alternative.me/fng/');
      const data = response.data.data[0];
      return {
        value: parseInt(data.value),
        classification: data.value_classification,
        timestamp: new Date(parseInt(data.timestamp) * 1000)
      };
    } catch (error) {
      console.error('Fear & Greed Indexの取得に失敗:', error);
      return null;
    }
  }
}