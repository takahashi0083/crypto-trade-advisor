import axios from 'axios';
import type { CryptoPrice } from '../types/crypto';

const BINANCE_API = 'https://api.binance.com/api/v3';
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'MATICUSDT'];

export class CryptoApiService {
  static async getPrices(): Promise<CryptoPrice[]> {
    try {
      console.log('Fetching prices from Binance API...');
      const response = await axios.get(`${BINANCE_API}/ticker/24hr`);
      const allTickers = response.data;
      console.log('Received tickers:', allTickers.length);
      
      return SYMBOLS.map(symbol => {
        const ticker = allTickers.find((t: any) => t.symbol === symbol);
        if (!ticker) return null;
        
        const baseSymbol = symbol.replace('USDT', '');
        const priceInUSD = parseFloat(ticker.lastPrice);
        // USD to JPY conversion (approximate rate)
        const USD_TO_JPY = 150;
        return {
          symbol: baseSymbol,
          price: priceInUSD * USD_TO_JPY, // Convert to JPY
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