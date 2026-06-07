const CACHE_NAME = 'att-app-v1';
const ASSETS = [
  '/', '/index.html', '/css/style.css', '/js/app.js', '/js/firebase-config.js', '/js/students.js',
  '/js/attendance.js', '/js/dashboard.js', '/js/reports.js', '/js/export.js'
];

self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(c=> c.addAll(ASSETS)).then(()=> self.skipWaiting()));
});

self.addEventListener('activate', event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event=>{
  event.respondWith(caches.match(event.request).then(resp=> resp || fetch(event.request).then(r=>{ caches.open(CACHE_NAME).then(c=>c.put(event.request, r.clone())); return r; })).catch(()=> caches.match('/index.html')));
});
