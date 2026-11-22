// Velad: service worker mínimo. Siempre pide a la red (así cada cambio del sitio llega igual),
// y solo si no hay conexión usa la última copia guardada.
const C='velad-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(C).then(k=>k.put(r,c));return res;}).catch(()=>caches.match(r)));
});
