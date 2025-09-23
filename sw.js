const VERSION = 'lc-sw-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/dashboard_single.html',
  '/deposit_single.html',
  '/withdraw_single.html',
  '/faq_single.html',
  '/settings_single.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/litcash-192.png',
  '/icons/litcash-256.png',
  '/icons/litcash-384.png',
  '/icons/litcash-512.png',
  '/icons/litcash-180.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(APP_SHELL).catch(()=>null))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k === VERSION ? null : caches.delete(k)))).then(() => self.clients.claim())
  );
});

function isVideo(req) {
  const url = new URL(req.url);
  return url.pathname.includes('/assets/videos') || /\.(mp4|webm|mov)$/i.test(url.pathname);
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || isVideo(request)) return;
  e.respondWith((async () => {
    try {
      const net = await fetch(request);
      const cache = await caches.open(VERSION);
      cache.put(request, net.clone());
      return net;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') return caches.match('/offline.html');
      throw err;
    }
  })());
});