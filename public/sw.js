// RiceCare: Disease Detector - Offline Service Worker
const CACHE_NAME = 'ricecare-cache-v5';

// Assets to pre-cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  '/philippines_rice_disease_edge_v2.tflite',
  '/tflite_web_api_cc.js',
  '/tflite_web_api_cc.wasm',
  '/tflite_web_api_cc_simd.js',
  '/tflite_web_api_cc_simd.wasm',
  '/tflite_web_api_cc_simd_threaded.js',
  '/tflite_web_api_cc_simd_threaded.wasm',
  '/tflite_web_api_cc_simd_threaded.worker.js',
  '/tflite_web_api_cc_threaded.js',
  '/tflite_web_api_cc_threaded.wasm',
  '/tflite_web_api_cc_threaded.worker.js',
  '/tflite_web_api_client.js'
];

// Install Event: Create cache and store essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First, Network-Fallback strategy
// Intercepts requests and serves from cache if available, otherwise fetches and caches dynamically.
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS requests (ignores chrome-extension or other schemes)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Cache hit - return the cached resource
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Cache miss - fetch from network
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('[Service Worker] Dynamically caching new resource:', event.request.url);
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Fetch failed for:', event.request.url, error);
          // Return a fallback if offline and requesting HTML page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
