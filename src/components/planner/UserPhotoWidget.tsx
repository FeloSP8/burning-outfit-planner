"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export function UserPhotoWidget({ initialPhotoUrl }: { initialPhotoUrl: string | null }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const { url } = await (await fetch("/api/upload", { method: "POST", body: fd })).json();
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: url }),
    });
    setPhotoUrl(url);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-[#c4906a]/50 bg-[#f5e8cc] transition-all hover:border-[#c84a10]/70"
        title="Subir foto de cuerpo completo"
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="Tu foto" fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl opacity-40">🧍</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-bold text-white uppercase tracking-wide text-center leading-tight px-1">
            {uploading ? "…" : photoUrl ? "Cambiar" : "Subir"}
          </span>
        </div>
      </button>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-[#2a1a08]">
          {photoUrl ? "Foto lista ✓" : "Sin foto todavía"}
        </p>
        <p className="text-xs font-medium text-[#7a5030] leading-snug">
          {photoUrl
            ? "El probador usará esta imagen."
            : "Necesaria para el probador virtual."}
        </p>
        {!photoUrl && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 w-fit rounded-lg border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-3 py-1 text-[11px] font-bold text-[#7a3a10] hover:bg-[#f5e0b8] hover:border-[#c84a10]/50 transition-all"
          >
            + Añadir foto
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
