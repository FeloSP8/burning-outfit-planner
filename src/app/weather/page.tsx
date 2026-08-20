import { getCurrentUser } from "@/lib/auth";
import {
  BRC,
  EVENT,
  SF_STAY,
  daysBetween,
  forecastSkill,
  getWeatherBundle,
  playaToday,
} from "@/lib/weather";
import { CLIMATOLOGY, PLAYA_MEMORY, SOURCES, THRESHOLDS } from "@/lib/weather-guide";
import { CityDayGrid, DayCardGrid, DayList, RainLegend, WindLegend } from "@/components/weather/DayCards";
import { WeatherRegions } from "@/components/weather/WeatherRegions";
import { EventForecast } from "@/components/weather/EventForecast";
import { SEV, fmtCoords, fmtKm, fmtPlayaTime, fmtTemp, fmtWind } from "@/components/weather/format";

export const metadata = {
  title: "El tiempo · Burning Outfit Planner",
  description:
    "Pronóstico diario para Black Rock City: temperatura, ráfagas y lluvia día a día, con la metodología detrás.",
};

/** Los datos se cachean por fetch (30 min el pronóstico, 5 los avisos). */
export const revalidate = 300;

/** Todas las fechas `YYYY-MM-DD` entre dos extremos, inclusive. */
function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${start}T12:00:00Z`); t <= Date.parse(`${end}T12:00:00Z`); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Los N días a partir de hoy. */
function nextDays(from: string, n: number): string[] {
  const start = Date.parse(`${from}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) =>
    new Date(start + i * 86_400_000).toISOString().slice(0, 10)
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <p
        className="text-2xl text-[#7a2e08] sm:text-3xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {children}
      </p>
      {sub && <p className="mt-1 text-xs font-medium text-[#7a5030]">{sub}</p>}
    </div>
  );
}

/**
 * Bloque plegable. Todo lo que no es "qué tiempo va a hacer el día X" vive
 * aquí dentro: sigue disponible, pero no se cruza por delante.
 */
