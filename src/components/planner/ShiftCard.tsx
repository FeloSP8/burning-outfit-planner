"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Shift, Garment, OutfitItem, Day } from "@/types";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";

// ── Selector custom con previsualización de foto ──────────────────────────────
function GarmentSelect({
  options,
  value,
  onChange,
  disabled,
  icon,
  isNight,
}: {
  options: Garment[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
  icon: string;
  isNight: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((g) => g.id === value) ?? null;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  const triggerBase = `w-full flex items-center gap-2 text-sm font-semibold focus:outline-none cursor-pointer ${
    disabled ? "opacity-60 cursor-wait" : ""
  } ${isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`;

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={triggerBase}
      >
        {selected ? (
          <>
            <div className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-md flex items-center justify-center ${
              isNight ? "bg-white/10" : "bg-[#c4906a]/20"
            }`}>
              {selected.photoUrl
                ? <Image src={selected.photoUrl} alt={selected.name} fill className="object-cover" />
                : <span className="text-sm">{icon}</span>
              }
            </div>
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className={isNight ? "text-[#6a6090]" : "text-[#b09070]"}>— sin asignar —</span>
        )}
        <span className={`ml-auto shrink-0 text-[10px] transition-transform ${open ? "rotate-180" : ""} ${
          isNight ? "text-[#6a6090]" : "text-[#b09070]"
        }`}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border shadow-xl ${
          isNight
            ? "bg-[#1a1840] border-[#3a3070] shadow-black/60"
            : "bg-[#fdf4e0] border-[#c4906a]/50 shadow-[#2a1a08]/15"
        }`}>
          {/* Opción vacía */}
          <button
            type="button"
            onClick={() => pick("")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
              !value
                ? isNight ? "bg-white/10 font-bold" : "bg-[#c4906a]/20 font-bold"
                : isNight ? "hover:bg-white/8" : "hover:bg-[#c4906a]/10"
            } ${isNight ? "text-[#9890c8]" : "text-[#7a5030]"}`}
          >
            <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
              isNight ? "bg-white/5" : "bg-[#c4906a]/15"
            }`}>
              <span className="text-lg opacity-40">{icon}</span>
            </div>
            <span className="text-xs font-semibold italic">Sin asignar</span>
          </button>

          {/* Divisor */}
          {options.length > 0 && (
            <div className={`mx-3 border-t ${isNight ? "border-[#3a3070]" : "border-[#c4906a]/30"}`} />
          )}

          {/* Opciones con foto */}
          {options.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => pick(g.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${
                g.id === value
                  ? isNight ? "bg-white/10" : "bg-[#c4906a]/20"
                  : isNight ? "hover:bg-white/8" : "hover:bg-[#c4906a]/10"
              }`}
            >
              {/* Miniatura */}
              <div className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg flex items-center justify-center ${
                isNight ? "bg-white/10" : "bg-[#c4906a]/20"
              }`}>
                {g.photoUrl
                  ? <Image src={g.photoUrl} alt={g.name} fill className="object-cover" />
                  : <span className="text-lg">{icon}</span>
                }
              </div>

              {/* Info */}
              <div className="flex flex-col items-start min-w-0">
                <span className={`text-xs font-bold truncate max-w-[130px] ${
                  isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"
                }`}>{g.name}</span>
                <span className={`text-[10px] ${
                  g.status === "COMPRADO" ? "text-emerald-500" :
                  g.status === "RECIBIDO" ? "text-sky-400" :
                  isNight ? "text-[#6a6090]" : "text-[#b09070]"
                }`}>{g.status.charAt(0) + g.status.slice(1).toLowerCase()}</span>
              </div>

              {/* Check si seleccionado */}
              {g.id === value && (
                <span className={`ml-auto text-xs font-bold ${isNight ? "text-[#a098e0]" : "text-[#c84a10]"}`}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

export function ShiftCard({ shift, inventory, requireCoat, userPhotoUrl, days, currentDayId }: {
  shift: Shift;
  inventory: Garment[];
  requireCoat: boolean;
  userPhotoUrl: string | null;
  days: Day[];
  currentDayId: string;
}) {
  const router = useRouter();
  const [items, setItems]         = useState<OutfitItem[]>(shift.outfit?.items ?? []);
  const [tryOnUrl, setTryOnUrl]   = useState<string | null>(shift.outfit?.tryOn?.imageUrl ?? null);
  const [loading, setLoading]     = useState(false);
  const [warning, setWarning]     = useState<string | null>(null);
  const [extraPrompt, setExtra]   = useState("");
  const [model, setModel]         = useState<ModelId>("gpt-image-2");
  const [slotState, setSlotState] = useState<Partial<Record<Garment["slot"], SlotSaveState>>>({});
  const [shared, setShared]       = useState<boolean>(shift.outfit?.shared ?? false);
  const [sharing, setSharing]     = useState(false);
  const [targetDayId, setTargetDayId] = useState("");
  const [moving, setMoving]           = useState(false);
  const [moveError, setMoveError]     = useState<string | null>(null);

  const isNight      = shift.type === "NOCHE";
  const getItem      = (slot: Garment["slot"]) => items.find((i) => i.garment.slot === slot)?.garment ?? null;
  const missingCoat  = requireCoat && !getItem("COAT");
  const visibleSlots = SLOTS.filter((s) => s.key !== "COAT" || isNight);
  const eligibleDays = days.filter(
    (d) => d.id !== currentDayId && d.shifts.some((s) => s.type === shift.type)
  );

  async function moveToDay() {
    if (!targetDayId || !shift.outfit || moving) return;
    setMoving(true);
    setMoveError(null);
    const res = await fetch(`/api/outfits/${shift.outfit.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDayId }),
    });
    const data = await res.json();
    setMoving(false);
    if (!res.ok) {
      setMoveError(data.error ?? "No se pudo mover el outfit.");
      return;
    }
    setTargetDayId("");
    router.refresh();
  }

  async function randomizeOutfit() {
    for (const { key } of visibleSlots) {
      const options = inventory.filter((g) => g.slot === key);
      const pick = options.length > 0 ? options[Math.floor(Math.random() * options.length)] : null;
      await assign(key, pick?.id ?? "");
    }
  }

  function setSlotSave(slot: Garment["slot"], state: SlotSaveState) {
    setSlotState((prev) => ({ ...prev, [slot]: state }));
  }

  async function assign(slot: Garment["slot"], garmentId: string) {
    if (!shift.outfit) return;
    setSlotSave(slot, "saving");

    try {
      if (!garmentId) {
        // Deselect: quitar la prenda actual de este slot
        const current = items.find((i) => i.garment.slot === slot);
        if (current) {
          const res = await fetch(
            `/api/outfits/${shift.outfit.id}/items?garmentId=${current.garment.id}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error();
          // Quitar por garmentId exacto, no por slot (evita limpiar prendas huérfanas)
          setItems((prev) => prev.filter((i) => i.garment.id !== current.garment.id));
        }
      } else {
        const res = await fetch(`/api/outfits/${shift.outfit.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ garmentId }),
        });
        if (!res.ok) throw new Error(await res.text());
        const item: OutfitItem = await res.json();
        // El servidor ya elimina la prenda anterior del mismo slot (UNIQUE_SLOTS incluye ACCESSORY)
        // Reflejamos lo mismo en el estado local: quitar cualquier prenda del mismo slot antes de añadir
        setItems((prev) => [...prev.filter((i) => i.garment.slot !== slot), item]);
      }

      setSlotSave(slot, "saved");
      setTimeout(() => setSlotSave(slot, "idle"), 1800);
    } catch {
      setSlotSave(slot, "error");
      setTimeout(() => setSlotSave(slot, "idle"), 3000);
    }
  }

  async function toggleShared() {
    if (!shift.outfit || sharing) return;
    const next = !shared;
    setSharing(true);
    setShared(next); // optimista
    try {
      const res = await fetch(`/api/outfits/${shift.outfit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: next }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShared(data.shared);
    } catch {
      setShared(!next); // revertir si falla
    } finally {
      setSharing(false);
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
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-xl tracking-tight ${isNightCard ? "text-[#a098e0]" : "text-[#7a2e08]"}`}
              style={{ fontFamily: "var(--font-display)" }}>
            {isNightCard ? "🌙 Noche" : "☀️ Tarde"}
          </h2>
          <button
            type="button"
            onClick={randomizeOutfit}
            title="Generar look aleatorio"
            className={`ml-auto rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
              isNightCard
                ? "border-[#3a3070] text-[#9890c8] hover:border-[#6a5ae0] hover:bg-[#6a5ae0]/15 hover:text-[#c8c0f8]"
                : "border-[#c4906a]/40 text-[#a07040] hover:border-[#c84a10]/50 hover:bg-[#c84a10]/10 hover:text-[#7a2e08]"
            }`}
          >
            🎲 Look aleatorio
          </button>
          {missingCoat && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-[11px] font-bold text-red-700 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Falta abrigo
            </span>
          )}
        </div>

        {/* Cambiar día */}
        {eligibleDays.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${isNightCard ? "text-[#9890c8]" : "text-[#a07040]"}`}>
              Cambiar día
            </span>
            <select
              value={targetDayId}
              onChange={(e) => { setTargetDayId(e.target.value); setMoveError(null); }}
              disabled={moving}
              className={`min-w-0 flex-1 rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none disabled:opacity-50 ${
                isNightCard
                  ? "border-[#2a2060] bg-[#1a1840] text-[#d8d0f0]"
                  : "border-[#c4906a]/40 bg-[#f5e8cc] text-[#2a1a08]"
              }`}
            >
              <option value="">— elegir día —</option>
              {eligibleDays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label ?? `Día ${days.indexOf(d) + 1}`}
                </option>
              ))}
            </select>
            {targetDayId && (
              <button
                type="button"
                onClick={moveToDay}
                disabled={moving}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold text-white transition-all disabled:opacity-40 ${
                  isNightCard
                    ? "bg-[#4a38c0] hover:bg-[#5a48d0]"
                    : "bg-[#c84a10] hover:bg-[#a83a08]"
                }`}
              >
                {moving ? "…" : "Cambiar"}
              </button>
            )}
          </div>
        )}
        {moveError && (
          <p className="mt-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700">
            ⚠️ {moveError}
          </p>
        )}

        {/* Toggle compartir en el muro */}
        <button
          type="button"
          onClick={toggleShared}
          disabled={sharing}
          aria-pressed={shared}
          className={`mt-2.5 flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition-all disabled:opacity-60 ${
            shared
              ? isNightCard
                ? "border-[#6a5ae0] bg-[#6a5ae0]/15"
                : "border-[#c84a10] bg-[#c84a10]/10"
              : isNightCard
              ? "border-[#2a2060] bg-white/3 hover:bg-white/6"
              : "border-[#c4906a]/25 bg-[#c4906a]/5 hover:bg-[#c4906a]/12"
          }`}
        >
          {/* Switch */}
          <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            shared ? (isNightCard ? "bg-[#6a5ae0]" : "bg-[#c84a10]") : isNightCard ? "bg-white/15" : "bg-[#c4906a]/40"
          }`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              shared ? "translate-x-[18px]" : "translate-x-[3px]"
            }`} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className={`text-xs font-bold leading-tight ${isNightCard ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
              🔗 {shared ? "Compartido en el muro" : "Compartir en el muro"}
            </span>
            <span className={`text-[10px] leading-snug ${isNightCard ? "text-[#6a6090]" : "text-[#a07040]"}`}>
              {shared ? "Otros usuarios pueden ver este outfit" : "Solo tú ves este outfit"}
            </span>
          </span>
        </button>
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

              {/* Label + select */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isNightCard ? "text-[#9890c8]" : "text-[#a07040]"}`}>
                  {label}
                </span>
                <GarmentSelect
                  options={options}
                  value={current?.id ?? ""}
                  onChange={(id) => assign(key, id)}
                  disabled={isSaving}
                  icon={icon}
                  isNight={isNightCard}
                />
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
