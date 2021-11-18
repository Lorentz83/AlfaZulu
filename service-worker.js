'use strict';

const cachePrefix = 'AlfaZulu-';
const cacheName = cachePrefix + 'v1';

// The browser doesn't know that index.html is the default directory
// file. We need to cache "./" here
const contentToCache = ["./", "script.js", "style.css", "ico-32.png"];

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installing...');
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching all: ', contentToCache);
        await cache.addAll(contentToCache);
    })());
});


self.addEventListener('activate', event => {
    // Delete older caches.
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if ( key.startsWith(cachePrefix) && key !== cacheName ) {
                    console.log('[Service Worker] deleting cache: ', key);
                    return caches.delete(key);
                }
            })
        )).then( () => console.log('[Service Worker] Activated') )
    );
});


self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const cached = caches.match(e.request);
        const response = fetch(e.request).catch(() => false);
        
        const timeout = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(false);
            }, 1000);
        });

        if ( await Promise.race([response, timeout]) === false ) {
            const r = await cached;
            if ( r ) { // Return the cache only if it exists.
                console.log(`[Service Worker] network unavailable, using cache for: ${e.request.url}`);
                return r;
            } else {
                console.log(`[Service Worker] network unavailable, but there is no cache for ${e.request.url}`);
           }
        }

        const r = await response;
        if ( r.ok ) { // Cache only if we actually got something good from the network.
            const cache = await caches.open(cacheName);
            console.log(`[Service Worker] Caching last version of: ${e.request.url}`);
            cache.put(e.request, r.clone());
        }
        return r;
    })());
});
