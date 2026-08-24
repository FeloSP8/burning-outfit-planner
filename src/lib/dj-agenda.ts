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
import { ARTIST_INFO, GENRES, type Genre } from "@/lib/dj-artists";

const MINUTES_PER_DAY = 24 * 60;

/**
 * Duración por defecto de un set cuando el cartel no da horas: dos horas.
 * Es lo que dura un set normal y es la base de la estimación.
 */
export const ESTIMATED_SET_MINUTES = 2 * 60;

/**
 * Hora a la que se da por apagada una fiesta de noche, en minutos desde la
 * medianoche del día en que empieza: las 6 de la mañana siguiente.
 *
 * Sin esto, una noche de siete sets a dos horas cada uno acabaría a mediodía.
 * Con el tope, los sets se reparten el hueco disponible hasta las 6.
 */
const NIGHT_END = MINUTES_PER_DAY + 6 * 60;

/**
 * El mismo tope para las noches que el propio cartel marca con un set de
 * amanecer: si dice que alguien pincha mientras sale el sol, la fiesta llega
 * más allá de las 6. Nova Heaven y Longfeng cierran sobre las 8.
 */
const NIGHT_END_SUNRISE = MINUTES_PER_DAY + 8 * 60;

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

/**
 * `artista → sus sets`, ordenados en el tiempo. Es el índice de la vista por
 * DJ: quién pincha, cuántas veces y dónde.
 */
export const ARTIST_INDEX: Map<string, SetRef[]> = (() => {
  const out = new Map<string, SetRef[]>();
  for (const ref of ALL_SETS) {
    for (const artist of ref.set.artists) {
      const list = out.get(artist);
      if (list) list.push(ref);
      else out.set(artist, [ref]);
    }
  }
  return out;
})();

/**
 * `género → artistas que lo pinchan`, en el orden del vocabulario y con los
 * artistas alfabéticos. Solo salen los géneros que tiene alguien: un estilo
 * vacío en la lista es ruido.
 */
export const GENRE_INDEX: Map<Genre, string[]> = (() => {
  const out = new Map<Genre, string[]>();
  for (const genre of GENRES) {
    const artists = ALL_ARTISTS.filter((a) => ARTIST_INFO[a]?.genres?.includes(genre));
    if (artists.length > 0) out.set(genre, artists);
  }
  return out;
})();

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
  /** La hora entera es estimación nuestra: el cartel no la publica. */
  estimated: boolean;
}

/**
 * Cuánto se le supone a cada set de una fiesta sin horas publicadas.
 *
 * Dos horas, salvo que no quepan: en una noche los sets se reparten a partes
 * iguales lo que va del arranque a las 6 de la mañana —a las 8 si el cartel
 * marca un set de amanecer—, redondeando a cinco minutos hacia abajo para no
 * pasarse. Siete sets desde las 22:00 salen a poco más de una hora cada uno;
 * seis desde las 21:00, a hora y media.
 *
 * Las fiestas de día, atardecer y amanecer no tienen ese tope —no acaban de
 * madrugada—, así que se quedan en las dos horas, salvo que la fiesta traiga
 * su propio `setMinutes`.
 */
export function estimatedSlotMinutes(party: Party): number {
  // Una fiesta puede llevar su propia duración cuando la regla no le encaja.
  if (party.setMinutes) return party.setMinutes;

  const untimed = party.sets.filter((s) => !s.start).length;
  if (untimed === 0 || party.kind !== "night") return ESTIMATED_SET_MINUTES;

  const end = party.sets.some((s) => s.sun === "amanecer") ? NIGHT_END_SUNRISE : NIGHT_END;
  const fair = Math.floor((end - toMinutes(party.start)) / untimed / 5) * 5;
  return Math.max(15, Math.min(ESTIMATED_SET_MINUTES, fair));
}

/** ¿Las horas de esta fiesta son estimación nuestra? */
export function isEstimated(party: Party): boolean {
  return party.sets.some((s) => !s.start);
}

