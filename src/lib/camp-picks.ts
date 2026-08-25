import "server-only";
import { db } from "@/lib/db";

/**
 * Los campamentos que ha marcado cada uno.
 *
 * `uid del campamento → nombres`. Compartido, igual que los sets y los pases:
 * en el mapa se ven los de todo el grupo, no solo los tuyos.
 */
export type CampPicksByUid = Record<string, string[]>;

export async function loadCampPicks(): Promise<CampPicksByUid> {
  const rows = await db.campPick.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byCamp: CampPicksByUid = {};
  for (const row of rows) {
    (byCamp[row.campUid] ??= []).push(row.user.name);
  }
  return byCamp;
}
