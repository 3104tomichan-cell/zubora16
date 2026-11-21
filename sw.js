// サービスワーカー（tools/build.py が sw.js を作る。直接 sw.js を編集しない）
// 方針：いつも先にネットを見に行き（最新版を優先）、つながらないときだけ前に保存したものを使う。
// これで、一度開いたスマホ（スタッフ用の端末など）は、電波が悪くても再読み込みや診断ができる。
// 記録の送信先（script.google.com）は扱わない。
const CACHE = 'zubora-2026.0.7';
const SHELL = ['./', './index.html', './assets/logo.png',
  './fonts/ZenMaru-500.woff2', './fonts/ZenMaru-700.woff2',
  ...['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16']
    .map((id) => `./assets/types/${id}.webp`)];

self.addEventListener('install', (e) => {
  // 1つ取れなくても登録は失敗させない
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('zubora-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then((hit) => hit || Response.error())),
  );
});
