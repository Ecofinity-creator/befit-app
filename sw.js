// Be Fit Marke SW v1774301110
var CACHE = 'befit-1774301110';

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
  );
});

self.addEventListener('fetch', function(e) {
  // For navigation requests, always try network first
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // For everything else, network first with cache fallback
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});

self.addEventListener('push', function(e) {
  var d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'Be Fit Marke', {
      body: d.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.tag || 'befit',
      vibrate: [200, 100, 200, 100, 400],
      requireInteraction: false
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var tag = e.notification.tag || '';
  var url = '/befit-app/';
  
  // Deep links based on notification tag
  if (tag.startsWith('snack-')) {
    var meal = tag.replace('snack-', '');
    url = '/befit-app/?tab=' + meal + '&section=snack';
  } else if (tag === 'chat') {
    url = '/befit-app/?tab=chat';
  } else if (tag === 'feedback') {
    url = '/befit-app/?tab=morning';
  } else if (tag === 'broadcast') {
    url = '/befit-app/?tab=news';
  }
  
  e.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(cls) {
      // If app is already open, focus and navigate
      for (var i = 0; i < cls.length; i++) {
        if (cls[i].url.includes('/befit-app/')) {
          cls[i].focus();
          cls[i].postMessage({type: 'NAVIGATE', url: url});
          return;
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
