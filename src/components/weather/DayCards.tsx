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
  RAIN_BANDS,
  RAIN_CHANCES,
  WIND_BANDS,
  dayFlags,
  rainBand,
  rainChance,
  windBand,
  type DailyPoint,
  type Ensemble,
  type ModelForecast,
  type Severity,
} from "@/lib/weather";
import {
  CHANCE_STYLE,
  RAIN_STYLE,
  SEV,
  WIND_STYLE,
  fmtDate,
  fmtRain,
  fmtWind,
  rainBandRange,
  weatherCode,
  windBandRange,
} from "./format";

export interface DayConsensus {
  date: string;
  tMaxC: number | null;
  tMinC: number | null;
  tFeelsMaxC: number | null;
  tFeelsMinC: number | null;
  precipMm: number | null;
  precipProb: number | null;
  gustKmh: number | null;
  uvMax: number | null;
  code: number | null;
  /** Miembros del ensemble que dan lluvia medible, si el ensemble respondió. */
  ensembleRainPct: number | null;
  ensembleMembers: number | null;
  /** Los modelos no cuentan la misma historia para este día. */
  disagree: boolean;
  /** Peor bandera del día, si hay alguna. */
  worst: { text: string; level: Severity } | null;
  level: Severity;
}

const avg = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
const max = (xs: number[]) => (xs.length === 0 ? null : Math.max(...xs));

/** Resume el día de todos los modelos en una sola lectura conservadora. */
export function consensusFor(
  models: ModelForecast[],
  date: string,
  ensemble?: Ensemble | null
): DayConsensus | null {
  const days = models
    .map((m) => m.days.find((d) => d.date === date))
    .filter((d): d is DailyPoint => d !== undefined);
  if (days.length === 0) return null;

  const vals = (key: keyof DailyPoint) =>
    days.map((d) => d[key]).filter((v): v is number => typeof v === "number");

  const tMax = vals("tMaxC");
  const gusts = vals("gustKmh");
  const rains = vals("precipMm");
  const ens = ensemble?.days.find((d) => d.date === date) ?? null;

  // Peor caso en lo que hace daño (ráfaga y lluvia), media en lo que solo
  // informa (temperatura).
  const consensus: DayConsensus = {
    date,
    tMaxC: avg(tMax),
    tMinC: avg(vals("tMinC")),
    tFeelsMaxC: avg(vals("tFeelsMaxC")),
    tFeelsMinC: avg(vals("tFeelsMinC")),
    precipMm: max(rains),
    // La probabilidad buena es la del ensemble — cuántos de sus 31 miembros
    // mojan — y se usa tal cual: quedarse con el máximo entre ella y la de los
    // deterministas inflaría el número sin añadir información. Los
    // deterministas solo entran si el ensemble no ha respondido.
    precipProb: ens ? ens.rainAnyPct : max(vals("precipProb")),
    ensembleRainPct: ens?.rainAnyPct ?? null,
    ensembleMembers: ens?.members ?? null,
    gustKmh: max(gusts),
    uvMax: max(vals("uvMax")),
    code: days[0].code,
    disagree:
      (tMax.length > 1 && Math.max(...tMax) - Math.min(...tMax) > 4) ||
      (gusts.length > 1 && Math.max(...gusts) - Math.min(...gusts) > 20) ||
      (rains.length > 1 && rainBand(Math.max(...rains))?.id !== rainBand(Math.min(...rains))?.id),
    worst: null,
    level: "ok",
  };

  const flags = dayFlags(consensus);
  const order: Severity[] = ["extreme", "high", "warn"];
  consensus.worst = order.map((l) => flags.find((f) => f.level === l)).find(Boolean) ?? null;
  consensus.level = consensus.worst?.level ?? "ok";
  return consensus;
}

/**
 * Medidor de viento: cifra, nombre del tramo y una barra de cinco casillas
 * que se van encendiendo. La casilla es lo que responde "¿mucho o poco?" sin
 * tener que saberse los mph de memoria.
 */
