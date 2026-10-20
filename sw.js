/* Service worker: saves the whole app on the device so it opens with no signal.
   VERSION changes whenever app files change, so phones pick up the new copy. */
const VERSION = "ms-v2.3";
const APP = ["./", "index.html", "styles.css", "theory.js", "audio.js", "data.js", "hints.js", "sync.js", "unlock.js", "importer.js", "ambient.js",
  "core.js", "library.js", "practice.js", "path.js", "spotify.js", "takes.js", "voice.js", "app.js", "manifest.webmanifest", "vendor/pdf.min.js", "vendor/pdf.worker.min.js",
  "icons/favicon.svg", "icons/favicon-32.png", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];
const EXTERNAL = ["https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap"];
const CACHE_HOSTS = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(APP.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
    await Promise.all(EXTERNAL.map(u => c.add(new Request(u, { mode: "cors" })).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const isApp = url.origin === location.origin;
  if (!isApp && !CACHE_HOSTS.includes(url.hostname)) return;   // GitHub sync, Spotify etc. always go to the network
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request, { ignoreSearch: isApp });
    const net = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    if (r) return r;
    if (e.request.mode === "navigate") return (await c.match("index.html")) || Response.error();
    return Response.error();
  })());
});
