import type { PlayaEvent } from "@/lib/brc-api";

/**
 * Lo justo para listar los eventos de un campamento en el mapa.
 *
 * El evento entero trae descripción, dirección y coordenadas, y en el mapa no
 * se usa nada de eso: se enseña qué hacen y cuándo. Con miles de eventos, la
 * diferencia entre mandar esto y mandarlos enteros son cientos de kB.
 *
 * Vive fuera de `brc-api.ts` porque ese módulo es `server-only` —habla con la
 * API de Burning Man— y esto lo necesitan también las dos pantallas que pintan
 * el mapa desde el snapshot, que son cliente. El tipo `PlayaEvent` sí puede
 * venir de allí: un `import type` desaparece al compilar.
 */
export interface CampEvent {
  campUid: string;
  title: string;
  type: string;
  allDay: boolean;
  occurrences: { start: string; end: string }[];
}

export function toCampEvents(events: PlayaEvent[]): CampEvent[] {
  const out: CampEvent[] = [];
  for (const { campUid, title, type, allDay, occurrences } of events) {
    if (!campUid) continue;
    out.push({ campUid, title, type, allDay, occurrences });
  }
  return out;
}
