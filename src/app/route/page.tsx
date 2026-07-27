import { getCurrentUser } from "@/lib/auth";
import {
  ROUTE_META,
  ROUTE_STOPS,
  ROUTE_LEGS,
  ROUTE_NOTES,
  ROUTE_PENDING,
  ROUTE_SHARE_URL,
  buildNavigateFromHereUrl,
} from "@/lib/route-data";
import { getRouteGeometry } from "@/lib/route-geometry";
import { RouteMap } from "@/components/route/RouteMap";

export const metadata = {
  title: "Ruta · Burning Outfit Planner",
  description: "Newark (CA) → Black Rock City (NV) — ruta de aprovisionamiento y traslado",
};

export default async function RoutePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const { points: routePoints, isRealRoad } = await getRouteGeometry();
  const navigateUrl = buildNavigateFromHereUrl();

  return (
    <div className="flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}>
          Ruta a la playa
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          {ROUTE_META.subtitle} · Newark (CA) → Black Rock City (NV)
        </p>
      </div>

      {/* Resumen del viaje */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Distancia total", value: ROUTE_META.totalDistance, emoji: "🛣️" },
          { label: "Tiempo de volante", value: ROUTE_META.totalDriving, emoji: "⏱️" },
          { label: "Paradas", value: `${ROUTE_STOPS.length}`, emoji: "📍" },
          { label: "Personas", value: `${ROUTE_META.people}`, emoji: "👥" },
        ].map(({ label, value, emoji }) => (
          <div key={label}
            className="flex items-center gap-3 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
            <span className="text-2xl">{emoji}</span>
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight text-[#2a1a08]">{value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a07040]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mapa embebido */}
      <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#c4906a]/20 px-4 py-3">
          <span className="text-base">🗺️</span>
          <span className="text-sm text-[#7a2e08]"
            style={{ fontFamily: "var(--font-display)" }}>
            El recorrido
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a
              href={navigateUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Navega desde donde estés ahora, pasando por todas las paradas"
              className="rounded-xl bg-[#c84a10] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#a83a08]"
            >
              🧭 Navegar desde aquí
            </a>
            <a
              href={ROUTE_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Abre la ruta guardada, desde Newark — vista previa del recorrido completo"
              className="rounded-xl border-2 border-[#c84a10]/50 px-4 py-2 text-xs font-bold text-[#c84a10] transition-colors hover:bg-[#c84a10]/10"
            >
              Ver ruta completa →
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
          <RouteMap stops={ROUTE_STOPS} routePoints={routePoints} isRealRoad={isRealRoad} />
        </div>
      </div>

      {/* Paradas */}
      <div>
        <p className="mb-4 text-2xl text-[#7a2e08] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}>
          Paradas
        </p>

        <ol className="relative flex flex-col gap-3">
          {ROUTE_STOPS.map((stop, i) => {
            const isLast = i === ROUTE_STOPS.length - 1;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.coords[0]},${stop.coords[1]}`;

            return (
              <li key={stop.order} className="relative flex gap-4">
                {/* Columna del número + línea de conexión */}
                <div className="relative flex shrink-0 flex-col items-center">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md ${
                    isLast
                      ? "bg-[#7a2e08] shadow-[#7a2e08]/20"
                      : "bg-[#c84a10] shadow-[#c84a10]/20"
                  }`}>
                    <span className="text-sm font-black text-white">{stop.order}</span>
                  </div>
                  {!isLast && (
                    <div className="mt-1 w-0.5 flex-1 rounded-full bg-[#c4906a]/35" />
                  )}
                </div>

                {/* Tarjeta de la parada */}
                <div className={`mb-1 flex-1 rounded-2xl border-2 px-4 py-3 ${
                  isLast
                    ? "border-[#7a2e08]/40 bg-[#f6e6c8]"
                    : "border-[#c4906a]/40 bg-[#fdf4e0]"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">{stop.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black leading-tight text-[#2a1a08]">
                        {stop.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#a07040]">
                        {stop.address}
                        {stop.phone && <> · {stop.phone}</>}
                      </p>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[11px] font-bold text-[#c84a10]/80 underline underline-offset-2 transition-colors hover:text-[#c84a10]"
                    >
                      Ver
                    </a>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#7a5030]">
                    {stop.purpose}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Tramos */}
      <div>
        <p className="mb-4 text-2xl text-[#7a2e08] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}>
          Tramos
        </p>

        <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
          {ROUTE_LEGS.map((leg, i) => (
            <div
              key={leg.label}
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 ${
                i > 0 ? "border-t border-[#c4906a]/20" : ""
              } ${leg.isTotal ? "bg-[#c4822a]/15" : ""}`}
            >
              <span className={`min-w-0 flex-1 text-xs ${
                leg.isTotal ? "font-black text-[#7a2e08]" : "font-semibold text-[#2a1a08]"
              }`}>
                {leg.label}
              </span>
              <span className={`shrink-0 text-xs ${
                leg.isTotal ? "font-black text-[#7a2e08]" : "font-bold text-[#7a5030]"
              }`}>
                {leg.distance}
              </span>
              <span className={`shrink-0 text-xs ${
                leg.isTotal ? "font-black text-[#7a2e08]" : "font-medium text-[#a07040]"
              }`}>
                {leg.duration}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs font-medium leading-relaxed text-[#a07040]">
          Añadir: tiempo de compra en las 3 tiendas (estimar 3–4 h en total) y la cola de
          Gate en BRC (histórico: de 1 h a 12+ h según hora de llegada).
        </p>
      </div>

      {/* Datos del RV */}
      <div className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base">🚐</span>
          <span className="text-sm text-[#7a2e08]"
            style={{ fontFamily: "var(--font-display)" }}>
            La autocaravana
          </span>
        </div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {[
            { label: "Vehículo", value: ROUTE_META.vehicle },
            { label: "Booking", value: ROUTE_META.booking },
            {
              label: "Recogida",
              value: `${ROUTE_META.pickup.date} · ${ROUTE_META.pickup.window} · ${ROUTE_META.pickup.place}`,
            },
            {
              label: "Devolución",
              value: `${ROUTE_META.return.date} · ${ROUTE_META.return.window} · ${ROUTE_META.return.place}`,
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a07040]">
                {label}
              </p>
              <p className="text-xs font-bold text-[#2a1a08]">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-[#c4906a]/20 pt-3 text-xs font-medium text-[#7a5030]">
          Extras: Early Bird Departure Option, generador ilimitado, ZDP, provisioning kit,
          1000 millas incluidas y{" "}
          <span className="font-black text-[#c84a10]">
            3 personal kits — descuadre: hay 4 personas
          </span>
          .
        </p>
      </div>

      {/* Notas de la ruta */}
      <div>
        <p className="mb-4 text-2xl text-[#7a2e08] sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}>
          Notas de la ruta
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {ROUTE_NOTES.map((note) => (
            <div key={note.title}
              className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">{note.emoji}</span>
                <p className="text-xs font-black leading-tight text-[#2a1a08]">
                  {note.title}
                </p>
              </div>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#7a5030]">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pendiente de resolver */}
      <div className="rounded-2xl border-2 border-amber-300/70 bg-amber-50 px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span className="text-sm text-[#7a2e08]"
            style={{ fontFamily: "var(--font-display)" }}>
            Pendiente de resolver
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {ROUTE_PENDING.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold leading-relaxed text-[#7a5030]">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
