// Be Fit Marke SW v1774255999
// This service worker NEVER caches HTML - always fetches fresh

self.addEventListener('install', function(e) {
  // Skip waiting immediately - don't wait for old SW to die
  self.skipWaiting();
  // Clear ALL old caches on install
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
    })
    .then(function() { return self.clients.claim(); })
    .then(function() {
      // Force all open windows to reload with fresh content
      return self.clients.matchAll({type: 'window', includeUncontrolled: true})
        .then(function(clients) {
          return Promise.all(clients.map(function(client) {
            return client.navigate(client.url);
          }));
        });
    })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url = req.url;
  
  // NEVER cache these - always fetch fresh from network
  if (req.mode === 'navigate' ||
      url.includes('.html') ||
      url.includes('sw.js') ||
      url.endsWith('/') ||
      url.includes('/befit-app') && !url.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2)$/)) {
    e.respondWith(
      fetch(req, {cache: 'no-store', headers: {'Cache-Control': 'no-cache'}})
      .catch(function() {
        // Offline fallback - serve from cache if available
        return caches.match(req);
      })
    );
    return;
  }
  
  // For static assets (images, fonts) - network first, cache as fallback
  e.respondWith(
    fetch(req, {cache: 'no-cache'})
    .catch(function() { return caches.match(req); })
  );
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
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
