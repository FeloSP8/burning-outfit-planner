import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave `service_role`.
 * SOLO para uso en servidor (Route Handlers, libs server-side).
 * Salta las políticas RLS — por eso nunca debe llegar al navegador.
 *
 * Lo usamos para subir/borrar imágenes en Storage; el aislamiento por
 * usuario lo garantizan las API routes (getCurrentUser) y las rutas
 * con prefijo `{userId}/` dentro del bucket.
 *
 * Se instancia de forma perezosa (no a nivel de módulo) para no fallar
 * durante el build cuando aún no hay variables de entorno cargadas.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para Supabase Storage."
    );

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/** Nombre del bucket de imágenes en Supabase Storage. */
export const STORAGE_BUCKET = "outfit-images";