function WindGauge({ kmh, compact = false }: { kmh: number | null; compact?: boolean }) {
  const band = windBand(kmh);
  const style = band ? WIND_STYLE[band.id] : null;
  const activeIndex = band ? WIND_BANDS.findIndex((b) => b.id === band.id) : -1;

  return (
    // En la lista los anchos van fijos para que las columnas de todos los días
    // caigan alineadas y se puedan comparar de un barrido vertical.
    <div className={compact ? "flex items-center gap-2" : "flex flex-col gap-1"}>
      <p
        className={`text-sm font-black tabular-nums ${
          compact ? "min-w-40 shrink-0 whitespace-nowrap" : ""
        } ${style?.text ?? "text-[#a07040]"}`}
      >
        💨 {fmtWind(kmh)}
        {!compact && <span className="ml-1 text-[11px] font-bold text-[#a07040]">en ráfaga</span>}
      </p>

      <div className="flex items-center gap-2">
        {band && (
          <span
            className={`shrink-0 rounded-lg px-2 py-0.5 text-center font-black uppercase tracking-wide ${
              compact ? "min-w-28 text-[10px] whitespace-nowrap" : "text-[11px]"
            } ${style!.chip}`}
          >
            {band.label}
          </span>
        )}
        <span className="flex gap-0.5" aria-hidden>
          {WIND_BANDS.map((b, i) => (
            <span
              key={b.id}
              className={`h-1.5 w-3 rounded-full ${
                i <= activeIndex ? WIND_STYLE[b.id].bar : "bg-[#c4906a]/25"
              }`}
            />
          ))}
        </span>
      </div>

      {/* La frase es lo que de verdad responde "¿y eso cómo se vive?". */}
      {!compact && band && (
        <p className="text-[11px] font-medium leading-snug text-[#7a5030]">{band.hint}</p>
      )}
    </div>
  );
}

