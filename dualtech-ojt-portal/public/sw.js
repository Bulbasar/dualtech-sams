const CACHE_NAME = 'dualtech-ojt-cache-v5'; // Bumped version to force update

// 1. Static local files we explicitly know about
const STATIC_URLS = [
  './',
  './trainee.html',
  './tsdportal.html',
  './mentoring.html',
  './ic-portal.html',  
  './manifest.json',
  './icon-192.png',
  './dualtech-logo.png'
];

// 2. CDNs we want to cache dynamically as the browser fetches them
const CDN_DOMAINS = [
  'esm.sh',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'cdn.tailwindcss.com',
  'www.gstatic.com'
];

// Install Event: Cache local static files immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and cached static assets');
        return cache.addAll(STATIC_URLS);
      })
  );
});

// Fetch Event: Handle requests differently based on what is being asked for
self.addEventListener('fetch', (event) => {
  // Only handle GET requests from http/https (ignore POST, chrome-extension://, etc)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // RULE A: Ignore Firebase API / Database calls. 
  // Firebase handles its own offline database sync via IndexedDB. Caching these breaks Firestore.
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com')) {
    return; // Let the request pass through normally
  }

  // RULE B: Cache-First for CDNs (React, Tailwind, Firebase Libraries, Icons)
  // If the file is from a known CDN, check the cache first. If it's not there, download and cache it for next time.
  if (CDN_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Return instantly from cache
        }
        
        return fetch(event.request).then((networkResponse) => {
          // Only cache valid responses
          if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch((error) => {
          console.log('CDN Fetch failed; offline and not in cache', error);
          // Return a 503 Service Unavailable response instead of throwing to avoid "Failed to convert value to 'Response'"
          return new Response('Offline: resource not found in cache', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
    return;
  }

  // RULE C: Network-First for your local HTML files
  // Always try to get the newest version of the app from the internet first. 
  // If the user has no internet, fallback to the last cached version of the app.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('Network failed, pulling from cache for:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a 503 Service Unavailable response instead of throwing to avoid "Failed to convert value to 'Response'"
          return new Response('Offline: resource not found in cache', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Activate Event: Clean up old caches so users don't get stuck on old code
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); 
});