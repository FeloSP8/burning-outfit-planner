"use client";

import { useMemo, useState } from "react";
import {
  ALL_SETS,
  ALL_ARTISTS,
  ARTIST_INDEX,
  GENRE_INDEX,
  VENUE_BY_ID,
  DAYS_WITH_LINEUP,
  KIND_LABEL,
  clashesFor,
  dayAfterLabel,
  findClashes,
  fromMinutes,
  isEstimated,
  matchesQuery,
  normalize,
  partiesOn,
  partyRange,
  setWindow,
  shortWeekday,
  toEntry,
  venueLabel,
  type AgendaEntry,
  type Clash,
  type SetRef,
} from "@/lib/dj-agenda";
import type { DjSet, Party } from "@/lib/dj-lineups";
import { ARTIST_INFO, type Genre } from "@/lib/dj-artists";
import type { DjPicksBySet } from "@/types";

const venueOf = (party: Party) => VENUE_BY_ID[party.venueId];

/**
 * "Playground · Arrival Stage · Afrika", pero solo "Huofeng" cuando la fiesta
 * se llama igual que el escenario, que es lo normal en los sitios de una sola
 * fiesta por noche.
 */
function whereLabel(party: Party): string {
  const label = venueLabel(venueOf(party));
  return label === party.name ? label : `${label} · ${party.name}`;
}

