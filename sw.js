// NETRUNNER VAULT — Service Worker
// Cache-first стратегия. Все ассеты приложения кэшируются при установке.
// Любые внешние запросы блокируются (приложение полностью оффлайн).

const CACHE = 'netrunner-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // SECURITY: блокируем всё, что не наш origin (защита от утечек)
  if (url.origin !== self.location.origin) {
    e.respondWith(new Response('', { status: 403, statusText: 'External requests blocked' }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      // если запрашивают что-то нового, чего нет в кэше — пробуем сеть, иначе 404
      return fetch(e.request).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
