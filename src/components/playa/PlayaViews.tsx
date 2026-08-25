"use client";

import { ALL_SLOTS } from "@/lib/pdf-theme";
import { EVENT_DAYS } from "@/lib/dj-lineups";
import { fromMinutes, pickedEntriesByDay, venueLabel } from "@/lib/dj-agenda";
import type { PlayaSnapshot } from "@/types/snapshot";

/**
 * Las vistas del modo playa: solo lectura, sobre el snapshot descargado.
 *
 * Nada de esto llama a la red. Marcar un ★ o tachar de la checklist se hace
 * con cobertura, en las pantallas normales; aquí solo se consulta.
 */

const CARD = "rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]";

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-6 text-sm font-medium text-[#a07040]">{children}</p>;
}

function DayHeading({ date, extra }: { date: string; extra?: string | null }) {
  const day = EVENT_DAYS.find((d) => d.date === date);
  return (
    <p className="mt-5 mb-2 text-sm font-black uppercase tracking-wide text-[#c84a10]">
      {day ? `${day.weekday} ${day.short}` : date}
      {day?.label ? ` · ${day.label}` : ""}
      {extra ? ` · ${extra}` : ""}
    </p>
  );
}

export function AgendaView({ picks }: { picks: PlayaSnapshot["picks"] }) {
  const days = pickedEntriesByDay(picks);
  if (days.length === 0) return <Empty>Nadie ha marcado ningún set todavía.</Empty>;

  return (
    <div>
      {days.map(({ day, entries }) => (
        <div key={day.date}>
          <DayHeading date={day.date} />
          <div className="flex flex-col gap-1.5">
            {entries.map((entry) => (
              <div key={entry.set.id} className={`${CARD} flex items-start gap-3 px-3 py-2.5`}>
                <div className="w-14 shrink-0">
                  <p className="text-sm font-black leading-tight text-[#7a2e08]">
                    {fromMinutes(entry.window.start)}
                  </p>
                  {entry.window.estimated && (
                    <p className="text-[10px] font-semibold text-[#a07040]">aprox.</p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-[#2a1a08]">
                    {entry.set.label}
                    {entry.set.live && (
                      <span className="ml-1.5 text-[10px] font-black uppercase text-[#c84a10]">
                        live
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#7a5030]">
                    {entry.venue.emoji} {venueLabel(entry.venue)} · {entry.venue.location}
                  </p>
                </div>
                <p className="w-20 shrink-0 text-right text-[11px] font-semibold text-[#a07040]">
                  {entry.fans.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OutfitsView({ days }: { days: PlayaSnapshot["days"] }) {
  const withOutfit = days.filter((d) =>
    d.shifts.some((sh) => sh.outfit && sh.outfit.items.length > 0)
  );
  if (withOutfit.length === 0) return <Empty>Ningún outfit montado todavía.</Empty>;

  return (
    <div>
      {withOutfit.map((day) => (
        <div key={day.id}>
          <DayHeading date={day.date.slice(0, 10)} extra={day.label} />
          <div className="flex flex-col gap-1.5">
            {day.shifts.map((shift) => {
              const items = shift.outfit?.items ?? [];
              if (items.length === 0) return null;
              return (
                <div key={shift.id} className={`${CARD} px-3 py-2.5`}>
                  <p className="text-[11px] font-black uppercase tracking-wide text-[#a07040]">
                    {shift.type === "TARDE" ? "🌇 Tarde" : "🌙 Noche"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-lg bg-[#f0e4c0] px-2 py-1 text-xs font-bold text-[#2a1a08]"
                      >
                        {item.garment.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChecklistView({ items }: { items: PlayaSnapshot["checklist"] }) {
  if (items.length === 0) return <Empty>La checklist está vacía.</Empty>;

  const blocks = [
    { title: "Comunes · basta con que uno lo traiga", list: items.filter((i) => i.type === "COMMON") },
    { title: "Individuales · cada uno el suyo", list: items.filter((i) => i.type === "INDIVIDUAL") },
  ].filter((b) => b.list.length > 0);

  return (
    <div>
      {blocks.map(({ title, list }) => (
        <div key={title}>
          <p className="mt-5 mb-2 text-sm font-black uppercase tracking-wide text-[#c84a10]">
            {title}
          </p>
          <div className="flex flex-col gap-1.5">
            {list.map((item) => {
              const done = item.type === "COMMON" ? item.done : item.iChecked;
              return (
                <div key={item.id} className={`${CARD} flex items-center gap-3 px-3 py-2.5`}>
                  <span className="text-base">{done ? "✅" : "⬜"}</span>
                  <p
                    className={`min-w-0 flex-1 text-sm font-semibold ${
                      done ? "text-[#a07040] line-through" : "text-[#2a1a08]"
                    }`}
                  >
                    {item.text}
                    {item.origin === "ALLI" && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase text-[#a07040]">
                        se compra allí
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-[11px] font-semibold text-[#a07040]">
                    {item.type === "COMMON"
                      ? (item.assigneeName ?? "sin asignar")
                      : item.checkedBy.join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InventoryView({ garments }: { garments: PlayaSnapshot["garments"] }) {
  if (garments.length === 0) return <Empty>El inventario está vacío.</Empty>;

  return (
    <div>
      {ALL_SLOTS.map((slot) => {
        const items = garments.filter((g) => g.slot === slot.key);
        if (items.length === 0) return null;
        return (
          <div key={slot.key}>
            <p className="mt-5 mb-2 text-sm font-black uppercase tracking-wide text-[#c84a10]">
              {slot.label} · {items.length}
            </p>
            <div className="flex flex-col gap-1.5">
              {items.map((garment) => (
                <div key={garment.id} className={`${CARD} flex items-center gap-3 px-3 py-2.5`}>
                  <p className="min-w-0 flex-1 text-sm font-bold text-[#2a1a08]">{garment.name}</p>
                  <p className="shrink-0 text-[11px] font-semibold lowercase text-[#a07040]">
                    {garment.status.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeatherView({ weather }: { weather: PlayaSnapshot["weather"] }) {
  if (!weather || weather.models.length === 0) {
    return <Empty>El pronóstico no se pudo guardar en la última descarga.</Empty>;
  }

  // Vista propia y no la de `/weather`: aquella tira de `@/lib/weather`, que
  // es `server-only` (hace las llamadas a las APIs), así que no puede viajar
  // al navegador. Aquí basta con resumir lo que ya trae el snapshot.
  //
  // El resumen es el peor caso de todos los modelos, el mismo criterio que la
  // pantalla online: pasarse de precavido cuesta unos lag screws, quedarse
  // corto cuesta el campamento.
  const dates = Array.from(
    new Set(weather.models.flatMap((m) => m.days.map((d) => d.date)))
  ).sort();

  const worst = (date: string) => {
    const points = weather.models
      .map((m) => m.days.find((d) => d.date === date))
      .filter((d) => d !== undefined);
    const pick = (get: (p: (typeof points)[number]) => number | null, fn: (xs: number[]) => number) => {
      const values = points.map(get).filter((v): v is number => v != null);
      return values.length === 0 ? null : fn(values);
    };
    return {
      tMax: pick((p) => p!.tMaxC, (xs) => Math.max(...xs)),
      tMin: pick((p) => p!.tMinC, (xs) => Math.min(...xs)),
      gust: pick((p) => p!.gustKmh, (xs) => Math.max(...xs)),
      rain: pick((p) => p!.precipMm, (xs) => Math.max(...xs)),
      prob: pick((p) => p!.precipProb, (xs) => Math.max(...xs)),
    };
  };

  const round = (v: number | null, unit: string) => (v == null ? "—" : `${Math.round(v)}${unit}`);

  return (
    <div>
      <p className="mt-5 mb-2 text-sm font-black uppercase tracking-wide text-[#c84a10]">
        Peor caso de {weather.models.length} modelos
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dates.map((date) => {
          const day = worst(date);
          const eventDay = EVENT_DAYS.find((d) => d.date === date);
          return (
            <div key={date} className={`${CARD} px-3 py-2.5`}>
              <p className="text-xs font-black text-[#7a2e08]">
                {eventDay ? `${eventDay.weekday} ${eventDay.short}` : date}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-[#7a5030]">
                <span>☀️ {round(day.tMax, "°")}</span>
                <span>🌙 {round(day.tMin, "°")}</span>
                <span>💨 {round(day.gust, " km/h")}</span>
                <span>
                  🌧️ {round(day.rain, " mm")}
                  {day.prob != null ? ` · ${Math.round(day.prob)}%` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] font-medium text-[#a07040]">
        Congelado en el momento de la descarga: no se actualiza sin cobertura.
      </p>
    </div>
  );
}