/** Ventana de la fiesta entera. */
export function partyWindow(party: Party): Window {
  const start = toMinutes(party.start);
  if (party.end) return { start, end: withinParty(party, party.end), exact: true, estimated: false };

  const slot = estimatedSlotMinutes(party);

  // Sin hora de cierre pero con todas las del cartel puestas: la fiesta acaba
  // un hueco después del último set, no sumando uno por cada uno.
  const timed = party.sets.filter((x) => x.start).map((x) => withinParty(party, x.start!));
  if (timed.length === party.sets.length) {
    return { start, end: Math.max(...timed) + slot, exact: false, estimated: true };
  }

  // Sin horas: se cierra donde acabe el último set estimado.
  return { start, end: start + party.sets.length * slot, exact: false, estimated: true };
}

/**
 * Coloca en el reloj todos los sets de una fiesta, de una vez.
 *
 * Los que traen hora del cartel mandan y no se tocan. Los que no, se reparten
 * a partes iguales el hueco que va de una hora fija a la siguiente — o del
 * arranque al cierre, cuando la fiesta entera viene sin horas, que es el caso
 * de Playground, Symbio y Favela.
 *
 * Los carteles mezclan las dos cosas: el de Favela del viernes son cinco sets
 * sin hora, la ceremonia de las 06:29 y un cierre, también sin hora. Repartir
 * por tramos es lo que coloca ese cierre después de la ceremonia y no antes.
 */
function layoutParty(party: Party): Map<string, Window> {
  const pw = partyWindow(party);
  const n = party.sets.length;
  const anchorAt = (i: number): number | null =>
    party.sets[i].start ? withinParty(party, party.sets[i].start!) : null;

  // Los cortes son los sets con hora fija; el primer tramo arranca en el 0
  // aunque no la lleve, porque empieza cuando abre la fiesta.
  const cuts = Array.from({ length: n }, (_, i) => i).filter((i) => anchorAt(i) !== null);
  if (cuts[0] !== 0) cuts.unshift(0);

  const starts = new Array<number>(n);
  for (let c = 0; c < cuts.length; c++) {
    const from = cuts[c];
    const to = c + 1 < cuts.length ? cuts[c + 1] : n;
    const t0 = anchorAt(from) ?? pw.start;
    const t1 = c + 1 < cuts.length ? anchorAt(cuts[c + 1])! : pw.end;
    const slot = (t1 - t0) / (to - from);
    for (let k = from; k < to; k++) {
      // El primero del tramo cae en la hora exacta; los estimados se redondean
      // a cinco minutos para no enseñar un "23:42".
      starts[k] = k === from ? t0 : Math.round((t0 + (k - from) * slot) / 5) * 5;
    }
  }

  const out = new Map<string, Window>();
  for (let i = 0; i < n; i++) {
    const estimated = !party.sets[i].start;
    // Cada set dura hasta que empieza el siguiente; el último, hasta el cierre.
    const nextEstimated = i + 1 < n ? !party.sets[i + 1].start : !pw.exact;
    out.set(party.sets[i].id, {
      start: starts[i],
      end: i + 1 < n ? starts[i + 1] : pw.end,
      exact: !estimated && !nextEstimated,
      estimated,
    });
  }
  return out;
}

/** Los repartos son estables: se calculan una vez por fiesta. */
const LAYOUTS = new Map<string, Map<string, Window>>();

/** Ventana de un set: del cartel si la publica, estimada si no. */
export function setWindow(party: Party, set: DjSet): Window {
  let layout = LAYOUTS.get(party.id);
  if (!layout) {
    layout = layoutParty(party);
    LAYOUTS.set(party.id, layout);
  }
  return layout.get(set.id)!;
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
      out.push({ a, b, certain: !a.window.estimated && !b.window.estimated && a.window.exact && b.window.exact });
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

/** Rango legible: "21:00 → 03:45", o "21:00 → 05:00 aprox." si el cierre es estimado. */
export function partyRange(party: Party): string {
  if (party.end) return `${party.start} → ${party.end}`;
  return `${party.start} → ${fromMinutes(partyWindow(party).end)} aprox.`;
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
