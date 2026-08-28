import "server-only";
import { geocodeAddress, type BrcPlace } from "@/lib/brc-geocode";
import type { LatLng } from "@/lib/brc-city";

/**
 * La API pública de Burning Man: campamentos, arte y eventos oficiales.
 *
 * Necesita una clave propia (`BMORG_API_KEY`, que se pide en
 * api.burningman.org/request) y va solo en el servidor: la clave no puede
 * pisar el navegador ni el repositorio.
 *
 * OJO con el embargo de ubicaciones, que está en los términos de servicio: las
 * de los campamentos no se pueden enseñar antes del domingo previo al evento y
 * las del arte no antes de que abran las puertas. Por eso `CAMP_LOCATIONS_FROM`
 * — antes de esa fecha se sirve el catálogo sin sitio.
 *
 * Si la clave no está o la API no contesta, esto devuelve una lista vacía y el
 * motivo: la app tiene que seguir funcionando igual, solo que sin campamentos.
 */

const BASE = "https://api.burningman.org/api";
const YEAR = 2026;

/** Seis horas: la colocación cambia poco y la API no es nuestra. */
const REVALIDATE_SECONDS = 60 * 60 * 6;

/** Desde cuándo se pueden enseñar las direcciones de los campamentos. */
const CAMP_LOCATIONS_FROM = "2026-08-23";

/** Las del arte, solo desde que abren las puertas. */
const ART_LOCATIONS_FROM = "2026-08-30";

/**
 * Cuánta descripción se guarda de cada evento.
 *
 * Son miles: enteras multiplicarían por tres lo que ocupa la copia offline, y
 * para decidir si te interesa algo sobra con las dos primeras líneas.
 */
const DESCRIPTION_CHARS = 160;

/**
 * Y cuánta de cada campamento.
 *
 * Más larga que la de un evento porque es lo que se lee para decidir si te
 * acercas, pero con tope: son más de mil campamentos y enteras engordarían el
 * snapshot que hay que llevarse al playa sin que nadie lea tanto.
 */
const CAMP_DESCRIPTION_CHARS = 400;

/** Lo que devuelve la API por campamento, de lo que usamos. */
interface ApiCamp {
  uid: string;
  name: string;
  description?: string | null;
  hometown?: string | null;
  landmark?: string | null;
  location_string?: string | null;
  location?: {
    gps_latitude?: number | null;
    gps_longitude?: number | null;
    exact_location?: string | null;
  } | null;
}

export interface Camp {
  uid: string;
  name: string;
  description: string | null;
  hometown: string | null;
  /** Dirección tal como la publica la organización: "D & 3:15". */
  address: string | null;
  point: LatLng | null;
  /** false = el cruce se ha estimado, no sale del plano. */
  exact: boolean;
}

/**
 * Lo que hace falta para pintar un campamento, buscarlo y saber qué es.
 *
 * Es lo que viaja al navegador y al snapshot offline. La descripción va
 * recortada: entera, un párrafo por cada uno de los más de mil campamentos
 * multiplicaría lo que ocupa la copia sin que nadie lea tanto.
 */
export type CampPin = Pick<Camp, "uid" | "name" | "address" | "point" | "exact"> & {
  description: string | null;
};

export function toPins(camps: Camp[]): CampPin[] {
  return camps.map(({ uid, name, address, point, exact, description }) => ({
    uid,
    name,
    address,
    point,
    exact,
    description: cut(description, CAMP_DESCRIPTION_CHARS),
  }));
}

export interface CampsResult {
  camps: Camp[];
  /** Por qué no hay campamentos, para poder decirlo en pantalla. */
  error: string | null;
  /** true cuando la lista viene sin sitio por el embargo, no por un fallo. */
  locationsEmbargoed: boolean;
}

/** Fecha de hoy en el playa (Pacific), en formato ISO corto. */
function playaDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

/**
 * Coordenadas de un campamento: las de la API si las trae, y si no, las que
 * salen de geocodificar su dirección contra el plano oficial.
 */
function placeOf(camp: ApiCamp): BrcPlace | null {
  const lat = camp.location?.gps_latitude;
  const lon = camp.location?.gps_longitude;
  if (typeof lat === "number" && typeof lon === "number") {
    return { point: [lat, lon], address: camp.location_string ?? "", exact: true };
  }
  if (!camp.location_string) return null;
  return geocodeAddress(camp.location_string);
}

/**
 * Una llamada a la API. Devuelve la lista, o el motivo por el que no hay.
 *
 * Nunca lanza: quedarse sin campamentos no puede tumbar una página entera.
 */
