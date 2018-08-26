'use strict';
const cacheVersion = 'v5';
const staticCacheName = `resto-rev-cache-${cacheVersion}`;
const imagesCache = `resto-rev-cache-images-${cacheVersion}`;
const imageRegex = new RegExp(/(.*)(\/)(.*)\.(jpg|png|gif)$/);
const toBeCached = [
  '/', '/restaurant.html',
  'css/styles.css',
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js',
  'js/service-worker-loader.js',
  'leaflet/leaflet.css',
  'https://use.fontawesome.com/releases/v5.2.0/css/all.css',
  'leaflet/leaflet.js'
];
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if(requestUrl.origin === location.origin)
  {
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(serveFromCache('/restaurant.html'));
      return;
    }
    if (requestUrl.pathname.match(imageRegex)) {
      event.respondWith(serveImg(event.request));
      return;
    }
    event.respondWith(serveFromCache(requestUrl.pathname));
    return;
  }
  event.respondWith(handleRemoteFetching(event.request));
});
function handleRemoteFetching(request){
  return caches.match(request).then(res => {
    return res || fetch(request);
  });
}
function serveFromCache(key) {
  return caches.open(staticCacheName).then(cache => {
    return cache.match(key).then(res => res || fetch(key).then(fetched => {
      cache.put(key, fetched.clone());
      return fetched;
    }));
  });
}
function serveImg(request) {
  let key = request.url.replace(/(.*)(\/)(.*)\.(jpg|png|gif)$/, '$3');
  return caches.open(imagesCache).then(cache => {
    return cache.match(key)
      .then(res => {
        return res ||
          fetch(request).then(res => {
            cache.put(key, res.clone());
            return res;
          })
            .catch((err) => console.log(err));
      })
      .catch(err => console.log(err));
  });
}
self.addEventListener('install', function(e) {
  self.importScripts('./js/libs/idb-promised.js', './js/idb-manager.js');
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
