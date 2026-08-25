"use client";

import { useState } from "react";
import Link from "next/link";
import { CityMap, type LayerKey, type MapVenue } from "@/components/map/CityMap";

/** Escenario que no se puede pintar: art car, bus o deep playa. */
export interface RovingVenue {
  id: string;
  name: string;
  emoji: string;
  location: string;
}

const TOGGLES: { key: LayerKey; label: string; emoji: string }[] = [
  { key: "venues", label: "Escenarios", emoji: "🎧" },
  { key: "toilets", label: "Baños", emoji: "🚻" },
  { key: "essentials", label: "Hielo y sanidad", emoji: "🧊" },
  { key: "services", label: "Servicios", emoji: "ℹ️" },
];

export function MapPanel({
  venues,
  roving,
}: {
  venues: (MapVenue & { distance: string; walk: number })[];
  roving: RovingVenue[];
}) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    venues: true,
    toilets: true,
    essentials: false,
    services: false,
  });

  const toggle = (key: LayerKey) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

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

      <div className="relative h-[62vh] min-h-[380px] overflow-hidden rounded-2xl border-2 border-[#c4906a]/40">
        <CityMap venues={venues} layers={layers} />
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
