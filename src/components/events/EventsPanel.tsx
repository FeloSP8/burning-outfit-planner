"use client";

import { useCallback, useMemo, useState } from "react";
import { EVENT_DAYS } from "@/lib/dj-lineups";
import { MyAgenda } from "@/components/events/MyAgenda";
import type { PlayaEvent } from "@/lib/brc-api";
import type { EventPicksByPass } from "@/lib/event-picks";
import type { DjPicksBySet } from "@/types";

/**
 * Los eventos oficiales del evento, filtrables.
 *
 * La misma pantalla sirve online (`/events`, con lo que devuelve la API) y sin
 * cobertura (la pestaña del modo playa, con lo que trae el snapshot): es solo
 * lectura sobre una lista que le dan hecha.
 *
 * Las horas vienen de la API en hora del playa y con su `-07:00` detrás, así
 * que no hay que convertir husos: para agrupar por día basta el prefijo de la
 * cadena, y para saber qué hay ahora, `Date.parse` ya resuelve el desfase.
 */

/** Cuántos se pintan de una vez: un día tiene cientos. */
const PAGE = 120;

const CARD = "rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]";

/** Emoji por tipo de evento, con las abreviaturas que usa la API. */
const TYPE_EMOJI: Record<string, string> = {
  prty: "🎶",
  work: "🛠️",
  care: "💗",
  food: "🍜",
  game: "🎲",
  adlt: "🔥",
  kid: "🧒",
  para: "🎪",
  perf: "🎭",
  fire: "🔥",
  arts: "🎨",
  tea: "🫖",
  yoga: "🧘",
  live: "🎤",
  rept: "🔁",
  othr: "✨",
  other: "✨",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** "2026-08-31T21:00:00-07:00" → "21:00". */
const hourOf = (iso: string) => iso.slice(11, 16);

/** "2026-08-31T…" → "31 ago", para saber de qué día es cada fila. */
function dayLabel(iso: string): string {
  const date = iso.slice(0, 10);
  return EVENT_DAYS.find((d) => d.date === date)?.short ?? date.slice(5);
}

interface Occurrence {
  event: PlayaEvent;
  start: string;
  end: string;
  /** Milisegundos, ya resueltos: las horas de la API traen su desfase detrás. */
  startMs: number;
  endMs: number;
}

/** Cuánto se mira hacia delante en la vista "Ahora". */
const SOON_MS = 3 * 60 * 60 * 1000;

export function EventsPanel({
  events,
  note,
  picks = {},
  eventPicks = {},
  currentUserName,
  canPick = true,
}: {
  events: PlayaEvent[];
  note?: string | null;
  /** Sets de DJs marcados, para la vista "Mi agenda". */
  picks?: DjPicksBySet;
  eventPicks?: EventPicksByPass;
  currentUserName?: string;
  /** Sin cobertura no se puede marcar: la estrella se enseña, pero apagada. */
  canPick?: boolean;
}) {
  // Casi nadie sabe de memoria en qué día cae nada, así que por defecto se
  // busca en toda la semana. Solo si hay algo en marcha se abre por "Ahora".
  const [day, setDay] = useState<string>(() => {
    const now = Date.now();
    const live = events.some((event) =>
      event.occurrences.some((o) => Date.parse(o.end) >= now && Date.parse(o.start) <= now + SOON_MS)
    );
    return live ? "ahora" : "todos";
  });
  const [picked, setPicked] = useState<EventPicksByPass>(eventPicks);
  const [type, setType] = useState<string>("todos");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  // Un evento con cinco pases son cinco filas: lo que se consulta es "qué hay
  // el jueves a las 10", no el catálogo de eventos.
  const occurrences = useMemo<Occurrence[]>(
    () =>
      events
        .flatMap((event) =>
          event.occurrences.map((o) => ({
            event,
            start: o.start,
            end: o.end,
            startMs: Date.parse(o.start),
            endMs: Date.parse(o.end),
          }))
        )
        .sort((a, b) => a.start.localeCompare(b.start)),
    [events]
  );

  const types = useMemo(() => {
    const count = new Map<string, { label: string; n: number }>();
    for (const event of events) {
      const entry = count.get(event.type) ?? { label: event.typeLabel, n: 0 };
      entry.n += 1;
      count.set(event.type, entry);
    }
    return [...count.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [events]);

  const shown = useMemo(() => {
    const now = Date.now();
    const q = normalize(query.trim());

    return occurrences.filter(({ event, start, startMs, endMs }) => {
      if (day === "ahora") {
        // En marcha ahora mismo o a punto de empezar. Sirve igual a las tres
        // de la mañana: aquí no hay días que cambien a medianoche.
        if (endMs < now || startMs > now + SOON_MS) return false;
      } else if (day !== "todos" && !start.startsWith(day)) {
        // La fecha de la cadena ya es hora del playa, así que basta el prefijo.
        return false;
      }
      if (type !== "todos" && event.type !== type) return false;
      if (q.length >= 2) {
        const haystack = normalize(`${event.title} ${event.where ?? ""}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [occurrences, day, type, query]);

  const toggle = useCallback(
    async (eventUid: string, startTime: string) => {
      if (!canPick || !currentUserName) return;
      const key = `${eventUid}|${startTime}`;
      const mine = (picked[key] ?? []).includes(currentUserName);

      const apply = (add: boolean) =>
        setPicked((prev) => {
          const who = prev[key] ?? [];
          return {
            ...prev,
            [key]: add ? [...who, currentUserName] : who.filter((name) => name !== currentUserName),
          };
        });

      apply(!mine);
      const res = await fetch("/api/event-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventUid, startTime }),
      }).catch(() => null);

      // Volver al estado real: mejor eso que una agenda que miente.
      if (!res || !res.ok) apply(mine);
    },
    [canPick, currentUserName, picked]
  );

  const visible = shown.slice(0, limit);

  const reset = (next: () => void) => {
    next();
    setLimit(PAGE);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Día. En una sola fila que se arrastra: nueve días envueltos ocupaban
          tres líneas y dejaban los eventos fuera de pantalla. */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {currentUserName && (
          <button
            type="button"
            onClick={() => reset(() => setDay("mia"))}
            className={chip(day === "mia")}
          >
            ⭐ Mi agenda
          </button>
        )}
        <button
          type="button"
          onClick={() => reset(() => setDay("ahora"))}
          className={chip(day === "ahora")}
        >
          🔴 Ahora
        </button>
        <button
          type="button"
          onClick={() => reset(() => setDay("todos"))}
          className={chip(day === "todos")}
        >
          Toda la semana
        </button>
        {EVENT_DAYS.map((eventDay) => (
          <button
            key={eventDay.date}
            type="button"
            onClick={() => reset(() => setDay(eventDay.date))}
            className={chip(day === eventDay.date)}
          >
            {eventDay.short}
          </button>
        ))}
      </div>

      {day === "mia" && currentUserName ? (
        <MyAgenda
          picks={picks}
          events={events}
          eventPicks={picked}
          currentUserName={currentUserName}
        />
      ) : (
        <>
      {/* Tipo y búsqueda */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={type}
          onChange={(e) => reset(() => setType(e.target.value))}
          className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2 text-xs font-bold text-[#2a1a08] focus:border-[#c84a10] focus:outline-none"
        >
          <option value="todos">Todos los tipos ({events.length})</option>
          {types.map(([key, { label, n }]) => (
            <option key={key} value={key}>
              {TYPE_EMOJI[key] ?? "✨"} {label} ({n})
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => reset(() => setQuery(e.target.value))}
          placeholder="Buscar por nombre o campamento…"
          className="min-w-0 flex-1 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-2 text-sm font-semibold text-[#2a1a08] placeholder:text-[#a07040] focus:border-[#c84a10] focus:outline-none"
        />
      </div>

      {note && <p className="text-[11px] font-semibold text-[#a07040]">{note}</p>}

      <p className="text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
        {shown.length === 0
          ? "Nada que enseñar con estos filtros"
          : `${shown.length} ${shown.length === 1 ? "pase" : "pases"}`}
      </p>

      <div className="flex flex-col gap-1.5">
        {visible.map(({ event, start, end }) => {
          const who = picked[`${event.uid}|${start}`] ?? [];
          const mine = currentUserName ? who.includes(currentUserName) : false;
          return (
          <div key={`${event.uid}-${start}`} className={`${CARD} flex items-start gap-3 px-3 py-2.5`}>
            <div className="w-16 shrink-0">
              <p className="text-[10px] font-bold uppercase text-[#c84a10]">{dayLabel(start)}</p>
              <p className="text-sm font-black leading-tight text-[#7a2e08]">
                {event.allDay ? "Todo" : hourOf(start)}
              </p>
              <p className="text-[10px] font-semibold text-[#a07040]">
                {event.allDay ? "el día" : `→ ${hourOf(end)}`}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-[#2a1a08]">
                {TYPE_EMOJI[event.type] ?? "✨"} {event.title}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#7a5030]">
                {event.where ?? "sin sitio"}
                {event.address ? ` · ${event.address}` : ""}
              </p>
              {event.description && (
                <p className="mt-1 text-[11px] font-medium leading-snug text-[#a07040]">
                  {event.description}
                </p>
              )}
              {who.length > 0 && (
                <p className="mt-1 text-[11px] font-bold text-[#c84a10]">Van: {who.join(", ")}</p>
              )}
            </div>
            {currentUserName && (
              <button
                type="button"
                onClick={() => toggle(event.uid, start)}
                disabled={!canPick}
                aria-pressed={mine}
                aria-label={mine ? "Quitar de mi agenda" : "Añadir a mi agenda"}
                className={`shrink-0 rounded-full px-2 py-1 text-lg leading-none transition-opacity ${
                  mine ? "opacity-100" : "opacity-35"
                } ${canPick ? "hover:opacity-100" : "cursor-default"}`}
              >
                ★
              </button>
            )}
          </div>
          );
        })}
      </div>

      {shown.length > visible.length && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="rounded-full border-2 border-[#c84a10] px-4 py-2 text-xs font-black text-[#c84a10]"
        >
          Ver {Math.min(PAGE, shown.length - visible.length)} más
        </button>
      )}
        </>
      )}
    </div>
  );
}

function chip(active: boolean): string {
  return `shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
    active
      ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
      : "border-[#c4906a]/50 bg-[#fdf4e0] text-[#a07040]"
  }`;
}
