import { getCurrentUser } from "@/lib/auth";
import {
  BRC,
  EVENT,
  daysBetween,
  forecastSkill,
  getWeatherBundle,
  playaToday,
} from "@/lib/weather";
import { CLIMATOLOGY, PLAYA_MEMORY, SOURCES, THRESHOLDS } from "@/lib/weather-guide";
import { WeatherRegions } from "@/components/weather/WeatherRegions";
import { EventForecast, NextDaysStrip } from "@/components/weather/EventForecast";
import { SEV, fmtCoords, fmtKm, fmtPlayaTime, fmtTemp, fmtWind } from "@/components/weather/format";

export const metadata = {
  title: "El tiempo · Burning Outfit Planner",
  description:
    "Pronóstico para Black Rock City: NWS Reno, contraste multi-modelo y observaciones reales de las estaciones cercanas.",
};

/** Los datos se cachean por fetch (30 min el pronóstico, 5 los avisos). */
export const revalidate = 300;

const SKILL_STYLE = {
  none: "border-[#c4906a]/50 bg-[#f6e6c8]",
  low: "border-amber-400/70 bg-amber-50",
  medium: "border-orange-400/60 bg-orange-50",
  high: "border-emerald-500/50 bg-emerald-50",
} as const;

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
  const primaryModel = bundle.models[0];

  return (
    <div className="flex flex-col gap-10">

      {/* Header */}
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          El tiempo en el playa
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Black Rock City · {fmtCoords(BRC.lat, BRC.lon)} · {BRC.elevationM} m · evento del 30 de
          agosto al 7 de septiembre de 2026
        </p>
      </div>

      {/* Cuánta confianza merece esto hoy */}
      <div className={`rounded-2xl border-2 px-4 py-4 ${SKILL_STYLE[skill.level]}`}>
        <div className="flex items-start gap-2">
          <span className="text-base leading-none">
            {skill.level === "high" ? "✅" : skill.level === "none" ? "🔮" : "⏳"}
          </span>
          <div>
            <p className="text-sm font-black text-[#2a1a08]">{skill.title}</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-[#7a5030]">{skill.body}</p>
          </div>
        </div>
      </div>

      {/* Avisos oficiales — lo único que exige actuar ya */}
      <div>
        <SectionTitle sub="Emitidos por el NWS Reno para el punto de BRC. Son los que mandan sobre cualquier modelo.">
          Avisos activos
        </SectionTitle>

        {bundle.alerts.length === 0 ? (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold text-emerald-900">
              Sin avisos activos ahora mismo para las coordenadas de Black Rock City.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bundle.alerts.map((alert) => (
              <div
                key={`${alert.event}-${alert.effective}`}
                className="rounded-2xl border-2 border-red-500/70 bg-red-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[11px] font-black uppercase text-white">
                    {alert.event}
                  </span>
                  <span className="text-[11px] font-bold text-red-900">
                    Severidad {alert.severity} · urgencia {alert.urgency}
                  </span>
                  <span className="ml-auto text-[11px] font-semibold text-red-800">
                    hasta {fmtPlayaTime(alert.expires)}
                  </span>
                </div>
                {alert.headline && (
                  <p className="mt-2 text-xs font-black text-red-950">{alert.headline}</p>
                )}
                <p className="mt-1 whitespace-pre-line text-xs font-medium leading-relaxed text-red-900">
                  {alert.description}
                </p>
                {alert.instruction && (
                  <p className="mt-2 border-t border-red-300 pt-2 text-xs font-bold leading-relaxed text-red-950">
                    {alert.instruction}
                  </p>
                )}
                <p className="mt-2 text-[11px] font-semibold text-red-800">
                  {alert.areaDesc}
                  {alert.sender && ` · ${alert.sender}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* De qué sitio es este pronóstico, exactamente */}
      <WeatherRegions
        nwsPoint={bundle.nwsPoint}
        nwsForecast={bundle.nwsForecast}
        models={bundle.models}
        air={bundle.air}
      />

      {/* La semana del evento */}
      <div>
        <SectionTitle sub="Los dos modelos enfrentados, día a día. Si coinciden, fíate; si discrepan, la incertidumbre es la noticia.">
          La semana del evento
        </SectionTitle>

        {bundle.models.length === 0 ? (
          <SourceDown what="Open-Meteo" />
        ) : (
          <EventForecast models={bundle.models} ensemble={bundle.ensemble} />
        )}
      </div>

      {/* Próximos días — útiles para el viaje y las compras */}
      {primaryModel && (
        <div>
          <SectionTitle
            sub={`${primaryModel.label} · ${primaryModel.resolution}. Sirve para el trayecto y las compras previas.`}
          >
            Próximos días
          </SectionTitle>
          <NextDaysStrip model={primaryModel} />
        </div>
      )}

      {/* Pronóstico oficial en palabras */}
      <div>
        <SectionTitle
          sub={
            bundle.nwsPoint
              ? `WFO ${bundle.nwsPoint.wfo} · celda ${bundle.nwsPoint.gridX},${bundle.nwsPoint.gridY}${
                  bundle.nwsForecast?.updated
                    ? ` · actualizado ${fmtPlayaTime(bundle.nwsForecast.updated)}`
                    : ""
                }`
              : undefined
          }
        >
          Pronóstico oficial del NWS Reno
        </SectionTitle>

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
      </div>

      {/* Observaciones reales */}
      <div>
        <SectionTitle sub="Lo único de esta página que no es un modelo: lo que están midiendo ahora las estaciones de alrededor.">
          Qué se está midiendo ahora
        </SectionTitle>

        {bundle.observations.length === 0 ? (
          <SourceDown what="Las estaciones de observación" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bundle.observations.map((obs) => (
              <div
                key={`${obs.source}-${obs.id}`}
                className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">📍</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black leading-tight text-[#2a1a08]">{obs.name}</p>
                    <p className="text-[11px] font-semibold text-[#a07040]">
                      {obs.id} · {fmtKm(obs.distanceKm)} al {obs.bearing} · {obs.source}
                    </p>
                  </div>
                </div>

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
      </div>

      {/* Polvo */}
      <div>
        <SectionTitle sub="Polvo en suspensión y PM10 de CAMS. Da la intrusión regional, no el whiteout de tu calle.">
          Polvo y calidad del aire
        </SectionTitle>

        {!bundle.air ? (
          <SourceDown what="La API de calidad del aire de Open-Meteo" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {bundle.air.days.map((day) => {
              const pm10 = day.pm10Max;
              const level = pm10 == null ? "ok" : pm10 >= 150 ? "extreme" : pm10 >= 50 ? "warn" : "ok";
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
      </div>

      {/* Umbrales */}
      <div>
        <SectionTitle sub="Lo crítico aquí no es la temperatura: es la ráfaga y el milímetro de lluvia.">
          Umbrales que cambian el plan
        </SectionTitle>

        <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-[#c4906a]/20 text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
                  <th className="px-4 py-2">Variable</th>
                  <th className="px-4 py-2">Umbral</th>
                  <th className="px-4 py-2">Consecuencia</th>
                </tr>
              </thead>
              <tbody>
                {THRESHOLDS.map((t) => (
                  <tr
                    key={`${t.variable}-${t.limit}`}
                    className="border-b border-[#c4906a]/10 last:border-0"
                  >
                    <td className="px-4 py-2 text-xs font-bold text-[#2a1a08]">{t.variable}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums ${SEV[t.level].chip}`}
                      >
                        {t.limit}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] font-medium leading-relaxed text-[#7a5030]">
                      {t.consequence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Climatología y memoria */}
      <div>
        <SectionTitle sub="Cuando no hay pronóstico con habilidad, esto es lo único honesto que se puede decir.">
          Climatología y memoria del playa
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CLIMATOLOGY.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3"
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
              className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3"
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
          finales de agosto que en un año seco — pero la señal a escala de nueve días es débil y
          no dice nada de fechas concretas.
        </p>
      </div>

      {/* Fuentes */}
      <div>
        <SectionTitle sub="Ninguna app es fiable por sí sola aquí. Este es el orden en que conviene mirarlas.">
          Fuentes
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3 transition-colors hover:border-[#c84a10]/50 hover:bg-[#f6e6c8]"
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
      </div>
    </div>
  );
}
