/* Service worker: saves the whole app on the device so it opens with no signal.
   Bump VERSION whenever app files change so phones pick up the new copy. */
const VERSION = "ms-v1";
const APP = ["./", "index.html", "styles.css", "theory.js", "data.js", "audio.js", "sync.js", "app.js",
  "manifest.webmanifest", "icons/favicon.svg", "icons/favicon-32.png", "icons/apple-touch-icon.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];
const PDFJS = ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(APP.map(u => c.add(u).catch(() => {})));
    await Promise.all(PDFJS.map(u => c.add(new Request(u, { mode: "cors" })).catch(() => {})));
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
  if (url.hostname === "api.github.com") return;            // sync always goes to the network
  if (url.hostname.includes("spotify")) return;
  const isApp = url.origin === location.origin;
  const isCdn = url.hostname === "cdnjs.cloudflare.com";
  if (!isApp && !isCdn) return;
  // app files: use the saved copy right away, refresh it in the background
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request, { ignoreSearch: isApp });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    if (r) return r;
    if (e.request.mode === "navigate") return (await c.match("index.html")) || Response.error();
    return Response.error();
  })());
});
