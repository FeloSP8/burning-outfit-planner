import "server-only";
import { geocodeAddress, type BrcPlace } from "@/lib/brc-geocode";
import type { LatLng } from "@/lib/brc-city";

/**
 * La API pública de Burning Man: el listado oficial de campamentos.
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
 * Lo mínimo para pintar un campamento en el mapa y buscarlo por nombre.
 *
 * Es lo que viaja al navegador y al snapshot offline: las descripciones son
 * un párrafo por campamento y multiplicarían por cuatro lo que ocupa.
 */
export type CampPin = Pick<Camp, "uid" | "name" | "address" | "point" | "exact">;

export function toPins(camps: Camp[]): CampPin[] {
  return camps.map(({ uid, name, address, point, exact }) => ({ uid, name, address, point, exact }));
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

export async function getCamps(): Promise<CampsResult> {
  const key = process.env.BMORG_API_KEY;
  if (!key) {
    return { camps: [], error: "Falta BMORG_API_KEY en el entorno.", locationsEmbargoed: false };
  }

  let payload: ApiCamp[];
  try {
    const res = await fetch(`${BASE}/camp?year=${YEAR}`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return {
        camps: [],
        error: `La API respondió ${res.status}.`,
        locationsEmbargoed: false,
      };
    }
    payload = await res.json();
  } catch {
    return { camps: [], error: "No se ha podido hablar con la API.", locationsEmbargoed: false };
  }

  if (!Array.isArray(payload)) {
    return { camps: [], error: "La API ha devuelto algo que no es una lista.", locationsEmbargoed: false };
  }

  // El embargo se respeta aquí y no en la pantalla: así no hay forma de que una
  // vista nueva se salte los términos de servicio por descuido.
  const embargoed = playaDate() < CAMP_LOCATIONS_FROM;

  const camps: Camp[] = payload
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
