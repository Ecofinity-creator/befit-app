// Be Fit Marke SW — offline-first
var CACHE = 'befit-v1775386953';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap'
];

// ── INSTALL: cache alle app-bestanden ─────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS.slice(0, -1)).then(function() {
        return cache.add(ASSETS[ASSETS.length - 1]).catch(function() {});
      });
    })
  );
});

// ── ACTIVATE: verwijder oude caches ───────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// ── FETCH: offline-first strategie ────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // API-calls nooit cachen
  if (url.includes('firestore.googleapis.com') ||
      url.includes('api.anthropic.com') ||
      url.includes('openfoodfacts.org') ||
      url.includes('befit-backend') ||
      url.includes('firebase') ||
      e.request.method !== 'GET') {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response(JSON.stringify({error:'offline'}),
        {headers:{'Content-Type':'application/json'}});
    }));
    return;
  }

  // index.html: altijd netwerk-first zodat nieuwe versie direct geladen wordt
  if (url.includes('index.html') || url.endsWith('/befit-app/') || url.endsWith('/befit-app')) {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // Andere bestanden: cache-first, update op achtergrond
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() { return null; });
      return cached || networkFetch;
    })
  );
});

// ── PUSH: notificaties op achtergrond ─────────────────────────
self.addEventListener('push', function(e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(x) {
    d = {title: 'Be Fit Marke', body: e.data ? e.data.text() : ''};
  }
  var title = d.title || 'Be Fit Marke';
  var options = {
    body: d.body || '', icon: '/befit-app/icon-192.png',
    badge: '/befit-app/icon-192.png', tag: d.tag || 'befit',
    vibrate: [300, 100, 300, 100, 500], requireInteraction: true,
    silent: false, renotify: true,
    data: { url: d.url || '/befit-app/', tag: d.tag || 'befit' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATIONCLICK: deep links ─────────────────────────────
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var tag = (e.notification.data && e.notification.data.tag) || e.notification.tag || '';
  var url = '/befit-app/';
  if (tag.startsWith('snack-')) { url = '/befit-app/?tab=' + tag.replace('snack-', '') + '&section=snack'; }
  else if (tag === 'chat')    { url = '/befit-app/?tab=chat'; }
  else if (tag === 'feedback'){ url = '/befit-app/?tab=morning'; }
  else if (tag === 'broadcast'){ url = '/befit-app/?tab=news'; }
  else if (tag === 'video')   { url = '/befit-app/?tab=video'; }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      for (var i = 0; i < cls.length; i++) {
        if (cls[i].url.includes('/befit-app/')) {
          cls[i].focus(); cls[i].postMessage({ type: 'NAVIGATE', url: url }); return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── MESSAGES ──────────────────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
