"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CityMap, type LayerKey, type MapCamp, type MapVenue } from "@/components/map/CityMap";
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

/** Cuántos resultados de búsqueda se enseñan: más no caben en el móvil. */
const MAX_RESULTS = 8;

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

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return camps.filter((camp) => normalize(camp.name).includes(q)).slice(0, MAX_RESULTS);
  }, [query, camps]);

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
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${camps.length} campamentos…`}
            className="w-full rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-2.5 text-sm font-semibold text-[#2a1a08] placeholder:text-[#a07040] focus:border-[#c84a10] focus:outline-none"
          />
          {results.length > 0 && (
            <ul className="absolute z-[500] mt-1 w-full overflow-hidden rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] shadow-lg">
              {results.map((camp) => (
                <li key={camp.uid} className="flex items-center gap-1 px-2 hover:bg-[#f0e4c0]">
                  <button
                    type="button"
                    onClick={() => {
                      setFocus({ uid: camp.uid, nonce: Date.now() });
                      setQuery("");
                      setLayers((prev) => ({ ...prev, camps: true }));
                    }}
                    disabled={!camp.point}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#2a1a08]">
                      {camp.name}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-[#a07040]">
                      {camp.address ?? "sin sitio"}
                    </span>
                  </button>
                  <CampStar
                    camp={camp}
                    picked={picked}
                    currentUserName={currentUserName}
                    canPick={canPick}
                    onToggle={toggleCamp}
                  />
                </li>
              ))}
            </ul>
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
              {favouriteCamps.map((camp) => (
                <div
                  key={camp.uid}
                  className="flex items-center gap-2 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2"
                >
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
                  <CampStar
                    camp={camp}
                    picked={picked}
                    currentUserName={currentUserName}
                    canPick={canPick}
                    onToggle={toggleCamp}
                  />
                </div>
              ))}
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
