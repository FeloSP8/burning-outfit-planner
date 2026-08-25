import "server-only";
import { db } from "@/lib/db";
import { ARTIST_INDEX } from "@/lib/dj-agenda";
import type { FansByArtist } from "@/types";

/**
 * Los artistas que le gustan a un usuario, para sacarlos arriba de la lista.
 *
 * Los que ya no están en el catálogo se ignoran: si un cartel se corrige y un
 * nombre cambia de grafía, la fila se queda en la base de datos sin romper nada.
 */
export async function loadFavoriteArtists(userId: string): Promise<string[]> {
  const rows = await db.favoriteArtist.findMany({
    where: { userId },
    select: { artist: true },
  });
  return rows.map((r) => r.artist).filter((a) => ARTIST_INDEX.has(a));
}

/**
 * `artista → nombres de quienes lo tienen marcado`, en el orden en que lo
 * marcaron.
 *
 * Es una sola consulta para todo el grupo, igual que `loadPicks`: de aquí sale
 * tanto el contador de la lista como los favoritos del usuario actual, que son
 * las entradas donde aparece su nombre.
 */
export async function loadFansByArtist(): Promise<FansByArtist> {
  const rows = await db.favoriteArtist.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byArtist: FansByArtist = {};
  for (const row of rows) {
    if (!ARTIST_INDEX.has(row.artist)) continue;
    (byArtist[row.artist] ??= []).push(row.user.name);
  }
  return byArtist;
}
