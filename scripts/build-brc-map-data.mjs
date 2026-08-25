/**
 * Genera los datos del mapa de Black Rock City a partir del GIS oficial.
 *
 * Fuente: https://github.com/burningmantech/innovate-GIS-data — el dataset que
 * publica Burning Man cada año con la ciudad ya replanteada (calles, valla,
 * plazas, baños, puntos clave). Es público, sin clave de API, y son los mismos
 * datos que usan iBurn y dust.
 *
 * Produce dos cosas:
 *
 *   1. `public/brc/<año>/*.geojson` — la geometría que pinta el mapa, con las
 *      coordenadas redondeadas a 6 decimales (≈11 cm) y sin las propiedades
 *      de ArcGIS que no usamos. Baja de ~2 MB a ~250 kB.
 *   2. `src/lib/brc-city.ts` — tabla de cruces calle × radial, puntos clave y
 *      la orientación de la ciudad. Con eso `brc-geocode.ts` traduce "2 & C"
 *      a coordenadas sin pedirle nada a nadie.
 *
 * Uso (no hace falta salvo que salga un año nuevo):
 *   node scripts/build-brc-map-data.mjs [año]
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const YEAR = process.argv[2] ?? "2026";
const BASE = `https://raw.githubusercontent.com/burningmantech/innovate-GIS-data/master/${YEAR}/GeoJSON`;
const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public", "brc", YEAR);

/** Ficheros que copiamos al público, y las propiedades que sobreviven. */
const LAYERS = [
  { file: "trash_fence", keep: [] },
  { file: "street_lines", keep: ["name", "kind"] },
  { file: "plazas", keep: ["name"] },
  { file: "toilets", keep: ["class"] },
  { file: "cpns", keep: ["NAME"] },
  { file: "dmz", keep: [] },
  { file: "gate_road", keep: [] },
];

/** Los 5 "Point N" son puntos de replanteo topográfico: no pintan nada. */
const SKIP_POI = /^Point \d+$/;

