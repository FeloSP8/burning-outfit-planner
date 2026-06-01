"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GarmentForm } from "./GarmentForm";
import type { Garment } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  COMPRADO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  RECIBIDO: "bg-sky-100 text-sky-800 border-sky-300",
  PENDIENTE: "bg-amber-100 text-amber-800 border-amber-300",
};

const SLOT_ICON: Record<string, string> = {
  TOP: "👕", BOTTOM: "👖", SHOES: "👟", ACCESSORY: "🕶️", COAT: "🧥",
};

export function GarmentCard({ garment }: { garment: Garment }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${garment.name}"?`)) return;
    await fetch(`/api/garments/${garment.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#c4906a]/30 bg-[#fdf4e0] shadow-sm transition-all hover:border-[#c4906a]/60 hover:shadow-md">

        {/* Photo */}
        <div className="relative h-44 overflow-hidden bg-[#f5e0b8] flex items-center justify-center">
          {garment.photoUrl ? (
            <Image src={garment.photoUrl} alt={garment.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="text-6xl opacity-20">{SLOT_ICON[garment.slot] ?? "🧣"}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fdf4e0]/90 via-transparent to-transparent" />

          {/* Status badge */}
          <span className={`absolute right-2.5 top-2.5 rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[garment.status] ?? ""}`}>
            {garment.status}
          </span>

          {/* Action buttons — appear on hover */}
          <div className="absolute left-2.5 top-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-sm text-[#2a1a08] hover:bg-white hover:text-[#c84a10] border border-[#c4906a]/30 transition-all"
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-sm text-[#7a3a10] hover:bg-red-100 hover:text-red-700 border border-[#c4906a]/30 transition-all"
              title="Eliminar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Info — clicking opens edit */}
        <div
          className="flex flex-col gap-1.5 p-4 cursor-pointer"
          onClick={() => setEditing(true)}
        >
          <p className="font-black text-[#2a1a08] leading-tight truncate" style={{ fontFamily: "var(--font-body)" }}>
            {garment.name}
          </p>
          {garment.notes && (
            <p className="text-xs font-medium text-[#7a5030] line-clamp-2">{garment.notes}</p>
          )}
          {garment.purchaseUrl && (
            <a
              href={garment.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#c84a10] hover:text-[#a83a08] transition-colors truncate"
            >
              ↗ Ver enlace
            </a>
          )}
          <p className="mt-1 text-[10px] font-medium text-[#c4906a]/60 group-hover:text-[#c4906a] transition-colors">
            Toca para editar
          </p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-[#c4906a]/30 bg-[#fdf4e0] p-6 shadow-2xl">
            <GarmentForm garment={garment} onClose={() => setEditing(false)} />
          </div>
        </div>
      )}
    </>
  );
}
