"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSnapshot } from "@/lib/offline-store";
import type { PlayaSnapshot } from "@/types/snapshot";

/**
 * El marco de una sección servida sin cobertura.
 *
 * La página llega vacía —el servidor no ha podido poner nada— y todo lo que se
 * pinta sale del snapshot que se descargó con wifi. Aquí solo está lo que las
 * tres secciones comparten: leerlo, decir de cuándo es y avisar cuando no hay.
 */

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useSnapshot() {
  const [snapshot, setSnapshot] = useState<PlayaSnapshot | null>(null);
  const [reading, setReading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSnapshot().then((data) => {
      if (cancelled) return;
      setSnapshot(data);
      setReading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { snapshot, reading };
}

export function OfflineFrame({
  title,
  snapshot,
  reading,
  children,
}: {
  title: string;
  snapshot: PlayaSnapshot | null;
  reading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm font-medium text-[#7a5030]">
          <span className="rounded-full bg-[#c4906a]/25 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#7a4a20]">
            📴 sin cobertura
          </span>
          {snapshot
            ? `Copia del ${formatWhen(snapshot.generatedAt)}. Se puede consultar y filtrar todo; marcar necesita red.`
            : "Se está leyendo la copia guardada…"}
        </p>
      </div>

      {reading ? null : snapshot ? (
        children
      ) : (
        <div className="rounded-2xl border-2 border-amber-300/70 bg-amber-50 px-4 py-4">
          <p className="text-sm font-black text-[#7a2e08]">No hay ninguna copia guardada</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#7a5030]">
            Esta sección se pinta con lo que se descargó teniendo cobertura, y aquí no hay nada. En
            cuanto vuelvas a tener red, entra en{" "}
            <Link href="/playa" className="font-black text-[#c84a10] underline underline-offset-2">
              Modo playa
            </Link>{" "}
            y dale a descargar.
          </p>
        </div>
      )}
    </div>
  );
}