async function fetchGeoJson(name) {
  const res = await fetch(`${BASE}/${name}.geojson`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

/** Redondea a 6 decimales toda la geometría, sea cual sea su anidamiento. */
function roundCoords(value) {
  if (typeof value === "number") return Math.round(value * 1e6) / 1e6;
  return value.map(roundCoords);
}

function trim(geojson, keep) {
  return {
    type: "FeatureCollection",
    features: geojson.features.map((f) => {
      const props = {};
      for (const k of keep) if (f.properties?.[k] != null) props[k] = f.properties[k];
      return { type: "Feature", properties: props, geometry: { ...f.geometry, coordinates: roundCoords(f.geometry.coordinates) } };
    }),
  };
}

// ---------------------------------------------------------------------------
// Cruces de calles
// ---------------------------------------------------------------------------

/** Cada calle llega troceada en varios tramos: se juntan por nombre. */
function segmentsByStreet(streets, kinds) {
  const out = new Map();
  for (const f of streets.features) {
    const { name, kind } = f.properties;
    if (!name || !kinds.includes(kind)) continue;
    const coords = f.geometry.coordinates;
    const list = out.get(name) ?? [];
    for (let i = 0; i < coords.length - 1; i++) list.push([coords[i], coords[i + 1]]);
    out.set(name, list);
  }
  return out;
}

/**
 * Corte de dos segmentos. En grados: a esta escala (unos pocos km) la
 * distorsión de tratar lat/lon como plano es de centímetros.
 */
function intersect([p1, p2], [p3, p4]) {
  const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
  if (Math.abs(d) < 1e-14) return null; // paralelos
  const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
  const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

/**
 * Un radial y una anular se cruzan en un punto, pero cada calle son dos
 * bordes de calzada, así que salen varios cortes muy juntos: se promedian.
 */
function crossing(radialSegs, annularSegs) {
  const hits = [];
  for (const a of radialSegs) {
    for (const b of annularSegs) {
      const p = intersect(a, b);
      if (p) hits.push(p);
    }
  }
  if (hits.length === 0) return null;
  const lon = hits.reduce((s, p) => s + p[0], 0) / hits.length;
  const lat = hits.reduce((s, p) => s + p[1], 0) / hits.length;
  return [round6(lat), round6(lon)];
}

const round6 = (n) => Math.round(n * 1e6) / 1e6;

/** Rumbo inicial de A a B, en grados desde el norte. */
function bearing(from, to) {
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(from[0]);
  const φ2 = toRad(to[0]);
  const Δλ = toRad(to[1] - from[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ---------------------------------------------------------------------------

/** Clasifica los puntos clave para que el mapa sepa qué icono ponerles. */
function poiKind(name) {
  if (name === "The Man") return "man";
  if (name === "The Temple") return "temple";
  // Antes que Center Camp: "Center Camp Plaza" cae en el mismo punto que
  // "Center Camp" y no queremos dos pines encima.
  if (/Plaza|Portal|Promenade/.test(name)) return "plaza";
  if (name.startsWith("Center Camp")) return "center";
  if (/Arctica|^Ice /.test(name)) return "ice";
  if (/^ESD Station|Rampart/.test(name)) return "medical";
  if (/Ranger|Hell Station/.test(name)) return "ranger";
  if (/DMZ/.test(name)) return "dmz";
  return "service";
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  let streets = null;
  let cpns = null;

  for (const { file, keep } of LAYERS) {
    const raw = await fetchGeoJson(file);
    if (file === "street_lines") streets = raw;
    if (file === "cpns") cpns = raw;
    const trimmed = trim(raw, keep);
    const out = path.join(PUBLIC_DIR, `${file}.geojson`);
    await writeFile(out, JSON.stringify(trimmed));
    console.log(`✓ ${file}.geojson — ${trimmed.features.length} features`);
  }

  // Radiales: las avenidas van cada 30 min y los "path" son las de :15 y :45.
  const radials = segmentsByStreet(streets, ["avenue", "path"]);
  const annulars = segmentsByStreet(streets, ["annular"]);

  const intersections = {};
  for (const [radial, rSegs] of [...radials].sort()) {
    for (const [annular, aSegs] of [...annulars].sort()) {
      const point = crossing(rSegs, aSegs);
      if (point) intersections[`${radial}|${annular}`] = point;
    }
  }
  console.log(`✓ ${Object.keys(intersections).length} cruces`);

  const pois = cpns.features
    .map((f) => ({
      name: f.properties.NAME,
      kind: poiKind(f.properties.NAME),
      point: [round6(f.geometry.coordinates[1]), round6(f.geometry.coordinates[0])],
    }))
    .filter((p) => !SKIP_POI.test(p.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const man = pois.find((p) => p.kind === "man").point;
  const temple = pois.find((p) => p.kind === "temple").point;

  // El Templo está en el eje de las 12:00, así que su rumbo desde el Hombre es
  // el de las 12 en punto. Todo lo demás gira 30° por hora sobre él.
  const bearing12 = Math.round(bearing(man, temple) * 100) / 100;

  const ts = `/**
 * Geometría de Black Rock City ${YEAR} — GENERADO, no editar a mano.
 *
 * Sale de \`scripts/build-brc-map-data.mjs\` con el GIS oficial de Burning Man
 * (github.com/burningmantech/innovate-GIS-data, dominio público de uso no
 * comercial). Para regenerarlo: \`node scripts/build-brc-map-data.mjs ${YEAR}\`.
 */

/** [lat, lng] — el orden que espera Leaflet. */
export type LatLng = [number, number];

export const BRC_YEAR = ${YEAR};

/** El Hombre: centro de la ciudad y origen de todas las direcciones. */
export const MAN: LatLng = [${man[0]}, ${man[1]}];

/** Rumbo (grados desde el norte) del eje de las 12:00, medido Hombre → Templo. */
export const BEARING_12 = ${bearing12};

export type PoiKind =
  | "man"
  | "temple"
  | "center"
  | "ice"
  | "medical"
  | "ranger"
  | "plaza"
  | "dmz"
  | "service";

export interface Poi {
  name: string;
  kind: PoiKind;
  point: LatLng;
}

/** Puntos clave de la ciudad (CPNs del GIS oficial). */
export const POIS: Poi[] = ${JSON.stringify(pois, null, 2).replace(/"(name|kind|point)":/g, "$1:")};

/**
 * Cruces calle × radial, con clave "<radial>|<anular>" — "3:15|C".
 * Es el punto medio de los cortes de las dos calzadas, o sea el centro real
 * del cruce.
 */
export const INTERSECTIONS: Record<string, LatLng> = ${JSON.stringify(intersections, null, 2)};
`;

  await writeFile(path.join(ROOT, "src", "lib", "brc-city.ts"), ts);
  console.log(`✓ src/lib/brc-city.ts — ${pois.length} puntos clave, 12:00 a ${bearing12}°`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
