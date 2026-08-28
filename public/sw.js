/**
 * Service worker del modo playa.
 *
 * Escrito a mano y a propósito: `next-pwa` está abandonado y las alternativas
 * son una dependencia más que tiene que ir siguiéndole el ritmo a Next. Aquí
 * hacen falta tres cosas y caben en un archivo.
 *
 *   1. Cachear lo estático según se navega (JS, CSS, tipografías, el mapa).
 *   2. Guardar bajo demanda lo que la pantalla `/playa` necesita sí o sí, y el
 *      armazón de las secciones que siguen funcionando sin cobertura.
 *   3. Cuando no hay red, servir el armazón de la sección que se pedía —y
 *      `/playa` para todo lo demás— en vez del dinosaurio del navegador.
 *
 * Lo que no hace: cachear respuestas de la API ni imágenes. Los datos van en
 * IndexedDB (ver `src/lib/offline-store.ts`) y las fotos no se descargan.
 */

const CACHE = "playa-v1";
const OFFLINE_PAGE = "/playa";

/**
 * Secciones que siguen funcionando sin cobertura.
 *
 * De cada una se guarda un "armazón": la página sin datos ninguno, que ya en
 * el móvil se rellena leyendo el snapshot de IndexedDB. Guardar el armazón y
 * no la página entera evita llevarse los miles de eventos dos veces —ya van en
 * el snapshot— y encima congelados.
 *
 * Se pide con la cabecera `x-playa-shell` y se guarda **con su URL de verdad**,
 * sin ningún `?shell=1`. Es importante: la copia se sirve como respuesta a
 * `/events`, así que tiene que ser `/events`. Servida desde otra URL, el router
 * de Next se encuentra una página que no es la que pidió y la vacía.
 *
 * OJO: esta lista está también en `src/lib/offline-routes.ts`. Este archivo lo
 * carga el navegador por su cuenta y no puede importar del proyecto.
 */
const SHELL_ROUTES = ["/agenda", "/events", "/map"];
const SHELL_HEADER = "x-playa-shell";

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
  if (event.data?.type === "CHECK_SHELL") {
    event.waitUntil(checkShell(event.ports?.[0]));
    return;
  }
  if (event.data?.type !== "CACHE_ESSENTIALS") return;
  const port = event.ports?.[0];
  const assets = Array.isArray(event.data.assets) ? event.data.assets : [];

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = [...new Set([...ESSENTIALS, ...assets])];
      // Uno a uno y no con addAll: si falla un archivo, que no se caiga todo.
      const results = await Promise.allSettled(urls.map((url) => cache.add(url)));
      let failed = results.filter((r) => r.status === "rejected").length;

      failed += await cacheShells(cache);

      // Los armazones traen su propio JS y su propio CSS, con nombres que
      // cambian en cada despliegue. Guardar el HTML no guarda nada de eso, así
      // que hay que leerlo y pedir lo que declara: sin ello quedaría una página
      // en blanco, que es peor que no tenerla.
      failed += await cacheSubresources(cache, SHELL_ROUTES);

      port?.postMessage({ type: "ESSENTIALS_CACHED", failed, total: urls.length });
    })()
  );
});

/**
 * Guarda el armazón de cada sección bajo su propia URL.
 *
 * No vale `cache.add`: hay que pedirla con la cabecera para que el servidor la
 * devuelva vacía, y luego guardarla con la URL pelada, que es la que el
 * navegador pedirá cuando no haya red.
 */
async function cacheShells(cache) {
  let failed = 0;

  for (const route of SHELL_ROUTES) {
    try {
      const response = await fetch(route, {
        headers: { [SHELL_HEADER]: "1" },
        credentials: "same-origin",
        cache: "no-store",
      });
      // `redirected` es la sesión caducada: el proxy manda a /login. Guardar
      // eso bajo /agenda dejaría la pantalla de login puesta ahí para siempre,
      // y sin red no habría manera de arreglarlo.
      if (!response.ok || response.redirected) throw new Error(String(response.status));
      await cache.put(new Request(route), response);
    } catch {
      failed += 1;
    }
  }

  return failed;
}

/** Los .js y .css que pide un HTML ya guardado. Devuelve cuántos han fallado. */
async function cacheSubresources(cache, pages) {
  const wanted = new Set();

  for (const page of pages) {
    const hit = await cache.match(page, { ignoreVary: true });
    if (!hit) continue;
    const html = await hit.clone().text();
    for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) {
      wanted.add(match[1]);
    }
  }

  // Lo que ya esté guardado no se vuelve a pedir: entre las tres secciones
  // comparten casi todos los chunks.
  const missing = [];
  for (const url of wanted) {
    if (!(await cache.match(url))) missing.push(url);
  }

  const results = await Promise.allSettled(missing.map((url) => cache.add(url)));
  return results.filter((r) => r.status === "rejected").length;
}



/**
 * ¿La pantalla guardada sigue siendo la que sirve el servidor?
 *
 * Servirla de caché tiene un precio: lo que se ve es siempre la copia de la
 * vez anterior. Sin esta comprobación, cada cambio que se despliega tardaría
 * dos aperturas en aparecer y desde el móvil no habría manera de saberlo.
 *
 * La pide la página al arrancar, y no se hace sola en segundo plano, porque
 * así la respuesta llega cuando ya hay alguien escuchando.
 */
async function checkShell(port) {
  const answer = (updated) => port?.postMessage({ type: "SHELL_CHECKED", updated });
  try {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(OFFLINE_PAGE);
    if (!cached) return answer(false);

    const fresh = await fetch(OFFLINE_PAGE, { cache: "no-store" });
    if (!fresh.ok) return answer(false);

    const [before, after] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
    // Se guarda antes de avisar: al recargar tiene que salir ya la nueva.
    await cache.put(OFFLINE_PAGE, fresh);
    answer(before !== after);
  } catch {
    // Sin red no hay novedades que dar: se sigue con la copia guardada.
    answer(false);
  }
}

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
        // Se sirve tal cual y no se refresca por detrás: de eso se encarga la
        // propia pantalla con CHECK_SHELL, que sí sabe avisar al usuario.
        if (hit) return hit;
        return fetch(request);
      })()
    );
    return;
  }

  // El resto de navegaciones: red primero (con la app viva se ve lo de
  // verdad), y si no hay red, el armazón de esa misma sección —para que se
  // siga en donde uno estaba— y solo si no lo hay, la versión de bolsillo.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          // `ignoreVary`: la respuesta guardada trae los `Vary` de Next y la
          // navegación de verdad no lleva esas cabeceras, así que sin esto no
          // encontraría su propia copia.
          return (
            (await cache.match(url.pathname, { ignoreVary: true })) ??
            (await cache.match(request, { ignoreVary: true })) ??
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

  // Navegar con el menú no pide el documento: pide el "flight" de Next
  // (`?_rsc=…`). Sin red esa petición se cae y el router se queda a medias, con
  // la página anterior puesta. Devolverle el armazón —que es HTML y no flight—
  // le hace recargar entera, y entonces ya entra el caso de arriba.
  const wantsFlight = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (wantsFlight && SHELL_ROUTES.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(url.pathname, { ignoreVary: true })) ??
            new Response("", { status: 503 })
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
