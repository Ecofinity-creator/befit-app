// Be Fit Marke — Service Worker v1.0
const CACHE = 'befit-v1';
const VAPID_PUBLIC = 'BJoNsaWDe1tjHP5afxOdW7M2iEiQDtDKHJLmlQmsO3Y8EcGI7TVYZX9SyUoJfSUkgInuWEw1DvRxgb_md13xo5M';

// ── Install: cache the app shell ─────────────────────────────
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll([
        './befit-eetdagboek.html',
        './manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network ────────────
self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(resp){
        if(e.request.url.includes('befit-eetdagboek.html')){
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      });
    }).catch(function(){
      return caches.match('./befit-eetdagboek.html');
    })
  );
});

// ── Push: incoming push from server ──────────────────────────
self.addEventListener('push', function(e){
  var data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'Be Fit', body: e.data ? e.data.text() : 'Nieuw bericht van je diëtiste' }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Be Fit Marke', {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-72.png',
      tag: data.tag || 'befit-push',
      data: { url: data.url || './befit-eetdagboek.html' },
      vibrate: [200, 100, 200],
      requireInteraction: false
    })
  );
});

// ── Notification click: open/focus the app ───────────────────
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || './befit-eetdagboek.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(var i=0;i<list.length;i++){
        var c = list[i];
        if(c.url.includes('befit') && 'focus' in c){ return c.focus(); }
      }
      if(clients.openWindow){ return clients.openWindow(target); }
    })
  );
});

// ── Background sync: local reminder check ────────────────────
self.addEventListener('periodicsync', function(e){
  if(e.tag === 'check-reminders'){
    e.waitUntil(checkLocalReminders());
  }
});

async function checkLocalReminders(){
  // Notify all clients to check their timers
  var list = await clients.matchAll({ type: 'window' });
  list.forEach(function(c){ c.postMessage({ type: 'CHECK_TIMERS' }); });
}
