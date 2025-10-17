// sw.js - Coloque na RAIZ (mesmo nível do index.html)
const CACHE_NAME = 'molde-app-v1';
const urlsToCache = [
  // Páginas HTML
  '/',
  '/index.html',
  '/public/docs/anotacoes.html',
  '/public/docs/inicio.html',
  '/public/docs/promocoes.html',
  '/public/docs/relatorio.html',

  // CSS
  '/public/CSS/styles.css',
  '/public/CSS/anotacoes.css',
  '/public/CSS/inicio.css',
  '/public/CSS/promocoes.css',
  '/public/CSS/relatorio.css',

  // JavaScript
  '/public/JS/script.js',
  '/public/JS/anotacoes.js',
  '/public/JS/inicio.js',
  '/public/JS/promocoes.js',
  '/public/JS/relatorio.js',

  // Imagens e recursos
  '/public/docs/imagens/logo.png',
  '/imagens/',
  '/docs/',

  // Manifest
  '/manifest.json'
];

// INSTALL - Cache inicial
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching arquivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE - Limpar caches antigos
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativado');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH - Estratégia Cache First
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se encontrou
        if (response) {
          return response;
        }

        // Se não está no cache, busca na rede
        return fetch(event.request)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para adicionar ao cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            // Fallback para páginas offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Você pode adicionar mais fallbacks aqui
            console.log('Fetch failed; returning offline page instead.', error);
          });
      })
  );
});