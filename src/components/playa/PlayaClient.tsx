"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cacheAppShell,
  checkShellUpdate,
  loadSnapshot,
  saveSnapshot,
  storageUsed,
} from "@/lib/offline-store";
import { placeVenues } from "@/lib/playa-venues";
import { MapPanel } from "@/components/map/MapPanel";
import {
  AgendaView,
  ChecklistView,
  Empty,
  InventoryView,
  OutfitsView,
  WeatherView,
} from "@/components/playa/PlayaViews";
import type { PlayaSnapshot } from "@/types/snapshot";

/**
 * Modo playa: la app entera funcionando sin cobertura.
 *
 * Todo lo que se ve aquí sale de dos sitios que no necesitan red: el snapshot
 * que se descargó con wifi (IndexedDB) y lo que ya viaja en el propio código
 * —los line-ups y la geometría de la ciudad—. La pantalla no consulta la base
 * de datos ni pide sesión, así que el service worker puede servirla tal cual
 * desde la caché.
 */

type TabId = "agenda" | "mapa" | "outfits" | "checklist" | "inventario" | "tiempo";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "agenda", label: "Agenda", emoji: "🎧" },
  { id: "mapa", label: "Mapa", emoji: "🗺️" },
  { id: "outfits", label: "Outfits", emoji: "👕" },
  { id: "checklist", label: "Checklist", emoji: "✅" },
  { id: "inventario", label: "Inventario", emoji: "🎒" },
  { id: "tiempo", label: "Tiempo", emoji: "🌤️" },
];

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function PlayaClient() {
  const [snapshot, setSnapshot] = useState<PlayaSnapshot | null>(null);
  const [status, setStatus] = useState<"reading" | "ready" | "downloading">("reading");
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState<number | null>(null);
  /** Archivos del armazón que no se pudieron guardar en la última descarga. */
  const [shellFailed, setShellFailed] = useState<number | null>(null);
  const [tab, setTab] = useState<TabId>("agenda");
  /** El service worker ha visto una versión nueva de la pantalla. */
  const [updated, setUpdated] = useState(false);

  // La pantalla se sirve de caché, así que lo que se está viendo es la versión
  // de la vez anterior. Se pregunta al arrancar si hay una más nueva.
  useEffect(() => {
    let cancelled = false;
    checkShellUpdate().then((hasUpdate) => {
      if (!cancelled) setUpdated(hasUpdate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      setSnapshot(await loadSnapshot());
      setUsed(await storageUsed());
      setStatus("ready");
    })();
  }, []);

  const download = useCallback(async () => {
    setStatus("downloading");
    setError(null);
    try {
      const res = await fetch("/api/snapshot", { cache: "no-store" });
      // Sin sesión el proxy redirige al login, así que puede llegar un 200 con
      // HTML dentro: hay que mirar el tipo, no solo el código.
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (!res.ok || !isJson) {
        throw new Error(
          res.status === 401 || !isJson
            ? "Sesión caducada: entra otra vez desde el navegador y vuelve."
            : `Error ${res.status}`
        );
      }
      const fresh: PlayaSnapshot = await res.json();
      await saveSnapshot(fresh);

      // En Android esto marca el origen como persistente y lo libra del
      // desalojo automático. En iOS basta con tenerla en la pantalla de inicio.
      navigator.storage?.persist?.().catch(() => {});

      // Y ahora el armazón: esta pantalla, el mapa y las tipografías. Sin esto
      // hay datos guardados pero nada con que pintarlos.
      const failed = await cacheAppShell();
      setShellFailed(failed);

      setSnapshot(fresh);
      setUsed(await storageUsed());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido descargar");
    } finally {
      setStatus("ready");
    }
  }, []);

  const busy = status === "downloading";

  if (status === "reading") {
    return <p className="py-10 text-center text-sm font-semibold text-[#a07040]">Cargando…</p>;
  }

  if (!snapshot) {
    return (
      <div className="flex flex-col gap-4">
        {updated && <UpdateBanner />}
        <div className="rounded-2xl border-2 border-dashed border-[#c4906a] bg-[#fdf4e0] px-5 py-8 text-center">
          <p className="text-3xl">📥</p>
          <p className="mt-3 text-lg font-black text-[#2a1a08]">Todavía no has descargado nada</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm font-medium text-[#7a5030]">
            Con wifi, antes de salir: se guardan la agenda, los outfits, la checklist, el
            inventario y el tiempo en el móvil. A partir de ahí esta pantalla funciona en modo
            avión.
          </p>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="mt-5 rounded-full bg-[#c84a10] px-6 py-3 text-sm font-black text-[#fdf4e0] disabled:opacity-60"
          >
            {busy ? "Descargando…" : "Descargar para el playa"}
          </button>
          {error && <p className="mt-3 text-xs font-bold text-[#c84a10]">{error}</p>}

          <div className="mt-6 border-t border-[#c4906a]/40 pt-5">
            <PdfButton variant="primary" />
            <p className="mx-auto mt-2 max-w-md text-[11px] font-medium text-[#a07040]">
              Lo mismo pero en papel, y con las fotos de tus outfits: agenda, outfits, checklist e
              inventario en un PDF que se guarda en el móvil. No depende de esta pantalla ni del
              navegador.
            </p>
          </div>
        </div>
        <InstallHelp />
      </div>
    );
  }

  const { placed, roving } = placeVenues();

  return (
    <div className="flex flex-col gap-4">
      {updated && <UpdateBanner />}

      {/* Estado de la copia */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-2.5">
        <p className="text-xs font-bold text-[#2a1a08]">
          Copia del {formatWhen(snapshot.generatedAt)}
        </p>
        {used != null && (
          <p className="text-[11px] font-semibold text-[#a07040]">{formatSize(used)} guardados</p>
        )}
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="ml-auto rounded-full border-2 border-[#c84a10] px-3 py-1 text-[11px] font-black text-[#c84a10] disabled:opacity-60"
        >
          {busy ? "Actualizando…" : "Actualizar"}
        </button>
        {/* Arriba y a la vista: el PDF es el plan B y no se busca scrolleando. */}
        <div className="w-full">
          <PdfButton variant="quiet" />
        </div>
      </div>
      {error && <p className="text-xs font-bold text-[#c84a10]">{error}</p>}
      {shellFailed != null && shellFailed > 0 && (
        <p className="text-xs font-bold text-[#c84a10]">
          {shellFailed} archivos no se han podido guardar: vuelve a darle a actualizar con buena
          cobertura antes de salir.
        </p>
      )}

      {/* Pestañas */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, emoji }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === id
                ? "border-[#c84a10] bg-[#c84a10] text-[#fdf4e0]"
                : "border-[#c4906a]/50 bg-[#fdf4e0] text-[#a07040]"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {tab === "agenda" && <AgendaView picks={snapshot.picks} />}
      {tab === "mapa" && <MapPanel venues={placed} roving={roving} />}
      {tab === "outfits" && <OutfitsView days={snapshot.days} />}
      {tab === "checklist" && <ChecklistView items={snapshot.checklist} />}
      {tab === "inventario" && <InventoryView garments={snapshot.garments} />}
      {tab === "tiempo" && <WeatherView weather={snapshot.weather} />}

      <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#a07040]">
        Esta pantalla es de solo consulta: marcar sets, tachar la checklist o subir fotos necesita
        cobertura y se hace en las pantallas normales. Las fotos no se descargan a propósito — son
        casi todo el peso y en el evento no se miran.
      </p>
      <InstallHelp />
    </div>
  );
}


/** Aviso de versión nueva: un toque y se recarga con lo último. */
function UpdateBanner() {
  return (
    <button
      type="button"
      onClick={() => location.reload()}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[#c84a10] bg-[#c84a10] px-4 py-2.5 text-left"
    >
      <span className="text-xs font-black text-[#fdf4e0]">
        Hay una versión nueva de la app
      </span>
      <span className="shrink-0 rounded-full bg-[#fdf4e0] px-3 py-1 text-[11px] font-black text-[#c84a10]">
        Recargar
      </span>
    </button>
  );
}

/**
 * El dossier de papel. Sale en las dos pantallas —con copia y sin ella— porque
 * es justo lo que quiere alguien que todavía no se fía del modo offline.
 */
function PdfButton({ variant }: { variant: "primary" | "quiet" }) {
  return (
    <a
      href="/api/playa-pdf"
      className={
        variant === "primary"
          ? "inline-block rounded-full border-2 border-[#c84a10] px-5 py-2.5 text-sm font-black text-[#c84a10]"
          : "inline-block rounded-full border-2 border-[#c4906a]/50 px-3 py-1.5 text-xs font-bold text-[#a07040]"
      }
    >
      📄 Descargar dossier en PDF
    </a>
  );
}

function InstallHelp() {
  return (
    <details className="rounded-2xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-3">
      <summary className="cursor-pointer text-xs font-black text-[#7a2e08]">
        Cómo dejarla lista antes de salir
      </summary>
      <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-[11px] font-medium leading-relaxed text-[#7a5030]">
        <li>
          <span className="font-bold">Instálala en la pantalla de inicio.</span> En iPhone: botón
          de compartir → «Añadir a pantalla de inicio». En Android: menú del navegador → «Instalar
          aplicación».
        </li>
        <li>
          <span className="font-bold">Ábrela desde el icono</span>, no desde el navegador. En
          iPhone la app instalada guarda los datos en su propio sitio: lo que descargues en Safari
          no está dentro del icono.
        </li>
        <li>
          <span className="font-bold">Dale a descargar con wifi</span>, la noche antes de salir.
        </li>
        <li>
          <span className="font-bold">Compruébalo en modo avión</span> antes de irte: abre el
          icono y mira que la agenda y el mapa siguen ahí.
        </li>
      </ol>
    </details>
  );
}
