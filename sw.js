/* EDGE//AI service worker: network-first shell updates, offline fallback.
   Model files are cached separately by Transformers.js. */
const SHELL = 'edge-shell-v11';
const SHELL_URLS = ['./', './index.html'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('edge-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === self.location.origin) {
    // Navigations/index are network-first so fixes are not trapped behind a stale shell.
    // Offline falls back to the last verified shell.
    if (e.request.mode === 'navigate' || /\/index\.html$/.test(url.pathname)) {
      e.respondWith(fetch(e.request).then(res => {
        const copy=res.clone(); caches.open(SHELL).then(c=>c.put('./index.html',copy)); return res;
      }).catch(()=>caches.match('./index.html').then(x=>x||caches.match('./'))));
    } else {
      e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{const copy=res.clone();caches.open(SHELL).then(c=>c.put(e.request,copy));return res;})));
    }
    return;
  }
  // Model downloads pass through; Transformers.js owns their browser cache.
});


