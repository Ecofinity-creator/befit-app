// Be Fit SW v1774251144
const CACHE = 'befit-static-1774251144';
const HTML_URL = '/befit-app/';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
    .then(function() {
      // Tell all open tabs to reload
      return self.clients.matchAll({type: 'window'}).then(function(clients) {
        clients.forEach(function(client) { client.navigate(client.url); });
      });
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // NEVER cache HTML - always fetch fresh
  if (e.request.mode === 'navigate' || 
      url.endsWith('.html') || 
      url.endsWith('/') ||
      url.includes('index.html') ||
      url.includes('befit-app/') && !url.includes('.')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // Also don't cache sw.js itself
  if (url.includes('sw.js')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }
});

self.addEventListener('push', function(e) {
  var d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'Be Fit Marke', {
      body: d.body || '',
      icon: 'icon-192.png',
      tag: d.tag || 'befit',
      vibrate: [200, 100, 200, 100, 400]
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
