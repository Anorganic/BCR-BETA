/* MAINTENANCE BCR — service worker
   Cache "app shell" (HTML/CSS/JS/icons) supaya bisa dibuka cepat & tetap
   muncul walau koneksi internet jelek/putus sebentar.
   Data (Supabase) tetap butuh internet seperti biasa — ini cuma men-cache
   file statisnya, bukan data WR/WO/dll.
*/
const CACHE_NAME = "bcr-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Jangan cache request ke Supabase / domain luar — selalu ambil langsung dari network
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
