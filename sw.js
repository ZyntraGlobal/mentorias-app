// Incrementar a versão para forçar atualização no iPhone
const CACHE = 'mentorias-v3';
const ASSETS = ['./', 'index.html', 'app.js', 'manifest.json', 'assets/icon-192.png', 'assets/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre a versão mais nova); cache só quando estiver sem internet.
// GitHub API e acesso.json nunca passam pelo cache.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('acesso.json')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
