"use client";

import { useState } from "react";
import Image from "next/image";
import type { Shift, Garment, OutfitItem } from "@/types";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";

const SLOTS: { key: Garment["slot"]; label: string; icon: string }[] = [
  { key: "TOP",       label: "Parte de arriba", icon: "👕" },
  { key: "BOTTOM",    label: "Parte de abajo",  icon: "👖" },
  { key: "SHOES",     label: "Calzado",          icon: "👟" },
  { key: "ACCESSORY", label: "Accesorios",       icon: "🕶️" },
  { key: "COAT",      label: "Abrigo",           icon: "🧥" },
];

const STATUS_DOT: Record<string, string> = {
  COMPRADO: "bg-emerald-500",
  RECIBIDO: "bg-sky-500",
  PENDIENTE: "bg-amber-500",
};

type SlotSaveState = "idle" | "saving" | "saved" | "error";

export function ShiftCard({ shift, inventory, requireCoat, userPhotoUrl }: {
  shift: Shift;
  inventory: Garment[];
  requireCoat: boolean;
  userPhotoUrl: string | null;
}) {
  const [items, setItems]         = useState<OutfitItem[]>(shift.outfit?.items ?? []);
  const [tryOnUrl, setTryOnUrl]   = useState<string | null>(shift.outfit?.tryOn?.imageUrl ?? null);
  const [loading, setLoading]     = useState(false);
  const [warning, setWarning]     = useState<string | null>(null);
  const [extraPrompt, setExtra]   = useState("");
  const [model, setModel]         = useState<ModelId>("gpt-image-2");
  const [slotState, setSlotState] = useState<Partial<Record<Garment["slot"], SlotSaveState>>>({});

  const isNight     = shift.type === "NOCHE";
  const getItem     = (slot: Garment["slot"]) => items.find((i) => i.garment.slot === slot)?.garment ?? null;
  const missingCoat = requireCoat && !getItem("COAT");
  const visibleSlots = SLOTS.filter((s) => s.key !== "COAT" || isNight);

  function setSlotSave(slot: Garment["slot"], state: SlotSaveState) {
    setSlotState((prev) => ({ ...prev, [slot]: state }));
  }

  async function assign(slot: Garment["slot"], garmentId: string) {
    if (!shift.outfit) return;
    setSlotSave(slot, "saving");

    try {
      if (!garmentId) {
        // Deselect
        const item = items.find((i) => i.garment.slot === slot);
        if (item) {
          const res = await fetch(
            `/api/outfits/${shift.outfit.id}/items?garmentId=${item.garment.id}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error();
          setItems((prev) => prev.filter((i) => i.garment.slot !== slot));
        }
      } else {
        const res = await fetch(`/api/outfits/${shift.outfit.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ garmentId }),
        });
        if (!res.ok) throw new Error(await res.text());
        const item: OutfitItem = await res.json();
        setItems((prev) => [...prev.filter((i) => i.garment.slot !== slot), item]);
      }

      setSlotSave(slot, "saved");
      setTimeout(() => setSlotSave(slot, "idle"), 1800);
    } catch {
      setSlotSave(slot, "error");
      setTimeout(() => setSlotSave(slot, "idle"), 3000);
    }
  }

  async function runTryOn() {
    if (!shift.outfit || !userPhotoUrl) return;
    setLoading(true);
    setWarning(null);
    const res = await fetch("/api/ai/try-on", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: shift.outfit.id, userPhotoUrl, extraPrompt: extraPrompt.trim() || undefined, model }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.imageUrl) setTryOnUrl(data.imageUrl);
    if (data.warning) setWarning(data.warning);
    if (data.error)   setWarning(data.error);
  }

  const isNightCard = isNight;

  return (
    <section className={`flex flex-col overflow-hidden rounded-2xl border-2 shadow-sm ${
      isNightCard
        ? "bg-[#12102a] border-[#2a2060] text-[#d8d0f0]"
        : "bg-[#f5e0b8]/70 border-[#c4906a]/40 text-[#2a1a08]"
    }`}>

      {/* Header */}
      <div className={`px-5 pt-4 pb-3 border-b ${isNightCard ? "border-[#2a2060]" : "border-[#c4906a]/20"}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-black tracking-tight ${isNightCard ? "text-[#a098e0]" : "text-[#7a2e08]"}`}
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
            {isNightCard ? "🌙 Noche" : "☀️ Tarde"}
          </h2>
          {missingCoat && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-[11px] font-bold text-red-700 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Falta abrigo
            </span>
          )}
        </div>
      </div>

      {/* Slots */}
      <div className="flex flex-col gap-1.5 px-5 py-4">
        {visibleSlots.map(({ key, label, icon }) => {
          const current  = getItem(key);
          const options  = inventory.filter((g) => g.slot === key);
          const state    = slotState[key] ?? "idle";
          const isSaving = state === "saving";

          return (
            <div key={key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
              state === "saved"
                ? isNightCard ? "bg-emerald-900/30" : "bg-emerald-100/60"
                : state === "error"
                ? isNightCard ? "bg-red-900/30" : "bg-red-100/60"
                : isNightCard ? "bg-white/5 hover:bg-white/8" : "bg-[#c4906a]/10 hover:bg-[#c4906a]/20"
            }`}>

              {/* Thumbnail */}
              <div className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg flex items-center justify-center ${
                isNightCard ? "bg-white/10" : "bg-[#c4906a]/20"
              }`}>
                {current?.photoUrl
                  ? <Image src={current.photoUrl} alt={current.name} fill className="object-cover" />
                  : <span className="text-lg">{icon}</span>
                }
              </div>

              {/* Label + select */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isNightCard ? "text-[#9890c8]" : "text-[#a07040]"}`}>
                  {label}
                </span>
                <select
                  value={current?.id ?? ""}
                  disabled={isSaving}
                  onChange={(e) => assign(key, e.target.value)}
                  className={`w-full border-0 text-sm font-semibold focus:outline-none cursor-pointer appearance-none truncate disabled:opacity-60 disabled:cursor-wait ${
                    isNightCard ? "night-select" : "bg-transparent text-[#2a1a08]"
                  }`}
                >
                  <option value="">— sin asignar —</option>
                  {options.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Right indicator: save state or status dot */}
              <div className="shrink-0 w-5 flex items-center justify-center">
                {isSaving && (
                  <svg className="h-4 w-4 animate-spin text-[#c84a10]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {state === "saved" && (
                  <span className="text-sm text-emerald-500 font-bold">✓</span>
                )}
                {state === "error" && (
                  <span className="text-sm text-red-500 font-bold" title="Error al guardar">!</span>
                )}
                {state === "idle" && current && (
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[current.status] ?? "bg-zinc-400"}`} title={current.status} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      {warning && (
        <div className="mx-5 mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {warning}
        </div>
      )}

      {/* Try-on result */}
      {tryOnUrl && !loading && (
        <div className="relative mx-5 mb-4 h-64 overflow-hidden rounded-xl border border-[#c4906a]/30">
          <Image src={tryOnUrl} alt="Try-on" fill className="object-contain" />
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto px-5 pb-5 flex flex-col gap-2.5">

        {/* Model selector */}
        <div className="flex flex-col gap-1">
          <label className={`text-[10px] font-bold uppercase tracking-widest ${isNightCard ? "text-[#9890c8]" : "text-[#a07040]"}`}>
            Modelo de generación
          </label>
          <div className="flex flex-col gap-1.5">
            {LEONARDO_MODELS.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 px-3 py-2 transition-all ${
                  model === m.id
                    ? isNightCard
                      ? "border-[#6a5ae0] bg-[#6a5ae0]/15"
                      : "border-[#c84a10] bg-[#c84a10]/10"
                    : isNightCard
                    ? "border-[#2a2060] bg-white/3 hover:bg-white/6"
                    : "border-[#c4906a]/25 bg-[#c4906a]/5 hover:bg-[#c4906a]/12"
                }`}
              >
                <input
                  type="radio"
                  name={`model-${shift.id}`}
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="mt-0.5 shrink-0 accent-[#c84a10]"
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={`text-xs font-bold leading-tight ${isNightCard ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
                    {m.label}
                  </span>
                  <span className={`text-[10px] leading-snug ${isNightCard ? "text-[#6a6090]" : "text-[#a07040]"}`}>
                    {m.description}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Extra prompt */}
        <div className="flex flex-col gap-1">
          <label className={`text-[10px] font-bold uppercase tracking-widest ${isNightCard ? "text-[#9890c8]" : "text-[#a07040]"}`}>
            Indicaciones extra (opcional)
          </label>
          <textarea
            value={extraPrompt}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            placeholder={isNightCard ? "Ej: con LED lights, niebla en el fondo…" : "Ej: con gafas de sol, polvo en el aire…"}
            className={`w-full resize-none rounded-xl border-2 px-3 py-2 text-xs font-medium placeholder-opacity-50 focus:outline-none transition-colors ${
              isNightCard
                ? "border-[#2a2060] bg-white/5 text-[#d8d0f0] placeholder-[#4a4070] focus:border-[#4a38c0]/60"
                : "border-[#c4906a]/30 bg-[#c4906a]/10 text-[#2a1a08] placeholder-[#b09060] focus:border-[#c84a10]/50"
            }`}
          />
        </div>

        <button
          onClick={runTryOn}
          disabled={loading || !userPhotoUrl}
          title={!userPhotoUrl ? "Sube tu foto de cuerpo completo para usar el probador" : undefined}
          className={`w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            isNightCard
              ? "bg-[#4a38c0] hover:bg-[#5a48d0] shadow-[#4a38c0]/30"
              : "bg-[#c84a10] hover:bg-[#a83a08] shadow-[#c84a10]/30"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Generando…
            </span>
          ) : "👕  Probador Virtual"}
        </button>
        {!userPhotoUrl && (
          <p className={`text-center text-[10px] font-medium ${isNightCard ? "text-[#6a6090]" : "text-[#a07040]"}`}>
            Sube tu foto arriba para activar el probador
          </p>
        )}
      </div>
    </section>
  );
}
