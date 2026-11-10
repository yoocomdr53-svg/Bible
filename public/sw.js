// public/sw.js - Service Worker for SuperBible PWA
// Provides high-reliability real-time auto updates on both PC (Chrome/Edge desktop) and mobile (Android/iOS)
const CACHE_NAME = 'superbible-v1.2-cache';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old worker or existing tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'FORCE_UPDATE')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation requests (HTML pages) and version check: ALWAYS NETWORK-FIRST WITH NO-CACHE
  // This guarantees PC installed apps immediately receive new code bundles upon deployment!
  if (
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('version.json') ||
    url.pathname.endsWith('sw.js')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            // Keep a copy in cache for offline support
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. Static assets (hashed JS, CSS, fonts, audio, icons): Network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
