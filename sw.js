'use strict';
const CACHE = 'radar-mobile-0.4.0';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
const assetUrls = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('radar-mobile-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode === 'navigate' && new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  // Only known application assets can be cached. Never cache arbitrary URLs or query variants.
  if (url.origin !== self.location.origin || !assetUrls.has(url.href) || url.search || url.hash) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => (await caches.match(request)) || Response.error())
  );
});
