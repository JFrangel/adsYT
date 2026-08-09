// Monetag Service Worker
// Este archivo permite que Monetag verifique la propiedad del dominio

self.options = {
  "domain": "3nbf4.com",
  "zoneId": 10611671
};

self.lary = "";

// Importar el service worker de Monetag
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('Monetag Service Worker installed');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('Monetag Service Worker activated');
  event.waitUntil(clients.claim());
});

// Evento de fetch para interceptar requests
self.addEventListener('fetch', (event) => {
  // El SW de Monetag maneja las requests automáticamente
});
