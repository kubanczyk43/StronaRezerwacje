self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pwa-cache-v1').then(cache => {
     return cache.addAll([
        'index.html',
        'app.js',
        'style.css',
        'manifest.json',
        'dentistry_192dp_20B2AA_FILL0_wght400_GRAD0_opsz48.png',
        'dentistry_512dp_20B2AA_FILL0_wght400_GRAD0_opsz48.png',
        'chevron_left_256dp_FFFFFF_FILL0_wght400_GRAD0_opsz48.png',
        'chevron_right_256dp_FFFFFF_FILL0_wght400_GRAD0_opsz48.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});