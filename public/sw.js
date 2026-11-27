// Dzota Quiz - Service Worker for Offline Exam Support (v7)
// Strictly scoped to offline exam & static CDN assets — NEVER intercepts /dashboard, /login, or dynamic pages.
const CACHE_NAME = 'dzota-quiz-offline-v10';

const CORE_ASSETS = [
  '/index.html',
  '/logo-dzota.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js',
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
          } catch (e) {}
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

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url);
  } catch (e) {
    return;
  }

  // CHỈ can thiệp Navigation khi mở trực tiếp link Đề Thi (?id=, ?test=, /index.html)
  // Tuyệt đối KHÔNG chạm vào /dashboard, /login, /creator, /dynex, /duocly, /notebook hoặc trang chủ '/'
  if (req.mode === 'navigate') {
    const isOfflineQuizNavigation =
      parsedUrl.pathname === '/index.html' ||
      (parsedUrl.pathname === '/' &&
        (parsedUrl.searchParams.has('id') ||
          parsedUrl.searchParams.has('test') ||
          parsedUrl.searchParams.has('editId')));

    if (!isOfflineQuizNavigation) {
      return;
    }

    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, copy);
              cache.put('/index.html', response.clone());
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedMatch = await cache.match(req);
          if (cachedMatch) return cachedMatch;

          const appShell = await cache.match('/index.html');
          if (appShell) return appShell;

          return new Response(
            '<html><head><meta charset="utf-8"><title>Offline - Dzota</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Bạn đang ngoại tuyến</h2><p>Vui lòng kết nối mạng để tải bài thi.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Xử lý static CDN assets & icons (loại trừ hoàn toàn /_next/, /api/, và chính /sw.js)
  const url = req.url;
  if (
    parsedUrl.pathname.startsWith('/_next/') ||
    parsedUrl.pathname.startsWith('/api/') ||
    parsedUrl.pathname === '/sw.js'
  ) {
    if (parsedUrl.pathname.startsWith('/api/quick-quiz') && parsedUrl.searchParams.get('id') !== 'all') {
      // Cho phép cache dữ liệu từng đề thi cụ thể để làm bài Offline
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
    return;
  }

  const isStaticAsset =
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdn.tailwindcss.com') ||
    url.includes('cdnjs.cloudflare.com') ||
    parsedUrl.pathname.endsWith('.png') ||
    parsedUrl.pathname.endsWith('.jpg') ||
    parsedUrl.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
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
