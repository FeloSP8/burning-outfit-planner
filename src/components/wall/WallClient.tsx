"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { WallOutfit } from "@/types";

const SLOT_LABEL: Record<string, string> = {
  TOP: "Arriba", BOTTOM: "Abajo", SHOES: "Calzado", ACCESSORY: "Accesorios", COAT: "Abrigo", BIKE_ACCESSORY: "Bici",
};
const SLOT_ICON: Record<string, string> = {
  TOP: "👕", BOTTOM: "👖", SHOES: "👟", ACCESSORY: "🕶️", COAT: "🧥", BIKE_ACCESSORY: "🚲",
};

function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);
}

type ViewKey = "day" | "author";
type ShiftFilter = "ALL" | "TARDE" | "NOCHE";

// Orden de turnos dentro de un mismo día: Tarde antes que Noche
const SHIFT_ORDER: Record<string, number> = { TARDE: 0, NOCHE: 1 };

export function WallClient({ outfits }: { outfits: WallOutfit[] }) {
  const [view, setView] = useState<ViewKey>("day");
  const [authorFilter, setAuthorFilter] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

  const authors = useMemo(
    () => Array.from(new Set(outfits.map((o) => o.authorName))).sort((a, b) => a.localeCompare(b)),
    [outfits]
  );

  // Aplicar filtros
  const filtered = useMemo(
    () => outfits.filter((o) => {
      if (authorFilter !== "ALL" && o.authorName !== authorFilter) return false;
      if (shiftFilter !== "ALL" && o.shiftType !== shiftFilter) return false;
      return true;
    }),
    [outfits, authorFilter, shiftFilter]
  );

  // Agrupar según la vista elegida
  const groups = useMemo(() => groupOutfits(filtered, view), [filtered, view]);

  const selectCls =
    "rounded-lg border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2 text-sm font-semibold text-[#2a1a08] focus:border-[#c84a10]/60 focus:outline-none";

  return (
    <div className="flex flex-col gap-5">
      {/* Barra de vista + filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e0b8]/50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <Control label="Agrupar por">
          <select value={view} onChange={(e) => setView(e.target.value as ViewKey)} className={selectCls}>
            <option value="day">Día y turno</option>
            <option value="author">Usuario</option>
          </select>
        </Control>

        <Control label="Usuario">
          <select value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className={selectCls}>
            <option value="ALL">Todos</option>
            {authors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Control>

        <Control label="Turno">
          <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value as ShiftFilter)} className={selectCls}>
            <option value="ALL">Todos</option>
            <option value="TARDE">☀️ Tarde</option>
            <option value="NOCHE">🌙 Noche</option>
          </select>
        </Control>

        <span className="ml-auto self-center text-xs font-bold text-[#a07040]">
          {filtered.length} {filtered.length === 1 ? "outfit" : "outfits"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm font-semibold text-[#a07040]">
          No hay outfits que coincidan con el filtro.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-3">
              {/* Cabecera de grupo */}
              <div className="flex items-center gap-2 border-b-2 border-[#c4906a]/30 pb-2">
                <span className="text-lg">{g.icon}</span>
                <h2 className="text-lg font-black text-[#7a2e08]" style={{ fontFamily: "var(--font-body)" }}>
                  {g.title}
                </h2>
                <span className="rounded-full bg-[#8a5a20]/20 px-2 py-0.5 text-xs font-bold text-[#5a3010]">
                  {g.items.length}
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((o) => <OutfitCard key={o.id} outfit={o} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

type Group = { key: string; title: string; icon: string; sortKey: string; items: WallOutfit[] };

function groupOutfits(outfits: WallOutfit[], view: ViewKey): Group[] {
  const map = new Map<string, Group>();

  for (const o of outfits) {
    let key: string, title: string, icon: string, sortKey: string;

    if (view === "day") {
      const d = new Date(o.date);
      const dateLabel = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
      const shiftLabel = o.shiftType === "NOCHE" ? "Noche" : "Tarde";
      key = `${o.date.slice(0, 10)}_${o.shiftType}`;
      title = `${capitalize(dateLabel)} · ${shiftLabel}`;
      icon = o.shiftType === "NOCHE" ? "🌙" : "☀️";
      // ordenar por fecha y, dentro del día, Tarde antes que Noche
      sortKey = `${o.date.slice(0, 10)}_${SHIFT_ORDER[o.shiftType] ?? 9}`;
    } else {
      key = o.authorName;
      title = o.authorName;
      icon = "👤";
      sortKey = o.authorName.toLowerCase();
    }

    if (!map.has(key)) map.set(key, { key, title, icon, sortKey, items: [] });
    map.get(key)!.items.push(o);
  }

  return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">{label}</span>
      {children}
    </div>
  );
}

function OutfitCard({ outfit: o }: { outfit: WallOutfit }) {
  const isNight = o.shiftType === "NOCHE";
  const date = new Date(o.date);
  const dateLabel = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border-2 ${
      isNight ? "bg-[#0e0c20] border-[#2a2060]" : "bg-[#fdf4e0] border-[#c4906a]/40"
    }`}>
      {/* Header: autor + turno */}
      <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${isNight ? "border-[#2a2060]" : "border-[#c4906a]/20"}`}>
        <span className="text-base">{isNight ? "🌙" : "☀️"}</span>
        <div className="flex flex-col min-w-0">
          <span className={`text-sm font-black leading-tight truncate ${isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
            {o.authorName}
          </span>
          <span className={`text-[10px] font-semibold ${isNight ? "text-[#6a6090]" : "text-[#a07040]"}`}>
            {isNight ? "Noche" : "Tarde"} · {dateLabel}{o.dayLabel ? ` · ${o.dayLabel}` : ""}
          </span>
        </div>
      </div>

      {/* Try-on grande si existe */}
      {o.tryOnUrl && (
        <div className={`relative h-72 w-full ${isNight ? "bg-white/5" : "bg-[#c4906a]/10"}`}>
          <Image src={o.tryOnUrl} alt={`Outfit de ${o.authorName}`} fill className="object-contain" />
        </div>
      )}

      {/* Lista de prendas con link de compra */}
      <div className="flex flex-col gap-2 p-4">
        {o.items.map((it) => {
          const g = it.garment;
          const price = formatPrice(g.price);
          return (
            <div key={it.id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${isNight ? "bg-white/5" : "bg-[#c4906a]/10"}`}>
              <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg flex items-center justify-center ${isNight ? "bg-white/10" : "bg-[#c4906a]/20"}`}>
                {g.photoUrl
                  ? <Image src={g.photoUrl} alt={g.name} fill className="object-cover" />
                  : <span className="text-lg">{SLOT_ICON[g.slot] ?? "🧣"}</span>}
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <span className={`text-xs font-bold leading-tight truncate ${isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
                  {g.name}
                </span>
                <span className={`text-[10px] font-medium ${isNight ? "text-[#6a6090]" : "text-[#a07040]"}`}>
                  {SLOT_LABEL[g.slot] ?? g.slot}{price ? ` · ${price}` : ""}
                </span>
              </div>
              {g.purchaseUrl ? (
                <a href={g.purchaseUrl} target="_blank" rel="noopener noreferrer"
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors ${
                    isNight ? "bg-[#4a38c0] hover:bg-[#5a48d0]" : "bg-[#c84a10] hover:bg-[#a83a08]"
                  }`}>
                  Comprar ↗
                </a>
              ) : (
                <span className={`shrink-0 text-[10px] font-medium italic ${isNight ? "text-[#4a4070]" : "text-[#c4906a]/70"}`}>
                  sin link
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
