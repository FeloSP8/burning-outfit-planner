/**
 * Contenido fijo de la página del tiempo: umbrales accionables, climatología,
 * memoria de años anteriores y jerarquía de fuentes.
 *
 * Sale del meta-análisis de fuentes meteorológicas para BRC. Son datos que no
 * dependen de ninguna API: la climatología cambia de década en década y la
 * memoria del playa, nunca.
 */

export interface Threshold {
  variable: string;
  limit: string;
  consequence: string;
  level: "warn" | "high" | "extreme";
}

/** Los números que cambian el plan, no los que quedan bonitos. */
export const THRESHOLDS: Threshold[] = [
  {
    variable: "Ráfagas de viento",
    limit: "> 25-30 mph · 40-48 km/h",
    consequence: "Empiezan a fallar sombras y carpas mal ancladas. Lag screws largos.",
    level: "warn",
  },
  {
    variable: "Ráfagas de viento",
    limit: "> 40 mph · 64 km/h",
    consequence: "Whiteout de polvo, visibilidad < 1 milla. Difícil montar o mantener estructuras.",
    level: "high",
  },
  {
    variable: "Ráfagas de viento",
    limit: "> 50 mph · 80 km/h",
    consequence: "Cierre de puertas y daños graves a campamentos (pasó en 2025).",
    level: "extreme",
  },
  {
    variable: "Lluvia acumulada",
    limit: "> 0,25″ · 6-7 mm",
    consequence: "La arcilla del lecho se expande: barro pegajoso, ni bicis ni coches.",
    level: "high",
  },
  {
    variable: "Lluvia acumulada",
    limit: "> 0,5-1″ · 13-25 mm",
    consequence: "Cierre total y refugio en el sitio varios días (escenario 2023).",
    level: "extreme",
  },
  {
    variable: "Tormenta de tarde",
    limit: "cualquier % con monzón activo",
    consequence: "Las células son lentas y descargan mucha agua en poco sitio. Vigilar radar.",
    level: "warn",
  },
  {
    variable: "Mínima nocturna",
    limit: "< 50 °F · 10 °C",
    consequence: "Frío de desierto: capas y abrigo en el outfit de noche.",
    level: "warn",
  },
  {
    variable: "Máxima diurna",
    limit: "> 100 °F · 38 °C",
    consequence: "Golpe de calor. Mínimo 1 galón (3,8 L) de agua por persona y día.",
    level: "high",
  },
  {
    variable: "Índice UV",
    limit: "> 8 (casi diario)",
    consequence: "Quema en minutos. Protección total, incluso con polvo en suspensión.",
    level: "warn",
  },
  {
    variable: "Visibilidad por polvo",
    limit: "< 1 milla",
    consequence: "Máscara de partículas y goggles obligatorios. No circular.",
    level: "high",
  },
  {
    variable: "Avisos oficiales",
    limit: "Flash Flood / Dust Storm Warning",
    consequence: "Acción inmediata: no conducir y refugiarse. Manda el NWS, no el modelo.",
    level: "extreme",
  },
];

export interface PlayaYear {
  year: string;
  emoji: string;
  headline: string;
  body: string;
}

/** Qué ha pasado de verdad, que es el mejor calibrador de un pronóstico. */
export const PLAYA_MEMORY: PlayaYear[] = [
  {
    year: "2023",
    emoji: "🪣",
    headline: "El barro",
    body: "Del 1 al 3 de septiembre cayeron entre 0,5″ y ~1″ (13-25 mm) en un fin de semana: el equivalente a 2-3 meses de lluvia. Más de 70.000 personas atrapadas, refugio en el sitio y el Hombre quemado dos días tarde. No fue mucha agua en términos absolutos — fue la arcilla.",
  },
  {
    year: "2024",
    emoji: "😌",
    headline: "El mejor tiempo reciente",
    body: "Casi sin polvo y vientos máximos de ~5 mph durante la semana del Burn. Existe, pero no cuentes con ello.",
  },
  {
    year: "2025",
    emoji: "🌪️",
    headline: "Whiteout y luego lluvia",
    body: "Tormenta de polvo fuerte el 23-24 de agosto con ráfagas medidas > 50 mph (instrumentación temporal del aeropuerto de BRC), 4 heridos leves y puertas cerradas hasta 19 h. Después llovió el 24-25, lo que asentó el polvo; el playa se secó rápido.",
  },
];

/** Medias de Gerlach, el proxy climático del playa. */
export const CLIMATOLOGY = [
  { label: "Máxima media agosto", value: "32 °C · 89 °F" },
  { label: "Máxima media septiembre", value: "27 °C · 80 °F" },
  { label: "Mínima media", value: "16 °C · 60 °F" },
  { label: "Precipitación mensual", value: "5-8 mm · 0,2-0,3″" },
  { label: "Humedad relativa (sep)", value: "~23 %" },
  { label: "Días de lluvia al mes", value: "~3" },
];

export interface SourceLink {
  emoji: string;
  name: string;
  url: string;
  role: string;
  rank: 1 | 2 | 3 | 4;
}

/** Jerarquía operativa recomendada, de más autoridad a más comodidad. */
export const SOURCES: SourceLink[] = [
  {
    emoji: "🏛️",
    name: "NWS Reno — point forecast de BRC",
    url: "https://forecast.weather.gov/MapClick.php?lat=40.7864&lon=-119.2065",
    role: "Fuente primaria. Pronóstico humano con conocimiento del terreno y avisos oficiales.",
    rank: 1,
  },
  {
    emoji: "🚨",
    name: "Avisos activos (api.weather.gov)",
    url: "https://api.weather.gov/alerts/active?point=40.7864,-119.2065",
    role: "Flash flood, dust storm, high wind y excessive heat en crudo.",
    rank: 1,
  },
  {
    emoji: "🛰️",
    name: "Open-Meteo — multi-modelo",
    url: "https://open-meteo.com/en/docs",
    role: "Contraste horario de ráfagas, lluvia y polvo entre GFS+HRRR y ECMWF, con ensembles.",
    rank: 2,
  },
  {
    emoji: "📡",
    name: "GerlachWeather.com (PWS KNVGERLA7 · F0371)",
    url: "https://www.gerlachweather.com/",
    role: "La observación real más cercana al playa. Alimenta al NWS, a Weather Underground y a MesoWest.",
    rank: 3,
  },
  {
    emoji: "🔥",
    name: "BRC Dashboard — meteorólogo oficial",
    url: "https://brcdashboard.burningman.org/",
    role: "Hay un meteorólogo en el sitio: publica pronóstico y avisos de tráfico a diario. Revisar antes de salir.",
    rank: 3,
  },
  {
    emoji: "📻",
    name: "BMIR 94.5 FM",
    url: "https://bmir.org/",
    role: "Los boletines oficiales en el playa. En 2023 fue el canal por el que se pidió refugio.",
    rank: 3,
  },
  {
    emoji: "🌬️",
    name: "Windy",
    url: "https://www.windy.com/40.786/-119.207",
    role: "Para ver el viento y las tormentas por capas, no para los números finos.",
    rank: 4,
  },
  {
    emoji: "📊",
    name: "ForecastAdvisor — Reno, NV",
    url: "https://www.forecastadvisor.com/forecast/us/reno-nv/",
    role: "Ranking independiente de precisión por proveedor. El nodo evaluable más cercano es Reno, a ~151 km del Hombre.",
    rank: 4,
  },
];
