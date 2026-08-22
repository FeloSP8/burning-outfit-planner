/**
 * Aritmética de la agenda: horas, ventanas de cada fiesta y solapes.
 *
 * Todo se calcula en hora local del playa. Los carteles no llevan zona horaria
 * y no hay nada que convertir: la agenda solo se usa allí.
 *
 * Convención de la noche: un set de las 02:00 dentro de una fiesta que empieza
 * a las 21:00 es de madrugada, así que cae en el día siguiente aunque el cartel
 * lo pinte bajo "miércoles". Por eso las ventanas se calculan en minutos
 * absolutos desde la medianoche de la fecha de la fiesta y pueden pasar de 1440.
 */

import { EVENT_DAYS, PARTIES, VENUES, type DjSet, type EventDay, type Party, type Venue } from "@/lib/dj-lineups";

const MINUTES_PER_DAY = 24 * 60;

/**
 * Duración que se supone a una fiesta cuyo cartel no da hora de cierre (los dos
 * escenarios de Playground). Solo se usa para avisar de posibles solapes; nunca
 * se enseña como si fuera una hora real.
 */
const ASSUMED_PARTY_MINUTES = 4 * 60;

export const VENUE_BY_ID: Record<string, Venue> = Object.fromEntries(VENUES.map((v) => [v.id, v]));
export const PARTY_BY_ID: Record<string, Party> = Object.fromEntries(PARTIES.map((p) => [p.id, p]));

export interface SetRef {
  set: DjSet;
  party: Party;
  venue: Venue;
}

/** Índice plano `setId → {set, fiesta, escenario}`. */
export const SET_INDEX: Record<string, SetRef> = Object.fromEntries(
  PARTIES.flatMap((party) =>
    party.sets.map((set): [string, SetRef] => [
      set.id,
      { set, party, venue: VENUE_BY_ID[party.venueId] },
    ])
  )
);

export const ALL_SETS: SetRef[] = Object.values(SET_INDEX);

/** Todos los artistas del catálogo, sin repetir y ordenados. */
export const ALL_ARTISTS: string[] = Array.from(
  new Set(ALL_SETS.flatMap((r) => r.set.artists))
).sort((a, b) => a.localeCompare(b, "es"));