export function AgendaClient({
  initialPicks,
  initialFavorites,
  currentUserName,
  today,
}: {
  initialPicks: DjPicksBySet;
  /** Artistas que le gustan al usuario: salen arriba de la lista por DJ. */
  initialFavorites: string[];
  currentUserName: string;
  /** Fecha de hoy en el playa, para abrir la página por el día que toca. */
  today: string;
}) {
  const [picks, setPicks] = useState<DjPicksBySet>(initialPicks);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(initialFavorites));
  const [day, setDay] = useState<string>(
    () => DAYS_WITH_LINEUP.find((d) => d.date >= today)?.date ?? DAYS_WITH_LINEUP[0].date
  );
  const [onlyMine, setOnlyMine] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"dia" | "dj" | "estilo">("dia");
  const [genre, setGenre] = useState<Genre | null>(null);

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
  const clashDays = useMemo(
    () => new Set(clashes.flatMap((c) => [c.a.party.date, c.b.party.date])),
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

  async function toggleFavorite(artist: string) {
    const wasFavorite = favorites.has(artist);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (!next.delete(artist)) next.add(artist);
      return next;
    });

    const res = await fetch("/api/dj-favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist }),
    });

    if (!res.ok) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(artist);
        else next.delete(artist);
        return next;
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
          // Botón, no etiqueta: el contador es de toda la agenda pero las marcas
          // van en la tarjeta de cada día, así que sin esto avisa de algo que no
          // se ve por ninguna parte hasta dar con el día correcto.
          <button
            type="button"
            onClick={() => {
              setQuery("");
              const first = DAYS_WITH_LINEUP.find((d) => clashDays.has(d.date));
              if (first) setDay(first.date);
            }}
            className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100"
          >
            ⚠️ {clashes.length} {clashes.length === 1 ? "solape" : "solapes"} en tu agenda
            <span className="ml-1 font-black">›</span>
          </button>
        )}
      </div>

      {/* Por día o por DJ: dos formas de mirar lo mismo */}
      <div className="flex gap-1.5">
        {([
          ["dia", "🗓️ Día"],
          ["dj", "🎧 DJ"],
          ["estilo", "🎚️ Estilo"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            aria-pressed={view === id}
            className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-black transition-colors ${
              view === id
                ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                : "border-[#c4906a]/40 bg-[#fdf4e0] text-[#7a4a20] hover:border-[#c84a10]/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Buscador + vista */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            view === "dj" ? "Buscar DJ…" : view === "estilo" ? "Buscar DJ dentro del estilo…" : "Buscar DJ, fiesta o escenario…"
          }
          className="flex-1 rounded-xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2 text-sm font-semibold text-[#2a1a08] placeholder:font-medium placeholder:text-[#a07040] focus:border-[#c84a10] focus:outline-none"
        />
        {view === "dia" && (
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
        )}
      </div>

      {view === "estilo" ? (
        <GenreList
          selected={genre}
          onSelect={setGenre}
          query={query}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          picks={picks}
          mine={mine}
          currentUserName={currentUserName}
          clashes={clashes}
          onToggle={toggle}
        />
      ) : view === "dj" ? (
        <ArtistList
          query={query}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          picks={picks}
          mine={mine}
          currentUserName={currentUserName}
          clashes={clashes}
          onToggle={toggle}
        />
      ) : searching ? (
        <SearchResults
          results={results}
          query={query}
          picks={picks}
          mine={mine}
          currentUserName={currentUserName}
          clashes={clashes}
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
                    {clashDays.has(d.date) && " ⚠️"}
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
                  clashes={clashes}
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
  clashes,
  onToggle,
}: {
  party: Party;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashes: Clash[];
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
            {venueLabel(venue) !== party.name && `${venueLabel(venue)} · `}
            {party.where ?? venue.location} · {partyRange(party)}
            {isEstimated(party) && (
              <span className="ml-1.5 whitespace-nowrap rounded-md bg-[#c4906a]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#7a4a20]">
                ⏱ horas estimadas
              </span>
            )}
          </p>
        </div>
      </header>

      {party.note && (
        <p className="px-4 pb-2 text-[11px] font-medium leading-relaxed text-[#a07040]">{party.note}</p>
      )}

      <div className="border-t border-black/5 bg-[#fdf4e0]/70">
        {party.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            party={party}
            picked={mine.has(set.id)}
            who={picks[set.id] ?? []}
            currentUserName={currentUserName}
            conflicts={mine.has(set.id) ? clashesFor(set.id, clashes) : []}
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
  picked,
  who,
  currentUserName,
  conflicts,
  onToggle,
  showVenue = false,
  showDay = false,
}: {
  set: DjSet;
  party: Party;
  picked: boolean;
  who: string[];
  currentUserName: string;
  /** Sets de tu agenda con los que este se pisa. Vacío si no hay conflicto. */
  conflicts: AgendaEntry[];
  onToggle: (setId: string) => void;
  showVenue?: boolean;
  /** Antepone el día; solo hace falta en listas que cruzan fechas. */
  showDay?: boolean;
}) {
  const venue = venueOf(party);
  const others = who.filter((n) => n !== currentUserName);
  const window = setWindow(party, set);
  // Un set de madrugada se pinta con el día al que pertenece de verdad. Vale
  // igual para las horas estimadas: una noche de siete sets llega a las 05:00.
  const afterMidnight = window.start >= 24 * 60;

  return (
    <div
      className={`flex items-start gap-3 border-t border-[#c4906a]/15 px-4 py-2.5 first:border-t-0 ${
        picked ? "bg-[#c84a10]/10" : ""
      }`}
    >
      {/* La hora estimada va apagada y con su etiqueta debajo. Nada de "~"
          delante del número: en Syne se lee como un guion y acaba pareciendo
          parte de la hora. */}
      <span
        className={`w-[4.75rem] shrink-0 pt-0.5 text-xs font-black tabular-nums ${
          window.estimated ? "text-[#a07040]" : "text-[#7a2e08]"
        }`}
        title={window.estimated ? "Hora estimada: el cartel solo publica el orden" : undefined}
      >
        {window.estimated ? fromMinutes(window.start) : set.start}
        {(afterMidnight || showDay || window.estimated) && (
          <span className="block text-[10px] font-bold uppercase leading-tight text-[#a07040]">
            {[
              afterMidnight ? dayAfterLabel(party.date) : showDay ? shortWeekday(party.date) : null,
              window.estimated ? "aprox." : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-[#2a1a08]">{set.label}</p>

        {/* Las etiquetas en su propia fila: en línea con el nombre, "CABEZA DE
            CARTEL" no cabía en un móvil y se metía debajo del botón. */}
        {(set.live || set.headliner || set.sun || set.note) && (
          <span className="mt-1 flex flex-wrap items-center gap-1">
            {set.live && <Tag className="bg-[#c84a10] text-[#fdf4e0]">LIVE</Tag>}
            {set.headliner && <Tag className="bg-[#f5c518] text-[#4a2a08]">✳ CABEZA DE CARTEL</Tag>}
            {set.sun && (
              <Tag className="bg-[#f5c518]/40 text-[#7a4a20]">
                {set.sun === "amanecer" ? "🌅" : "🌇"} {set.sun}
              </Tag>
            )}
            {set.note && <Tag className="bg-[#c4906a]/25 text-[#7a4a20]">{set.note}</Tag>}
          </span>
        )}

        {showVenue && (
          <p className="text-[11px] font-semibold text-[#a07040]">
            {venue.emoji} {whereLabel(party)}
          </p>
        )}

        {others.length > 0 && (
          <p className="text-[11px] font-semibold text-[#a07040]">👥 también {others.join(", ")}</p>
        )}

        {conflicts.length > 0 && (
          // Nombrar el set y su día: el otro puede estar en la tarjeta de otro
          // día, y "se pisa con otro set" no dice dónde buscarlo.
          <p className="text-[11px] font-bold leading-relaxed text-amber-800">
            ⚠️ Se pisa con{" "}
            {conflicts
              .map((c) =>
                c.party.date === party.date
                  ? c.set.label
                  : `${c.set.label} (${shortWeekday(c.party.date)})`
              )
              .join(", ")}
            {conflicts.some((c) => !c.set.start || !set.start) && " · el cartel no da horas exactas"}
          </p>
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
    <span className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-black ${className}`}>
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
      {entries.map((entry) => (
        <SetRow
          key={entry.set.id}
          set={entry.set}
          party={entry.party}
          picked
          who={picks[entry.set.id] ?? []}
          currentUserName={currentUserName}
          conflicts={clashesFor(entry.set.id, clashes)}
          onToggle={onToggle}
          showVenue
        />
      ))}
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
  clashes,
  onToggle,
}: {
  results: SetRef[];
  query: string;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashes: Clash[];
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
                picked={mine.has(ref.set.id)}
                who={picks[ref.set.id] ?? []}
                currentUserName={currentUserName}
                conflicts={mine.has(ref.set.id) ? clashesFor(ref.set.id, clashes) : []}
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

/**
 * Todos los DJs del cartel en una lista. Al tocar un nombre se despliega dónde
 * y cuándo pincha — que para los que repiten escenario es la pregunta de
 * verdad: Vintage Culture sale siete veces en siete sitios distintos.
 *
 * Los marcados con ♥ suben arriba del todo. Con 157 nombres, buscar a los
 * cuatro que te importan cada vez que abres la página no es agenda, es trabajo.
 */
function ArtistList({
  query,
  favorites,
  onToggleFavorite,
  picks,
  mine,
  currentUserName,
  clashes,
  onToggle,
}: {
  query: string;
  favorites: Set<string>;
  onToggleFavorite: (artist: string) => void;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashes: Clash[];
  onToggle: (setId: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const matching = useMemo(() => {
    const q = normalize(query);
    return ALL_ARTISTS.filter((a) => !q || normalize(a).includes(q));
  }, [query]);

  // Dos bloques, cada uno alfabético: los tuyos y el resto.
  const favoritos = matching.filter((a) => favorites.has(a));
  const resto = matching.filter((a) => !favorites.has(a));

  function toggleOpen(artist: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(artist)) next.add(artist);
      return next;
    });
  }

  if (matching.length === 0) {
    return <Empty>Ningún DJ del cartel se llama así: “{query.trim()}”.</Empty>;
  }

  const block = (artists: string[]) => (
    <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
      {artists.map((artist) => (
        <ArtistRow
          key={artist}
          artist={artist}
          favorite={favorites.has(artist)}
          onToggleFavorite={onToggleFavorite}
          isOpen={open.has(artist)}
          onToggleOpen={toggleOpen}
          picks={picks}
          mine={mine}
          currentUserName={currentUserName}
          clashes={clashes}
          onToggle={onToggle}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {favoritos.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-[#a07040]">
            ♥ Mis DJs
          </p>
          {block(favoritos)}
        </div>
      )}

      {resto.length > 0 && (
        <div>
          {favoritos.length > 0 && (
            <p className="mb-1.5 text-xs font-black uppercase tracking-widest text-[#a07040]">
              Todos los demás
            </p>
          )}
          {block(resto)}
        </div>
      )}
    </div>
  );
}

/** Una fila de la lista de DJs: el corazón, el nombre y, desplegado, sus sets. */
function ArtistRow({
  artist,
  favorite,
  onToggleFavorite,
  isOpen,
  onToggleOpen,
  picks,
  mine,
  currentUserName,
  clashes,
  onToggle,
}: {
  artist: string;
  favorite: boolean;
  onToggleFavorite: (artist: string) => void;
  isOpen: boolean;
  onToggleOpen: (artist: string) => void;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashes: Clash[];
  onToggle: (setId: string) => void;
}) {
  // Del primero al último, que es como se leen: en orden de evento.
  const entries = useMemo(
    () => (ARTIST_INDEX.get(artist) ?? []).map(toEntry).sort((a, b) => a.absStart - b.absStart),
    [artist]
  );
  const chosen = entries.filter((e) => mine.has(e.set.id)).length;

  return (
    <div className="border-t border-[#c4906a]/15 first:border-t-0">
      {/* Dos botones separados, no uno dentro de otro: el corazón marca y el
          resto de la fila despliega. */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onToggleFavorite(artist)}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar a ${artist} de mis DJs` : `Añadir a ${artist} a mis DJs`}
          className={`shrink-0 py-2.5 pl-4 pr-2 text-base leading-none transition-colors ${
            favorite ? "text-[#c84a10]" : "text-[#c4906a]/50 hover:text-[#c84a10]/70"
          }`}
        >
          {favorite ? "♥" : "♡"}
        </button>

        <button
          type="button"
          onClick={() => onToggleOpen(artist)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pr-4 text-left transition-colors hover:bg-[#f6e6c8]"
        >
          <span className="min-w-0 flex-1 text-sm font-bold text-[#2a1a08]">{artist}</span>

          {chosen > 0 && <span className="shrink-0 text-xs font-black text-[#c84a10]">{chosen} ★</span>}

          <span className="shrink-0 rounded-md bg-[#c4906a]/20 px-1.5 py-0.5 text-[11px] font-bold text-[#7a4a20]">
            {entries.length} {entries.length === 1 ? "set" : "sets"}
          </span>

          <span
            className={`shrink-0 text-sm font-black text-[#c84a10] transition-transform ${isOpen ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-[#c4906a]/15 bg-[#f6e6c8]/40">
          <ArtistCard artist={artist} />
          {entries.map((entry) => (
            <SetRow
              key={entry.set.id}
              set={entry.set}
              party={entry.party}
              picked={mine.has(entry.set.id)}
              who={picks[entry.set.id] ?? []}
              currentUserName={currentUserName}
              conflicts={mine.has(entry.set.id) ? clashesFor(entry.set.id, clashes) : []}
              onToggle={onToggle}
              showVenue
              showDay
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Género, Instagram y un set en vídeo. Lo que no se ha podido comprobar no se
 * pinta: mejor una ficha a medias que un enlace que lleva a otro.
 */
function ArtistCard({ artist }: { artist: string }) {
  const info = ARTIST_INFO[artist];
  if (!info) return null;

  const hasAny = info.genres?.length || info.about || info.instagram || info.video;
  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-1.5 border-b border-[#c4906a]/15 px-4 py-2.5">
      {(info.genres?.length || info.instagram || info.video) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {info.genres?.map((g) => (
            <span
              key={g}
              className="rounded-md bg-[#c4906a]/25 px-1.5 py-0.5 text-[11px] font-bold text-[#7a4a20]"
            >
              {g}
            </span>
          ))}

          {info.instagram && (
            <a
              href={`https://instagram.com/${info.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#c84a10] underline underline-offset-2"
            >
              📷 @{info.instagram}
            </a>
          )}

          {info.video && (
            <a
              href={info.video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#c84a10] underline underline-offset-2"
            >
              ▶️ {info.video.label}
            </a>
          )}
        </div>
      )}

      {info.about && (
        <p className="text-[11px] font-medium leading-relaxed text-[#7a5030]">{info.about}</p>
      )}
    </div>
  );
}

/**
 * Los estilos del cartel. Se elige uno y salen los DJs que lo pinchan; al
 * tocar cualquiera se despliega cuándo y dónde, igual que en la vista por DJ.
 *
 * Un artista sale en todos sus estilos: Vintage Culture está en House, en
 * tech house y en melodic house, porque las tres cosas son verdad.
 */
function GenreList({
  selected,
  onSelect,
  query,
  favorites,
  onToggleFavorite,
  picks,
  mine,
  currentUserName,
  clashes,
  onToggle,
}: {
  selected: Genre | null;
  onSelect: (g: Genre | null) => void;
  query: string;
  favorites: Set<string>;
  onToggleFavorite: (artist: string) => void;
  picks: DjPicksBySet;
  mine: Set<string>;
  currentUserName: string;
  clashes: Clash[];
  onToggle: (setId: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggleOpen(artist: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(artist)) next.add(artist);
      return next;
    });
  }

  // Dentro del estilo elegido, el buscador filtra por nombre.
  const artists = useMemo(() => {
    if (!selected) return [];
    const q = normalize(query);
    const all = GENRE_INDEX.get(selected) ?? [];
    return q ? all.filter((a) => normalize(a).includes(q)) : all;
  }, [selected, query]);

  return (
    <div className="flex flex-col gap-4">
      {/* Los estilos, con cuántos DJs tiene cada uno */}
      <div className="flex flex-wrap gap-1.5">
        {[...GENRE_INDEX.entries()].map(([g, list]) => {
          const active = g === selected;
          const mios = list.filter((a) => favorites.has(a)).length;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onSelect(active ? null : g)}
              aria-pressed={active}
              className={`rounded-xl border-2 px-2.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                  : "border-[#c4906a]/40 bg-[#fdf4e0] text-[#7a4a20] hover:border-[#c84a10]/50"
              }`}
            >
              {g}
              <span className={`ml-1.5 font-black ${active ? "text-[#fdf4e0]/70" : "text-[#a07040]"}`}>
                {list.length}
              </span>
              {mios > 0 && <span className="ml-1 text-[#c84a10]">{active ? "" : "♥"}</span>}
            </button>
          );
        })}
      </div>

      {!selected ? (
        <Empty>Elige un estilo y salen los DJs que lo pinchan, con sus horas y sus escenarios.</Empty>
      ) : artists.length === 0 ? (
        <Empty>
          Ningún DJ de <span className="font-black">{selected}</span> se llama así: “{query.trim()}”.
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]">
          {artists.map((artist) => (
            <ArtistRow
              key={artist}
              artist={artist}
              favorite={favorites.has(artist)}
              onToggleFavorite={onToggleFavorite}
              isOpen={open.has(artist)}
              onToggleOpen={toggleOpen}
              picks={picks}
              mine={mine}
              currentUserName={currentUserName}
              clashes={clashes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
