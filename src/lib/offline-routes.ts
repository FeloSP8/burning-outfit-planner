import "server-only";
import { headers } from "next/headers";

/**
 * Las secciones que siguen funcionando sin cobertura.
 *
 * Cada una tiene un "armazón": la misma página, en la misma URL, pero devuelta
 * sin datos ninguno. Se guarda en la caché con el resto de la app, el service
 * worker la sirve cuando una navegación se queda sin red y, ya en el móvil, la
 * propia pantalla se rellena con el snapshot de IndexedDB.
 *
 * Por qué un armazón vacío y no la página entera cacheada: los eventos
 * oficiales son miles y ya viajan en el snapshot. Guardar además el HTML con
 * todo dentro sería llevarse lo mismo dos veces, y encima congelado.
 *
 * Y por qué una cabecera y no `?shell=1`: la copia se sirve como respuesta a
 * `/events`, así que tiene que *ser* `/events`. Servir el HTML de otra URL deja
 * al router de Next con una página que no es la que pidió, y la vacía.
 */
export const SHELL_HEADER = "x-playa-shell";

/** ¿La petición es la que hace el service worker para guardar el armazón? */
export async function isShellRequest(): Promise<boolean> {
  return (await headers()).get(SHELL_HEADER) === "1";
}
