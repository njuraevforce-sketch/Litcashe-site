// Litcash service worker (safe)
const VERSION = 'lc-sw-v2';

const APP_SHELL = [
  '/', '/index.html',
  '/dashboard_single.html', '/deposit_single.html', '/withdraw_single.html',
  '/faq_single.html', '/settings_single.html',
  '/manifest.webmanifest', '/offline.html',
  '/icons/litcash-180.png', '/icons/litcash-192.png',
  '/icons/litcash-256.png', '/icons/litcash-384.png', '/icons/litcash-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP_SHELL).catch(()=>null)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === VERSION ? null : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isVideo(req) {
  const url = new URL(req.url);
  return url.pathname.includes('/assets/videos') || /\.(mp4|webm|mov)$/i.test(url.pathname);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // ВАЖНО: не трогаем кросс-доменные и не-GET запросы (Supabase и пр.)
  if (req.method !== 'GET' || url.origin !== self.location.origin || isVideo(req)) return;

  // Network-first для своих статики
  e.respondWith((async () => {
    try {
      const net = await fetch(req);
      const cache = await caches.open(VERSION);
      cache.put(req, net.clone());
      return net;
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return caches.match('/offline.html');
      throw new Error('offline');
    }
  })());
});
