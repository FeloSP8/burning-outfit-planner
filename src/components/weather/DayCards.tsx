/**
 * La vista principal: un número por día y grande.
 *
 * Aquí los dos modelos se resumen en una sola lectura porque lo primero que
 * uno quiere saber es "¿qué día toca qué?". Cuando discrepan se enseña el peor
 * caso — en el playa pasarse de precavido cuesta unos lag screws, quedarse
 * corto cuesta el campamento — y se marca el día como "modelos discrepan".
 * El desglose por modelo y las probabilidades del ensemble viven abajo, en la
 * metodología, para quien quiera bajar a ese nivel.
 */

import {
  dayFlags,
  gustSeverity,
  rainSeverity,
  type DailyPoint,
  type ModelForecast,
  type Severity,
} from "@/lib/weather";
import { SEV, fmtDate, fmtRain, fmtWind, weatherCode } from "./format";

export interface DayConsensus {
  date: string;
  tMaxC: number | null;
  tMinC: number | null;
  precipMm: number | null;
  precipProb: number | null;
  gustKmh: number | null;
  uvMax: number | null;
  code: number | null;
  /** Los modelos no cuentan la misma historia para este día. */
  disagree: boolean;
  /** Peor bandera del día, si hay alguna. */
  worst: { text: string; level: Severity } | null;
  level: Severity;
}

const avg = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
const max = (xs: number[]) => (xs.length === 0 ? null : Math.max(...xs));

/** Resume el día de todos los modelos en una sola lectura conservadora. */
export function consensusFor(models: ModelForecast[], date: string): DayConsensus | null {
  const days = models
    .map((m) => m.days.find((d) => d.date === date))
    .filter((d): d is DailyPoint => d !== undefined);
  if (days.length === 0) return null;

  const vals = (key: keyof DailyPoint) =>
    days.map((d) => d[key]).filter((v): v is number => typeof v === "number");

  const tMax = vals("tMaxC");
  const gusts = vals("gustKmh");
  const rains = vals("precipMm");

  // Peor caso en lo que hace daño (ráfaga y lluvia), media en lo que solo
  // informa (temperatura).
  const consensus: DayConsensus = {
    date,
    tMaxC: avg(tMax),
    tMinC: avg(vals("tMinC")),
    precipMm: max(rains),
    precipProb: max(vals("precipProb")),
    gustKmh: max(gusts),
    uvMax: max(vals("uvMax")),
    code: days[0].code,
    disagree:
      (tMax.length > 1 && Math.max(...tMax) - Math.min(...tMax) > 4) ||
      (gusts.length > 1 && Math.max(...gusts) - Math.min(...gusts) > 20) ||
      (rains.length > 1 && rainSeverity(Math.max(...rains)) !== rainSeverity(Math.min(...rains))),
    worst: null,
    level: "ok",
  };

  const flags = dayFlags(consensus);
  const order: Severity[] = ["extreme", "high", "warn"];
  consensus.worst = order.map((l) => flags.find((f) => f.level === l)).find(Boolean) ?? null;
  consensus.level = consensus.worst?.level ?? "ok";
  return consensus;
}

/** Tarjeta grande: un vistazo y ya sabes cómo vestirte ese día. */
function DayCard({ date, day, note }: { date: string; day: DayConsensus | null; note?: string }) {
  if (!day) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-[#c4906a]/40 bg-[#f6e6c8]/50 px-4 py-4">
        <p className="text-sm font-black uppercase tracking-wide text-[#a07040]">
          {fmtDate(date)}
        </p>
        <p className="mt-6 text-xs font-semibold leading-relaxed text-[#a07040]">
          {note ?? "Todavía fuera del alcance de los modelos."}
        </p>
      </div>
    );
  }

  const { emoji, label } = weatherCode(day.code);
  const gust = gustSeverity(day.gustKmh);
  const rain = rainSeverity(day.precipMm);

  return (
    <div className={`rounded-2xl border-2 bg-[#fdf4e0] px-4 py-4 ${SEV[day.level].border}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black uppercase tracking-wide text-[#7a2e08]">
          {fmtDate(date)}
        </p>
        <span className="text-3xl leading-none">{emoji}</span>
      </div>

      <p className="mt-2 text-4xl font-black leading-none tabular-nums text-[#2a1a08]">
        {day.tMaxC === null ? "—" : `${Math.round(day.tMaxC)}°`}
        <span className="ml-2 text-2xl font-bold text-[#a07040]">
          {day.tMinC === null ? "" : `${Math.round(day.tMinC)}°`}
        </span>
      </p>
      <p className="mt-0.5 text-xs font-bold text-[#7a5030]">{label}</p>

      <div className="mt-3 flex flex-col gap-1 border-t border-[#c4906a]/25 pt-2">
        <p className={`text-sm font-black tabular-nums ${SEV[gust].text}`}>
          💨 {fmtWind(day.gustKmh)}
          <span className="ml-1 text-[11px] font-bold text-[#a07040]">en ráfaga</span>
        </p>
        <p className={`text-sm font-black tabular-nums ${SEV[rain].text}`}>
          💧 {fmtRain(day.precipMm)}
          {day.precipProb != null && (
            <span className="ml-1 text-[11px] font-bold text-[#a07040]">
              {Math.round(day.precipProb)} % de probabilidad
            </span>
          )}
        </p>
      </div>

      {day.worst && (
        <p
          className={`mt-3 rounded-xl px-2.5 py-1.5 text-[11px] font-bold leading-snug ${SEV[day.worst.level].chip}`}
        >
          {day.worst.text}
        </p>
      )}

      {day.disagree && (
        <p className="mt-2 text-[11px] font-semibold text-[#a07040]">
          ⚖️ Los modelos discrepan: se enseña el peor caso.
        </p>
      )}
    </div>
  );
}

export function DayCardGrid({
  dates,
  models,
  emptyNote,
}: {
  dates: string[];
  models: ModelForecast[];
  emptyNote?: (date: string) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((date) => (
        <DayCard
          key={date}
          date={date}
          day={consensusFor(models, date)}
          note={emptyNote?.(date)}
        />
      ))}
    </div>
  );
}

/** Lista compacta para los días previos: una línea por día, de un vistazo. */
export function DayList({ dates, models }: { dates: string[]; models: ModelForecast[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
      {dates.map((date, i) => {
        const day = consensusFor(models, date);
        const { emoji, label } = weatherCode(day?.code ?? null);
        return (
          <div
            key={date}
            className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 ${
              i > 0 ? "border-t border-[#c4906a]/20" : ""
            }`}
          >
            <span className="w-24 shrink-0 text-xs font-black uppercase text-[#7a2e08]">
              {fmtDate(date)}
            </span>
            <span className="w-40 shrink-0 text-xs font-semibold text-[#2a1a08]">
              {emoji} {label}
            </span>
            <span className="w-20 shrink-0 text-sm font-black tabular-nums text-[#2a1a08]">
              {day?.tMaxC == null ? "—" : `${Math.round(day.tMaxC)}°`}
              <span className="ml-1 text-xs font-bold text-[#a07040]">
                {day?.tMinC == null ? "" : `${Math.round(day.tMinC)}°`}
              </span>
            </span>
            <span
              className={`shrink-0 text-xs font-bold tabular-nums ${SEV[gustSeverity(day?.gustKmh ?? null)].text}`}
            >
              💨 {fmtWind(day?.gustKmh ?? null)}
            </span>
            <span
              className={`shrink-0 text-xs font-bold tabular-nums ${SEV[rainSeverity(day?.precipMm ?? null)].text}`}
            >
              💧 {fmtRain(day?.precipMm ?? null)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
