// Firebase Cloud Messaging — push em segundo plano (navegador e TWA).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyBW8mMJf7JiksMLGW8bO7ARtBZAX4NWr-w',
  authDomain: 'aquaria-2bc50.firebaseapp.com',
  projectId: 'aquaria-2bc50',
  storageBucket: 'aquaria-2bc50.firebasestorage.app',
  messagingSenderId: '745535854634',
  appId: '1:745535854634:web:b4f36bf1fc9e6d1c0a0b53',
});
const fcm = firebase.messaging();
fcm.onBackgroundMessage((payload) => {
  // Payloads com bloco `notification` já são exibidos automaticamente pelo
  // SDK do FCM (e delegados ao app no TWA). Exibir de novo aqui causaria a
  // notificação duplicada — só notificamos manualmente payload data-only.
  if (payload.notification) return;
  const n = payload.data || {};
  self.registration.showNotification(n.title || 'AquarIA', {
    body: n.body || '',
    icon: '/icon-192.png',
    data: { url: n.click_action || n.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

const CACHE_NAME = 'aquaria-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

// Instalação: cache básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {})
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: tenta rede primeiro, depois cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
