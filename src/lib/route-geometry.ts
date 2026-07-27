/**
 * Geometría de la ruta para dibujarla en el mapa.
 *
 * Se resuelve en el servidor contra OSRM (servicio público de routing sobre
 * datos de OpenStreetMap) y se cachea una semana: las coordenadas de las
 * paradas son fijas, así que el trazado no cambia entre visitas.
 *
 * Si OSRM no responde, se devuelven las propias paradas como polilínea. En ese
 * caso `isRealRoad` es false y el mapa la pinta discontinua, para no dar a
 * entender que ese trazado recto es el camino real por carretera.
 */

import { ROUTE_STOPS } from "./route-data";

/** [lat, lng] — el orden que espera Leaflet. */
export type LatLng = [number, number];

export interface RouteGeometry {
  points: LatLng[];
  /** true = trazado real por carretera (OSRM). false = líneas rectas entre paradas. */
  isRealRoad: boolean;
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/** Una semana: el trazado es estático. */
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

/** Polilínea de emergencia: las paradas unidas en línea recta. */
function straightLineFallback(): RouteGeometry {
  return { points: ROUTE_STOPS.map((s) => s.coords), isRealRoad: false };
}

function isCoordPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

export async function getRouteGeometry(): Promise<RouteGeometry> {
  // OSRM espera lon,lat separados por coma y las paradas por punto y coma.
  const path = ROUTE_STOPS.map(({ coords: [lat, lng] }) => `${lng},${lat}`).join(";");

  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return straightLineFallback();

    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return straightLineFallback();

    const { code, routes } = data as { code?: unknown; routes?: unknown };
    if (code !== "Ok" || !Array.isArray(routes) || routes.length === 0)
      return straightLineFallback();

    const coords = (routes[0] as { geometry?: { coordinates?: unknown } })?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return straightLineFallback();

    // GeoJSON viene en [lon, lat]; Leaflet quiere [lat, lng].
    const points: LatLng[] = [];
    for (const c of coords) {
      if (!isCoordPair(c)) continue;
      points.push([c[1], c[0]]);
    }
    if (points.length < 2) return straightLineFallback();

    return { points, isRealRoad: true };
  } catch {
    // Red caída, timeout o JSON inesperado: se degrada al trazado esquemático.
    return straightLineFallback();
  }
}
