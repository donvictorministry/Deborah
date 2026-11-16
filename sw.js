/* DV Note service worker.
   - Keeps the app working offline.
   - Opens clean note addresses (/note/<title>-<id>) straight from the saved app,
     so home-screen note shortcuts launch instantly, even offline.
   Change CACHE_NAME whenever you publish new files so phones pick them up. */
var CACHE_NAME = 'dv-note-v1';
var SHELL = ['./', 'index.html', 'notepad.js', 'manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function appPage() {
  return caches.match(new URL('index.html', self.registration.scope).href);
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    /* clean note address: always open the app, which then shows that note */
    if (url.pathname.indexOf('/note/') > -1) {
      e.respondWith(appPage().then(function (r) { return r || fetch(req); }));
      return;
    }
    /* normal pages: network first, saved copy when offline */
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || appPage(); });
      })
    );
    return;
  }

  /* files: saved copy first, refreshed in the background */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
