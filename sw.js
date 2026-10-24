// Cricket Live service worker: lets the app open without internet.
const CACHE = 'jrcricks-v7';
const NET_WAIT = 4000; // slow internet: after 4s open the saved copy
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('firebaseio.com') || url.hostname.includes('identitytoolkit') || url.hostname.includes('securetoken')) return;
  if (url.href.includes('recaptcha') || url.hostname.includes('appcheck')) return;
  const sameOrigin = url.origin === self.location.origin;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (sameOrigin) {
      const netP = fetch(req).then(net => { if (net && net.ok) cache.put(req, net.clone()); return net; });
      e.waitUntil(netP.catch(() => {}));
      const hit = await cache.match(req);
      if (!hit) return netP;
      try { return await Promise.race([netP, new Promise((_, rej) => setTimeout(rej, NET_WAIT))]); }
      catch (err) { return hit; }
    }
    const hit = await cache.match(req);
    if (hit) return hit;
    try { const net = await fetch(req); if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone()); return net; }
    catch (err) { throw err; }
  })());
});
