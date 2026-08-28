"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CityMap, type LayerKey, type MapCamp, type MapVenue } from "@/components/map/CityMap";
import { CITY_SECTORS, sectorsOf } from "@/lib/brc-sectors";
import type { CampEvent } from "@/lib/camp-events";
import type { CampPicksByUid } from "@/lib/camp-picks";

/** Escenario que no se puede pintar: art car, bus o deep playa. */
export interface RovingVenue {
  id: string;
  name: string;
  emoji: string;
  location: string;
}

const TOGGLES: { key: LayerKey; label: string; emoji: string }[] = [
  { key: "venues", label: "Escenarios", emoji: "🎧" },
  { key: "camps", label: "Campamentos", emoji: "⛺" },
  { key: "toilets", label: "Baños", emoji: "🚻" },
  { key: "essentials", label: "Hielo y sanidad", emoji: "🧊" },
  { key: "services", label: "Servicios", emoji: "ℹ️" },
];

/**
 * Cuántos campamentos se pintan de una vez.
 *
 * Filtrar por región deja cientos, y buscar por nombre puede dejar decenas: se
 * enseña una tanda y un botón para seguir, como en los eventos.
 */
const PAGE = 25;

/** Emoji por tipo de evento, con las abreviaturas que usa la API. */
const TYPE_EMOJI: Record<string, string> = {
  prty: "🎶", work: "🛠️", care: "💗", food: "🍜", game: "🎲", adlt: "🔥",
  kid: "🧒", para: "🎪", perf: "🎭", fire: "🔥", arts: "🎨", tea: "🫖",
  yoga: "🧘", live: "🎤", rept: "🔁", othr: "✨", other: "✨",
};

/** "2026-08-31T21:00:00-07:00" → "31 ago · 21:00". */
function whenOf(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "America/Los_Angeles" });
  return `${day} · ${iso.slice(11, 16)}`;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** La estrella de un campamento: encendida si alguien del grupo lo ha marcado. */
function CampStar({
  camp,
  picked,
  currentUserName,
  canPick,
  onToggle,
}: {
  camp: MapCamp;
  picked: CampPicksByUid;
  currentUserName?: string;
  canPick: boolean;
  onToggle: (uid: string) => void;
}) {
  if (!currentUserName) return null;
  const who = picked[camp.uid] ?? [];
  const mine = who.includes(currentUserName);

  return (
    <button
      type="button"
      onClick={() => onToggle(camp.uid)}
      disabled={!canPick}
      aria-pressed={mine}
      aria-label={mine ? `Quitar ${camp.name} de mis campamentos` : `Marcar ${camp.name}`}
      title={who.length > 0 ? `Marcado por ${who.join(", ")}` : undefined}
      className={`shrink-0 rounded-full px-2 py-1 text-lg leading-none ${
        mine ? "opacity-100" : who.length > 0 ? "opacity-60" : "opacity-30"
      } ${canPick ? "hover:opacity-100" : "cursor-default"}`}
    >
      ★
    </button>
  );
}

