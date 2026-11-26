/* Group Connect (single-file build) – offline cache + notification tap. Place next to index.html.
   No background sync here: reminders are checked when the app is open. */
const VERSION = '1.4.0';                       // must equal GC.VERSION inside index.html
const PREFIX = 'group-connect-';
const CACHE = PREFIX + 'v' + VERSION;
const ASSETS = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => { })))).then(() => self.skipWaiting())); });
/* Delete only OLD caches of this app (prefix "group-connect-"); other apps' caches and IndexedDB are never touched. */
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith(PREFIX) && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {   // page loads: network first, cached index.html only when offline
    e.respondWith(fetch(req).then(res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); } return res; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./')).then(r => r || new Response('Group Connect is offline and has not been cached yet. Please open it once while online.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
    return;
  }
  // other files: network first (so updates arrive), cached copy offline; a real error if neither – never index.html
  e.respondWith(fetch(req).then(res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || new Response('', { status: 504, statusText: 'Offline and not cached' }))));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./'))); });
