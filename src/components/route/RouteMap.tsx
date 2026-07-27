"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { RouteStop } from "@/lib/route-data";
import type { LatLng } from "@/lib/route-geometry";

/**
 * Mapa de la ruta con Leaflet y teselas de OpenStreetMap.
 *
 * Se usa Leaflet en vez del iframe de Google Maps porque el embed con ruta y
 * varias paradas exige clave de la Embed API (con facturación activada). El
 * endpoint antiguo `maps.google.com/maps?...&output=embed` ya no dibuja
 * waypoints: cae a un mapa del mundo vacío.
 *
 * Leaflet solo se importa dentro del efecto, así nunca se evalúa en el
 * servidor (necesita `window`).
 */
export function RouteMap({
  stops,
  routePoints,
  isRealRoad,
}: {
  stops: RouteStop[];
  routePoints: LatLng[];
  isRealRoad: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Guarda la instancia para poder destruirla y evitar doble init en dev.
  const mapRef = useRef<unknown>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;

        // Si un render anterior dejó el contenedor inicializado, se limpia.
        if (mapRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mapRef.current as any).remove();
          mapRef.current = null;
        }

        map = L.map(containerRef.current, {
          // El scroll de la página no debe quedar atrapado por el mapa.
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: true,
        });
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // Trazado de la ruta. Discontinuo si no es geometría real de carretera.
        const line = L.polyline(routePoints, {
          color: "#c84a10",
          weight: 4,
          opacity: 0.85,
          ...(isRealRoad ? {} : { dashArray: "8 10", weight: 3 }),
        }).addTo(map);

        // Marcadores numerados. divIcon en vez del icono por defecto para
        // evitar el problema clásico de rutas de imagen con el bundler.
        stops.forEach((stop) => {
          const isLast = stop.order === stops.length;
          const bg = isLast ? "#7a2e08" : "#c84a10";

          const icon = L.divIcon({
            className: "burn-route-pin",
            html: `<span style="
              display:flex;align-items:center;justify-content:center;
              width:30px;height:30px;border-radius:9999px;
              background:${bg};color:#fff;
              font-weight:900;font-size:13px;line-height:1;
              border:2.5px solid #fdf4e0;
              box-shadow:0 2px 6px rgba(0,0,0,.35);
            ">${stop.order}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -16],
          });

          L.marker(stop.coords, { icon, title: `${stop.order}. ${stop.name}` })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:inherit;min-width:170px">
                 <div style="font-weight:800;font-size:13px;color:#2a1a08">
                   ${stop.emoji} ${escapeHtml(stop.name)}
                 </div>
                 <div style="font-size:11px;color:#a07040;margin-top:3px">
                   ${escapeHtml(stop.address)}
                 </div>
                 <div style="font-size:11px;color:#7a5030;margin-top:5px;font-weight:600">
                   ${escapeHtml(stop.purpose)}
                 </div>
               </div>`
            );
        });

        // Encuadre sobre la ruta completa — sin esto sale el mundo entero.
        map.fitBounds(line.getBounds(), { padding: [36, 36] });

        // Las teselas se miden mal si el contenedor aún estaba dimensionándose.
        setTimeout(() => map && map.invalidateSize(), 180);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, [stops, routePoints, isRealRoad]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold text-[#a07040]">
          No se ha podido cargar el mapa. Usa «Abrir en Google Maps» para ver la ruta.
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full w-full" style={{ background: "#e8dcc4" }} />
      {!isRealRoad && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg bg-[#fdf4e0]/95 px-2.5 py-1.5 shadow-sm">
          <p className="text-[10px] font-bold text-[#7a5030]">
            Trazado aproximado — línea recta entre paradas
          </p>
        </div>
      )}
    </>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