export function MapPanel({
  venues,
  roving,
  camps = [],
  campsNote,
  campEvents = [],
  campPicks = {},
  currentUserName,
  canPick = true,
}: {
  venues: (MapVenue & { distance: string; walk: number })[];
  roving: RovingVenue[];
  /** Listado oficial de campamentos, ya situado. */
  camps?: MapCamp[];
  /** Qué contar cuando no hay campamentos que enseñar. */
  campsNote?: string | null;
  /** Eventos oficiales que cuelgan de un campamento, para poder listárselos. */
  campEvents?: CampEvent[];
  /** uid → quiénes lo tienen marcado. */
  campPicks?: CampPicksByUid;
  currentUserName?: string;
  /** Sin cobertura se ven los marcados, pero no se puede tocar la estrella. */
  canPick?: boolean;
}) {
  const [picked, setPicked] = useState<CampPicksByUid>(campPicks);
  const [showPicked, setShowPicked] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    venues: true,
    camps: true,
    toilets: true,
    essentials: false,
    services: false,
  });
  const [query, setQuery] = useState("");
  /** Región del reloj elegida. Una sola: null es toda la ciudad. */
  const [region, setRegion] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  /** Campamentos marcados que están abiertos, con su ficha entera. */
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // El nonce fuerza el vuelo aunque se busque dos veces el mismo campamento.
  const [focus, setFocus] = useState<{ uid: string; nonce: number } | null>(null);

  const toggle = (key: LayerKey) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const favourites = useMemo(
    () => Object.entries(picked).filter(([, who]) => who.length > 0).map(([uid]) => uid),
    [picked]
  );

  const favouriteCamps = useMemo(() => {
    const byUid = new Map(camps.map((camp) => [camp.uid, camp]));
    return favourites
      .map((uid) => byUid.get(uid))
      .filter((camp): camp is MapCamp => camp !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [favourites, camps]);

  const toggleCamp = useCallback(
    async (campUid: string) => {
      if (!canPick || !currentUserName) return;
      const mine = (picked[campUid] ?? []).includes(currentUserName);

      const apply = (add: boolean) =>
        setPicked((prev) => {
          const who = prev[campUid] ?? [];
          return {
            ...prev,
            [campUid]: add ? [...who, currentUserName] : who.filter((n) => n !== currentUserName),
          };
        });

      apply(!mine);
      const res = await fetch("/api/camp-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campUid }),
      }).catch(() => null);

      if (!res || !res.ok) apply(mine);
    },
    [canPick, currentUserName, picked]
  );

  // La región de cada campamento se resuelve una vez, no en cada tecla.
  const regionByUid = useMemo(
    () => new Map(camps.map((camp) => [camp.uid, sectorsOf(camp)])),
    [camps]
  );

  const regionCounts = useMemo(() => {
    const count = new Map<string, number>();
    for (const camp of camps) {
      for (const id of regionByUid.get(camp.uid) ?? []) count.set(id, (count.get(id) ?? 0) + 1);
    }
    return count;
  }, [camps, regionByUid]);

  /**
   * Lo que se lista: la región manda y el nombre afina.
   *
   * Con región y sin texto salen todos los de esa zona; con texto y sin región,
   * todos los que se llamen así; con las dos, la intersección. Sin ninguna de
   * las dos no se lista nada: mil y pico campamentos no son una lista útil.
   */
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!region && q.length < 2) return null;

    return camps
      .filter((camp) => !region || (regionByUid.get(camp.uid) ?? []).includes(region))
      .filter((camp) => q.length < 2 || normalize(camp.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [query, region, camps, regionByUid]);

  /** uid del campamento → sus eventos, ordenados por cuándo empiezan. */
  const eventsByCamp = useMemo(() => {
    const byCamp = new Map<string, CampEvent[]>();
    for (const event of campEvents) {
      const list = byCamp.get(event.campUid) ?? [];
      list.push(event);
      byCamp.set(event.campUid, list);
    }
    for (const list of byCamp.values()) {
      list.sort((a, b) => (a.occurrences[0]?.start ?? "").localeCompare(b.occurrences[0]?.start ?? ""));
    }
    return byCamp;
  }, [campEvents]);

  const toggleOpen = (uid: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(uid)) next.add(uid);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TOGGLES.map(({ key, label, emoji }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            aria-pressed={layers[key]}
            className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
              layers[key]
                ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                : "border-[#c4906a]/50 bg-[#fdf4e0] text-[#a07040]"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {camps.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Regiones del reloj. Una sola: aquí se busca "por dónde caigo", no
              se suman zonas sueltas como en los eventos. */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {CITY_SECTORS.map((sector) => {
              const n = regionCounts.get(sector.id) ?? 0;
              const active = region === sector.id;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => {
                    setRegion(active ? null : sector.id);
                    setLimit(PAGE);
                  }}
                  aria-pressed={active}
                  title={sector.label}
                  disabled={n === 0 && !active}
                  className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                      : "border-[#c4906a]/50 bg-[#fdf4e0] text-[#a07040]"
                  } ${n === 0 && !active ? "opacity-40" : ""}`}
                >
                  {sector.short} <span className="opacity-70">{n}</span>
                </button>
              );
            })}
            {region && (
              <button
                type="button"
                onClick={() => {
                  setRegion(null);
                  setLimit(PAGE);
                }}
                className="shrink-0 rounded-full border-2 border-[#c4906a]/50 bg-[#fdf4e0] px-3 py-1.5 text-xs font-bold text-[#a07040]"
              >
                ✕ Toda la ciudad
              </button>
            )}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder={`Buscar entre ${camps.length} campamentos…`}
            className="w-full rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-2.5 text-sm font-semibold text-[#2a1a08] placeholder:text-[#a07040] focus:border-[#c84a10] focus:outline-none"
          />

          {results !== null && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
                {results.length === 0
                  ? "Ningún campamento con esos filtros"
                  : `${results.length} ${results.length === 1 ? "campamento" : "campamentos"}`}
              </p>

              {results.slice(0, limit).map((camp) => (
                <div
                  key={camp.uid}
                  className="flex items-start gap-1 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-2 py-1"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFocus({ uid: camp.uid, nonce: Date.now() });
                      setLayers((prev) => ({ ...prev, camps: true }));
                    }}
                    disabled={!camp.point}
                    className="min-w-0 flex-1 px-2 py-1.5 text-left disabled:opacity-60"
                  >
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-bold text-[#2a1a08]">{camp.name}</span>
                      <span className="text-[11px] font-semibold text-[#a07040]">
                        {camp.address ?? "sin sitio"}
                      </span>
                    </p>
                    {camp.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-[#7a5030]">
                        {camp.description}
                      </p>
                    )}
                  </button>
                  <CampStar
                    camp={camp}
                    picked={picked}
                    currentUserName={currentUserName}
                    canPick={canPick}
                    onToggle={toggleCamp}
                  />
                </div>
              ))}

              {results.length > limit && (
                <button
                  type="button"
                  onClick={() => setLimit((l) => l + PAGE)}
                  className="self-start rounded-full border-2 border-[#c84a10] px-4 py-2 text-xs font-black text-[#c84a10]"
                >
                  Ver {Math.min(PAGE, results.length - limit)} más
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {favouriteCamps.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPicked((v) => !v)}
            className="rounded-full border-2 border-[#c84a10] px-3 py-1.5 text-xs font-black text-[#c84a10]"
          >
            ⭐ {favouriteCamps.length}{" "}
            {favouriteCamps.length === 1 ? "campamento marcado" : "campamentos marcados"}
            {showPicked ? " ▲" : " ▼"}
          </button>

          {showPicked && (
            <div className="mt-2 flex flex-col gap-1.5">
              {favouriteCamps.map((camp) => {
                const isOpen = open.has(camp.uid);
                const events = eventsByCamp.get(camp.uid) ?? [];
                return (
                  <div
                    key={camp.uid}
                    className="overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0]"
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setFocus({ uid: camp.uid, nonce: Date.now() })}
                        disabled={!camp.point}
                        className="min-w-0 flex-1 text-left disabled:opacity-50"
                      >
                        <p className="truncate text-sm font-bold text-[#2a1a08]">{camp.name}</p>
                        <p className="text-[11px] font-semibold text-[#a07040]">
                          {camp.address ?? "sin sitio"} · {(picked[camp.uid] ?? []).join(", ")}
                        </p>
                      </button>
                      {/* Botón aparte: el nombre lleva al plano y esto abre la
                          ficha. Meter las dos cosas en un clic obligaría a
                          elegir, y las dos hacen falta. */}
                      <button
                        type="button"
                        onClick={() => toggleOpen(camp.uid)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Cerrar la ficha de ${camp.name}` : `Ver la ficha de ${camp.name}`}
                        className={`shrink-0 px-1 text-sm font-black text-[#c84a10] transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      >
                        ›
                      </button>
                      <CampStar
                        camp={camp}
                        picked={picked}
                        currentUserName={currentUserName}
                        canPick={canPick}
                        onToggle={toggleCamp}
                      />
                    </div>

                    {isOpen && (
                      <div className="border-t border-[#c4906a]/20 bg-[#f6e6c8]/40 px-3 py-2.5">
                        <p className="text-xs font-medium leading-relaxed text-[#7a5030]">
                          {camp.description ?? "Este campamento no publica descripción."}
                        </p>

                        <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
                          {events.length === 0
                            ? "Sin eventos en el listado oficial"
                            : `${events.length} ${events.length === 1 ? "evento" : "eventos"}`}
                        </p>

                        {events.length > 0 && (
                          <ul className="mt-1.5 flex flex-col gap-1">
                            {events.map((event, i) => (
                              <li key={`${camp.uid}-${i}`} className="flex items-baseline gap-2">
                                <span className="shrink-0 text-xs">{TYPE_EMOJI[event.type] ?? "✨"}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="text-xs font-bold text-[#2a1a08]">{event.title}</span>
                                  <span className="ml-1.5 text-[11px] font-semibold text-[#a07040]">
                                    {event.allDay
                                      ? "todo el día"
                                      : event.occurrences.map((o) => whenOf(o.start)).join(" · ")}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {campsNote && (
        <p className="text-[11px] font-semibold text-[#a07040]">{campsNote}</p>
      )}

      <div className="relative h-[62vh] min-h-[380px] overflow-hidden rounded-2xl border-2 border-[#c4906a]/40">
        <CityMap
          venues={venues}
          camps={camps}
          layers={layers}
          focus={focus}
          favourites={favourites}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="flex items-center gap-3 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2.5"
          >
            <span className="text-2xl">{venue.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black leading-tight text-[#2a1a08]">
                {venue.stage ? `${venue.name} · ${venue.stage}` : venue.name}
              </p>
              <p className="text-[11px] font-semibold text-[#a07040]">
                {venue.location} · {venue.distance} del Hombre · {venue.walk} min a pie
                {venue.exact ? "" : " · cruce estimado"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {roving.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#c4906a]/50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#a07040]">
            Sin sitio fijo — no se pueden pintar
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[#7a5030]">
            {roving.map((v) => `${v.emoji} ${v.name} (${v.location})`).join(" · ")}
          </p>
        </div>
      )}

      <p className="text-[11px] font-medium leading-relaxed text-[#a07040]">
        La ciudad viene del{" "}
        <a
          href="https://github.com/burningmantech/innovate-GIS-data"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          GIS oficial de Burning Man
        </a>{" "}
        — calles, valla, plazas, baños y puntos clave del replanteo de 2026, dato público y sin
        clave de API. Los escenarios los ponemos nosotros geocodificando la dirección de cada
        cartel: no son datos oficiales de colocación, así que un campamento puede acabar media
        manzana más allá. Los line-ups están en{" "}
        <Link href="/agenda" className="font-bold underline">
          la agenda
        </Link>
        .
      </p>
    </div>
  );
}
