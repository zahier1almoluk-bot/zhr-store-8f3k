// Service Worker — محلات الزاهر
// عند تعديل أي ملف من ملفات التطبيق غيّر رقم النسخة ليصل التحديث للمستخدمين.
const VERSION = 'alzaher-v7';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './logo.png', './icon-512.png', './icon-maskable-512.png'];
// مكتبات خارجية تُخزَّن مؤقتاً أول مرة يعمل فيها التطبيق بالإنترنت لتعمل بعدها بدونه
const LIBS = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    await Promise.all(LIBS.map(async u => {
      try { await cache.put(u, await fetch(u, { mode: 'no-cors' })); } catch (_) { /* بدون إنترنت الآن: يُحاول لاحقاً */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isLib = LIBS.includes(req.url) || /unpkg\.com\/html5-qrcode|jspdf/.test(req.url);
  if (url.origin !== location.origin && !isLib) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }          // من الكاش فوراً + تحديث بالخلفية
    const r = await net;
    if (r) return r;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