/** Leyenda del código de color, para que la escala no haya que adivinarla. */
export function WindLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
      <span className="text-[11px] font-black uppercase tracking-widest text-[#a07040]">
        💨 Ráfagas
      </span>
      {WIND_BANDS.map((b) => (
        <span key={b.id} className="flex items-center gap-1.5" title={b.hint}>
          <span className={`h-2.5 w-2.5 rounded-full ${WIND_STYLE[b.id].bar}`} />
          <span className="text-[11px] font-bold text-[#2a1a08]">{b.label}</span>
          <span className="text-[11px] font-semibold tabular-nums text-[#a07040]">
            {windBandRange(b)}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Leyenda de la lluvia. Lleva su propia coletilla porque el reflejo de
 * cualquiera es mirar el milímetro y encogerse de hombros: aquí importa más
 * que caiga algo que cuánto caiga.
 */
export function RainLegend() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#a07040]">
          💧 Lluvia
        </span>
        {RAIN_BANDS.filter((b) => b.id !== "seco").map((b) => (
          <span key={b.id} className="flex items-center gap-1.5" title={b.hint}>
            <span className={`h-2.5 w-2.5 rounded-full ${RAIN_STYLE[b.id].bar}`} />
            <span className="text-[11px] font-bold text-[#2a1a08]">{b.label}</span>
            <span className="text-[11px] font-semibold tabular-nums text-[#a07040]">
              {rainBandRange(b)}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#c4906a]/20 pt-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#a07040]">
          Probabilidad
        </span>
        {RAIN_CHANCES.map((c) => (
          <span
            key={c.id}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums ${CHANCE_STYLE[c.id].chip}`}
          >
            {c.label} · ≥ {c.minPct} %
          </span>
        ))}
        <span className="text-[11px] font-medium text-[#7a5030]">
          Sale del ensemble cuando responde: cuántos de sus 31 miembros mojan.
        </span>
      </div>
    </div>
  );
}

/**
 * Medidor de lluvia. Va con la misma forma que el del viento, pero enseña dos
 * cosas en vez de una: cuánta agua y con qué probabilidad. La probabilidad se
 * pinta aunque la acumulación sea cero, porque en arcilla un chaparrón corto
 * que no acumula nada ya deja el suelo pegajoso.
 */
function RainGauge({
  mm,
  prob,
  ensemblePct,
  members,
  compact = false,
  city = false,
}: {
  mm: number | null;
  prob: number | null;
  ensemblePct?: number | null;
  members?: number | null;
  compact?: boolean;
  /** En ciudad la lluvia es lluvia: ni tramos de barro ni avisos de 4x4. */
  city?: boolean;
}) {
  const band = rainBand(mm);
  // En ciudad se enseña la cifra y la probabilidad, y se callan los tramos:
  // "Barro" o "Cierre" describen un lecho de arcilla, no una acera de SF.
  const style = band ? RAIN_STYLE[band.id] : null;
  const activeIndex = band ? RAIN_BANDS.findIndex((b) => b.id === band.id) : -1;
  const chance = rainChance(prob);
  const chanceStyle = chance ? CHANCE_STYLE[chance.id] : null;
  const showBand = !city && band && band.id !== "seco";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-col gap-1"}>
      <p
        className={`text-sm font-black tabular-nums ${
          compact ? "min-w-36 shrink-0 whitespace-nowrap" : ""
        } ${city ? (mm && mm >= 1 ? "text-sky-800" : "text-[#7a5030]") : (style?.text ?? "text-[#a07040]")}`}
      >
        💧 {fmtRain(mm)}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {showBand && (
          <span
            className={`shrink-0 rounded-lg px-2 py-0.5 text-center font-black uppercase tracking-wide ${
              compact ? "text-[10px] whitespace-nowrap" : "text-[11px]"
            } ${style!.chip}`}
          >
            {band.label}
          </span>
        )}
        {showBand && (
          <span className="flex gap-0.5" aria-hidden>
            {RAIN_BANDS.map((b, i) => (
              <span
                key={b.id}
                className={`h-1.5 w-3 rounded-full ${
                  i <= activeIndex ? RAIN_STYLE[b.id].bar : "bg-[#c4906a]/25"
                }`}
              />
            ))}
          </span>
        )}
        {chance && prob != null && (
          <span
            className={`shrink-0 rounded-lg px-2 py-0.5 font-bold tabular-nums ${
              compact ? "text-[10px] whitespace-nowrap" : "text-[11px]"
            } ${chanceStyle!.chip}`}
            title={
              ensemblePct != null && members
                ? `${ensemblePct} % de los ${members} miembros del ensemble dan lluvia medible`
                : undefined
            }
          >
            {Math.round(prob)} % · {chance.label}
          </span>
        )}
      </div>

      {!compact && showBand && (
        <p className="text-[11px] font-medium leading-snug text-[#7a5030]">{band!.hint}</p>
      )}

      {/* El caso traicionero: los modelos no acumulan nada pero medio ensemble
          moja. Sin esta frase, "0 mm" al lado de "70 %" parece un error. */}
      {!compact && !city && band?.id === "seco" && chance && chance.id !== "improbable" && prob != null && (
        <p className="text-[11px] font-medium leading-snug text-[#7a5030]">
          Sin acumulación prevista, pero {Math.round(prob)} % de probabilidad
          {ensemblePct != null && members ? ` (${ensemblePct} % de ${members} miembros)` : ""}: aquí
          basta un chaparrón corto para dejar el suelo pegajoso.
        </p>
      )}
    </div>
  );
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

      <div className="mt-3 flex flex-col gap-2 border-t border-[#c4906a]/25 pt-2">
        <WindGauge kmh={day.gustKmh} />
        <div className="border-t border-[#c4906a]/25 pt-2">
          <RainGauge
            mm={day.precipMm}
            prob={day.precipProb}
            ensemblePct={day.ensembleRainPct}
            members={day.ensembleMembers}
          />
        </div>
      </div>

      {/* Si lo peor del día es la probabilidad de lluvia y no hay acumulación,
          el medidor de arriba ya lo ha contado con más detalle: repetirlo en un
          chip solo añade ruido. El borde de la tarjeta mantiene el aviso. */}
      {day.worst && !(day.worst.text.includes("probabilidad de lluvia") && rainBand(day.precipMm)?.id === "seco") && (
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

/**
 * Tarjeta de ciudad, para los días de San Francisco.
 *
 * Aquí no manda la ráfaga sino la sensación térmica: en agosto la capa marina
 * deja tardes de 15 °C a dos manzanas de otras de 24, y la queja universal del
 * turista es haber ido en manga corta. Por eso la sensación va al lado del
 * termómetro y el viento solo aparece cuando de verdad aprieta.
 */
function CityDayCard({ date, day }: { date: string; day: DayConsensus | null }) {
  if (!day) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#c4906a]/40 bg-[#f6e6c8]/50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-wide text-[#a07040]">
          {fmtDate(date)}
        </p>
        <p className="mt-2 text-[11px] font-semibold text-[#a07040]">
          Todavía fuera del alcance de los modelos.
        </p>
      </div>
    );
  }

  const { emoji, label } = weatherCode(day.code);
  const band = windBand(day.gustKmh);
  // El viento en SF solo se menciona cuando cambia cómo hay que vestirse.
  const notableWind = band && ["fuerte", "muy-fuerte", "extremo"].includes(band.id);
  // Si la sensación se separa más de 2 °C de la temperatura, es la cifra que
  // importa: eso es el viento de la bahía o la niebla haciendo su trabajo.
  const feelsGap =
    day.tMaxC != null && day.tFeelsMaxC != null ? Math.abs(day.tMaxC - day.tFeelsMaxC) : 0;

  return (
    <div className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-[#7a2e08]">
          {fmtDate(date)}
        </p>
        <span className="text-2xl leading-none">{emoji}</span>
      </div>

      <p className="mt-1 text-3xl font-black leading-none tabular-nums text-[#2a1a08]">
        {day.tMaxC === null ? "—" : `${Math.round(day.tMaxC)}°`}
        <span className="ml-2 text-xl font-bold text-[#a07040]">
          {day.tMinC === null ? "" : `${Math.round(day.tMinC)}°`}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] font-bold text-[#7a5030]">{label}</p>

      {day.tFeelsMaxC != null && (
        <p
          className={`mt-1.5 text-xs font-black tabular-nums ${
            feelsGap >= 2 ? "text-sky-800" : "text-[#7a5030]"
          }`}
        >
          🌡️ Sensación {Math.round(day.tFeelsMaxC)}°
          {day.tFeelsMinC != null && ` / ${Math.round(day.tFeelsMinC)}°`}
          {feelsGap >= 2 && (
            <span className="ml-1 text-[10px] font-bold uppercase tracking-wide">
              {day.tFeelsMaxC < day.tMaxC! ? "más frío de lo que marca" : "más bochorno"}
            </span>
          )}
        </p>
      )}

      <div className="mt-2 border-t border-[#c4906a]/25 pt-2">
        <RainGauge mm={day.precipMm} prob={day.precipProb} city />
      </div>

      {notableWind && (
        <p className={`mt-2 text-[11px] font-bold ${WIND_STYLE[band.id].text}`}>
          💨 {fmtWind(day.gustKmh)} — viento de bahía, corta más de lo que dice el termómetro
        </p>
      )}
    </div>
  );
}

/** Los días de ciudad. Mismo motor, otras prioridades. */
export function CityDayGrid({
  dates,
  models,
}: {
  dates: string[];
  models: ModelForecast[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {dates.map((date) => (
        <CityDayCard key={date} date={date} day={consensusFor(models, date)} />
      ))}
    </div>
  );
}

export function DayCardGrid({
  dates,
  models,
  ensemble,
  emptyNote,
}: {
  dates: string[];
  models: ModelForecast[];
  ensemble?: Ensemble | null;
  emptyNote?: (date: string) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((date) => (
        <DayCard
          key={date}
          date={date}
          day={consensusFor(models, date, ensemble)}
          note={emptyNote?.(date)}
        />
      ))}
    </div>
  );
}

/** Lista compacta para los días previos: una línea por día, de un vistazo. */
export function DayList({
  dates,
  models,
  ensemble,
}: {
  dates: string[];
  models: ModelForecast[];
  ensemble?: Ensemble | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
      {dates.map((date, i) => {
        const day = consensusFor(models, date, ensemble);
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
            <span className="shrink-0">
              <WindGauge kmh={day?.gustKmh ?? null} compact />
            </span>
            <span className="shrink-0">
              <RainGauge mm={day?.precipMm ?? null} prob={day?.precipProb ?? null} compact />
            </span>
          </div>
        );
      })}
    </div>
  );
}
