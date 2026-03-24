// Be Fit Marke SW
var CACHE = 'befit-v3';

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
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function() { return caches.match(e.request); })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});

self.addEventListener('push', function(e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(x) { d = {title:'Be Fit Marke', body: e.data ? e.data.text() : ''}; }

  var title = d.title || 'Be Fit Marke';
  var options = {
    body:              d.body || '',
    icon:              '/befit-app/icon-192.png',
    badge:             '/befit-app/icon-192.png',
    tag:               d.tag  || 'befit',
    vibrate:           [300, 100, 300, 100, 500],
    requireInteraction: true,      // Stays visible until tapped — key for foreground popup
    silent:            false,
    renotify:          true,       // Re-alert even if same tag
    data:              { url: d.url || '/befit-app/', tag: d.tag || 'befit' }
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var tag = (e.notification.data && e.notification.data.tag) || e.notification.tag || '';
  var url = '/befit-app/';

  if (tag.startsWith('snack-')) {
    url = '/befit-app/?tab=' + tag.replace('snack-', '') + '&section=snack';
  } else if (tag === 'chat')     { url = '/befit-app/?tab=chat'; }
  else if (tag === 'feedback')   { url = '/befit-app/?tab=morning'; }
  else if (tag === 'broadcast')  { url = '/befit-app/?tab=news'; }

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      for (var i = 0; i < cls.length; i++) {
        if (cls[i].url.includes('/befit-app/')) {
          cls[i].focus();
          cls[i].postMessage({ type: 'NAVIGATE', url: url });
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
