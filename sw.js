// Service worker do Defensores Galácticos. Gerado no build (scripts/build.mjs troca os placeholders):
// pré-cacheia o jogo na instalação, para abrir offline depois da primeira visita.
const VERSION = '41624df760';
const CACHE = `defgal-${VERSION}`;
const FONTS = 'defgal-fonts';
const PRECACHE = ["./","./apple-touch-icon.png","./assets/app-OFB2ZAXT.js","./icon-192.png","./icon-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // versões antigas do jogo saem do cache
      for (const k of await caches.keys()) if (k.startsWith('defgal-') && k !== CACHE && k !== FONTS) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // fontes do Google: guardadas na primeira visita para o jogo manter o visual offline
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      (async () => {
        const cache = await caches.open(FONTS);
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit ?? net;
      })(),
    );
    return;
  }
  if (url.origin !== location.origin || url.pathname.endsWith('/version.json')) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (req.mode === 'navigate') {
        // página: rede primeiro (pega versões novas), cache como reserva offline
        try {
          const res = await fetch(req);
          if (res.ok) cache.put('./', res.clone());
          return res;
        } catch {
          return (await cache.match('./', { ignoreVary: true })) ?? Response.error();
        }
      }
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })(),
  );
});
