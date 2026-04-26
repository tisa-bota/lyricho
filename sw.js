// ============================================================
// コード譜メモ帳 — Service Worker
// バージョンを上げるだけで全ユーザーのキャッシュが自動更新されます
// ============================================================
const VERSION = '1.7.0';
const CACHE = 'crd-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

// ── インストール：必要ファイルをキャッシュ ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())  // 即座に有効化
  );
});

// ── アクティベート：古いキャッシュを削除 ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] 古いキャッシュを削除:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())  // 開いているページをすぐ制御下に
  );
});

// ── フェッチ：キャッシュ戦略 ──
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Googleフォント → ネットワーク優先（失敗時はキャッシュ）
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // アプリ本体（index.html）→ ネットワーク優先（オフライン時はキャッシュ）
  // ※ これにより更新があればユーザーが次回起動時に自動で最新版を受け取れる
  if (url.includes('index.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // その他（icon.svg, manifest.json 等）→ キャッシュ優先
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (!r || r.status !== 200 || r.type === 'opaque') return r;
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      });
    })
  );
});
