/**
 * Capa de datos meteorológicos para Black Rock City.
 *
 * Jerarquía de fuentes (meta-análisis de fiabilidad para la zona):
 *   1. NWS Reno / WFO REV (api.weather.gov) — autoridad y avisos oficiales.
 *   2. Open-Meteo — contraste multi-modelo horario (GFS+HRRR vs ECMWF IFS),
 *      ensembles para la probabilidad real de lluvia y CAMS para el polvo.
 *   3. Observaciones reales de las estaciones más cercanas (METAR vía NWS y,
 *      si hay token, el PWS de Gerlach vía Synoptic/MesoWest).
 *
 * OJO — no hay ninguna estación de observación en el propio playa: el
 * aeropuerto de BRC (88NV) es una pista de tierra estacional sin METAR
 * permanente. Todo lo que se pinta aquí es el punto de rejilla que cada
 * modelo resuelve *cerca* de BRC, no una medida del desierto. Por eso cada
 * fuente devuelve su `GridPoint` con la coordenada real que ha usado y su
 * distancia al Hombre: la página lo enseña tal cual en vez de fingir una
 * precisión que no existe.
 *
 * Ninguna de estas llamadas necesita clave (Synoptic es opcional). Todas
 * degradan a `null` si fallan: la página pinta el resto de secciones igual.
 */

import "server-only";

// ─────────────────────────────────────────────────────────
// Constantes del evento y del punto objetivo
// ─────────────────────────────────────────────────────────

/** El Hombre, Burning Man 2026. Es el punto que se pide a todas las APIs. */
export const BRC = {
  lat: 40.7864,
  lon: -119.2065,
  /** Altitud del lecho seco (Black Rock Desert), ~3.906 ft. */
  elevationM: 1191,
} as const;

/** Ventana del evento — misma que usa por defecto el planificador. */
export const EVENT = { start: "2026-08-30", end: "2026-09-07" } as const;

/**
 * El pronóstico de "la semana del evento" arranca un día antes del evento en
 * sí: el 29 de agosto es cuando se recoge el RV y se conduce hasta el playa
 * (ver `ROUTE_META.pickup` en route-data.ts), así que ya interesa saber qué
 * tiempo va a hacer. El "faltan X días" de la confianza del pronóstico sigue
 * midiendo contra `EVENT.start`, que es la fecha real del evento.
 */
export const FORECAST_START = "2026-08-29";

/**
 * San Francisco: los días de ciudad, antes de recoger el RV (29 ago) y
 * después de devolverlo (5 sep).
 *
 * OJO con el punto: SF tiene los microclimas más bruscos de EE. UU. En una
 * tarde de agosto el Sunset puede estar a 15 °C con niebla y el Mission a 24
 * al sol, a cinco kilómetros. Estas coordenadas son el centro (Union Square),
 * o sea el término medio: cerca de la costa hará más frío y más viento.
 */
export const SF = {
  lat: 37.7749,
  lon: -122.4194,
  elevationM: 16,
} as const;

/**
 * Los días de ciudad en San Francisco: 27 y 28 de agosto. El 29 se recoge el
 * RV y empieza el viaje al desierto.
 */
export const SF_STAY = {
  dates: ["2026-08-27", "2026-08-28"],
} as const;

/** api.weather.gov exige un User-Agent identificativo con contacto. */
const NWS_HEADERS = {
  "User-Agent": "burning-outfit-planner (https://github.com/FeloSP8/burning-outfit-planner)",
  Accept: "application/geo+json",
};

// Cachés: el pronóstico se refresca cada 30 min, los avisos cada 5 (son lo
// único que puede cambiar de golpe) y la rejilla del NWS es fija.
const REVALIDATE = {
  point: 60 * 60 * 24 * 30,
  forecast: 60 * 30,
  alerts: 60 * 5,
  observation: 60 * 15,
  stations: 60 * 60 * 24 * 7,
} as const;

// ─────────────────────────────────────────────────────────
// Umbrales accionables (los que cambian el plan en el playa)
// ─────────────────────────────────────────────────────────

/** Ráfagas, en km/h. Los originales son 25 / 40 / 50 mph. */
export const GUST = { warn: 40, high: 64, extreme: 80 } as const;
/** Lluvia acumulada en 24 h, en mm. Los originales son 0,25" y 0,5". */
export const RAIN = { mud: 6.4, closure: 12.7 } as const;
/** Temperaturas: frío nocturno y golpe de calor. */
export const TEMP = { cold: 10, heat: 37.8 } as const;
/** Índice UV a partir del cual quema en minutos. */
export const UV_ALERT = 8;

export type Severity = "ok" | "warn" | "high" | "extreme";

// ─────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────

export const kmhToMph = (kmh: number) => kmh / 1.609344;
export const mmToInches = (mm: number) => mm / 25.4;
export const cToF = (c: number) => (c * 9) / 5 + 32;

/** Distancia entre dos puntos sobre la esfera, en km. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

/** Rumbo de `a` hacia `b` como punto cardinal ("NE", "SO"…). */
export function bearingLabel(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return COMPASS[Math.round(((deg + 360) % 360) / 45) % 8];
}

