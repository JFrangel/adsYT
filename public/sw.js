// Service Worker de Monetag (verificación de dominio + push).
//
// IMPORTANTE: importScripts() es SÍNCRONO y se ejecuta antes que cualquier
// listener. Si el CDN de Monetag no responde —cosa que pasa: sus dominios
// rotan y los bloqueadores los filtran— la excepción aborta el script entero,
// el Service Worker no llega a instalarse y, si ya había uno activo de una
// visita anterior, puede quedarse interceptando navegaciones y hacer que el
// sitio parezca caído aunque el servidor esté perfecto.
//
// Por eso el import va dentro de try/catch: si Monetag no carga, el sitio
// sigue funcionando y solo se pierde la parte publicitaria.

self.options = {
  domain: '3nbf4.com',
  zoneId: 10611671,
};

self.lary = '';

try {
  importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');
} catch (error) {
  console.warn('No se pudo cargar el Service Worker de Monetag:', error);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Sin listener 'fetch' propio: uno vacío no aporta nada y mete al Service
// Worker en el camino de cada navegación sin motivo. El SW de Monetag
// registra el suyo si carga bien.
