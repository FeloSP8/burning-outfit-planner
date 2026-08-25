/**
 * Service worker del modo playa.
 *
 * Escrito a mano y a propósito: `next-pwa` está abandonado y las alternativas
 * son una dependencia más que tiene que ir siguiéndole el ritmo a Next. Aquí
 * hacen falta tres cosas y caben en un archivo.
 *
 *   1. Cachear lo estático según se navega (JS, CSS, tipografías, el mapa).
 *   2. Guardar bajo demanda lo que la pantalla `/playa` necesita sí o sí.
 *   3. Cuando no hay red, servir `/playa` ante cualquier navegación, en vez
 *      del dinosaurio del navegador.
 *
 * Lo que no hace: cachear respuestas de la API ni imágenes. Los datos van en
 * IndexedDB (ver `src/lib/offline-store.ts`) y las fotos no se descargan.
 */

const CACHE = "playa-v1";
const OFFLINE_PAGE = "/playa";

/** Lo imprescindible para que `/playa` arranque sin red. */
const ESSENTIALS = [
  OFFLINE_PAGE,
  "/manifest.webmanifest",
  "/fonts/LunokRegular.woff",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brc/2026/trash_fence.geojson",
  "/brc/2026/street_lines.geojson",
  "/brc/2026/plazas.geojson",
  "/brc/2026/toilets.geojson",
  "/brc/2026/cpns.geojson",
  "/brc/2026/dmz.geojson",
  "/brc/2026/gate_road.geojson",
];

/** Rutas cuyo contenido no cambia sin cambiar de URL: caché primero. */
function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brc/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg")
  );
}

self.addEventListener("install", (event) => {
  // Sin esperar: la versión nueva del worker manda desde ya.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

/**
 * El botón de descarga avisa por aquí para guardar lo imprescindible.
 *
 * Junto al mensaje llegan los .js y .css que la página tiene cargados: sus
 * nombres cambian en cada despliegue, así que es la propia página la que dice
 * cuáles son. Sin ellos habría datos guardados pero nada con que pintarlos: en
 * la primera visita el worker todavía no controla la página, así que esas
 * peticiones no pasan por aquí y no se cachean solas.
 */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ESSENTIALS") return;
  const port = event.ports?.[0];
  const assets = Array.isArray(event.data.assets) ? event.data.assets : [];

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = [...new Set([...ESSENTIALS, ...assets])];
      // Uno a uno y no con addAll: si falla un archivo, que no se caiga todo.
      const results = await Promise.allSettled(urls.map((url) => cache.add(url)));
      const failed = results.filter((r) => r.status === "rejected").length;
      port?.postMessage({ type: "ESSENTIALS_CACHED", failed, total: urls.length });
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // La pantalla offline se sirve siempre de la caché. Si fuera red primero,
  // con media raya de cobertura la petición saldría, la sesión podría estar
  // caducada y acabarías en el login sin poder entrar.
  if (request.mode === "navigate" && url.pathname === OFFLINE_PAGE) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(OFFLINE_PAGE);
        if (hit) {
          // Se refresca por detrás para la próxima vez.
          event.waitUntil(
            fetch(request)
              .then((response) => response.ok && cache.put(OFFLINE_PAGE, response.clone()))
              .catch(() => {})
          );
          return hit;
        }
        return fetch(request);
      })()
    );
    return;
  }

  // El resto de navegaciones: red primero (con la app viva se ve lo de
  // verdad), y si no hay red, la versión de bolsillo.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request)) ??
            (await cache.match(OFFLINE_PAGE)) ??
            new Response("Sin conexión y sin copia guardada.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  if (!isStatic(url)) return; // API, RSC, imágenes: directo a la red

  // Estático: se sirve de caché y se refresca por detrás.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      const response = hit ?? (await network);
      if (response) return response;
      return new Response("Recurso no disponible sin conexión.", { status: 504 });
    })()
  );
});
