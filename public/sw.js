// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  // Skip waiting to ensure the new service worker activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  // Take control of all pages under its scope immediately.
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // A simple network-first strategy.
  // This is just to make the app installable (PWA).
  // No offline functionality is intended for now.
  event.respondWith(fetch(event.request));
});