/** "22:30" → 1350. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 1470 → "00:30". */
export function fromMinutes(total: number): string {
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  return `${String(h).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

/** Minutos absolutos de una hora dentro de una fiesta: si es anterior al arranque, es de madrugada. */
function withinParty(party: Party, hhmm: string): number {
  const start = toMinutes(party.start);
  const at = toMinutes(hhmm);
  return at < start ? at + MINUTES_PER_DAY : at;
}

export interface Window {
  /** Minutos desde la medianoche de `party.date`. Puede pasar de 1440. */
  start: number;
  end: number;
  /** `false` cuando el final es una suposición y no una hora del cartel. */
  exact: boolean;
}

/** Ventana de la fiesta entera. */
export function partyWindow(party: Party): Window {
  const start = toMinutes(party.start);
  if (!party.end) return { start, end: start + ASSUMED_PARTY_MINUTES, exact: false };
  return { start, end: withinParty(party, party.end), exact: true };
}

/**
 * Ventana de un set. Con hora en el cartel va de su inicio al del siguiente
 * (o al cierre de la fiesta). Sin hora —Playground solo publica el orden— se
 * queda con la ventana de la fiesta entera, marcada como inexacta.
 */
export function setWindow(party: Party, set: DjSet): Window {
  if (!set.start) return { ...partyWindow(party), exact: false };

  const start = withinParty(party, set.start);
  const laterStarts = party.sets
    .filter((s) => s.start)
    .map((s) => withinParty(party, s.start!))
    .filter((m) => m > start);
  const partyEnd = partyWindow(party);
  const end = laterStarts.length > 0 ? Math.min(...laterStarts) : partyEnd.end;
  return { start, end, exact: partyEnd.exact || laterStarts.length > 0 };
}

/** Minutos desde la época, para comparar sets de días distintos. */
function absolute(date: string, minutes: number): number {
  return Date.parse(`${date}T00:00:00Z`) / 60_000 + minutes;
}

export interface AgendaEntry extends SetRef {
  window: Window;
  /** Inicio absoluto, para ordenar la agenda de un día. */
  absStart: number;
  absEnd: number;
  /** El set empieza después de medianoche: pertenece a la madrugada del día siguiente. */
  afterMidnight: boolean;
}

export function toEntry(ref: SetRef): AgendaEntry {
  const window = setWindow(ref.party, ref.set);
  return {
    ...ref,
    window,
    absStart: absolute(ref.party.date, window.start),
    absEnd: absolute(ref.party.date, window.end),
    afterMidnight: window.start >= MINUTES_PER_DAY,
  };
}

/** Fiestas de un día, de la más temprana a la más tardía. */
export function partiesOn(date: string): Party[] {
  return PARTIES.filter((p) => p.date === date).sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start)
  );
}

/** Días del evento que ya tienen algún line-up publicado. */
export const DAYS_WITH_LINEUP: EventDay[] = EVENT_DAYS.filter(
  (d) => PARTIES.some((p) => p.date === d.date)
);

/**
 * Pares de sets elegidos que se pisan. Dos sets del mismo escenario y la misma
 * fiesta nunca cuentan: van uno detrás de otro por definición.
 */
export interface Clash {
  a: AgendaEntry;
  b: AgendaEntry;
  /** Las dos horas salen del cartel; si no, es un solape probable, no seguro. */
  certain: boolean;
}

export function findClashes(entries: AgendaEntry[]): Clash[] {
  const sorted = [...entries].sort((x, y) => x.absStart - y.absStart);
  const out: Clash[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.party.id === b.party.id) continue;
      if (b.absStart >= a.absEnd) break; // ordenados por inicio: ya no hay más solapes con `a`
      out.push({ a, b, certain: a.window.exact && b.window.exact && !!a.set.start && !!b.set.start });
    }
  }
  return out;
}

/** Todos los sets con los que un set concreto se pisa, dentro de una selección. */
export function clashesFor(setId: string, clashes: Clash[]): AgendaEntry[] {
  return clashes
    .filter((c) => c.a.set.id === setId || c.b.set.id === setId)
    .map((c) => (c.a.set.id === setId ? c.b : c.a));
}

/** Rango legible de una fiesta: "21:00 → 03:45" o "desde las 22:00". */
export function partyRange(party: Party): string {
  return party.end ? `${party.start} → ${party.end}` : `desde las ${party.start}`;
}

/** Nombre completo del escenario: "Playground · Arrival Stage". */
export function venueLabel(venue: Venue): string {
  return venue.stage ? `${venue.name} · ${venue.stage}` : venue.name;
}

/** ¿El texto buscado aparece en el set, la fiesta o el escenario? */
export function matchesQuery(ref: SetRef, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [
    ref.set.label,
    ...ref.set.artists,
    ref.party.name,
    venueLabel(ref.venue),
  ].map(normalize);
  return haystack.some((h) => h.includes(q));
}

/** Sin acentos y en minúsculas: buscar "polke" tiene que encontrar a Natascha Polké. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const KIND_LABEL: Record<Party["kind"], { label: string; emoji: string }> = {
  night:   { label: "Noche",   emoji: "🌙" },
  sunset:  { label: "Atardecer", emoji: "🌇" },
  sunrise: { label: "Amanecer", emoji: "🌅" },
  day:     { label: "Día",     emoji: "☀️" },
};

/** Día de la semana abreviado del día siguiente: "02:45" del miércoles es "jue". */
export function dayAfterLabel(date: string): string {
  const next = new Date(Date.parse(`${date}T12:00:00Z`) + MINUTES_PER_DAY * 60_000);
  return next.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" }).replace(".", "");
}

/** "2026-09-03" → "jue". Para nombrar el día de un set sin repetir la fecha entera. */
export function shortWeekday(date: string): string {
  const day = EVENT_DAYS.find((d) => d.date === date);
  return day ? day.weekday.slice(0, 3).toLowerCase() : date;
}
