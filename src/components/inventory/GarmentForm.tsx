"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Garment, GarmentSlot, GarmentStatus } from "@/types";

const SLOTS: { value: GarmentSlot; label: string }[] = [
  { value: "TOP",            label: "👕  Parte de arriba" },
  { value: "BOTTOM",         label: "👖  Parte de abajo" },
  { value: "SHOES",          label: "👟  Calzado" },
  { value: "ACCESSORY",      label: "🕶️  Accesorios" },
  { value: "COAT",           label: "🧥  Abrigo" },
  { value: "BIKE_ACCESSORY", label: "🚲  Accesorio bici" },
];

const STATUSES: { value: GarmentStatus; label: string }[] = [
  { value: "PENDIENTE", label: "🟡  Pendiente" },
  { value: "COMPRADO",  label: "🟢  Comprado" },
  { value: "RECIBIDO",  label: "🔵  Recibido" },
];

const inputClass = "w-full rounded-xl border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-3.5 py-2.5 text-sm font-semibold text-[#2a1a08] placeholder-[#b09070] focus:border-[#c84a10]/60 focus:outline-none transition-colors";
const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#a07040]";

interface Props {
  garment?: Garment;   // present = edit mode
  onClose?: () => void;
}

export function GarmentForm({ garment: initial, onClose }: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const isEdit   = !!initial;

  const [name, setName]            = useState(initial?.name ?? "");
  const [slot, setSlot]            = useState<GarmentSlot>((initial?.slot as GarmentSlot) ?? "TOP");
  const [status, setStatus]        = useState<GarmentStatus>((initial?.status as GarmentStatus) ?? "PENDIENTE");
  const [photoPreview, setPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [photoUrl, setPhotoUrl]    = useState<string | null>(initial?.photoUrl ?? null);
  const [purchaseUrl, setPurchase] = useState(initial?.purchaseUrl ?? "");
  const [notes, setNotes]          = useState(initial?.notes ?? "");
  const [price, setPrice]          = useState<string>(initial?.price != null ? String(initial.price) : "");
  const [uploading, setUploading]  = useState(false);
  const [saving, setSaving]        = useState(false);
  const [pasteHint, setPasteHint]  = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("La imagen no puede superar 5 MB.");
      return;
    }
    setFormError(null);
    let prevPreview: string | null = null;
    setPreview((p) => { prevPreview = p; return URL.createObjectURL(file); });
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok || data.error) {
      setPreview(prevPreview);
      setFormError(data.error ?? "No se pudo subir la imagen. Inténtalo de nuevo.");
      return;
    }
    if (data.url) setPhotoUrl(data.url);
  }, []);

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((it) => it.type.startsWith("image/"));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 2000);
        await uploadFile(file);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [uploadFile]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  }

  async function handleDelete() {
    if (!initial?.id) return;
    setDeleting(true);
    const res = await fetch(`/api/garments/${initial.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
      onClose?.();
    } else {
      setFormError("No se pudo borrar la prenda. Inténtalo de nuevo.");
      setConfirmDelete(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const payload = {
      name,
      slot,
      status,
      photoUrl,
      purchaseUrl: purchaseUrl || null,
      notes: notes || null,
      price: price !== "" ? parseFloat(price) : null,
    };

    const url    = isEdit && initial ? `/api/garments/${initial.id}` : "/api/garments";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.error?.fieldErrors) {
        setFieldErrors(data.error.fieldErrors);
      } else {
        setFormError("No se pudo guardar la prenda. Inténtalo de nuevo.");
      }
      return;
    }

    router.refresh();
    onClose?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-3xl font-black text-[#7a2e08]" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        {isEdit ? "Editar prenda" : "Nueva prenda"}
      </h2>

      {/* Photo */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all
          ${pasteHint
            ? "border-[#c84a10] bg-[#c84a10]/10 scale-[1.01]"
            : "border-[#c4906a]/50 bg-[#f5e8cc] hover:border-[#c84a10]/60 hover:bg-[#f5e0b8]"}`}
      >
        {photoPreview ? (
          <>
            <Image src={photoPreview} alt="preview" fill className="object-contain" />
            {/* Change photo overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors rounded-xl">
              <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white opacity-0 hover:opacity-100 transition-opacity">
                Cambiar foto
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#a07040]">
            <span className="text-3xl">{uploading ? "⏳" : "📷"}</span>
            <span className="text-xs font-bold">{uploading ? "Subiendo…" : "Clic para subir"}</span>
            {!uploading && (
              <span className="text-[10px] font-medium text-[#b09070]">
                o pega con{" "}
                <kbd className="rounded border border-[#c4906a]/40 bg-[#f5e0b8] px-1.5 py-0.5 font-mono text-[10px] text-[#7a4a20]">
                  Ctrl+V
                </kbd>
              </span>
            )}
          </div>
        )}

        {pasteHint && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#c84a10]/10 rounded-xl">
            <span className="rounded-full bg-[#c84a10] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              ✓ Imagen pegada
            </span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Error global */}
      {formError && (
        <p className="rounded-lg bg-red-50 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">
          ⚠️ {formError}
        </p>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          placeholder="Ej: Capa iridiscente plateada" className={inputClass} />
      </div>

      {/* Slot + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Categoría</label>
          <select value={slot} onChange={(e) => setSlot(e.target.value as GarmentSlot)} className={inputClass}>
            {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as GarmentStatus)} className={inputClass}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Purchase URL + Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Enlace de compra</label>
          <input value={purchaseUrl} onChange={(e) => setPurchase(e.target.value)} type="url"
            placeholder="https://…" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Precio (€)</label>
          <input
            value={price}
            onChange={(e) => { setPrice(e.target.value); setFieldErrors((p) => ({ ...p, price: [] })); }}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className={`${inputClass} ${fieldErrors.price?.length ? "border-red-400" : ""}`}
          />
          {fieldErrors.price?.length ? (
            <p className="text-xs font-semibold text-red-600">{fieldErrors.price[0]}</p>
          ) : null}
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          placeholder="Talla, color, instrucciones…" className={`${inputClass} resize-none`} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          {onClose && (
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border-2 border-[#c4906a]/40 py-2.5 text-sm font-bold text-[#7a4a20] hover:bg-[#f5e0b8] transition-colors">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={saving || uploading}
            className="flex-1 rounded-xl bg-[#c84a10] py-2.5 text-sm font-bold text-white shadow-md shadow-[#c84a10]/20 hover:bg-[#a83a08] disabled:opacity-40 transition-all">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar prenda"}
          </button>
        </div>

        {isEdit && (
          confirmDelete ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border-2 border-[#c4906a]/40 py-2 text-sm font-bold text-[#7a4a20] hover:bg-[#f5e0b8] transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-40 transition-all">
                {deleting ? "Borrando…" : "Sí, borrar prenda"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="w-full rounded-xl border-2 border-red-200 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:border-red-300 transition-all">
              Borrar prenda
            </button>
          )
        )}
      </div>
    </form>
  );
}
