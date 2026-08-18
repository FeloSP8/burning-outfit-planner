/** Formateo y colores compartidos por las secciones de la página del tiempo. */

import { cToF, kmhToMph, mmToInches, type Severity, type WindBandId } from "@/lib/weather";

const es = (n: number, digits = 1) =>
  n.toLocaleString("es-ES", { maximumFractionDigits: digits });

/** °C con su equivalente en °F, que es la unidad de todos los umbrales del playa. */
export function fmtTemp(c: number | null): string {
  return c === null ? "—" : `${Math.round(c)} °C · ${Math.round(cToF(c))} °F`;
}

export function fmtTempShort(c: number | null): string {
  return c === null ? "—" : `${Math.round(c)}°`;
}

/** Viento en km/h y mph (los umbrales de sombras y puertas están en mph). */
export function fmtWind(kmh: number | null): string {
  return kmh === null ? "—" : `${Math.round(kmh)} km/h · ${Math.round(kmhToMph(kmh))} mph`;
}

/** Lluvia en mm y pulgadas (0,25" es el umbral del barro). */
export function fmtRain(mm: number | null): string {
  if (mm === null) return "—";
  if (mm === 0) return "0 mm";
  return `${es(mm)} mm · ${es(mmToInches(mm), 2)}″`;
}

export function fmtKm(km: number | null): string {
  return km === null ? "—" : `${es(km)} km`;
}

export function fmtCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/** "sáb 30 ago" — la fecha ya viene en hora local del playa. */
export function fmtDate(date: string, long = false): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-ES", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
    timeZone: "UTC",
  });
}

/** Hora local del playa de una marca ISO. */
export function fmtPlayaTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

/** Semáforo de umbrales: verde arena → ámbar → rojo. */
export const SEV: Record<Severity, { chip: string; text: string; border: string }> = {
  ok: {
    chip: "bg-[#c4906a]/15 text-[#7a5030]",
    text: "text-[#2a1a08]",
    border: "border-[#c4906a]/40",
  },
  warn: {
    chip: "bg-amber-200/70 text-amber-900",
    text: "text-amber-800",
    border: "border-amber-400/70",
  },
  high: {
    chip: "bg-orange-300/70 text-orange-950",
    text: "text-orange-800",
    border: "border-orange-500/70",
  },
  extreme: {
    chip: "bg-red-300/80 text-red-950",
    text: "text-red-800",
    border: "border-red-500/70",
  },
};

/** Códigos WMO que devuelve Open-Meteo. */
const WMO: Record<number, [string, string]> = {
  0: ["☀️", "Despejado"],
  1: ["🌤️", "Casi despejado"],
  2: ["⛅", "Parcialmente nublado"],
  3: ["☁️", "Nublado"],
  45: ["🌫️", "Niebla"],
  48: ["🌫️", "Niebla helada"],
  51: ["🌦️", "Llovizna débil"],
  53: ["🌦️", "Llovizna"],
  55: ["🌦️", "Llovizna intensa"],
  61: ["🌧️", "Lluvia débil"],
  63: ["🌧️", "Lluvia"],
  65: ["🌧️", "Lluvia intensa"],
  80: ["🌦️", "Chubascos aislados"],
  81: ["🌧️", "Chubascos"],
  82: ["⛈️", "Chubascos torrenciales"],
  95: ["⛈️", "Tormenta"],
  96: ["⛈️", "Tormenta con granizo"],
  99: ["⛈️", "Tormenta fuerte con granizo"],
};

export function weatherCode(code: number | null): { emoji: string; label: string } {
  const hit = code === null ? undefined : WMO[code];
  return { emoji: hit?.[0] ?? "🌡️", label: hit?.[1] ?? "Sin dato" };
}

/**
 * Código de color del viento: rampa verde → rojo. El color va siempre
 * acompañado del nombre del tramo, para que no dependa de distinguir
 * matices — ni de ver bien el color.
 */
export const WIND_STYLE: Record<WindBandId, { chip: string; text: string; bar: string }> = {
  flojo: {
    chip: "bg-emerald-200/80 text-emerald-950",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
  },
  moderado: {
    chip: "bg-lime-200/80 text-lime-950",
    text: "text-lime-800",
    bar: "bg-lime-500",
  },
  fuerte: {
    chip: "bg-amber-300/80 text-amber-950",
    text: "text-amber-800",
    bar: "bg-amber-500",
  },
  "muy-fuerte": {
    chip: "bg-orange-400/80 text-orange-950",
    text: "text-orange-800",
    bar: "bg-orange-500",
  },
  extremo: {
    chip: "bg-red-400/90 text-red-950",
    text: "text-red-800",
    bar: "bg-red-600",
  },
};