/** Fecha local `YYYY-MM-DD` en la zona horaria del playa. */
export function playaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Días naturales entre dos fechas `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** GET + JSON con timeout y caché de Next. Devuelve `null` ante cualquier fallo. */
async function getJson<T>(
  url: string,
  revalidate: number,
  headers?: Record<string, string>
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Red caída, timeout, API tumbada o JSON inesperado: la sección se pinta
    // como "fuente no disponible" en vez de reventar la página entera.
    return null;
  }
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

// ─────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────

/** El punto que una fuente ha resuelto de verdad para "Black Rock City". */
export interface GridPoint {
  lat: number;
  lon: number;
  elevationM: number | null;
  /** Distancia al Hombre, en km. */
  distanceKm: number;
  /** Rumbo desde el Hombre ("NE", "SO"…). */
  bearing: string;
}

export interface DailyPoint {
  date: string;
  tMaxC: number | null;
  tMinC: number | null;
  /** Sensación térmica: la que manda en San Francisco, con viento y niebla. */
  tFeelsMaxC: number | null;
  tFeelsMinC: number | null;
  precipMm: number | null;
  precipProb: number | null;
  gustKmh: number | null;
  windKmh: number | null;
  uvMax: number | null;
  code: number | null;
}

export interface ModelForecast {
  id: string;
  label: string;
  /** Resolución nominal del modelo, para saber qué se le puede pedir. */
  resolution: string;
  grid: GridPoint;
  days: DailyPoint[];
}

export interface NwsPoint {
  wfo: string;
  gridX: number;
  gridY: number;
  forecastUrl: string;
  stationsUrl: string;
  /** Localidad con la que el propio NWS etiqueta el punto (suele ser Gerlach). */
  place: string | null;
  /** Distancia de esa localidad al Hombre, según el propio NWS, en km. */
  placeDistanceKm: number | null;
  zone: string | null;
  county: string | null;
  radar: string | null;
  timeZone: string | null;
}

export interface NwsPeriod {
  name: string;
  startTime: string;
  isDaytime: boolean;
  tempC: number | null;
  wind: string;
  windDirection: string;
  precipProb: number | null;
  short: string;
  detailed: string;
}

export interface NwsForecast {
  periods: NwsPeriod[];
  updated: string | null;
  /** Altitud de la celda de rejilla que responde por BRC. */
  elevationM: number | null;
  /** Centro de la celda de 2,5 km, calculado a partir de su polígono. */
  grid: GridPoint | null;
}

export interface NwsAlert {
  event: string;
  headline: string | null;
  severity: string;
  urgency: string;
  areaDesc: string;
  effective: string | null;
  expires: string | null;
  description: string;
  instruction: string | null;
  sender: string | null;
}

export interface StationObservation {
  id: string;
  name: string;
  distanceKm: number;
  bearing: string;
  elevationM: number | null;
  timestamp: string | null;
  tempC: number | null;
  windKmh: number | null;
  gustKmh: number | null;
  humidity: number | null;
  dewPointC: number | null;
  visibilityKm: number | null;
  text: string | null;
  /** Quién sirve el dato: METAR del NWS o PWS vía Synoptic. */
  source: "NWS" | "Synoptic";
}

export interface AirQualityDay {
  date: string;
  dustMax: number | null;
  pm10Max: number | null;
  pm25Max: number | null;
}

export interface AirQuality {
  grid: GridPoint;
  days: AirQualityDay[];
}

export interface EnsembleDay {
  date: string;
  members: number;
  /** % de miembros que superan el umbral de barro (0,25"). */
  rainMudPct: number;
  /** % de miembros con lluvia medible (>0,2 mm). */
  rainAnyPct: number;
  /** % de miembros con ráfagas > 40 mph. */
  gustHighPct: number;
  /** Ráfaga máxima de la mediana de miembros, km/h. */
  gustMedianKmh: number | null;
  /** Ráfaga máxima del miembro más extremo, km/h. */
  gustMaxKmh: number | null;
}

export interface Ensemble {
  label: string;
  grid: GridPoint;
  days: EnsembleDay[];
}

// ─────────────────────────────────────────────────────────
// Open-Meteo — pronóstico determinista por modelo
// ─────────────────────────────────────────────────────────

interface OpenMeteoBase {
  latitude?: unknown;
  longitude?: unknown;
  elevation?: unknown;
}

/** Punto de rejilla real que ha usado Open-Meteo (no es el que se le pide). */
function gridFrom(
  body: OpenMeteoBase | null,
  reference: { lat: number; lon: number } = BRC
): GridPoint | null {
  const lat = num(body?.latitude);
  const lon = num(body?.longitude);
  if (lat === null || lon === null) return null;
  const point = { lat, lon };
  return {
    lat,
    lon,
    elevationM: num(body?.elevation),
    distanceKm: haversineKm(reference, point),
    bearing: bearingLabel(reference, point),
  };
}

const DAILY_VARS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "uv_index_max",
  "weather_code",
].join(",");

interface OpenMeteoForecast extends OpenMeteoBase {
  daily?: Record<string, unknown>;
}

/** Catálogo de modelos que se contrastan en la página. */
export const MODELS = [
  {
    id: "gfs_seamless",
    label: "GFS + HRRR",
    resolution: "HRRR 3 km (48 h) → GFS 13 km",
    note: "Alta resolución en el corto plazo: es el que mejor ve las tormentas de tarde y las ráfagas.",
  },
  {
    id: "ecmwf_ifs025",
    label: "ECMWF IFS",
    resolution: "0,25° (~25 km)",
    note: "El global más hábil a medio plazo, pero no resuelve la convección local del playa.",
  },
] as const;

export async function getModelForecast(
  model: { id: string; label: string; resolution: string },
  place: { lat: number; lon: number } = BRC
): Promise<ModelForecast | null> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&daily=${DAILY_VARS}` +
    "&timezone=America%2FLos_Angeles&forecast_days=16" +
    `&models=${model.id}`;

  const body = await getJson<OpenMeteoForecast>(url, REVALIDATE.forecast);
  const grid = gridFrom(body, place);
  const daily = body?.daily;
  if (!grid || !daily || !Array.isArray(daily.time)) return null;

  const col = (key: string): unknown[] =>
    Array.isArray(daily[key]) ? (daily[key] as unknown[]) : [];

  const time = daily.time as unknown[];
  const cols = {
    tMaxC: col("temperature_2m_max"),
    tMinC: col("temperature_2m_min"),
    tFeelsMaxC: col("apparent_temperature_max"),
    tFeelsMinC: col("apparent_temperature_min"),
    precipMm: col("precipitation_sum"),
    precipProb: col("precipitation_probability_max"),
    windKmh: col("wind_speed_10m_max"),
    gustKmh: col("wind_gusts_10m_max"),
    uvMax: col("uv_index_max"),
    code: col("weather_code"),
  };

  const days: DailyPoint[] = [];
  for (let i = 0; i < time.length; i++) {
    const date = time[i];
    if (typeof date !== "string") continue;
    days.push({
      date,
      tMaxC: num(cols.tMaxC[i]),
      tMinC: num(cols.tMinC[i]),
      tFeelsMaxC: num(cols.tFeelsMaxC[i]),
      tFeelsMinC: num(cols.tFeelsMinC[i]),
      precipMm: num(cols.precipMm[i]),
      precipProb: num(cols.precipProb[i]),
      windKmh: num(cols.windKmh[i]),
      gustKmh: num(cols.gustKmh[i]),
      uvMax: num(cols.uvMax[i]),
      code: num(cols.code[i]),
    });
  }
  if (days.length === 0) return null;

  return { id: model.id, label: model.label, resolution: model.resolution, grid, days };
}

