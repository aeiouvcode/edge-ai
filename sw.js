/* EDGE//AI service worker: makes the app shell offline after first visit.
   Model files are cached separately by Transformers.js in the Cache API. */
const SHELL = 'edge-shell-v1';
const SHELL_URLS = ['./', './index.html'];
const CDN = 'cdn.jsdelivr.net';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('edge-shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === self.location.origin) {
    // app shell: cache-first, then network (and refresh cache)
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }
  if (url.host === CDN) {
    // pinned engine library: cache-first so the app boots offline
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }
  // everything else (model downloads): pass through; transformers.js handles its own cache
});
