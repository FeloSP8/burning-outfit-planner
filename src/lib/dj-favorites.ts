import "server-only";
import { db } from "@/lib/db";
import { ARTIST_INDEX } from "@/lib/dj-agenda";

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
