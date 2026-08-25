"use client";

import { useMemo } from "react";
import { EVENT_DAYS } from "@/lib/dj-lineups";
import { fromMinutes, pickedEntriesByDay, venueLabel } from "@/lib/dj-agenda";
import type { PlayaEvent } from "@/lib/brc-api";
import type { EventPicksByPass } from "@/lib/event-picks";
import type { DjPicksBySet } from "@/types";

/**
 * Mi agenda: los sets de DJs marcados y los eventos oficiales marcados, juntos
 * y en orden.
 *
 * Son dos catálogos con formas distintas —uno transcrito a mano de los carteles
 * y otro de la API— así que aquí se reducen a lo mismo: una hora, un título, un
 * sitio y con quién.
 *
 * Un set de las 02:00 pertenece a la noche del día anterior, y así se agrupa:
 * la fiesta manda sobre el calendario. Los eventos oficiales van por su fecha,
 * que es como los publica la organización.
 */

const CARD = "rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]";

interface Item {
  key: string;
  /** Día bajo el que se agrupa, "2026-09-03". */
  day: string;
  /** Milisegundos desde la época, para ordenar todo junto. */
  at: number;
  hour: string;
  /** La hora es estimación nuestra, no del cartel. */
  approx: boolean;
  title: string;
  where: string;
  address: string | null;
  emoji: string;
  /** De dónde sale: el cartel de un campamento o el listado oficial. */
  origin: "dj" | "oficial";
  /** Los demás del grupo que también van. */
  others: string[];
}

export function MyAgenda({
  picks,
  events,
  eventPicks,
  currentUserName,
}: {
  picks: DjPicksBySet;
  events: PlayaEvent[];
  eventPicks: EventPicksByPass;
  currentUserName: string;
}) {
  const days = useMemo(() => {
    const items: Item[] = [];

    // Sets de DJs marcados por mí.
    for (const { day, entries } of pickedEntriesByDay(picks)) {
      for (const entry of entries) {
        if (!entry.fans.includes(currentUserName)) continue;
        items.push({
          key: `dj-${entry.set.id}`,
          day: day.date,
          at: entry.absStart * 60_000,
          hour: fromMinutes(entry.window.start),
          approx: entry.window.estimated,
          title: entry.set.label,
          where: venueLabel(entry.venue),
          address: entry.venue.location,
          emoji: entry.venue.emoji,
          origin: "dj",
          others: entry.fans.filter((name) => name !== currentUserName),
        });
      }
    }

    // Pases del listado oficial marcados por mí.
    for (const event of events) {
      for (const occurrence of event.occurrences) {
        const who = eventPicks[`${event.uid}|${occurrence.start}`] ?? [];
        if (!who.includes(currentUserName)) continue;
        items.push({
          key: `ev-${event.uid}-${occurrence.start}`,
          day: occurrence.start.slice(0, 10),
          at: Date.parse(occurrence.start),
          hour: event.allDay ? "Todo el día" : occurrence.start.slice(11, 16),
          approx: false,
          title: event.title,
          where: event.where ?? "sin sitio",
          address: event.address,
          emoji: "📋",
          origin: "oficial",
          others: who.filter((name) => name !== currentUserName),
        });
      }
    }

    items.sort((a, b) => a.at - b.at);

    const byDay = new Map<string, Item[]>();
    for (const item of items) {
      const list = byDay.get(item.day) ?? [];
      list.push(item);
      byDay.set(item.day, list);
    }

    // Por orden de evento, y lo que caiga fuera de esos nueve días al final.
    const known = EVENT_DAYS.filter((d) => byDay.has(d.date)).map((d) => ({
      date: d.date,
      label: `${d.weekday} ${d.short}${d.label ? ` · ${d.label}` : ""}`,
      items: byDay.get(d.date)!,
    }));
    const extra = [...byDay.keys()]
      .filter((date) => !EVENT_DAYS.some((d) => d.date === date))
      .sort()
      .map((date) => ({ date, label: date, items: byDay.get(date)! }));

    return [...known, ...extra];
  }, [picks, events, eventPicks, currentUserName]);

  const total = days.reduce((n, day) => n + day.items.length, 0);

  if (total === 0) {
    return (
      <p className="px-1 py-6 text-sm font-medium text-[#a07040]">
        Todavía no has marcado nada. Pon ★ en los sets de la agenda de DJs y en los eventos
        oficiales, y aquí sale todo junto y en orden.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
        {total} {total === 1 ? "plan" : "planes"} en {days.length}{" "}
        {days.length === 1 ? "día" : "días"}
      </p>

      {days.map(({ date, label, items }) => (
        <div key={date}>
          <p className="mt-5 mb-2 text-sm font-black uppercase tracking-wide text-[#c84a10]">
            {label}
          </p>
          <div className="flex flex-col gap-1.5">
            {items.map((item) => (
              <div key={item.key} className={`${CARD} flex items-start gap-3 px-3 py-2.5`}>
                <div className="w-16 shrink-0">
                  <p className="text-sm font-black leading-tight text-[#7a2e08]">{item.hour}</p>
                  {item.approx && (
                    <p className="text-[10px] font-semibold text-[#a07040]">aprox.</p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-[#2a1a08]">
                    {item.emoji} {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#7a5030]">
                    {item.where}
                    {item.address ? ` · ${item.address}` : ""}
                  </p>
                </div>
                {item.others.length > 0 && (
                  <p className="w-16 shrink-0 text-right text-[11px] font-semibold text-[#a07040]">
                    con {item.others.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
