const CACHE='mi-espacio-shell-v21';const FILES=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))))});
self.addEventListener('push',e=>{
 let payload={title:'MI ESPACIO',body:'Tenés un recordatorio pendiente.',url:'/'};
 try{if(e.data)payload={...payload,...e.data.json()}}catch{if(e.data)payload.body=e.data.text()}
 e.waitUntil(self.registration.showNotification(payload.title||'MI ESPACIO',{
  body:payload.body||'Tenés un recordatorio pendiente.',
  data:{url:payload.url||'/'},
  tag:payload.tag||undefined,
  renotify:false
 }));
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 const target=new URL(e.notification.data?.url||'/',self.location.origin).href;
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
  for(const client of list){if(client.url.startsWith(self.location.origin)&&'focus'in client)return client.navigate(target).then(c=>c&&c.focus())}
  return clients.openWindow(target);
 }));
});