async function fetchList<T>(path: string): Promise<{ data: T[] | null; error: string | null }> {
  const key = process.env.BMORG_API_KEY;
  if (!key) return { data: null, error: "Falta BMORG_API_KEY en el entorno." };

  try {
    // OJO: la respuesta de /event son varios MB, más de lo que Next guarda en
    // su caché de fetch, así que ese listado puede acabar pidiéndose en cada
    // visita. Con cuatro usuarios se aguanta; si algún día molesta, hay que
    // cachear el resultado ya recortado, no la respuesta cruda.
    const res = await fetch(`${BASE}/${path}?year=${YEAR}`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return { data: null, error: `La API respondió ${res.status}.` };

    const payload = await res.json();
    if (!Array.isArray(payload)) {
      return { data: null, error: "La API ha devuelto algo que no es una lista." };
    }
    return { data: payload as T[], error: null };
  } catch {
    return { data: null, error: "No se ha podido hablar con la API." };
  }
}

export async function getCamps(): Promise<CampsResult> {
  const { data, error } = await fetchList<ApiCamp>("camp");
  if (!data) return { camps: [], error, locationsEmbargoed: false };

  // El embargo se respeta aquí y no en la pantalla: así no hay forma de que una
  // vista nueva se salte los términos de servicio por descuido.
  const embargoed = playaDate() < CAMP_LOCATIONS_FROM;

  const camps: Camp[] = data
    .filter((camp) => camp?.uid && camp?.name)
    .map((camp) => {
      const place = embargoed ? null : placeOf(camp);
      return {
        uid: camp.uid,
        name: camp.name,
        description: camp.description?.trim() || null,
        hometown: camp.hometown?.trim() || null,
        address: embargoed ? null : (place?.address ?? camp.location_string ?? null),
        point: place?.point ?? null,
        exact: place?.exact ?? false,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return { camps, error: null, locationsEmbargoed: embargoed };
}

// ─────────────────────────────────────────────────────────
// Arte
// ─────────────────────────────────────────────────────────

interface ApiArt {
  uid: string;
  name: string;
  artist?: string | null;
  location_string?: string | null;
  location?: {
    gps_latitude?: number | null;
    gps_longitude?: number | null;
  } | null;
}

export interface ArtPiece {
  uid: string;
  name: string;
  artist: string | null;
  address: string | null;
  point: LatLng | null;
}

async function getArt(): Promise<ArtPiece[]> {
  const { data } = await fetchList<ApiArt>("art");
  if (!data) return [];

  // El arte no se puede situar hasta que abren las puertas; el nombre sí se
  // puede dar, que es lo que hace falta para decir dónde es un evento.
  const embargoed = playaDate() < ART_LOCATIONS_FROM;

  return data
    .filter((art) => art?.uid && art?.name)
    .map((art) => {
      const lat = art.location?.gps_latitude;
      const lon = art.location?.gps_longitude;
      const placed = !embargoed && typeof lat === "number" && typeof lon === "number";
      return {
        uid: art.uid,
        name: art.name,
        artist: art.artist?.trim() || null,
        address: embargoed ? null : (art.location_string ?? null),
        point: placed ? ([lat as number, lon as number] as LatLng) : null,
      };
    });
}

// ─────────────────────────────────────────────────────────
// Eventos
// ─────────────────────────────────────────────────────────

interface ApiEvent {
  uid: string;
  title: string;
  description?: string | null;
  event_type?: { label?: string | null; abbr?: string | null } | null;
  hosted_by_camp?: string | null;
  located_at_art?: string | null;
  other_location?: string | null;
  all_day?: boolean | null;
  occurrence_set?: { start_time?: string | null; end_time?: string | null }[] | null;
}

export interface PlayaEvent {
  uid: string;
  title: string;
  /** Abreviatura del tipo: "prty", "work", "food"… */
  type: string;
  typeLabel: string;
  description: string | null;
  /** Quién lo monta: campamento, pieza de arte o lo que diga el propio evento. */
  where: string | null;
  /** uid del campamento anfitrión, para poder listarle sus eventos. */
  campUid: string | null;
  address: string | null;
  point: LatLng | null;
  allDay: boolean;
  /** Cada pase, en ISO con el huso del playa tal como lo da la API. */
  occurrences: { start: string; end: string }[];
}

export interface EventsResult {
  events: PlayaEvent[];
  error: string | null;
}

function cut(text: string | null | undefined, max: number): string | null {
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

const trim = (text: string | null | undefined) => cut(text, DESCRIPTION_CHARS);

/**
 * Los eventos oficiales, ya con su sitio resuelto.
 *
 * La API no dice dónde cae un evento: dice de qué campamento o de qué pieza de
 * arte cuelga. Así que hacen falta las tres listas para poder situarlo, y de
 * paso las tres se cachean juntas.
 */
export async function getEvents(): Promise<EventsResult> {
  const [{ data, error }, { camps }, art] = await Promise.all([
    fetchList<ApiEvent>("event"),
    getCamps(),
    getArt(),
  ]);

  if (!data) return { events: [], error };

  const campByUid = new Map(camps.map((camp) => [camp.uid, camp]));
  const artByUid = new Map(art.map((piece) => [piece.uid, piece]));

  const events: PlayaEvent[] = data
    .filter((event) => event?.uid && event?.title)
    .map((event) => {
      const camp = event.hosted_by_camp ? campByUid.get(event.hosted_by_camp) : undefined;
      const piece = event.located_at_art ? artByUid.get(event.located_at_art) : undefined;
      const host = camp ?? piece ?? null;

      const occurrences = (event.occurrence_set ?? [])
        .filter((o) => o?.start_time)
        .map((o) => ({ start: o.start_time!, end: o.end_time ?? o.start_time! }))
        .sort((a, b) => a.start.localeCompare(b.start));

      return {
        uid: event.uid,
        title: event.title.trim(),
        type: event.event_type?.abbr?.trim() || "other",
        typeLabel: event.event_type?.label?.trim() || "Otros",
        description: trim(event.description),
        where: host?.name ?? trim(event.other_location) ?? null,
        campUid: camp?.uid ?? null,
        address: host?.address ?? null,
        point: host?.point ?? null,
        allDay: event.all_day === true,
        occurrences,
      };
    })
    .filter((event) => event.occurrences.length > 0)
    .sort((a, b) => a.occurrences[0].start.localeCompare(b.occurrences[0].start));

  return { events, error: null };
}
