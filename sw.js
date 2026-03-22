// SW v1774181720
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}))});
});
self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('push', function(e) {
  var d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||'Be Fit',{body:d.body||'',icon:'icon-192.png',tag:d.tag||'befit',vibrate:[200,100,200,100,400]}));
});
self.addEventListener('message', function(e) {
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
