"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export function UserPhotoWidget({ initialPhotoUrl, initialName }: { initialPhotoUrl: string | null; initialName: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [nameSaved, setNameSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) return;
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no puede superar 5 MB.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || data.error) {
      setUploading(false);
      setUploadError(data.error ?? "No se pudo subir la imagen. Inténtalo de nuevo.");
      return;
    }
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl: data.url }),
    });
    setPhotoUrl(data.url);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-4">
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

    {uploadError && (
      <p className="rounded-lg bg-red-50 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">
        ⚠️ {uploadError}
      </p>
    )}

    {/* Nombre (se muestra en el muro a los demás) */}
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
        Tu nombre
        {nameSaved && <span className="text-emerald-600 normal-case tracking-normal">guardado ✓</span>}
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder="Cómo te verán en el muro"
        maxLength={40}
        className="w-full rounded-lg border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-3 py-1.5 text-sm font-semibold text-[#2a1a08] placeholder-[#b09060] focus:border-[#c84a10]/60 focus:outline-none"
      />
    </div>
    </div>
  );
}
