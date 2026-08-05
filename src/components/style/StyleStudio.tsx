"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { STYLE_CATEGORIES, getStylePreset } from "@/lib/style-presets";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";
import type { StyleLook } from "@/types";

type BaseOption = { url: string; label: string };

/**
 * Estudio de estilismo: coge la foto que el usuario ya tiene en la app y genera
 * variantes cambiando solo el pelo y el vello facial (peinado, tinte, bigote,
 * barba). La ropa, la pose y el fondo no se tocan. Cualquier look se puede
 * convertir en la foto de modelo que usa el probador virtual.
 */
export function StyleStudio({
  userPhotoUrl,
  initialLooks,
}: {
  userPhotoUrl: string | null;
  initialLooks: StyleLook[];
}) {
  const router = useRouter();
  const [looks, setLooks]     = useState<StyleLook[]>(initialLooks);
  const [baseUrl, setBaseUrl] = useState<string>(userPhotoUrl ?? "");
  const [picked, setPicked]   = useState<string[]>([]);
  const [custom, setCustom]   = useState("");
  const [model, setModel]     = useState<ModelId>("gpt-image-2");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [busyLookId, setBusy] = useState<string | null>(null);

  // Fotos que se pueden usar de partida: la de modelo actual, los looks ya
  // generados y las fotos originales que dieron pie a esos looks.
  const baseOptions: BaseOption[] = useMemo(() => {
    const seen = new Set<string>();
    const out: BaseOption[] = [];
    const add = (url: string, label: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      out.push({ url, label });
    };
    if (userPhotoUrl) add(userPhotoUrl, "Foto de modelo");
    for (const l of looks) add(l.imageUrl, l.label);
    for (const l of looks) add(l.sourcePhoto, "Foto original");
    return out;
  }, [userPhotoUrl, looks]);

  const effectiveBase = baseOptions.some((o) => o.url === baseUrl)
    ? baseUrl
    : baseOptions[0]?.url ?? "";

  function toggle(presetId: string) {
    const category = STYLE_CATEGORIES.find((c) => c.presets.some((p) => p.id === presetId));
    setPicked((prev) => {
      if (prev.includes(presetId)) return prev.filter((id) => id !== presetId);
      if (category?.exclusive) {
        const siblings = new Set(category.presets.map((p) => p.id));
        return [...prev.filter((id) => !siblings.has(id)), presetId];
      }
      return [...prev, presetId];
    });
  }

  const hasInstructions = picked.length > 0 || custom.trim().length > 0;

  async function generate() {
    if (!effectiveBase || !hasInstructions || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePhotoUrl: effectiveBase,
          presets: picked,
          customPrompt: custom.trim() || undefined,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(typeof data.error === "string" ? data.error : "No se pudo generar el estilismo.");
        return;
      }
      setLooks((prev) => [data as StyleLook, ...prev]);
      setBaseUrl(data.imageUrl); // encadenar cambios sobre el resultado
    } catch {
      setError("No se pudo generar el estilismo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function useAsModelPhoto(look: StyleLook) {
    if (busyLookId) return;
    setBusy(look.id);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: look.imageUrl }),
      });
      if (!res.ok) throw new Error();
      setBaseUrl(look.imageUrl);
      router.refresh(); // el probador y el widget de foto leen del servidor
    } catch {
      setError("No se pudo cambiar la foto de modelo.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(look: StyleLook) {
    if (busyLookId) return;
    setBusy(look.id);
    setError(null);
    try {
      const res = await fetch(`/api/style-looks/${look.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo borrar el look.");
        return;
      }
      setLooks((prev) => prev.filter((l) => l.id !== look.id));
    } catch {
      setError("No se pudo borrar el look.");
    } finally {
      setBusy(null);
    }
  }

  const chipBase =
    "rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer";

  if (!userPhotoUrl && looks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#c4906a]/40 py-16 text-center">
        <span className="text-5xl opacity-30">💇</span>
        <p className="text-sm font-medium text-[#a07040]">
          Necesitas una foto tuya para probar estilismos.
        </p>
        <Link
          href="/planner"
          className="rounded-xl bg-[#c84a10] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#c84a10]/30 transition-all hover:bg-[#a83a08]"
        >
          Subir mi foto en el Planificador
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">

      {/* ── Controles ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#c4906a]/30 bg-[#f5e0b8]/50 p-5">

        {/* Foto de partida */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
            Foto de partida
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {baseOptions.map((opt) => (
              <button
                key={opt.url}
                type="button"
                onClick={() => setBaseUrl(opt.url)}
                title={opt.label}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  opt.url === effectiveBase
                    ? "border-[#c84a10] ring-2 ring-[#c84a10]/25"
                    : "border-[#c4906a]/30 hover:border-[#c84a10]/50"
                }`}
              >
                <Image src={opt.url} alt={opt.label} fill className="object-cover" sizes="64px" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Presets por categoría */}
        {STYLE_CATEGORIES.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
              {cat.label}
              <span className="ml-1.5 normal-case tracking-normal text-[#b09070]">
                ({cat.hint})
              </span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cat.presets.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className={`${chipBase} ${
                      on
                        ? "border-[#c84a10] bg-[#c84a10]/12 text-[#7a2e08]"
                        : "border-[#c4906a]/30 bg-[#f5e8cc] text-[#7a5030] hover:border-[#c84a10]/45"
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Texto libre */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
            Otro detalle (opcional)
          </label>
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ej: raya al lado y las puntas quemadas por el sol"
            className="w-full resize-none rounded-xl border-2 border-[#c4906a]/30 bg-[#c4906a]/10 px-3 py-2 text-xs font-medium text-[#2a1a08] placeholder-[#b09060] focus:border-[#c84a10]/50 focus:outline-none"
          />
        </div>

        {/* Modelo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
            Modelo de generación
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LEONARDO_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={model === m.id}
                title={m.description}
                onClick={() => setModel(m.id)}
                className={`${chipBase} ${
                  model === m.id
                    ? "border-[#c84a10] bg-[#c84a10]/12 text-[#7a2e08]"
                    : "border-[#c4906a]/30 bg-[#f5e8cc] text-[#7a5030] hover:border-[#c84a10]/45"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen + CTA */}
        {picked.length > 0 && (
          <p className="text-[11px] font-semibold text-[#7a5030]">
            Se aplicará: {picked.map((id) => getStylePreset(id)?.label).filter(Boolean).join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading || !effectiveBase || !hasInstructions}
          title={
            !effectiveBase
              ? "Necesitas una foto de partida"
              : !hasInstructions
              ? "Elige al menos un estilismo"
              : undefined
          }
          className="w-full rounded-xl bg-[#c84a10] py-2.5 text-sm font-bold text-white shadow-md shadow-[#c84a10]/30 transition-all hover:bg-[#a83a08] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generando estilismo…
            </span>
          ) : "✨  Generar estilismo"}
        </button>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* ── Galería de looks ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">
          Tus looks {looks.length > 0 && `(${looks.length})`}
        </span>

        {looks.length === 0 && !loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c4906a]/40 py-12 text-center">
            <span className="text-4xl opacity-30">🎨</span>
            <p className="text-xs font-medium text-[#a07040]">
              Aún no has generado ningún estilismo.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {loading && (
              <div className="flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-[#c4906a]/40 bg-[#f5e8cc]/60">
                <span className="text-xs font-bold text-[#a07040]">Generando…</span>
              </div>
            )}
            {looks.map((look) => {
              const inUse = look.imageUrl === userPhotoUrl;
              const busy  = busyLookId === look.id;
              return (
                <div
                  key={look.id}
                  className={`flex flex-col overflow-hidden rounded-xl border-2 bg-[#f5e8cc]/70 ${
                    inUse ? "border-[#c84a10]" : "border-[#c4906a]/30"
                  }`}
                >
                  <div className="relative h-56 w-full bg-[#e8d6b0]">
                    <Image
                      src={look.imageUrl}
                      alt={look.label}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                    {inUse && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#c84a10] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        En uso
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <p className="text-[11px] font-bold leading-snug text-[#2a1a08]">
                      {look.label}
                    </p>
                    <p className="text-[10px] font-medium text-[#a07040]">
                      {new Date(look.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>

                    <div className="mt-auto flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => useAsModelPhoto(look)}
                        disabled={inUse || busy}
                        className="flex-1 rounded-lg border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-2 py-1 text-[10px] font-bold text-[#7a3a10] transition-all hover:border-[#c84a10]/50 hover:bg-[#f5e0b8] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {inUse ? "Foto de modelo" : busy ? "…" : "Usar de modelo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(look)}
                        disabled={busy}
                        title="Borrar look"
                        className="rounded-lg border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-2 py-1 text-[10px] font-bold text-[#a05030] transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
