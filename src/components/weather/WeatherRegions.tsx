/**
 * "¿De qué sitio es exactamente este pronóstico?"
 *
 * No hay ninguna estación en el playa, así que cada fuente responde por un
 * punto distinto: la celda de rejilla del NWS, el nodo de cada modelo global y
 * la estación real más cercana. Este bloque enseña esas coordenadas tal cual,
 * con su distancia al Hombre calculada al vuelo, para que quede claro cuánta
 * extrapolación hay detrás de cada número de la página.
 */

import {
  BRC,
  MODELS,
  SF,
  referenceStations,
  type AirQuality,
  type GridPoint,
  type ModelForecast,
  type NwsForecast,
  type NwsPoint,
} from "@/lib/weather";
import { fmtCoords, fmtKm } from "./format";

function RegionCard({
  emoji,
  source,
  area,
  grid,
  resolution,
  note,
  reference = "al Hombre",
}: {
  emoji: string;
  source: string;
  area: string;
  grid: GridPoint | null;
  resolution: string;
  note: string;
  /** Respecto a qué se mide el desvío. Por defecto, el Hombre. */
  reference?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="text-base leading-none">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black leading-tight text-[#2a1a08]">{source}</p>
          <p className="text-[11px] font-semibold text-[#a07040]">{resolution}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
          Zona que responde
        </p>
        <p className="text-xs font-bold text-[#2a1a08]">{area}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#c4906a]/20 pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
            Coordenadas
          </p>
          <p className="text-xs font-bold tabular-nums text-[#2a1a08]">
            {grid ? fmtCoords(grid.lat, grid.lon) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
            Desvío {reference}
          </p>
          <p className="text-xs font-bold tabular-nums text-[#2a1a08]">
            {grid ? `${fmtKm(grid.distanceKm)} al ${grid.bearing}` : "—"}
          </p>
        </div>
        {grid?.elevationM != null && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
              Altitud del nodo
            </p>
            <p className="text-xs font-bold tabular-nums text-[#2a1a08]">
              {Math.round(grid.elevationM)} m
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] font-medium leading-relaxed text-[#7a5030]">{note}</p>
    </div>
  );
}

export function WeatherRegions({
  nwsPoint,
  nwsForecast,
  models,
  air,
  sf,
}: {
  nwsPoint: NwsPoint | null;
  nwsForecast: NwsForecast | null;
  models: ModelForecast[];
  air: AirQuality | null;
  sf?: ModelForecast | null;
}) {
  const stations = referenceStations();
  const byId = new Map(models.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        {/* El título lo pone el desplegable que envuelve a este bloque. */}
        <p className="text-xs font-medium leading-relaxed text-[#7a5030]">
          En el playa <span className="font-black">no hay ninguna estación meteorológica</span>.
          El aeropuerto de Black Rock City (88NV) es una pista de tierra estacional sin METAR
          permanente, así que nadie mide el desierto donde acampamos. Todo lo que hay debajo son
          nodos de modelo alrededor del punto objetivo —{" "}
          <span className="font-bold tabular-nums">
            el Hombre, {fmtCoords(BRC.lat, BRC.lon)}, {BRC.elevationM} m
          </span>{" "}
          — más las estaciones reales más cercanas, que están a decenas de kilómetros y fuera
          del lecho seco. Los días de ciudad se piden aparte, sobre{" "}
          <span className="font-bold tabular-nums">
            San Francisco, {fmtCoords(SF.lat, SF.lon)}
          </span>
          .
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <RegionCard
          emoji="🏛️"
          source={
            nwsPoint
              ? `NWS Reno · WFO ${nwsPoint.wfo} · celda ${nwsPoint.gridX},${nwsPoint.gridY}`
              : "NWS Reno · WFO REV"
          }
          resolution="Rejilla de 2,5 km · pronóstico humano"
          area={
            nwsPoint?.place
              ? `${nwsPoint.place}${
                  nwsPoint.placeDistanceKm != null
                    ? ` (el propio NWS etiqueta el punto a ${fmtKm(nwsPoint.placeDistanceKm)} de la localidad)`
                    : ""
                }${nwsPoint.zone ? ` · zona ${nwsPoint.zone}` : ""}`
              : "Noroeste de Nevada — celda de rejilla de Gerlach"
          }
          grid={nwsForecast?.grid ?? null}
          note={`La fuente con autoridad legal: es la única que emite avisos de flash flood, dust storm y high wind${
            nwsPoint?.radar ? `. Radar de referencia: ${nwsPoint.radar}` : ""
          }.`}
        />

        {MODELS.map((m) => {
          const forecast = byId.get(m.id);
          return (
            <RegionCard
              key={m.id}
              emoji="🛰️"
              source={`Open-Meteo · ${m.label}`}
              resolution={m.resolution}
              area="Nodo de rejilla sobre el lecho seco del Black Rock Desert"
              grid={forecast?.grid ?? null}
              note={m.note}
            />
          );
        })}

        {sf && (
          <RegionCard
            emoji="🌉"
            source="San Francisco · Open-Meteo GFS + HRRR"
            resolution={sf.resolution}
            area="Centro de San Francisco (Union Square)"
            grid={sf.grid}
            reference="al centro de SF"
            note="SF tiene microclimas de varios grados en pocos kilómetros: este nodo representa el centro, no el Sunset ni el Mission. Se usa HRRR porque a 3 km resuelve la capa marina, que es lo que decide la tarde."
          />
        )}

        <RegionCard
          emoji="🌪️"
          source="CAMS (Copernicus) vía Open-Meteo"
          resolution="~0,4° (~40 km)"
          area="Celda regional del noroeste de Nevada"
          grid={air?.grid ?? null}
          note="De aquí sale el polvo en suspensión y el PM10. La celda es enorme comparada con el playa: sirve para ver una intrusión de polvo regional, no el whiteout de tu calle."
        />
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
        <div className="flex items-center gap-2 border-b border-[#c4906a]/20 px-4 py-3">
          <span className="text-base">📡</span>
          <span
            className="text-sm text-[#7a2e08]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Estaciones reales de referencia
          </span>
          <span className="ml-auto text-[11px] font-semibold text-[#a07040]">
            distancia calculada al Hombre
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-[#c4906a]/20 text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
                <th className="px-4 py-2">Estación</th>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Distancia</th>
                <th className="px-4 py-2">Qué es</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => {
                const isPlaya = s.id === "88NV";
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-[#c4906a]/10 last:border-0 ${
                      isPlaya ? "bg-amber-100/60" : ""
                    }`}
                  >
                    <td className="px-4 py-2 text-xs font-bold text-[#2a1a08]">{s.name}</td>
                    <td className="px-4 py-2 text-xs font-semibold tabular-nums text-[#7a5030]">
                      {s.id}
                    </td>
                    <td className="px-4 py-2 text-xs font-bold tabular-nums text-[#2a1a08]">
                      {fmtKm(s.distanceKm)} al {s.bearing}
                    </td>
                    <td className="px-4 py-2 text-[11px] font-medium text-[#7a5030]">{s.kind}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] font-medium leading-relaxed text-[#a07040]">
        Traducción práctica: el pronóstico del playa es en realidad el pronóstico de la zona de
        Gerlach y del lecho seco que la rodea. La temperatura y el viento sinóptico se
        extrapolan bien; las tormentas de tarde y las rachas de polvo, que son lo que de verdad
        arruina un campamento, no las resuelve ningún modelo a esta escala.
      </p>
    </div>
  );
}
