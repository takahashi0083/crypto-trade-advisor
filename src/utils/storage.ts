// LocalStorageとサーバーストレージの抽象化レイヤー

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

export class Storage {
  static async getItem(key: string): Promise<string | null> {
    // まずローカルストレージを試す
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('LocalStorage unavailable:', e);
      }
    }

    // サーバーストレージを使用
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/${key}`);
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get data from server:', error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    // まずローカルストレージを試す
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('LocalStorage unavailable:', e);
      }
    }

    // サーバーストレージを使用
    try {
      await fetch(`${API_BASE_URL}/api/data/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: value })
      });
    } catch (error) {
      console.error('Failed to save data to server:', error);
    }
  }

  static async removeItem(key: string): Promise<void> {
    // まずローカルストレージを試す
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('LocalStorage unavailable:', e);
      }
    }

    // サーバーストレージを使用（nullをセット）
    try {
      await fetch(`${API_BASE_URL}/api/data/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: null })
      });
    } catch (error) {
      console.error('Failed to remove data from server:', error);
    }
  }
}