/**
 * Pronóstico de San Francisco. Aquí basta un modelo, y se elige GFS+HRRR
 * porque a 3 km resuelve la capa marina — la niebla que decide si un día de
 * agosto en SF son 15 °C o 24 °C — mucho mejor que un global de 25 km.
 */
export async function getCityForecast(): Promise<ModelForecast | null> {
  return getModelForecast(
    {
      id: "gfs_seamless",
      label: "GFS + HRRR",
      resolution: "HRRR 3 km (48 h) → GFS 13 km",
    },
    SF
  );
}

// ─────────────────────────────────────────────────────────
// Open-Meteo — calidad del aire (polvo, CAMS)
// ─────────────────────────────────────────────────────────

interface OpenMeteoAir extends OpenMeteoBase {
  hourly?: Record<string, unknown>;
}

export async function getAirQuality(): Promise<AirQuality | null> {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality" +
    `?latitude=${BRC.lat}&longitude=${BRC.lon}` +
    "&hourly=dust,pm10,pm2_5&timezone=America%2FLos_Angeles&forecast_days=5";

  const body = await getJson<OpenMeteoAir>(url, REVALIDATE.forecast);
  const grid = gridFrom(body);
  const hourly = body?.hourly;
  if (!grid || !hourly || !Array.isArray(hourly.time)) return null;

  const time = hourly.time as unknown[];
  const series = {
    dustMax: Array.isArray(hourly.dust) ? (hourly.dust as unknown[]) : [],
    pm10Max: Array.isArray(hourly.pm10) ? (hourly.pm10 as unknown[]) : [],
    pm25Max: Array.isArray(hourly.pm2_5) ? (hourly.pm2_5 as unknown[]) : [],
  };

  // La API de calidad del aire solo da valores horarios: el máximo diario se
  // agrega aquí, que es el número accionable (¿toca máscara y goggles?).
  const byDate = new Map<string, AirQualityDay>();
  for (let i = 0; i < time.length; i++) {
    const stamp = time[i];
    if (typeof stamp !== "string") continue;
    const date = stamp.slice(0, 10);
    const day = byDate.get(date) ?? { date, dustMax: null, pm10Max: null, pm25Max: null };
    for (const key of ["dustMax", "pm10Max", "pm25Max"] as const) {
      const v = num(series[key][i]);
      if (v !== null) day[key] = day[key] === null ? v : Math.max(day[key]!, v);
    }
    byDate.set(date, day);
  }

  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return days.length > 0 ? { grid, days } : null;
}

// ─────────────────────────────────────────────────────────
// Open-Meteo — ensemble GFS (probabilidad real, no un % de folleto)
// ─────────────────────────────────────────────────────────

interface OpenMeteoEnsemble extends OpenMeteoBase {
  hourly?: Record<string, unknown>;
}

/** Agrupa una serie horaria por día local. */
function dailyReduce(
  time: unknown[],
  values: unknown[],
  reducer: (acc: number, v: number) => number,
  seed: number
): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 0; i < time.length; i++) {
    const stamp = time[i];
    const v = num(values[i]);
    if (typeof stamp !== "string" || v === null) continue;
    const date = stamp.slice(0, 10);
    out.set(date, reducer(out.get(date) ?? seed, v));
  }
  return out;
}

