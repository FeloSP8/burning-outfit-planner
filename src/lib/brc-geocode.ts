/**
 * Direcciones de Black Rock City → coordenadas.
 *
 * La ciudad es un reloj: las radiales son horas ("2:30") y las anulares van
 * de la Esplanade a la K. Una dirección como "2:30 & F" es un cruce concreto,
 * y el GIS oficial nos da dónde cae — eso es `INTERSECTIONS` en `brc-city.ts`.
 *
 * Cuando el cruce no existe en la ciudad real (las calles de :15 y :45 solo
 * salen a partir de la F, la J no llega a las 2:00 ni a las 10:00) se estima
 * por geometría: rumbo de la radial y radio medio de la anular. Sale a unos
 * pocos metros y queda marcado con `exact: false` para poder pintarlo distinto.
 *
 * No usa nada de la API de Burning Man: las direcciones de nuestros escenarios
 * salen de los carteles, y la geometría de la ciudad es el dataset público.
 */

import { INTERSECTIONS, MAN, BEARING_12, type LatLng } from "./brc-city";

export interface BrcPlace {
  point: LatLng;
  /** Dirección normalizada: "2:30 & F". */
  address: string;
  /** true = cruce real del GIS. false = estimado por geometría. */
  exact: boolean;
}

const EARTH_RADIUS_M = 6371008.8;
const FEET_PER_METER = 3.28084;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Distancia en metros entre dos puntos (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Punto a `meters` metros del Hombre con ese rumbo (grados desde el norte). */
function destination(bearingDeg: number, meters: number): LatLng {
  const δ = meters / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(MAN[0]);
  const λ1 = toRad(MAN[1]);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [toDeg(φ2), toDeg(λ2)];
}

/** Rumbo de una radial: las 12:00 marcan el eje y cada hora gira 30°. */
export function clockBearing(hour: number, minute: number): number {
  return (BEARING_12 + ((hour % 12) + minute / 60) * 30) % 360;
}

/** Punto dado en coordenadas polares — el formato en que viene el arte. */
export function polarPoint(hour: number, minute: number, feetFromMan: number): LatLng {
  return destination(clockBearing(hour, minute), feetFromMan / FEET_PER_METER);
}

/** Radio medio de cada anular, deducido de sus cruces conocidos. */
const ringRadius: Map<string, number> = (() => {
  const sums = new Map<string, { total: number; n: number }>();
  for (const [key, point] of Object.entries(INTERSECTIONS)) {
    const ring = key.split("|")[1];
    const acc = sums.get(ring) ?? { total: 0, n: 0 };
    acc.total += distanceMeters(MAN, point);
    acc.n += 1;
    sums.set(ring, acc);
  }
  return new Map([...sums].map(([ring, { total, n }]) => [ring, total / n]));
})();

/** Anulares de la ciudad, de dentro a fuera. */
export const RINGS = ["ESP", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

const RADIAL_RE = /\b(1[0-2]|[2-9])(?::([0-5]\d))?\b/;
const RING_RE = /\b(esplanade|esp|[a-k])\b/i;

/**
 * "2 & C", "C & 2:30", "10 & Esplanade", "2:00 & I · art car" → coordenadas.
 * Devuelve null si el texto no es una dirección de la ciudad (un art car sin
 * sitio fijo, "deep playa", el bus de Robot Heart…).
 */
export function geocodeAddress(input: string): BrcPlace | null {
  // Lo que va tras "·" es una coletilla nuestra ("art car", "sin sitio fijo").
  const text = input.split("·")[0].trim();
  if (!text) return null;

  const radialMatch = text.match(RADIAL_RE);
  if (!radialMatch) return null;

  // Se busca la anular fuera del trozo que ya se ha comido la radial: si no,
  // la "e" de "Esplanade" podría casar antes con otra letra suelta.
  const rest = text.replace(radialMatch[0], " ");
  const ringMatch = rest.match(RING_RE);
  if (!ringMatch) return null;

  const hour = Number(radialMatch[1]);
  const minute = Number(radialMatch[2] ?? "0");
  const raw = ringMatch[1].toUpperCase();
  const ring = raw === "ESPLANADE" ? "ESP" : raw;

  const radial = `${hour}:${String(minute).padStart(2, "0")}`;
  const address = `${radial} & ${ring === "ESP" ? "Esplanade" : ring}`;

  const exact = INTERSECTIONS[`${radial}|${ring}`];
  if (exact) return { point: exact, address, exact: true };

  const radius = ringRadius.get(ring);
  if (radius === undefined) return null;
  return { point: destination(clockBearing(hour, minute), radius), address, exact: false };
}

/** Metros → "1,2 km" / "480 m", en español. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Minutos andando a 4,5 km/h — el paso real por arena, no el de acera. */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 75));
}
