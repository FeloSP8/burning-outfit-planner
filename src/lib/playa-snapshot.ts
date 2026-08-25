import "server-only";
import { db } from "@/lib/db";
import { loadPicks } from "@/lib/dj-picks";
import { loadFansByArtist } from "@/lib/dj-favorites";
import { loadEventPicks } from "@/lib/event-picks";
import { getWeatherBundle } from "@/lib/weather";
import { getCamps, getEvents, toPins } from "@/lib/brc-api";
import { SNAPSHOT_VERSION, type PlayaSnapshot } from "@/types/snapshot";
import type { ChecklistItemData, ChecklistOrigin, ChecklistType, Day, Garment } from "@/types";

/**
 * Reúne todo lo que se lleva uno al playa: la agenda marcada por el grupo, los
 * outfits del usuario, el inventario, la checklist y el tiempo congelado.
 *
 * Lo usan dos sitios: `/api/snapshot`, que lo guarda en el móvil para la
 * pantalla offline, y `/api/playa-pdf`, que lo imprime. Una sola consulta para
 * los dos, así no se van separando con el tiempo.
 */
export async function buildSnapshot(userId: string, userName: string): Promise<PlayaSnapshot> {
  const [picks, fans, eventPicks, rawDays, rawGarments, rawChecklist, weather, campsResult, eventsResult] =
    await Promise.all([
    loadPicks(),
    loadFansByArtist(),
    loadEventPicks(),
    db.day.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      include: {
        shifts: {
          orderBy: { type: "asc" },
          include: { outfit: { include: { items: { include: { garment: true } }, tryOn: true } } },
        },
      },
    }),
    db.garment.findMany({ where: { userId }, orderBy: [{ slot: "asc" }, { createdAt: "asc" }] }),
    db.checklistItem.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { name: true } },
        checks: { include: { user: { select: { name: true } } } },
      },
    }),
    // El tiempo son siete llamadas a APIs externas: que una se caiga no puede
    // dejarte sin agenda ni sin outfits.
    getWeatherBundle().catch(() => null),
    // Si la API de Burning Man falla, uno se queda sin el listado oficial pero
    // con todo lo demás.
    getCamps().catch(() => null),
    getEvents().catch(() => null),
  ]);

  const days = rawDays.map((d) => ({
    ...d,
    date: d.date.toISOString(),
    shifts: d.shifts.map((s) => ({
      ...s,
      outfit: s.outfit
        ? {
            ...s.outfit,
            updatedAt: s.outfit.updatedAt.toISOString(),
            tryOn: s.outfit.tryOn
              ? { ...s.outfit.tryOn, createdAt: s.outfit.tryOn.createdAt.toISOString() }
              : null,
            items: s.outfit.items.map((it) => ({
              ...it,
              garment: { ...it.garment, createdAt: it.garment.createdAt.toISOString() },
            })),
          }
        : null,
    })),
  })) as Day[];

  const garments = rawGarments.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
  })) as Garment[];

  const checklist: ChecklistItemData[] = rawChecklist.map((it) => ({
    id: it.id,
    text: it.text,
    type: it.type as ChecklistType,
    origin: (it.origin as ChecklistOrigin) ?? null,
    tags: it.tags ? it.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    done: it.done,
    assigneeName: it.assigneeName,
    createdByName: it.createdBy.name,
    checkedBy: it.checks.map((c) => c.user.name),
    iChecked: it.checks.some((c) => c.userId === userId),
  }));

  return {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    userName,
    picks,
    fans,
    days,
    garments,
    checklist,
    weather: weather ? { models: weather.models, ensemble: weather.ensemble } : null,
    camps: campsResult ? toPins(campsResult.camps) : [],
    events: eventsResult?.events ?? [],
    eventPicks,
  };
}
