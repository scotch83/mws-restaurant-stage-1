'use strict';

const cacheVersion = 'v2'
const staticCacheName = `resto-rev-cache-${cacheVersion}`;
const imagesCache = `resto-rev-cache-images-${cacheVersion}`;
const toBeCached = [
  '/', '/restaurant.html',
  //'/css/styles.css',
  '/js/main.js',
  '/js/restaurant_info.js',
  //'/js/dbhelper.js',
  '/leaflet/images/marker-icon.png', '/leaflet/images/marker-icon-2x.png',
  '/leaflet/images/layers-2x.png', '/leaflet/images/layers.png',
  '/leaflet/images/marker-shadow.png', '/leaflet/leaflet-src.esm.js',
  '/leaflet/leaflet-src.esm.js.map', '/leaflet/leaflet-src.js',
  '/leaflet/leaflet-src.js.map', '/leaflet/leaflet.css', '/leaflet/leaflet.js',
  '/leaflet/leaflet.js.map', '/data/restaurants.json'
];

self.addEventListener('fetch', (event) => {
  //add
  const requestUrl = new URL(event.request.url);
  console.log(requestUrl);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'))
      return;
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(caches.open(imagesCache).then(cache => {
        return cache.match(event.request)
            .then(res => {
              return res || fetch(event.request).then(res => {
                cache.put(event.request, res.clone())
                return res;
              });
            })
            .catch(err => console.log(err));
      }));
      return;
    }
  }
  event.respondWith(
      caches.match(event.request).then(res => res || fetch(event.request)));
});

self.addEventListener('install', function(e) {
  e.waitUntil(
      caches.open(staticCacheName).then(cache => cache.addAll(toBeCached)));
});

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', function (event) {

  event.waitUntil(caches.keys()
    .then(cachesKeys =>
      Promise.all(cachesKeys.filter((name) => name.startsWith('resto-') && !name.endsWith(cacheVersion))
        .map(nameToDelete => caches.delete(nameToDelete)))
  ));

});
