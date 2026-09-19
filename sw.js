const CACHE_NAME = 'caller-screen-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.png',
  './icon-192.png'
];

// Install event: Caches the core static files so the PWA can load offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

// Activate event: Cleans up any old cache versions when you update CACHE_NAME
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serves static assets from the cache first, falling back to the network
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Bypass the service worker cache for the external API proxy, 
  // relying instead on the localStorage caching handled in app.js
  if (event.request.url.includes('api.allorigins.win') || event.request.url.includes('freecnam.org')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if found, otherwise fetch from the network
      return cachedResponse || fetch(event.request);
    })
  );
});
