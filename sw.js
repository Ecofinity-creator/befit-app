const CACHE_NAME = 'befit-v1774163554';
const URLS_TO_CACHE = ['./', './index.html'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(resp) {
        if(!resp || resp.status !== 200) return resp;
        var rc = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, rc); });
        return resp;
      });
    })
  );
});

self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'Be Fit', {
    body: data.body || '',
    icon: 'icon-192.png',
    tag: data.tag || 'befit',
    vibrate: [200, 100, 200, 100, 400]
  }));
});

self.addEventListener('message', function(e) {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
