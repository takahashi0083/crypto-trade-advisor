const CACHE_NAME = 'crypto-advisor-v2';

// インストール時
self.addEventListener('install', event => {
  // 即座にアクティベート
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチイベント - 開発環境では何もしない
self.addEventListener('fetch', event => {
  // 開発サーバーのリクエストはそのまま通す
  if (event.request.url.includes('localhost')) {
    return;
  }
  
  // 本番環境でのみキャッシュを使用
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// プッシュ通知の受信
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '新しい売買シグナルがあります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Crypto Trade Advisor', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});