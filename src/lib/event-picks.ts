import "server-only";
import { db } from "@/lib/db";

/**
 * Los pases del listado oficial que ha marcado cada uno.
 *
 * La clave es `uid|inicio` porque casi todos los eventos se repiten: se marca
 * el pase del jueves, no el evento entero.
 *
 * Compartido, como las selecciones de DJs: saber que a dos más les apetece lo
 * mismo es media agenda hecha.
 */
export type EventPicksByPass = Record<string, string[]>;

/** La clave con la que viaja un pase marcado. */
export function passKey(eventUid: string, startTime: string): string {
  return `${eventUid}|${startTime}`;
}

export async function loadEventPicks(): Promise<EventPicksByPass> {
  const rows = await db.eventPick.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byPass: EventPicksByPass = {};
  for (const row of rows) {
    (byPass[passKey(row.eventUid, row.startTime)] ??= []).push(row.user.name);
  }
  return byPass;
}
