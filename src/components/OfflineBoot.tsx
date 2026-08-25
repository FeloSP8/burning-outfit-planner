"use client";

import { useEffect } from "react";

/**
 * Registra el service worker en cuanto se carga cualquier pantalla.
 *
 * Va en el layout y no en `/playa` a propósito: así el JS, las tipografías y
 * el mapa se van cacheando mientras se usa la app con cobertura, y el día de
 * la descarga ya está casi todo dentro.
 */
export function OfflineBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Tras `load` para no competir por ancho de banda con la propia página.
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
