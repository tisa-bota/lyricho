const VERSION    = '942f7dc8'; // GitHub Actions がここをコミットSHAに置換
const CACHE_NAME = `lyricho-v${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

// ── インストール ──────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting(); // 即座に有効化
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ── 有効化（古いキャッシュを削除）────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── フェッチ（キャッシュ優先）────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
