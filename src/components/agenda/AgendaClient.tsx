"use client";

import { useMemo, useState } from "react";
import {
  ALL_SETS,
  VENUE_BY_ID,
  DAYS_WITH_LINEUP,
  KIND_LABEL,
  clashesFor,
  dayAfterLabel,
  findClashes,
  matchesQuery,
  partiesOn,
  partyRange,
  toEntry,
  venueLabel,
  type AgendaEntry,
  type Clash,
  type SetRef,
} from "@/lib/dj-agenda";
import type { DjSet, Party } from "@/lib/dj-lineups";
import type { DjPicksBySet } from "@/types";

const ORDINALS = ["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"];

const venueOf = (party: Party) => VENUE_BY_ID[party.venueId];

export function AgendaClient({
  initialPicks,
  currentUserName,
  today,
}: {
  initialPicks: DjPicksBySet;
  currentUserName: string;
  /** Fecha de hoy en el playa, para abrir la página por el día que toca. */
  today: string;
}) {
  const [picks, setPicks] = useState<DjPicksBySet>(initialPicks);
  const [day, setDay] = useState<string>(
    () => DAYS_WITH_LINEUP.find((d) => d.date >= today)?.date ?? DAYS_WITH_LINEUP[0].date
  );
  const [onlyMine, setOnlyMine] = useState(false);
  const [query, setQuery] = useState("");

  const mine = useMemo(
    () => new Set(Object.entries(picks).filter(([, who]) => who.includes(currentUserName)).map(([id]) => id)),
    [picks, currentUserName]
  );

  /** Mis sets de todo el evento, ya con ventana horaria. Es la base de la agenda. */
  const myEntries = useMemo(
    () => ALL_SETS.filter((r) => mine.has(r.set.id)).map(toEntry),
    [mine]
  );

  // Los solapes se buscan en todo el evento, no día a día: un set de las 06:00
  // del miércoles compite con la fiesta de amanecer del jueves.
  const clashes = useMemo(() => findClashes(myEntries), [myEntries]);
  const clashingIds = useMemo(
    () => new Set(clashes.flatMap((c) => [c.a.set.id, c.b.set.id])),
    [clashes]
  );

  const daysWithPlan = useMemo(
    () => new Set(myEntries.map((e) => e.party.date)),
    [myEntries]
  );

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? ALL_SETS.filter((r) => matchesQuery(r, query)) : []),
    [searching, query]
  );

  async function toggle(setId: string) {
    const isMine = mine.has(setId);
    // Optimista: la lista se reordena sola y el POST solo confirma.
    setPicks((prev) => {
      const who = prev[setId] ?? [];
      return {
        ...prev,
        [setId]: isMine ? who.filter((n) => n !== currentUserName) : [...who, currentUserName],
      };
    });

    const res = await fetch("/api/dj-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId }),
    });

    if (!res.ok) {
      // Revertir: mejor volver al estado real que dejar una agenda que miente.
      setPicks((prev) => {
        const who = prev[setId] ?? [];
        return {
          ...prev,
          [setId]: isMine ? [...who, currentUserName] : who.filter((n) => n !== currentUserName),
        };
      });
    }
  }

  const dayEntries = myEntries
    .filter((e) => e.party.date === day)
    .sort((a, b) => a.absStart - b.absStart);

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen de lo elegido */}
      <div className="flex flex-wrap items-center gap-2">
        <Stat value={mine.size} label={mine.size === 1 ? "set elegido" : "sets elegidos"} />
        <Stat value={daysWithPlan.size} label={daysWithPlan.size === 1 ? "día con plan" : "días con plan"} />
        {clashes.length > 0 && (
          <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
            ⚠️ {clashes.length} {clashes.length === 1 ? "solape" : "solapes"} en tu agenda
          </span>
        )}
      </div>

      {/* Buscador + vista */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar DJ, fiesta o escenario…"
          className="flex-1 rounded-xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2 text-sm font-semibold text-[#2a1a08] placeholder:font-medium placeholder:text-[#a07040] focus:border-[#c84a10] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setOnlyMine((v) => !v)}
          aria-pressed={onlyMine}
          className={`whitespace-nowrap rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
            onlyMine
              ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
              : "border-[#c4906a]/40 bg-[#fdf4e0] text-[#7a4a20] hover:border-[#c84a10]/50"
          }`}
        >
          {onlyMine ? "★ Solo mi agenda" : "☆ Solo mi agenda"}
        </button>
      </div>

      {searching ? (
        <SearchResults
          results={results}
          query={query}
          picks={picks}
          mine={mine}
          currentUserName={currentUserName}
          clashingIds={clashingIds}
          onToggle={toggle}
        />
      ) : (
        <>
          {/* Días del evento con line-up publicado */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {DAYS_WITH_LINEUP.map((d) => {
              const count = myEntries.filter((e) => e.party.date === d.date).length;
              const active = d.date === day;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setDay(d.date)}
                  className={`shrink-0 rounded-xl border-2 px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                      : "border-[#c4906a]/40 bg-[#fdf4e0] text-[#7a4a20] hover:border-[#c84a10]/50"
                  }`}
                >
                  <span className="block text-xs font-black leading-tight">{d.weekday}</span>
                  <span className={`block text-[11px] font-bold ${active ? "text-[#fdf4e0]/80" : "text-[#a07040]"}`}>
                    {d.short}
                    {count > 0 && ` · ${count} ★`}
                  </span>
                </button>
              );
            })}
          </div>

          {onlyMine ? (
            <MyDay
              entries={dayEntries}
              picks={picks}
              currentUserName={currentUserName}
              clashes={clashes}
              onToggle={toggle}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {partiesOn(day).map((party) => (
                <PartyCard
                  key={party.id}
                  party={party}
                  picks={picks}
                  mine={mine}
                  currentUserName={currentUserName}
                  clashingIds={clashingIds}
                  onToggle={toggle}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="rounded-xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-1.5 text-xs font-bold text-[#7a4a20]">
      <span className="text-sm font-black tabular-nums text-[#c84a10]">{value}</span> {label}
    </span>
  );
}

/** El line-up de una fiesta, tal y como lo pinta el cartel. */
function PartyCard({
  party,
  picks,
  mine,
  currentUserName,
  clashingIds,
  onToggle,
}: {
  party: Party;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashingIds: Set<string>;
  onToggle: (setId: string) => void;
}) {
  const venue = venueOf(party);
  const kind = KIND_LABEL[party.kind];

  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${venue.theme.border} ${venue.theme.card}`}>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
        <span className="text-base leading-none">{venue.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black leading-tight ${venue.theme.text}`}>
            {party.name}
            <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${venue.theme.chip}`}>
              {kind.emoji} {kind.label}
            </span>
          </p>
          <p className="text-[11px] font-semibold text-[#a07040]">
            {venueLabel(venue)} · {venue.location} · {partyRange(party)}
          </p>
        </div>
      </header>

      {party.note && (
        <p className="px-4 pb-2 text-[11px] font-medium leading-relaxed text-[#a07040]">{party.note}</p>
      )}

      <div className="border-t border-black/5 bg-[#fdf4e0]/70">
        {party.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            party={party}
            order={i}
            picked={mine.has(set.id)}
            who={picks[set.id] ?? []}
            currentUserName={currentUserName}
            clashing={mine.has(set.id) && clashingIds.has(set.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

/** Una línea del cartel: hora (u orden), quién pincha y el botón de "voy". */
function SetRow({
  set,
  party,
  order,
  picked,
  who,
  currentUserName,
  clashing,
  onToggle,
  showVenue = false,
}: {
  set: DjSet;
  party: Party;
  order: number;
  picked: boolean;
  who: string[];
  currentUserName: string;
  clashing: boolean;
  onToggle: (setId: string) => void;
  showVenue?: boolean;
}) {
  const venue = venueOf(party);
  const others = who.filter((n) => n !== currentUserName);
  // Un set de madrugada se pinta con el día al que pertenece de verdad.
  const afterMidnight = !!set.start && set.start < party.start;

  return (
    <div
      className={`flex items-start gap-3 border-t border-[#c4906a]/15 px-4 py-2.5 first:border-t-0 ${
        picked ? "bg-[#c84a10]/10" : ""
      }`}
    >
      <span className="w-16 shrink-0 pt-0.5 text-xs font-black tabular-nums text-[#7a2e08]">
        {set.start ?? <span className="font-bold text-[#a07040]">{ORDINALS[order] ?? `${order + 1}º`}</span>}
        {afterMidnight && (
          <span className="block text-[10px] font-bold uppercase text-[#a07040]">
            {dayAfterLabel(party.date)}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-[#2a1a08]">
          {set.label}
          {set.live && <Tag className="bg-[#c84a10] text-[#fdf4e0]">LIVE</Tag>}
          {set.headliner && <Tag className="bg-[#f5c518] text-[#4a2a08]">✳ CABEZA DE CARTEL</Tag>}
          {set.note && <Tag className="bg-[#c4906a]/25 text-[#7a4a20]">{set.note}</Tag>}
        </p>

        {showVenue && (
          <p className="text-[11px] font-semibold text-[#a07040]">
            {venue.emoji} {venueLabel(venue)} · {party.name}
          </p>
        )}

        {others.length > 0 && (
          <p className="text-[11px] font-semibold text-[#a07040]">👥 también {others.join(", ")}</p>
        )}

        {clashing && (
          <p className="text-[11px] font-bold text-amber-800">⚠️ Se pisa con otro set de tu agenda</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggle(set.id)}
        aria-pressed={picked}
        aria-label={picked ? `Quitar ${set.label} de mi agenda` : `Añadir ${set.label} a mi agenda`}
        className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-xs font-black transition-colors ${
          picked
            ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
            : "border-[#c4906a]/40 bg-[#fdf4e0] text-[#a07040] hover:border-[#c84a10]/60 hover:text-[#c84a10]"
        }`}
      >
        {picked ? "★ Voy" : "☆ Voy"}
      </button>
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`ml-2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-black align-middle ${className}`}>
      {children}
    </span>
  );
}

/** Mi agenda de un día: todo lo elegido en orden, mezclando escenarios. */
function MyDay({
  entries,
  picks,
  currentUserName,
  clashes,
  onToggle,
}: {
  entries: AgendaEntry[];
  picks: DjPicksBySet;
  currentUserName: string;
  clashes: Clash[];
  onToggle: (setId: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <Empty>
        Todavía no has elegido nada para este día. Quita el filtro{" "}
        <span className="font-black">Solo mi agenda</span> y marca con ★ los sets que quieras ver.
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
      {entries.map((entry) => {
        const conflicts = clashesFor(entry.set.id, clashes);
        return (
          <div key={entry.set.id} className="border-t border-[#c4906a]/15 first:border-t-0">
            <SetRow
              set={entry.set}
              party={entry.party}
              order={entry.party.sets.indexOf(entry.set)}
              picked
              who={picks[entry.set.id] ?? []}
              currentUserName={currentUserName}
              clashing={false}
              onToggle={onToggle}
              showVenue
            />
            {conflicts.length > 0 && (
              <p className="px-4 pb-2.5 pl-[4.75rem] text-[11px] font-bold leading-relaxed text-amber-800">
                ⚠️ Se pisa con {conflicts.map((c) => c.set.label).join(", ")}
                {conflicts.every((c) => !c.set.start || !entry.set.start) && " (el cartel no da horas exactas)"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Resultados del buscador, agrupados por día. */
function SearchResults({
  results,
  query,
  picks,
  mine,
  currentUserName,
  clashingIds,
  onToggle,
}: {
  results: SetRef[];
  query: string;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashingIds: Set<string>;
  onToggle: (setId: string) => void;
}) {
  if (results.length === 0) {
    return <Empty>Nadie con ese nombre en los carteles que hay cargados: “{query.trim()}”.</Empty>;
  }

  const byDate = new Map<string, SetRef[]>();
  for (const ref of results) {
    const list = byDate.get(ref.party.date) ?? [];
    list.push(ref);
    byDate.set(ref.party.date, list);
  }

  return (
    <div className="flex flex-col gap-4">
      {DAYS_WITH_LINEUP.filter((d) => byDate.has(d.date)).map((d) => (
        <section key={d.date}>
          <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-[#a07040]">
            {d.weekday} {d.short}
          </p>
          <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
            {byDate.get(d.date)!.map((ref) => (
              <SetRow
                key={ref.set.id}
                set={ref.set}
                party={ref.party}
                order={ref.party.sets.indexOf(ref.set)}
                picked={mine.has(ref.set.id)}
                who={picks[ref.set.id] ?? []}
                currentUserName={currentUserName}
                clashing={mine.has(ref.set.id) && clashingIds.has(ref.set.id)}
                onToggle={onToggle}
                showVenue
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#c4906a]/50 bg-[#f6e6c8]/60 px-4 py-6 text-center">
      <p className="text-xs font-semibold leading-relaxed text-[#7a5030]">{children}</p>
    </div>
  );
}
