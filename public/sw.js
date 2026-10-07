// Dzota Quiz - Service Worker for Offline Exam Support
const CACHE_NAME = 'dzota-quiz-offline-v2';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/logo-dzota.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of CORE_ASSETS) {
        try {
          await cache.add(new Request(url, { mode: 'cors' }));
        } catch (err) {
          try {
            await cache.add(url);
          } catch (e) {
            // Ignore individual cache add errors
          }
        }
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Xử lý Navigation Request (F5, bấm link, mở tab mới)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
              // Lưu cả vào '/' làm app shell dự phòng khi mất mạng
              cache.put('/', response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          // Khi mất kết nối internet (Offline)
          const cache = await caches.open(CACHE_NAME);
          // 1. Thử tìm đúng URL hiện tại trong cache
          const cachedMatch = await cache.match(req);
          if (cachedMatch) return cachedMatch;

          // 2. Thử tìm URL bỏ qua query params
          const cachedIgnoreSearch = await cache.match(req, { ignoreSearch: true });
          if (cachedIgnoreSearch) return cachedIgnoreSearch;

          // 3. Fallback về '/' hoặc '/index.html' (App Shell)
          const fallbackShell = (await cache.match('/')) || (await cache.match('/index.html'));
          if (fallbackShell) return fallbackShell;

          // 4. Lấy bất kỳ trang HTML đã lưu trong cache
          const cachedRequests = await cache.keys();
          for (const cr of cachedRequests) {
            if (cr.url.includes('/?id=') || cr.url.endsWith('/') || cr.url.endsWith('.html')) {
              const res = await cache.match(cr);
              if (res) return res;
            }
          }

          return new Response(
            '<html><head><meta charset="utf-8"><title>Offline - Dzota</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Bạn đang ngoại tuyến</h2><p>Vui lòng kết nối mạng để tải bài thi.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Xử lý static assets (CDN scripts, styles, images)
  const url = req.url;
  const isStaticAsset =
    url.includes('cdn.') ||
    url.includes('cdnjs.') ||
    url.includes('.js') ||
    url.includes('.css') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.woff') ||
    url.includes('.ttf');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate: cập nhật nền nếu có mạng
          fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // API calls: Network first, fallback to cached
  if (url.includes('/api/quick-quiz') || url.includes('/api/creator')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          throw new Error('Offline API unavailable');
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_OFFLINE_QUIZ') {
    const url = event.data.url;
    if (url) {
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          await cache.add(url);
        } catch (e) {
          fetch(url)
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch(() => {});
        }
      });
    }
  }
});
