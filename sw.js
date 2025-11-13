const CACHE_NAME = 'asl-practice-v3'; // Incremented version to ensure update

// List of files to cache
const urlsToCache = [
  'index.html',
  'app.js',
  'style.css',
  'metadata.json',
  'vite.svg',
];

// Add image files to the cache list
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

ALPHABET.forEach(char => urlsToCache.push(`images/${char}.png`));
NUMBERS.forEach(num => urlsToCache.push(`images/${num}.png`));

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        const promises = urlsToCache.map(url => {
          return cache.add(new Request(url, {cache: 'reload'})).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          });
        });
        return Promise.all(promises);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, and cache it for next time
        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});