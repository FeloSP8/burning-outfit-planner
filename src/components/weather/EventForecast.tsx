/**
 * Pronóstico por días: la tira corta de los próximos días y el detalle día a
 * día de la ventana del evento, con los dos modelos enfrentados y la
 * probabilidad del ensemble.
 *
 * Se enseñan los modelos por separado a propósito. Cuando GFS y ECMWF dicen lo
 * mismo, la confianza es alta; cuando discrepan, el número medio sería una
 * mentira cómoda — y en esta zona discrepan justo con las tormentas de tarde,
 * que son las que dejan el playa impracticable.
 */

import {
  EVENT,
  dayFlags,
  rainSeverity,
  windBand,
  type DailyPoint,
  type Ensemble,
  type ModelForecast,
} from "@/lib/weather";
import { SEV, WIND_STYLE, fmtDate, fmtRain, fmtTempShort, fmtWind, weatherCode } from "./format";

/** Todas las fechas `YYYY-MM-DD` entre dos extremos, inclusive. */
function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${start}T12:00:00Z`); t <= Date.parse(`${end}T12:00:00Z`); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

function ModelRow({ model, day }: { model: ModelForecast; day: DailyPoint | undefined }) {
  if (!day) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="w-28 shrink-0 text-[11px] font-black text-[#7a2e08]">{model.label}</span>
        <span className="text-[11px] font-medium text-[#a07040]">
          fuera de su horizonte de pronóstico
        </span>
      </div>
    );
  }

  const { emoji, label } = weatherCode(day.code);
  const band = windBand(day.gustKmh);
  const rain = rainSeverity(day.precipMm);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
      <span className="w-28 shrink-0 text-[11px] font-black text-[#7a2e08]">{model.label}</span>
      <span className="text-xs font-semibold text-[#2a1a08]">
        {emoji} {label}
      </span>
      <span className="text-xs font-bold tabular-nums text-[#2a1a08]">
        {fmtTempShort(day.tMaxC)} / {fmtTempShort(day.tMinC)}
      </span>
      <span className={`text-xs font-bold tabular-nums ${SEV[rain].text}`}>
        💧 {fmtRain(day.precipMm)}
        {day.precipProb != null && (
          <span className="font-semibold text-[#a07040]"> ({Math.round(day.precipProb)}%)</span>
        )}
      </span>
      <span
        className={`text-xs font-bold tabular-nums ${band ? WIND_STYLE[band.id].text : "text-[#a07040]"}`}
      >
        💨 {fmtWind(day.gustKmh)}
        {band && <span className="ml-1 text-[11px] font-black uppercase">{band.label}</span>}
      </span>
      {day.uvMax != null && (
        <span className="text-xs font-semibold tabular-nums text-[#7a5030]">
          UV {Math.round(day.uvMax)}
        </span>
      )}
    </div>
  );
}

function EnsembleRow({ day }: { day: Ensemble["days"][number] }) {
  const chip = (label: string, pct: number) => {
    const level = pct >= 40 ? "high" : pct >= 15 ? "warn" : "ok";
    return (
      <span
        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums ${SEV[level].chip}`}
      >
        {label} {pct}%
      </span>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-[#c4906a]/20 bg-[#f6e6c8]/60 px-4 py-2">
      <span className="w-28 shrink-0 text-[11px] font-black text-[#7a2e08]">
        Ensemble GFS
      </span>
      <span className="text-[11px] font-semibold text-[#a07040]">
        {day.members} miembros
      </span>
      {chip("lluvia medible", day.rainAnyPct)}
      {chip("lluvia >0,25″ (barro)", day.rainMudPct)}
      {chip("ráfagas >40 mph", day.gustHighPct)}
      {day.gustMedianKmh != null && (
        <span className="text-[11px] font-semibold tabular-nums text-[#7a5030]">
          ráfaga mediana {Math.round(day.gustMedianKmh)} km/h
          {day.gustMaxKmh != null && ` · peor miembro ${Math.round(day.gustMaxKmh)} km/h`}
        </span>
      )}
    </div>
  );
}

export function EventForecast({
  models,
  ensemble,
}: {
  models: ModelForecast[];
  ensemble: Ensemble | null;
}) {
  const dates = dateRange(EVENT.start, EVENT.end);
  const byModel = models.map((m) => ({ model: m, days: new Map(m.days.map((d) => [d.date, d])) }));
  const ensembleByDate = new Map((ensemble?.days ?? []).map((d) => [d.date, d]));

  return (
    <div className="flex flex-col gap-3">
      {dates.map((date) => {
        const rows = byModel.map(({ model, days }) => ({ model, day: days.get(date) }));
        const covered = rows.some((r) => r.day);
        // Las banderas se sacan del peor escenario entre modelos: si uno solo
        // ve barro, eso ya es motivo para preparar el campamento.
        const flags = rows
          .flatMap((r) => (r.day ? dayFlags(r.day) : []))
          .filter((f, i, all) => all.findIndex((x) => x.text === f.text) === i);
        const worst = flags.some((f) => f.level === "extreme")
          ? "extreme"
          : flags.some((f) => f.level === "high")
            ? "high"
            : flags.some((f) => f.level === "warn")
              ? "warn"
              : "ok";
        const ens = ensembleByDate.get(date);

        return (
          <div
            key={date}
            className={`overflow-hidden rounded-2xl border-2 bg-[#fdf4e0] ${SEV[worst].border}`}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-[#c4906a]/20 px-4 py-2">
              <span className="text-xs font-black uppercase tracking-wide text-[#7a2e08]">
                {fmtDate(date)}
              </span>
              {!covered && (
                <span className="rounded-lg bg-[#c4906a]/20 px-2 py-0.5 text-[11px] font-bold text-[#7a5030]">
                  sin pronóstico todavía
                </span>
              )}
              {flags.map((f) => (
                <span
                  key={f.text}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${SEV[f.level].chip}`}
                >
                  {f.text}
                </span>
              ))}
            </div>

            {covered ? (
              <>
                {rows.map(({ model, day }) => (
                  <ModelRow key={model.id} model={model} day={day} />
                ))}
                {ens && <EnsembleRow day={ens} />}
              </>
            ) : (
              <p className="px-4 py-3 text-xs font-medium leading-relaxed text-[#7a5030]">
                Este día cae más allá del horizonte de los modelos (16 días). Aparecerá solo
                cuando entre en rango; hasta entonces, lo único honesto es la climatología.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
