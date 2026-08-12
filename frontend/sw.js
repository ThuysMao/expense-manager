const CACHE_NAME = 'expense-manager-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/index.css',
  '/css/components.css',
  '/css/dashboard.css',
  '/css/forms.css',
  '/css/stats.css',
  '/css/animations.css',
  '/js/utils.js',
  '/js/store.js',
  '/js/dashboard.js',
  '/js/transactions.js',
  '/js/wallets.js',
  '/js/goals.js',
  '/js/stats.js',
  '/js/app.js',
  '/icons/icon-192.png?v=2',
  '/icons/icon-512.png?v=2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Bỏ qua các API calls, chỉ cache UI assets
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
