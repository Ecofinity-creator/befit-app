// BE FIT SW v1774170367 - NUCLEAR CACHE CLEAR
const CACHE_NAME = 'befit-1774170367';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // Never cache - always fetch fresh
  if(e.request.method === 'GET' && e.request.url.includes('befit-app')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
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
