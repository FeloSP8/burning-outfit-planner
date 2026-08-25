import "server-only";
import sharp from "sharp";

/**
 * Imágenes para meter dentro de un PDF.
 *
 * `@react-pdf/renderer` sabe descargar una URL él solo, pero metería el JPEG
 * original de la cámara —dos o tres megas por foto— y con veinte outfits el
 * dossier no se podría ni mandar. Aquí se bajan una vez, se encogen y se
 * incrustan como data URI.
 *
 * Solo JPEG: pdfkit, que es quien acaba escribiendo el PDF, entiende JPEG y
 * PNG y nada más. WebP o AVIF reventarían el render.
 */

/** Nunca esperar a una imagen más de esto: el dossier tiene que salir igual. */
const FETCH_TIMEOUT_MS = 8_000;

/** Descargas a la vez. Ni de una en una (lento) ni todas (tumba la función). */
const CONCURRENCY = 6;

/** Tope de imágenes distintas por dossier, por si el inventario se dispara. */
const MAX_IMAGES = 80;

async function fetchOne(url: string, width: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());

    const output = await sharp(input)
      // `rotate()` sin argumentos aplica la orientación del EXIF: sin esto las
      // fotos hechas en vertical con el móvil salen tumbadas.
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch {
    // Una foto que no baja no puede cargarse el dossier entero: se deja sin
    // ella y el PDF sale igual.
    return null;
  }
}

/**
 * Baja y encoge un lote de imágenes. Devuelve `url → data URI`, sin las que
 * hayan fallado.
 *
 * Las URLs repetidas se piden una sola vez: la misma prenda aparece en varios
 * outfits y no tiene sentido bajarla cinco veces ni incrustarla cinco veces.
 */
export async function loadPdfImages(
  requests: { url: string; width: number }[]
): Promise<Record<string, string>> {
  const unique = new Map<string, number>();
  for (const { url, width } of requests) {
    if (!url) continue;
    // Si la misma imagen se pide en dos tamaños, manda el grande.
    unique.set(url, Math.max(unique.get(url) ?? 0, width));
  }

  const pending = [...unique.entries()].slice(0, MAX_IMAGES);
  const images: Record<string, string> = {};

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(([url, width]) => fetchOne(url, width)));
    batch.forEach(([url], index) => {
      const dataUri = results[index];
      if (dataUri) images[url] = dataUri;
    });
  }

  return images;
}
