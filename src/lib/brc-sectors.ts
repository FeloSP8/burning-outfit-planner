/**
 * Los sectores de Black Rock City, por horas del reloj.
 *
 * La ciudad es un arco de las 2:00 a las 10:00 y nadie se mueve por ella
 * pensando en coordenadas: se piensa en "lo que hay entre las 3 y las 4:30".
 * Estos seis trozos son los que se usan para filtrar los eventos oficiales.
 *
 * Los bordes son **compartidos**: los dos extremos entran. Un campamento en
 * las 3:00 clavadas está tanto al final de "2:00 – 3:00" como al principio de
 * "3:00 – 4:30", y sale en los dos. Es lo que pasa de verdad andando por la
 * ciudad —esa esquina es la frontera, no pertenece a un lado— y buscando sitio
 * es mejor que salga de más a que se pierda por estar justo en la raya.
 */

import type { LatLng } from "./brc-city";
import { clockHourOf } from "./brc-geocode";

export interface CitySector {
  id: string;
  /** "3:00 – 4:30". */
  label: string;
  /** "3–4:30", para los chips: seis etiquetas largas no caben en un móvil. */
  short: string;
  /** Horas decimales: 4.5 son las 4:30. */
  from: number;
  to: number;
}

export const CITY_SECTORS: CitySector[] = [
  { id: "2-3", label: "2:00 – 3:00", short: "2–3", from: 2, to: 3 },
  { id: "3-430", label: "3:00 – 4:30", short: "3–4:30", from: 3, to: 4.5 },
  { id: "430-6", label: "4:30 – 6:00", short: "4:30–6", from: 4.5, to: 6 },
  { id: "6-730", label: "6:00 – 7:30", short: "6–7:30", from: 6, to: 7.5 },
  { id: "730-9", label: "7:30 – 9:00", short: "7:30–9", from: 7.5, to: 9 },
  { id: "9-10", label: "9:00 – 10:00", short: "9–10", from: 9, to: 10 },
];

/**
 * La radial de una dirección escrita: "2:30 & F" → 2.5, "9:00 Portal" → 9.
 *
 * No vale `geocodeAddress` para esto: esa exige también la anular, y hay sitios
 * con radial y sin ella —las plazas, los portales— que sí caen en un sector.
 */
const RADIAL_RE = /\b(1[0-2]|[1-9])(?::([0-5]\d))?\b/;

function radialOf(address: string): number | null {
  const match = address.match(RADIAL_RE);
  if (!match) return null;
  return Number(match[1]) + Number(match[2] ?? "0") / 60;
}

/** La hora del reloj de un sitio, por sus coordenadas o por su dirección. */
export function clockHourOfPlace(place: {
  address?: string | null;
  point?: LatLng | null;
}): number | null {
  // El punto manda: cuando la API da GPS es lo más fiable que hay, y la
  // dirección que lo acompaña puede no ser una del callejero ("Center Camp").
  if (place.point) return clockHourOf(place.point);
  if (place.address) return radialOf(place.address);
  return null;
}

/**
 * En qué sectores cae un sitio.
 *
 * Casi siempre uno; dos cuando está justo en una frontera, porque los bordes
 * son compartidos. Vacío si no se sabe dónde está.
 */
export function sectorsOf(place: { address?: string | null; point?: LatLng | null }): string[] {
  const raw = clockHourOfPlace(place);
  if (raw === null) return [];

  // Al minuto: la hora que sale de unas coordenadas trae decimales de sobra, y
  // sin redondear un sitio en las 3:00 clavadas da 3,0001 y deja de estar en la
  // frontera —o, en las 10:00, se cae de todos los sectores.
  const hour = Math.round(raw * 60) / 60;

  return CITY_SECTORS.filter((s) => hour >= s.from && hour <= s.to).map((s) => s.id);
}