export async function getEnsemble(): Promise<Ensemble | null> {
  const url =
    "https://ensemble-api.open-meteo.com/v1/ensemble" +
    `?latitude=${BRC.lat}&longitude=${BRC.lon}` +
    "&hourly=precipitation,wind_gusts_10m" +
    "&timezone=America%2FLos_Angeles&forecast_days=16&models=gfs_seamless";

  const body = await getJson<OpenMeteoEnsemble>(url, REVALIDATE.forecast);
  const grid = gridFrom(body);
  const hourly = body?.hourly;
  if (!grid || !hourly || !Array.isArray(hourly.time)) return null;

  const time = hourly.time as unknown[];

  // Cada miembro llega como columna aparte: `precipitation`, el control, y
  // `precipitation_member01…31`. Se agrega por miembro y luego se cuenta
  // cuántos miembros cruzan cada umbral: eso es la probabilidad de verdad.
  const rainKeys = Object.keys(hourly).filter((k) => k.startsWith("precipitation"));
  const gustKeys = Object.keys(hourly).filter((k) => k.startsWith("wind_gusts_10m"));
  if (rainKeys.length === 0 && gustKeys.length === 0) return null;

  const rainPerMember = rainKeys.map((k) =>
    dailyReduce(time, (hourly[k] as unknown[]) ?? [], (a, b) => a + b, 0)
  );
  const gustPerMember = gustKeys.map((k) =>
    dailyReduce(time, (hourly[k] as unknown[]) ?? [], Math.max, 0)
  );

  const dates = [
    ...new Set(
      time.filter((t): t is string => typeof t === "string").map((t) => t.slice(0, 10))
    ),
  ].sort();

  const days: EnsembleDay[] = dates.map((date) => {
    const rain = rainPerMember.map((m) => m.get(date)).filter((v): v is number => v != null);
    const gusts = gustPerMember.map((m) => m.get(date)).filter((v): v is number => v != null);
    const sorted = [...gusts].sort((a, b) => a - b);
    const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

    return {
      date,
      members: Math.max(rain.length, gusts.length),
      rainMudPct: pct(rain.filter((v) => v >= RAIN.mud).length, rain.length),
      rainAnyPct: pct(rain.filter((v) => v >= 0.2).length, rain.length),
      gustHighPct: pct(gusts.filter((v) => v >= GUST.high).length, gusts.length),
      gustMedianKmh: sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : null,
      gustMaxKmh: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  });

  return { label: "GFS ensemble", grid, days };
}

// ─────────────────────────────────────────────────────────
// NWS / WFO Reno — autoridad y avisos
// ─────────────────────────────────────────────────────────

export async function getNwsPoint(): Promise<NwsPoint | null> {
  const body = await getJson<{ properties?: Record<string, unknown> }>(
    `https://api.weather.gov/points/${BRC.lat},${BRC.lon}`,
    REVALIDATE.point,
    NWS_HEADERS
  );
  const p = body?.properties;
  if (!p) return null;

  const wfo = typeof p.gridId === "string" ? p.gridId : null;
  const gridX = num(p.gridX);
  const gridY = num(p.gridY);
  const forecastUrl = typeof p.forecast === "string" ? p.forecast : null;
  const stationsUrl = typeof p.observationStations === "string" ? p.observationStations : null;
  if (!wfo || gridX === null || gridY === null || !forecastUrl || !stationsUrl) return null;

  const rel = (p.relativeLocation as { properties?: Record<string, unknown> } | undefined)
    ?.properties;
  const city = typeof rel?.city === "string" ? rel.city : null;
  const state = typeof rel?.state === "string" ? rel.state : null;
  const distM = num((rel?.distance as { value?: unknown } | undefined)?.value);

  const idOf = (v: unknown) =>
    typeof v === "string" ? v.split("/").pop() ?? null : null;

  return {
    wfo,
    gridX,
    gridY,
    forecastUrl,
    stationsUrl,
    place: city ? `${city}${state ? `, ${state}` : ""}` : null,
    placeDistanceKm: distM === null ? null : distM / 1000,
    zone: idOf(p.forecastZone),
    county: idOf(p.county),
    radar: typeof p.radarStation === "string" ? p.radarStation : null,
    timeZone: typeof p.timeZone === "string" ? p.timeZone : null,
  };
}

/** Centro del polígono de la celda de rejilla (2,5 km) que responde por BRC. */
function polygonCenter(geometry: unknown): GridPoint | null {
  const coords = (geometry as { coordinates?: unknown } | null)?.coordinates;
  if (!Array.isArray(coords) || !Array.isArray(coords[0])) return null;
  const ring = coords[0] as unknown[];
  let lat = 0;
  let lon = 0;
  let n = 0;
  for (const c of ring) {
    if (!Array.isArray(c)) continue;
    const cLon = num(c[0]);
    const cLat = num(c[1]);
    if (cLon === null || cLat === null) continue;
    lon += cLon;
    lat += cLat;
    n++;
  }
  if (n === 0) return null;
  const point = { lat: lat / n, lon: lon / n };
  return {
    ...point,
    elevationM: null,
    distanceKm: haversineKm(BRC, point),
    bearing: bearingLabel(BRC, point),
  };
}

export async function getNwsForecast(point: NwsPoint): Promise<NwsForecast | null> {
  // units=si: el NWS devuelve por defecto °F y mph.
  const body = await getJson<{ properties?: Record<string, unknown>; geometry?: unknown }>(
    `${point.forecastUrl}?units=si`,
    REVALIDATE.forecast,
    NWS_HEADERS
  );
  const p = body?.properties;
  if (!p || !Array.isArray(p.periods)) return null;

  const elevation = p.elevation as { value?: unknown; unitCode?: unknown } | undefined;
  const elevationValue = num(elevation?.value);
  const elevationM =
    elevationValue === null
      ? null
      : typeof elevation?.unitCode === "string" && elevation.unitCode.includes("ft")
        ? elevationValue * 0.3048
        : elevationValue;

  const periods: NwsPeriod[] = [];
  for (const raw of p.periods as unknown[]) {
    const r = raw as Record<string, unknown>;
    const temp = num(r.temperature);
    const unit = typeof r.temperatureUnit === "string" ? r.temperatureUnit : "C";
    periods.push({
      name: typeof r.name === "string" ? r.name : "",
      startTime: typeof r.startTime === "string" ? r.startTime : "",
      isDaytime: r.isDaytime === true,
      tempC: temp === null ? null : unit === "F" ? ((temp - 32) * 5) / 9 : temp,
      wind: typeof r.windSpeed === "string" ? r.windSpeed : "",
      windDirection: typeof r.windDirection === "string" ? r.windDirection : "",
      precipProb: num((r.probabilityOfPrecipitation as { value?: unknown } | undefined)?.value),
      short: typeof r.shortForecast === "string" ? r.shortForecast : "",
      detailed: typeof r.detailedForecast === "string" ? r.detailedForecast : "",
    });
  }
  if (periods.length === 0) return null;

  return {
    periods,
    updated: typeof p.updated === "string" ? p.updated : null,
    elevationM,
    grid: polygonCenter(body?.geometry),
  };
}

export async function getNwsAlerts(): Promise<NwsAlert[]> {
  const body = await getJson<{ features?: unknown }>(
    `https://api.weather.gov/alerts/active?point=${BRC.lat},${BRC.lon}`,
    REVALIDATE.alerts,
    NWS_HEADERS
  );
  if (!Array.isArray(body?.features)) return [];

  const alerts: NwsAlert[] = [];
  for (const feature of body.features as unknown[]) {
    const p = (feature as { properties?: Record<string, unknown> })?.properties;
    if (!p || typeof p.event !== "string") continue;
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    alerts.push({
      event: p.event,
      headline: str(p.headline),
      severity: str(p.severity) ?? "Unknown",
      urgency: str(p.urgency) ?? "Unknown",
      areaDesc: str(p.areaDesc) ?? "",
      effective: str(p.effective),
      expires: str(p.expires),
      description: str(p.description) ?? "",
      instruction: str(p.instruction),
      sender: str(p.senderName),
    });
  }
  return alerts;
}

// ─────────────────────────────────────────────────────────
// Observaciones reales — lo único que no es un modelo
// ─────────────────────────────────────────────────────────

/**
 * Estaciones de referencia de la zona. Se usan como respaldo cuando el NWS no
 * devuelve su lista, y para poder nombrarlas aunque estén sin datos.
 * No hay ninguna en el playa: la más cercana es el PWS de Gerlach.
 */
export const REFERENCE_STATIONS = [
  {
    id: "F0371",
    name: "Gerlach (PWS Davis Vantage Pro2)",
    lat: 40.6533,
    lon: -119.3567,
    kind: "PWS — alimenta a NWS, Weather Underground (KNVGERLA7) y MesoWest",
  },
  {
    id: "88NV",
    name: "Aeropuerto de Black Rock City",
    lat: 40.7539,
    lon: -119.2119,
    kind: "Pista de tierra estacional — SIN METAR permanente",
  },
  {
    id: "KLOL",
    name: "Lovelock / Derby Field",
    lat: 40.0664,
    lon: -118.5654,
    kind: "METAR/ASOS oficial",
  },
  {
    id: "KWMC",
    name: "Winnemucca Municipal",
    lat: 40.8966,
    lon: -117.8064,
    kind: "METAR/ASOS oficial",
  },
  {
    id: "KRNO",
    name: "Reno-Tahoe International",
    lat: 39.4991,
    lon: -119.7681,
    kind: "METAR/ASOS — referencia regional (y el único nodo con ranking de fiabilidad)",
  },
] as const;

export interface ReferenceStation {
  id: string;
  name: string;
  kind: string;
  distanceKm: number;
  bearing: string;
}

/** Las estaciones de referencia con su distancia real al Hombre. */
export function referenceStations(): ReferenceStation[] {
  return REFERENCE_STATIONS.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    distanceKm: haversineKm(BRC, s),
    bearing: bearingLabel(BRC, s),
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}

interface NwsStationFeature {
  properties?: Record<string, unknown>;
  geometry?: { coordinates?: unknown };
}

/** Convierte un valor del NWS (`{value, unitCode}`) a la unidad que toca. */
function nwsValue(raw: unknown, to: "C" | "kmh" | "km" | "pct"): number | null {
  const obj = raw as { value?: unknown; unitCode?: unknown } | undefined;
  const v = num(obj?.value);
  if (v === null) return null;
  const unit = typeof obj?.unitCode === "string" ? obj.unitCode : "";
  switch (to) {
    case "C":
      return unit.includes("degF") ? ((v - 32) * 5) / 9 : v;
    case "kmh":
      // wmoUnit:m_s-1 en algunas estaciones, km_h-1 en otras.
      return unit.includes("m_s-1") ? v * 3.6 : v;
    case "km":
      return unit.includes("m") && !unit.includes("km") ? v / 1000 : v;
    default:
      return v;
  }
}

async function getNwsObservation(
  station: { id: string; name: string; lat: number; lon: number; elevationM: number | null }
): Promise<StationObservation | null> {
  const body = await getJson<{ properties?: Record<string, unknown> }>(
    `https://api.weather.gov/stations/${station.id}/observations/latest`,
    REVALIDATE.observation,
    NWS_HEADERS
  );
  const p = body?.properties;
  if (!p) return null;

  const point = { lat: station.lat, lon: station.lon };
  return {
    id: station.id,
    name: station.name,
    distanceKm: haversineKm(BRC, point),
    bearing: bearingLabel(BRC, point),
    elevationM: station.elevationM,
    timestamp: typeof p.timestamp === "string" ? p.timestamp : null,
    tempC: nwsValue(p.temperature, "C"),
    windKmh: nwsValue(p.windSpeed, "kmh"),
    gustKmh: nwsValue(p.windGust, "kmh"),
    humidity: nwsValue(p.relativeHumidity, "pct"),
    dewPointC: nwsValue(p.dewpoint, "C"),
    visibilityKm: nwsValue(p.visibility, "km"),
    text: typeof p.textDescription === "string" ? p.textDescription : null,
    source: "NWS",
  };
}

/** Las 3 estaciones METAR con datos reales más cercanas al Hombre. */
export async function getNwsObservations(point: NwsPoint): Promise<StationObservation[]> {
  const body = await getJson<{ features?: unknown }>(
    point.stationsUrl,
    REVALIDATE.stations,
    NWS_HEADERS
  );
  if (!Array.isArray(body?.features)) return [];

  const candidates = [];
  for (const raw of body.features as NwsStationFeature[]) {
    const id = raw?.properties?.stationIdentifier;
    const coords = raw?.geometry?.coordinates;
    if (typeof id !== "string" || !Array.isArray(coords)) continue;
    const lon = num(coords[0]);
    const lat = num(coords[1]);
    if (lat === null || lon === null) continue;
    candidates.push({
      id,
      name: typeof raw.properties?.name === "string" ? raw.properties.name : id,
      lat,
      lon,
      // La elevación del NWS viene ya en metros (wmoUnit:m).
      elevationM: num((raw.properties?.elevation as { value?: unknown } | undefined)?.value),
      distanceKm: haversineKm(BRC, { lat, lon }),
    });
  }

  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  const observations = await Promise.all(
    candidates.slice(0, 4).map((s) => getNwsObservation(s))
  );
  return observations.filter((o): o is StationObservation => o !== null).slice(0, 3);
}

/**
 * PWS de Gerlach vía Synoptic/MesoWest. Es la observación real más cercana al
 * playa (~19 km), pero la API pide token gratuito: sin `SYNOPTIC_TOKEN` la
 * sección simplemente no aparece.
 */
export async function getSynopticObservation(): Promise<StationObservation | null> {
  const token = process.env.SYNOPTIC_TOKEN;
  if (!token) return null;

  const body = await getJson<{ STATION?: unknown }>(
    `https://api.synopticdata.com/v2/stations/latest?stid=F0371&token=${token}&units=metric`,
    REVALIDATE.observation
  );
  const station = Array.isArray(body?.STATION) ? (body.STATION[0] as Record<string, unknown>) : null;
  if (!station) return null;

  const obs = station.OBSERVATIONS as Record<string, { value?: unknown; date_time?: unknown }> | undefined;
  const pick = (key: string) => num(obs?.[key]?.value);
  const lat = num(typeof station.LATITUDE === "string" ? Number(station.LATITUDE) : station.LATITUDE);
  const lon = num(typeof station.LONGITUDE === "string" ? Number(station.LONGITUDE) : station.LONGITUDE);
  const point = { lat: lat ?? 40.6533, lon: lon ?? -119.3567 };

  return {
    id: "F0371",
    name: typeof station.NAME === "string" ? station.NAME : "Gerlach PWS",
    distanceKm: haversineKm(BRC, point),
    bearing: bearingLabel(BRC, point),
    elevationM: num(Number(station.ELEVATION)) === null ? null : Number(station.ELEVATION) * 0.3048,
    timestamp:
      typeof obs?.air_temp_value_1?.date_time === "string" ? obs.air_temp_value_1.date_time : null,
    tempC: pick("air_temp_value_1"),
    windKmh: pick("wind_speed_value_1") === null ? null : pick("wind_speed_value_1")! * 3.6,
    gustKmh: pick("wind_gust_value_1") === null ? null : pick("wind_gust_value_1")! * 3.6,
    humidity: pick("relative_humidity_value_1"),
    dewPointC: pick("dew_point_temperature_value_1d"),
    visibilityKm: null,
    text: null,
    source: "Synoptic",
  };
}

// ─────────────────────────────────────────────────────────
// Semáforo de umbrales
// ─────────────────────────────────────────────────────────

/**
 * Escala de viento en seis tramos, para leer de un vistazo si el día es de
 * viento flojo, molesto o de los que arrancan sombras.
 *
 * Los tres cortes de arriba (40 / 64 / 80 km/h = 25 / 40 / 50 mph) son los
 * umbrales operativos del playa: sombras que fallan, whiteout y cierre de
 * puertas. Los dos de abajo salen del polvo, no de las estructuras:
 *
 * - La escala Beaufort sitúa "levanta polvo y papeles" en fuerza 4, es decir
 *   20-28 km/h, y eso es en terreno normal con vegetación.
 * - En lechos secos el umbral de emisión de PM10 está en velocidades de
 *   fricción de ~0,30-0,55 m/s, y el extremo bajo corresponde a las
 *   superficies *alteradas* — sin costra. Sobre un playa liso (z0 ~ 0,3-1 mm)
 *   esos 0,30 m/s son unos 25-30 km/h a 10 m de altura.
 * - BRC es el caso extremo de superficie alterada: 70.000 personas, bicis y
 *   art cars pulverizando la costra durante una semana.
 *
 * O sea: con 30 km/h el polvo ya vuela de forma continua. Llamar "moderado" a
 * eso sería engañoso, de ahí el tramo "Molesto".
 */
export type WindBandId =
  | "calma"
  | "polvo-suelto"
  | "molesto"
  | "fuerte"
  | "muy-fuerte"
  | "extremo";

export interface WindBand {
  id: WindBandId;
  label: string;
  /** Qué significa ese viento acampado en el desierto. */
  hint: string;
  minKmh: number;
  maxKmh: number;
}

export const WIND_BANDS: WindBand[] = [
  {
    id: "calma",
    label: "Calma",
    hint: "Ni te enteras. Día de montar cosas y de cocinar fuera.",
    minKmh: 0,
    maxKmh: 15,
  },
  {
    id: "polvo-suelto",
    label: "Polvo suelto",
    hint: "El polvo fino empieza a levantarse a ratos. Goggles a mano.",
    minKmh: 15,
    maxKmh: 25,
  },
  {
    id: "molesto",
    label: "Molesto",
    hint: "Polvo en el aire casi todo el rato: goggles puestos, mascarilla encima y cuesta cocinar.",
    minKmh: 25,
    maxKmh: GUST.warn,
  },
  {
    id: "fuerte",
    label: "Fuerte",
    hint: "Empiezan a fallar sombras y carpas mal ancladas. El NWS ya emite avisos de polvo.",
    minKmh: GUST.warn,
    maxKmh: GUST.high,
  },
  {
    id: "muy-fuerte",
    label: "Muy fuerte",
    hint: "Whiteout de polvo, visibilidad por debajo de 1 milla. No se circula.",
    minKmh: GUST.high,
    maxKmh: GUST.extreme,
  },
  {
    id: "extremo",
    label: "Extremo",
    hint: "Cierre de puertas y daños serios en campamento.",
    minKmh: GUST.extreme,
    maxKmh: Infinity,
  },
];

/** En qué tramo cae una ráfaga. El valor del corte va siempre al tramo superior. */
export function windBand(kmh: number | null): WindBand | null {
  if (kmh === null) return null;
  return WIND_BANDS.find((b) => kmh < b.maxKmh) ?? WIND_BANDS[WIND_BANDS.length - 1];
}

/**
 * Escala de lluvia, en mm acumulados en 24 h.
 *
 * En el playa la lluvia no se mide por lo que moja sino por lo que pega: el
 * lecho es arcilla que se hincha al mojarse y se convierte en un barro que se
 * agarra a botas, ruedas y cadenas. Por eso los tramos empiezan tan abajo:
 *
 * - Con la superficie mojada no se circula ni con 4x4 — el barro se pega en
 *   capas y frena bicis y coches. No hace falta que se inunde.
 * - La guía de travesía del Black Rock Desert dice que si ha llovido en las
 *   últimas 72 h, no se cruza el playa. En 2023 el suelo tardó entre dos y
 *   tres días en admitir tráfico otra vez.
 * - Y aun así lo de 2023 fueron 13-25 mm: 2-3 meses de lluvia de golpe, pero
 *   en absoluto una cifra grande. El daño lo hizo la arcilla, no el volumen.
 *
 * O sea: cualquier lluvia medible cambia el plan del día. Lo que cambia con
 * la cantidad es cuánto dura el problema.
 */
export type RainBandId = "seco" | "chispas" | "pegajoso" | "barro" | "cierre";

export interface RainBand {
  id: RainBandId;
  label: string;
  hint: string;
  minMm: number;
  maxMm: number;
}

export const RAIN_BANDS: RainBand[] = [
  {
    id: "seco",
    label: "Seco",
    hint: "Nada de agua. Polvo y a lo tuyo.",
    minMm: 0,
    maxMm: 0.1,
  },
  {
    id: "chispas",
    label: "Chispas",
    hint: "Cuatro gotas: asientan el polvo y dejan la superficie pegajosa un rato. Suele secar en horas.",
    minMm: 0.1,
    maxMm: 1,
  },
  {
    id: "pegajoso",
    label: "Pegajoso",
    hint: "Barro superficial: las ruedas se embozan y andar cuesta. No muevas el coche hasta que seque.",
    minMm: 1,
    maxMm: RAIN.mud,
  },
  {
    id: "barro",
    label: "Barro",
    hint: "El playa deja de ser transitable: ni bici ni coche, ni con 4x4. Puede tardar un día en secar.",
    minMm: RAIN.mud,
    maxMm: RAIN.closure,
  },
  {
    id: "cierre",
    label: "Cierre",
    hint: "Escenario 2023: puertas cerradas, refugio en el sitio y éxodo retrasado varios días.",
    minMm: RAIN.closure,
    maxMm: Infinity,
  },
];

/** En qué tramo cae una acumulación. El valor del corte va al tramo superior. */
export function rainBand(mm: number | null): RainBand | null {
  if (mm === null) return null;
  return RAIN_BANDS.find((b) => mm < b.maxMm) ?? RAIN_BANDS[RAIN_BANDS.length - 1];
}

/**
 * Cuánto pesa una probabilidad de lluvia aquí.
 *
 * En un sitio normal un 30% de probabilidad es "coge paraguas". Aquí es
 * "puede que mañana no puedas mover el coche", así que se avisa desde mucho
 * antes de lo que avisaría una app del tiempo cualquiera. La regla operativa
 * del meta-análisis es preparar el wet playa survival con >0,25" previstos y
 * más de un 40% de probabilidad.
 */
export type RainChanceId = "improbable" | "posible" | "probable" | "muy-probable";

export interface RainChance {
  id: RainChanceId;
  label: string;
  minPct: number;
}

export const RAIN_CHANCES: RainChance[] = [
  { id: "improbable", label: "Improbable", minPct: 0 },
  { id: "posible", label: "Posible", minPct: 10 },
  { id: "probable", label: "Probable", minPct: 30 },
  { id: "muy-probable", label: "Muy probable", minPct: 60 },
];

export function rainChance(pct: number | null): RainChance | null {
  if (pct === null) return null;
  return [...RAIN_CHANCES].reverse().find((c) => pct >= c.minPct) ?? RAIN_CHANCES[0];
}

export function gustSeverity(kmh: number | null): Severity {
  if (kmh === null) return "ok";
  if (kmh >= GUST.extreme) return "extreme";
  if (kmh >= GUST.high) return "high";
  if (kmh >= GUST.warn) return "warn";
  return "ok";
}

export function rainSeverity(mm: number | null): Severity {
  if (mm === null) return "ok";
  if (mm >= RAIN.closure) return "extreme";
  if (mm >= RAIN.mud) return "high";
  if (mm >= 1) return "warn";
  return "ok";
}

/** Los avisos accionables de un día concreto, ya en lenguaje de playa. */
export function dayFlags(
  day: Pick<DailyPoint, "tMaxC" | "tMinC" | "precipMm" | "precipProb" | "gustKmh" | "uvMax">
): { text: string; level: Severity }[] {
  const flags: { text: string; level: Severity }[] = [];

  const gust = gustSeverity(day.gustKmh);
  if (gust === "extreme") flags.push({ text: "Ráfagas >50 mph: riesgo de cierre de puertas y daños en campamento", level: "extreme" });
  else if (gust === "high") flags.push({ text: "Ráfagas >40 mph: whiteout de polvo, visibilidad <1 milla", level: "high" });
  else if (gust === "warn") flags.push({ text: "Ráfagas >25 mph: revisa anclajes de sombras y carpas", level: "warn" });

  // La lluvia se avisa desde la primera gota: en arcilla, lo que decide no es
  // cuánta cae sino que caiga. La cantidad solo dice cuánto dura el problema.
  const rain = rainBand(day.precipMm);
  if (rain?.id === "cierre")
    flags.push({ text: "Lluvia >0,5\": escenario 2023 — barro, cierre de puertas y refugio en el sitio", level: "extreme" });
  else if (rain?.id === "barro")
    flags.push({ text: "Lluvia >0,25\": el playa se vuelve barro pegajoso, ni bici ni coche", level: "high" });
  else if (rain?.id === "pegajoso")
    flags.push({ text: "Lluvia: barro superficial — las ruedas se embozan y el coche no se mueve hasta que seque", level: "warn" });
  else if (rain?.id === "chispas")
    flags.push({ text: "Chispas: asientan el polvo, pero dejan la superficie pegajosa un rato", level: "warn" });

  // Un 30% de probabilidad en el playa no es "coge paraguas": es "puede que
  // mañana no muevas el coche". Se avisa aunque los modelos no acumulen nada.
  const chance = rainChance(day.precipProb);
  if ((rain === null || rain.id === "seco" || rain.id === "chispas") && chance) {
    if (chance.id === "muy-probable")
      flags.push({ text: `${Math.round(day.precipProb!)} % de probabilidad de lluvia: prepara el plan de playa mojado`, level: "high" });
    else if (chance.id === "probable")
      flags.push({ text: `${Math.round(day.precipProb!)} % de probabilidad de lluvia: aquí cualquier chaparrón frena el día`, level: "warn" });
  }

  if (day.tMaxC !== null && day.tMaxC >= TEMP.heat)
    flags.push({ text: "Máxima >100°F: golpe de calor — mínimo 1 galón de agua por persona y día", level: "high" });
  if (day.tMinC !== null && day.tMinC <= TEMP.cold)
    flags.push({ text: "Mínima <50°F: frío nocturno, capas y abrigo en el outfit de noche", level: "warn" });
  if (day.uvMax !== null && day.uvMax >= UV_ALERT)
    flags.push({ text: `UV ${Math.round(day.uvMax)}: quema en minutos, protección total`, level: "warn" });

  return flags;
}

/**
 * Cuánta confianza merece el pronóstico según lo lejos que quede el evento.
 * Más allá de ~10-14 días no hay habilidad determinista y conviene decirlo.
 */
export function forecastSkill(daysToEvent: number): {
  level: "none" | "low" | "medium" | "high";
  title: string;
  body: string;
} {
  const falta = daysToEvent === 1 ? "Falta 1 día" : `Faltan ${daysToEvent} días`;
  if (daysToEvent > 14)
    return {
      level: "none",
      title: `${falta}: todavía no hay pronóstico con habilidad real`,
      body: "Más allá de 14 días ningún modelo determinista acierta para fechas concretas. Lo que se ve aquí es tendencia, no pronóstico. A partir del ~20 de agosto GFS y ECMWF empiezan a resolver el inicio del evento, y solo desde el ~26-28 tiene sentido mirar los días sueltos.",
    };
  if (daysToEvent > 7)
    return {
      level: "low",
      title: `${falta}: pronóstico orientativo`,
      body: "En el rango de 8 a 14 días solo es fiable el patrón general (¿entra humedad monzónica o no?). Mira la dispersión del ensemble antes que el número del día concreto.",
    };
  if (daysToEvent > 3)
    return {
      level: "medium",
      title: `${falta}: el pronóstico empieza a ser útil`,
      body: "Ya se puede planificar con él, pero las tormentas de tarde siguen sin estar resueltas hasta que entra el HRRR (48 h). Vigila el ensemble y los avisos del NWS.",
    };
  if (daysToEvent >= 0)
    return {
      level: "high",
      title: daysToEvent === 0 ? "Empieza hoy: pronóstico fiable" : `${falta}: pronóstico fiable`,
      body: "Dentro de 48 h manda el HRRR (3 km) y los avisos oficiales del NWS Reno. Es el momento de decidir anclajes, agua extra y ventana de llegada.",
    };
  return {
    level: "high",
    title: "Evento en curso",
    body: "En el playa manda lo que digan el BRC Dashboard, BMIR 94.5 FM y los avisos del NWS Reno: llegan antes que cualquier modelo.",
  };
}

// ─────────────────────────────────────────────────────────
// Bundle para la página
// ─────────────────────────────────────────────────────────

export interface WeatherBundle {
  models: ModelForecast[];
  air: AirQuality | null;
  ensemble: Ensemble | null;
  nwsPoint: NwsPoint | null;
  nwsForecast: NwsForecast | null;
  alerts: NwsAlert[];
  observations: StationObservation[];
  /** true si Synoptic está configurado (y por tanto hay dato de Gerlach). */
  hasSynoptic: boolean;
  /** Los días de ciudad, en San Francisco. */
  sf: ModelForecast | null;
}

export async function getWeatherBundle(): Promise<WeatherBundle> {
  // El punto del NWS hay que resolverlo antes: de él salen la URL del
  // pronóstico y la lista de estaciones. El resto va en paralelo.
  const [nwsPoint, models, air, ensemble, alerts, gerlach, sf] = await Promise.all([
    getNwsPoint(),
    Promise.all(MODELS.map((m) => getModelForecast(m))),
    getAirQuality(),
    getEnsemble(),
    getNwsAlerts(),
    getSynopticObservation(),
    getCityForecast(),
  ]);

  const [nwsForecast, nwsObservations] = await Promise.all([
    nwsPoint ? getNwsForecast(nwsPoint) : null,
    nwsPoint ? getNwsObservations(nwsPoint) : [],
  ]);

  return {
    models: models.filter((m): m is ModelForecast => m !== null),
    air,
    ensemble,
    nwsPoint,
    nwsForecast,
    alerts,
    observations: [...(gerlach ? [gerlach] : []), ...nwsObservations],
    hasSynoptic: gerlach !== null,
    sf,
  };
}
