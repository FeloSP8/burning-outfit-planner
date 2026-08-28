"use client";

import { SNAPSHOT_VERSION, type PlayaSnapshot } from "@/types/snapshot";

/**
 * El snapshot guardado en el móvil, en IndexedDB.
 *
 * IndexedDB y no localStorage porque esto son cientos de kB de JSON y
 * localStorage es síncrono: guardarlo ahí bloquearía el hilo de la interfaz.
 * A pelo y sin librería: son cuatro operaciones y así no hay una dependencia
 * más que mantener.
 *
 * OJO en iOS: la app añadida a la pantalla de inicio tiene su propia base,
 * separada de la de Safari. Hay que descargar desde dentro del icono.
 */

const DB_NAME = "burning-playa";
const DB_VERSION = 1;
const STORE = "snapshot";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function saveSnapshot(snapshot: PlayaSnapshot): Promise<void> {
  await tx("readwrite", (store) => store.put(snapshot, KEY));
}

/** Devuelve null si no hay nada guardado o si es de un formato anterior. */
export async function loadSnapshot(): Promise<PlayaSnapshot | null> {
  try {
    const snapshot = await tx<PlayaSnapshot | undefined>("readonly", (store) => store.get(KEY));
    if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) return null;
    return snapshot;
  } catch {
    // Modo privado, almacenamiento bloqueado, base corrupta: sin datos y ya.
    return null;
  }
}

export async function clearSnapshot(): Promise<void> {
  await tx("readwrite", (store) => store.delete(KEY));
}

/** Lo que ocupa todo lo guardado por el origen, en bytes. null si no se sabe. */
export async function storageUsed(): Promise<number | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage } = await navigator.storage.estimate();
  return usage ?? null;
}

/**
 * Le pide al service worker que guarde el armazón de la app: esta pantalla, el
 * mapa, las tipografías y todos los .js y .css que la página ha cargado.
 *
 * Los nombres de los chunks llevan un hash que cambia en cada despliegue, así
 * que no se pueden escribir a mano: se leen de lo que el navegador acaba de
 * pedir de verdad (`performance`), que es exactamente lo que hará falta.
 *
 * Devuelve cuántos archivos no se pudieron guardar, o null si el navegador no
 * tiene service worker (o tarda demasiado en contestar).
 */
export async function cacheAppShell(): Promise<number | null> {
  if (!("serviceWorker" in navigator)) return null;

  // Leaflet no lo carga nadie hasta que se abre un mapa: va en un `import()`
  // dinámico, así que su trozo no aparece en el HTML de ninguna página ni en lo
  // que el navegador ha pedido hasta ahora. Se fuerza aquí para que entre en la
  // lista: sin él, el plano de la ciudad sale en blanco justo cuando hace falta.
  await import("leaflet").catch(() => null);

  const assets = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => url.startsWith(location.origin) && url.includes("/_next/static/"));

  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return null;

  return new Promise<number | null>((resolve) => {
    const channel = new MessageChannel();
    // Si el worker no contesta, no se deja la interfaz colgada esperándole.
    const timer = setTimeout(() => resolve(null), 20_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data?.failed ?? null);
    };
    worker.postMessage({ type: "CACHE_ESSENTIALS", assets }, [channel.port2]);
  });
}

/**
 * Pregunta al service worker si la pantalla guardada se ha quedado vieja.
 *
 * La copia se sirve de caché, o sea que lo que se está viendo es siempre la
 * versión de la vez anterior. Esto lo detecta y deja la nueva ya guardada, así
 * que basta con recargar.
 */
export async function checkShellUpdate(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !navigator.onLine) return false;

  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return false;

  return new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 10_000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(event.data?.updated === true);
    };
    worker.postMessage({ type: "CHECK_SHELL" }, [channel.port2]);
  });
}
