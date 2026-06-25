import "server-only";
import { randomUUID } from "crypto";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin";

/**
 * Almacenamiento de imágenes en Supabase Storage.
 * Las imágenes se guardan bajo `{userId}/archivo` para aislarlas por usuario.
 * Devuelven la URL pública de Supabase, que se guarda tal cual en la BD.
 */

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Sube un buffer (subida manual de fotos). Devuelve la URL pública. */
export async function saveBuffer(
  userId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await getSupabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Error subiendo imagen: ${error.message}`);
  return publicUrl(path);
}

/** Descarga una imagen remota (ej. resultado de IA) y la guarda en Storage. */
export async function saveRemoteImage(
  userId: string,
  url: string,
  prefix = "img"
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen remota: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = url.toLowerCase().includes(".png") ? "png" : "jpg";
  const path = `${userId}/${prefix}-${randomUUID()}.${ext}`;
  const { error } = await getSupabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .upload(path, buf, { contentType: CONTENT_TYPES[ext], upsert: false });
  if (error) throw new Error(`Error guardando imagen remota: ${error.message}`);
  return publicUrl(path);
}

/** Borra una imagen dada su URL pública de Supabase. No falla si no existe. */
export async function deleteFile(publicImageUrl: string) {
  const path = pathFromPublicUrl(publicImageUrl);
  if (!path) return;
  await getSupabaseAdmin().storage.from(STORAGE_BUCKET).remove([path]).catch(() => null);
}

/** Construye la URL pública de un objeto del bucket. */
function publicUrl(path: string): string {
  const { data } = getSupabaseAdmin().storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Extrae el path interno (`userId/archivo`) desde una URL pública de Supabase. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
