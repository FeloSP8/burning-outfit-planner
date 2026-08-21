import "server-only";
import { db } from "@/lib/db";
import { SET_INDEX } from "@/lib/dj-agenda";

/**
 * `setId → nombres de quienes lo han elegido`, en el orden en que lo hicieron.
 *
 * Los ids que ya no están en el catálogo se ignoran: si un cartel se corrige y
 * un set cambia de id, la fila se queda en la base de datos sin romper nada.
 */
export async function loadPicks(): Promise<Record<string, string[]>> {
  const picks = await db.djPick.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const bySet: Record<string, string[]> = {};
  for (const pick of picks) {
    if (!SET_INDEX[pick.setId]) continue;
    (bySet[pick.setId] ??= []).push(pick.user.name);
  }
  return bySet;
}