function Details({
  emoji,
  title,
  sub,
  children,
}: {
  emoji: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f6e6c8]">
        <span className="text-base leading-none">{emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black leading-tight text-[#2a1a08]">{title}</span>
          <span className="block text-[11px] font-semibold text-[#a07040]">{sub}</span>
        </span>
        <span className="shrink-0 text-sm font-black text-[#c84a10] transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="border-t border-[#c4906a]/20 px-4 py-4">{children}</div>
    </details>
  );
}

function SourceDown({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#c4906a]/50 bg-[#f6e6c8]/60 px-4 py-3">
      <p className="text-xs font-semibold text-[#7a5030]">
        {what} no responde ahora mismo. El resto de la página sigue siendo válido; vuelve a
        cargar en unos minutos.
      </p>
    </div>
  );
}

export default async function WeatherPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const bundle = await getWeatherBundle();
  const today = playaToday();
  const daysToEvent = daysBetween(today, EVENT.start);
  const skill = forecastSkill(daysToEvent);
  // Un día que ya ha pasado no es pronóstico, es historia: todas las secciones
  // se recortan a partir de hoy y desaparecen solas cuando se vacían.
  const eventDates = dateRange(EVENT.start, EVENT.end).filter((d) => d >= today);
  const sfDates = SF_STAY.dates.filter((d) => d >= today);

  // La tendencia va al final, y es del playa (no de dondequiera que se esté
  // parado ese día): los días que quedan antes de que empiece el evento, para
  // ver por dónde va el patrón mientras aún no hay tarjeta propia para ellos.
  // Si el evento ya ha pasado del todo, vuelve a ser lo que dice su nombre:
  // los próximos siete días.
  const preEventDates = nextDays(today, 7).filter((d) => d < EVENT.start);
  const trendDates = preEventDates.length > 0 ? preEventDates : eventDates.length === 0 ? nextDays(today, 7) : [];

  const hasModels = bundle.models.length > 0;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          El tiempo en el playa
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Black Rock City · 30 de agosto – 7 de septiembre de 2026
        </p>
      </div>

      {/* Avisos oficiales: solo si los hay, y en corto */}
      {bundle.alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {bundle.alerts.map((alert) => (
            <div
              key={`${alert.event}-${alert.effective}`}
              className="rounded-2xl border-2 border-red-500/70 bg-red-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[11px] font-black uppercase text-white">
                  🚨 {alert.event}
                </span>
                <span className="text-[11px] font-bold text-red-900">
                  hasta {fmtPlayaTime(alert.expires)}
                </span>
              </div>
              {alert.headline && (
                <p className="mt-2 text-xs font-black text-red-950">{alert.headline}</p>
              )}
              {alert.instruction && (
                <p className="mt-1 text-xs font-bold leading-relaxed text-red-950">
                  {alert.instruction}
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-bold text-red-800">
                  Ver aviso completo
                </summary>
                <p className="mt-1 whitespace-pre-line text-[11px] font-medium leading-relaxed text-red-900">
                  {alert.description}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-red-800">
                  {alert.areaDesc}
                  {alert.sender && ` · ${alert.sender}`}
                </p>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* San Francisco: los días de ciudad, antes de coger el RV */}
      {bundle.sf && sfDates.length > 0 && (
        <div>
          <SectionTitle sub="Los días de ciudad, antes de coger el RV. Aquí lo que decide el día es la sensación térmica y la lluvia, no la ráfaga.">
            San Francisco
          </SectionTitle>

          <div className="mb-3 rounded-2xl border-2 border-[#c4906a]/40 bg-[#f6e6c8]/60 px-4 py-3">
            <p className="text-[11px] font-medium leading-relaxed text-[#7a5030]">
              Verano en SF es al revés de lo que uno espera: la capa marina deja tardes de 15 °C
              con niebla mientras el interior de la bahía va a 30. Y los microclimas son brutales
              — el Sunset y el Mission se llevan varios grados a cinco kilómetros. Esto es el
              centro (Union Square): pegado a la costa, más frío y más viento.
            </p>
          </div>

          <CityDayGrid dates={sfDates} models={[bundle.sf]} />
        </div>
      )}

      {/* El playa, día a día */}
      {eventDates.length > 0 && (
        <div>
          <SectionTitle sub="Máxima y mínima, ráfaga máxima y lluvia acumulada. Un vistazo por día.">
            La semana del evento
          </SectionTitle>

          {!hasModels ? (
            <SourceDown what="El pronóstico" />
          ) : (
            <DayCardGrid
              dates={eventDates}
              models={bundle.models}
              ensemble={bundle.ensemble}
              emptyNote={(date) =>
                `Faltan ${daysBetween(today, date)} días. Ningún modelo llega tan lejos todavía.`
              }
            />
          )}

          <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#a07040]">
            <span className="font-bold">{skill.title}.</span> {skill.body}
          </p>

          {/* La leyenda va debajo: se consulta cuando un color extraña, no antes
              de haber visto un solo día. */}
          {hasModels && (
            <div className="mt-4 flex flex-col gap-2">
              <WindLegend />
              <RainLegend />
            </div>
          )}
        </div>
      )}

      {/* La tendencia, al final: playa, antes del evento. Es la que responde
          "¿por dónde va la cosa?" mientras aún no hay tarjeta propia para esos
          días. */}
      {hasModels && trendDates.length > 0 && (
        <div>
          <SectionTitle
            sub={
              eventDates.length > 0
                ? "El desierto en los días antes de llegar: viaje, compras y montaje."
                : "Lo que viene en el playa."
            }
          >
            Tendencia previa
          </SectionTitle>
          <DayList dates={trendDates} models={bundle.models} ensemble={bundle.ensemble} />
        </div>
      )}

      {/* Todo lo demás, plegado */}
      <div className="flex flex-col gap-3">
        <p
          className="mt-2 text-2xl text-[#7a2e08] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          La letra pequeña
        </p>

        <Details
          emoji="📍"
          title="Sobre qué se pronostica exactamente"
          sub="No hay ninguna estación en el playa: qué punto responde por BRC en cada fuente"
        >
          <WeatherRegions
            nwsPoint={bundle.nwsPoint}
            nwsForecast={bundle.nwsForecast}
            models={bundle.models}
            air={bundle.air}
            sf={bundle.sf}
          />
        </Details>

        <Details
          emoji="⚖️"
          title="Los modelos, uno a uno"
          sub="GFS+HRRR frente a ECMWF sin promediar, y la probabilidad real del ensemble"
        >
          {!hasModels ? (
            <SourceDown what="Open-Meteo" />
          ) : (
            <>
              <p className="mb-3 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                Arriba se enseña el peor caso entre modelos. Aquí está el desglose: cuando GFS y
                ECMWF coinciden, la confianza es alta; cuando discrepan, esa discrepancia es la
                información. El ensemble convierte eso en probabilidad real contando cuántos de
                sus 31 miembros cruzan cada umbral.
              </p>
              <EventForecast models={bundle.models} ensemble={bundle.ensemble} />
            </>
          )}
        </Details>

        <Details
          emoji="🏛️"
          title="Pronóstico oficial del NWS Reno"
          sub={
            bundle.nwsPoint
              ? `WFO ${bundle.nwsPoint.wfo} · celda ${bundle.nwsPoint.gridX},${bundle.nwsPoint.gridY}${
                  bundle.nwsForecast?.updated
                    ? ` · actualizado ${fmtPlayaTime(bundle.nwsForecast.updated)}`
                    : ""
                }`
              : "La fuente con autoridad y la única que emite avisos"
          }
        >
          {!bundle.nwsForecast ? (
            <SourceDown what="api.weather.gov" />
          ) : (
            <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
              {bundle.nwsForecast.periods.slice(0, 8).map((period, i) => (
                <div
                  key={period.startTime}
                  className={`px-4 py-3 ${i > 0 ? "border-t border-[#c4906a]/20" : ""} ${
                    period.isDaytime ? "" : "bg-[#f6e6c8]/50"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs font-black text-[#7a2e08]">
                      {period.isDaytime ? "☀️" : "🌙"} {period.name}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[#2a1a08]">
                      {fmtTemp(period.tempC)}
                    </span>
                    {period.wind && (
                      <span className="text-xs font-semibold text-[#7a5030]">
                        💨 {period.wind} {period.windDirection}
                      </span>
                    )}
                    {period.precipProb != null && (
                      <span className="text-xs font-semibold text-[#7a5030]">
                        💧 {Math.round(period.precipProb)} %
                      </span>
                    )}
                    <span className="ml-auto text-[11px] font-bold text-[#a07040]">
                      {period.short}
                    </span>
                  </div>
                  {i < 3 && period.detailed && (
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                      {period.detailed}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Details>

        <Details
          emoji="📡"
          title="Qué se está midiendo ahora"
          sub="Lo único de esta página que no es un modelo: las estaciones de alrededor"
        >
          {bundle.observations.length === 0 ? (
            <SourceDown what="Las estaciones de observación" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.observations.map((obs) => (
                <div
                  key={`${obs.source}-${obs.id}`}
                  className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3"
                >
                  <p className="text-xs font-black leading-tight text-[#2a1a08]">{obs.name}</p>
                  <p className="text-[11px] font-semibold text-[#a07040]">
                    {obs.id} · {fmtKm(obs.distanceKm)} al {obs.bearing} · {obs.source}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#c4906a]/20 pt-2">
                    <span className="text-xs font-bold tabular-nums text-[#2a1a08]">
                      🌡️ {fmtTemp(obs.tempC)}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[#7a5030]">
                      💨 {fmtWind(obs.windKmh)}
                      {obs.gustKmh != null && ` · ráfaga ${Math.round(obs.gustKmh)} km/h`}
                    </span>
                    {obs.humidity != null && (
                      <span className="text-xs font-semibold tabular-nums text-[#7a5030]">
                        💦 {Math.round(obs.humidity)} %
                      </span>
                    )}
                    {obs.visibilityKm != null && (
                      <span className="text-xs font-semibold tabular-nums text-[#7a5030]">
                        👁️ {Math.round(obs.visibilityKm)} km
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] font-medium text-[#a07040]">
                    {obs.text ? `${obs.text} · ` : ""}
                    {fmtPlayaTime(obs.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!bundle.hasSynoptic && (
            <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#a07040]">
              El PWS de Gerlach (Synoptic <span className="font-bold">F0371</span> / Weather
              Underground <span className="font-bold">KNVGERLA7</span>) es la observación más
              cercana al playa, pero su API pide un token gratuito. Con{" "}
              <span className="font-bold">SYNOPTIC_TOKEN</span> en el entorno aparecería aquí
              arriba; mientras tanto, sus datos en vivo están en{" "}
              <a
                href="https://www.gerlachweather.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#c84a10] underline underline-offset-2"
              >
                gerlachweather.com
              </a>
              .
            </p>
          )}
        </Details>

        <Details
          emoji="🌪️"
          title="Polvo y calidad del aire"
          sub="Polvo en suspensión y PM10 de CAMS, día a día"
        >
          {!bundle.air ? (
            <SourceDown what="La API de calidad del aire de Open-Meteo" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {bundle.air.days.map((day) => {
                const pm10 = day.pm10Max;
                const level =
                  pm10 == null ? "ok" : pm10 >= 150 ? "extreme" : pm10 >= 50 ? "warn" : "ok";
                return (
                  <div
                    key={day.date}
                    className={`rounded-2xl border-2 bg-[#fdf4e0] px-3 py-2.5 ${SEV[level].border}`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
                      {new Date(`${day.date}T12:00:00Z`).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-black tabular-nums text-[#2a1a08]">
                      {day.dustMax == null ? "—" : `${Math.round(day.dustMax)} µg/m³`}
                    </p>
                    <p className="text-[11px] font-semibold text-[#a07040]">polvo (máx. del día)</p>
                    <p className={`mt-1 text-[11px] font-bold tabular-nums ${SEV[level].text}`}>
                      PM10 {pm10 == null ? "—" : `${Math.round(pm10)} µg/m³`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Details>

        <Details
          emoji="📏"
          title="Umbrales que cambian el plan"
          sub="De dónde salen los colores de las tarjetas de arriba"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-[#c4906a]/20 text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
                  <th className="py-2 pr-4">Variable</th>
                  <th className="py-2 pr-4">Umbral</th>
                  <th className="py-2">Consecuencia</th>
                </tr>
              </thead>
              <tbody>
                {THRESHOLDS.map((t) => (
                  <tr
                    key={`${t.variable}-${t.limit}`}
                    className="border-b border-[#c4906a]/10 last:border-0"
                  >
                    <td className="py-2 pr-4 text-xs font-bold text-[#2a1a08]">{t.variable}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums ${SEV[t.level].chip}`}
                      >
                        {t.limit}
                      </span>
                    </td>
                    <td className="py-2 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                      {t.consequence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Details>

        <Details
          emoji="📚"
          title="Climatología y memoria del playa"
          sub="Lo que suele hacer en estas fechas y lo que pasó en 2023, 2024 y 2025"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CLIMATOLOGY.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#f6e6c8]/60 px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
                  {c.label}
                </p>
                <p className="text-sm font-black tabular-nums text-[#2a1a08]">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {PLAYA_MEMORY.map((y) => (
              <div
                key={y.year}
                className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#f6e6c8]/60 px-4 py-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-base leading-none">{y.emoji}</span>
                  <span className="text-sm font-black text-[#7a2e08]">{y.year}</span>
                  <span className="text-xs font-bold text-[#2a1a08]">{y.headline}</span>
                </div>
                <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                  {y.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#a07040]">
            Contexto de 2026: El Niño en fortalecimiento y monzón norteamericano pronosticado
            activo. Eso inclina las probabilidades hacia más humedad y tormentas de tarde a
            finales de agosto que en un año seco — pero la señal a escala de nueve días es débil
            y no dice nada de fechas concretas.
          </p>
        </Details>

        <Details
          emoji="🔗"
          title="Fuentes"
          sub="Ninguna app es fiable por sí sola aquí: este es el orden en que conviene mirarlas"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#f6e6c8]/60 px-4 py-3 transition-colors hover:border-[#c84a10]/50 hover:bg-[#f6e6c8]"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black leading-tight text-[#2a1a08]">
                      {s.name}
                      <span className="ml-2 rounded-md bg-[#c4906a]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#7a5030]">
                        nivel {s.rank}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                      {s.role}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Details>
      </div>

      <p className="text-[11px] font-medium text-[#a07040]">
        Punto de referencia: el Hombre, {fmtCoords(BRC.lat, BRC.lon)} · {BRC.elevationM} m.
        {bundle.alerts.length === 0 && " Sin avisos oficiales activos ahora mismo."}
      </p>
    </div>
  );
}
