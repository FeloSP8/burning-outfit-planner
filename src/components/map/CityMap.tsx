"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MAN, POIS, INTERSECTIONS, BRC_YEAR, type LatLng, type PoiKind } from "@/lib/brc-city";
import { RINGS, polarPoint, distanceMeters } from "@/lib/brc-geocode";

/**
 * Mapa de Black Rock City.
 *
 * No lleva teselas: la ciudad no existe en OpenStreetMap (se replantea cada
 * año y se desmonta), así que se dibuja entera a partir del GIS oficial que
 * hay en `public/brc/<año>/`. Ventaja de paso: no depende de ningún servidor
 * de mapas, que en el playa es justo lo que no hay.
 *
 * Leaflet solo se importa dentro del efecto, así nunca se evalúa en el
 * servidor (necesita `window`).
 */

export interface MapVenue {
  id: string;
  name: string;
  stage?: string;
  emoji: string;
  /** Dirección tal cual la escribe el cartel. */
  location: string;
  point: LatLng;
  /** false = el cruce no existe en la ciudad y se ha estimado. */
  exact: boolean;
}

/** Campamento del listado oficial, ya situado. */
export interface MapCamp {
  uid: string;
  name: string;
  address: string | null;
  point: [number, number] | null;
  exact: boolean;
  /** Recortada en el servidor. El plano no la usa; la lista de al lado sí. */
  description?: string | null;
}

/** Capas que el usuario puede apagar. */
export type LayerKey = "venues" | "camps" | "toilets" | "essentials" | "services";

const PLAYA = "#e8dcc4";
const STREET = "#b8895a";
const INK = "#2a1a08";

/** A partir de aquí caben las letras de las anulares sin pisarse. */
const RING_LABEL_ZOOM = 15;

/** Hielo, sanidad y rangers: lo que se busca de madrugada. */
const ESSENTIAL_KINDS: PoiKind[] = ["ice", "medical", "ranger"];

const ESSENTIAL_EMOJI: Record<string, string> = {
  ice: "🧊",
  medical: "🚑",
  ranger: "🎩",
};

/**
 * Servicios con nombre propio. Los CPN que no salen aquí son logística de la
 * organización (parcelas, subestaciones, puntos de replanteo) y no se pintan.
 */
const SERVICE_EMOJI: Record<string, string> = {
  "Playa Info": "ℹ️",
  Greeters: "🤗",
  "Recycle Camp": "♻️",
  "Yellow Bike Project": "🚲",
  "Department of Mutant Vehicles (DMV)": "🚙",
  Artery: "🎨",
  "Media Mecca": "📰",
  Airport: "✈️",
  "Burner Express Bus Depot": "🚌",
  "Box Office": "🎟️",
  "Gate Actual": "🚧",
  "Census Checkpoint": "📋",
  "Walk-In Camp": "🥾",
};

/**
 * Referencias que nunca se apagan: el Hombre, el Templo, Center Camp y las dos
 * zonas de música de deep playa, que es donde acaban la mitad de los art cars.
 */
const ANCHOR_EMOJI: Partial<Record<PoiKind, string>> = {
  man: "🔥",
  temple: "🛕",
  center: "⛺",
  dmz: "🔊",
};

export function CityMap({
  venues,
  camps,
  layers,
  focus,
  favourites = [],
}: {
  venues: MapVenue[];
  camps: MapCamp[];
  layers: Record<LayerKey, boolean>;
  /** uid del campamento al que ir; cambia cada vez que se busca uno. */
  focus?: { uid: string; nonce: number } | null;
  /** uids marcados por el grupo: se pintan aparte para verlos de un vistazo. */
  favourites?: string[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupsRef = useRef<Record<LayerKey, any>>({} as Record<LayerKey, any>);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campMarkersRef = useRef<Map<string, any>>(new Map());
  /** Los marcados, en un ref: el pintado del mapa los consulta al vuelo. */
  const favouritesRef = useRef<Set<string>>(new Set(favourites));
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    (async () => {
      try {
        const L = (await import("leaflet")).default;

        const names = ["trash_fence", "street_lines", "plazas", "toilets", "dmz", "gate_road"];
        const files = Object.fromEntries(
          await Promise.all(
            names.map(async (name) => {
              const res = await fetch(`/brc/${BRC_YEAR}/${name}.geojson`);
              if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
              return [name, await res.json()] as const;
            })
          )
        );

        if (cancelled || !containerRef.current) return;

        // Si un render anterior dejó el contenedor inicializado, se limpia.
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
          attributionControl: false,
          minZoom: 12,
          maxZoom: 18,
          // Sin teselas no hay nada que se vea borroso a zoom fraccionado, y
          // con saltos enteros la ciudad se quedaba pequeña en el encuadre.
          zoomSnap: 0,
          // Los ~1.400 campamentos se pintan en un canvas: como marcadores del
          // DOM, mover el mapa en el móvil va a tirones.
          preferCanvas: true,
        });
        mapRef.current = map;

        // --- Geometría de la ciudad -------------------------------------

        L.geoJSON(files.gate_road, {
          style: { color: STREET, weight: 2, opacity: 0.55, dashArray: "6 6" },
        }).addTo(map);

        const streets = L.geoJSON(files.street_lines, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style: (feature: any) => {
            const { kind, name } = feature.properties;
            if (name === "ESP") return { color: STREET, weight: 3.5, opacity: 0.95 };
            if (kind === "path") return { color: STREET, weight: 1.2, opacity: 0.6 };
            return { color: STREET, weight: 2, opacity: 0.8 };
          },
        }).addTo(map);

        L.geoJSON(files.plazas, {
          style: { color: "#a97b4a", weight: 1, fillColor: "#d8b98c", fillOpacity: 0.55 },
        }).addTo(map);

        const dmz = L.geoJSON(files.dmz, {
          style: { color: "#7a4ea9", weight: 1.5, dashArray: "5 5", fillColor: "#a982d8", fillOpacity: 0.2 },
        })
          .bindTooltip("DMZ · Deep-Playa Music Zone", { sticky: true })
          .addTo(map);

        L.geoJSON(files.trash_fence, {
          style: { color: "#c84a10", weight: 2, dashArray: "10 8", fill: false },
        }).addTo(map);

        // --- Etiquetas de calle -----------------------------------------

        const label = (point: LatLng, text: string, size: number) =>
          L.marker(point, {
            interactive: false,
            icon: L.divIcon({
              className: "brc-street-label",
              html: `<span style="
                color:${INK};opacity:.55;font-weight:800;font-size:${size}px;
                text-shadow:0 0 3px ${PLAYA},0 0 3px ${PLAYA},0 0 3px ${PLAYA};
                white-space:nowrap;
              ">${text}</span>`,
              iconSize: [0, 0],
            }),
          });

        // Las horas van en el hueco que queda entre el Hombre y la Esplanade:
        // por fuera de la K se las comen los pines de los escenarios.
        const espFeet = distanceMeters(MAN, INTERSECTIONS["4:30|ESP"]) * 3.28084;
        for (let hour = 2; hour <= 10; hour++) {
          // Center Camp se come el hueco de las 6:00, así que esas tres horas
          // se acercan más al Hombre.
          const feet = hour >= 5 && hour <= 7 ? espFeet - 1200 : espFeet - 500;
          label(polarPoint(hour, 0, feet), `${hour}:00`, 12).addTo(map);
        }

        // Las letras de las anulares solo caben con la ciudad ampliada: a la
        // vista completa se pisarían unas con otras.
        const ringLabels = L.layerGroup();
        for (const ring of RINGS) {
          for (const radial of ["4:30", "7:30"]) {
            const point = INTERSECTIONS[`${radial}|${ring}`];
            if (point) label(point, ring === "ESP" ? "Esplanade" : ring, 11).addTo(ringLabels);
          }
        }
        const syncRingLabels = () => {
          if (map.getZoom() >= RING_LABEL_ZOOM) ringLabels.addTo(map);
          else map.removeLayer(ringLabels);
        };
        map.on("zoomend", syncRingLabels);

        // --- Capas conmutables ------------------------------------------

        groupsRef.current.toilets = L.geoJSON(files.toilets, {
          style: { color: "#4a7fa9", weight: 1, fillColor: "#8fbcd8", fillOpacity: 0.7 },
          onEachFeature: (_feature, layer) => layer.bindTooltip("Baños", { sticky: true }),
        });

        const emojiPin = (emoji: string, size: number, ring: string) =>
          L.divIcon({
            className: "brc-pin",
            html: `<span style="
              display:flex;align-items:center;justify-content:center;
              width:${size}px;height:${size}px;border-radius:9999px;
              background:#fdf4e0;border:2px solid ${ring};
              font-size:${Math.round(size * 0.58)}px;line-height:1;
              box-shadow:0 1px 4px rgba(0,0,0,.3);
            ">${emoji}</span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
          });

        const essentials = L.layerGroup();
        const services = L.layerGroup();
        for (const poi of POIS) {
          const anchor = ANCHOR_EMOJI[poi.kind];
          if (anchor) {
            const isDmz = poi.kind === "dmz";
            L.marker(poi.point, {
              icon: emojiPin(anchor, isDmz ? 22 : 30, isDmz ? "#7a4ea9" : "#c84a10"),
              title: poi.name,
            })
              .bindTooltip(poi.name, { direction: "top" })
              .addTo(map);
            continue;
          }
          const essential = ESSENTIAL_KINDS.includes(poi.kind);
          const emoji = essential ? ESSENTIAL_EMOJI[poi.kind] : SERVICE_EMOJI[poi.name];
          if (!emoji) continue;
          L.marker(poi.point, { icon: emojiPin(emoji, essential ? 22 : 20, "#c4906a"), title: poi.name })
            .bindTooltip(poi.name, { direction: "top" })
            .addTo(essential ? essentials : services);
        }
        groupsRef.current.essentials = essentials;
        groupsRef.current.services = services;

        const campGroup = L.layerGroup();
        campMarkersRef.current.clear();
        for (const camp of camps) {
          if (!camp.point) continue; // sin colocar todavía, o dirección ilegible
          const marker = L.circleMarker(camp.point, {
            ...campStyle(favouritesRef.current.has(camp.uid)),
          }).bindPopup(
            `<div style="font-family:inherit;min-width:140px">
               <div style="font-weight:800;font-size:13px;color:${INK}">${esc(camp.name)}</div>
               <div style="font-size:11px;color:#a07040;margin-top:3px">${esc(camp.address ?? "")}</div>
               ${camp.exact ? "" : `<div style="font-size:10px;color:#a07040;margin-top:4px">Cruce estimado.</div>`}
             </div>`
          );
          marker.addTo(campGroup);
          campMarkersRef.current.set(camp.uid, marker);
        }
        groupsRef.current.camps = campGroup;

        // A vista de ciudad entera, 1.400 puntos del tamaño de los de zoom son
        // una mancha morada que tapa las calles: el radio crece al ampliar. Los
        // marcados van siempre un punto más grandes, para encontrarlos sin
        // buscarlos.
        const campRadius = (zoom: number) =>
          zoom >= 16 ? 5 : zoom >= 15 ? 3.5 : zoom >= 14 ? 2.5 : 1.5;
        const syncCampSize = () => {
          const radius = campRadius(map.getZoom());
          for (const [uid, marker] of campMarkersRef.current) {
            const favourite = favouritesRef.current.has(uid);
            marker.setRadius(favourite ? radius + 2 : radius);
          }
        };
        map.on("zoomend", syncCampSize);

        const venueGroup = L.layerGroup();
        for (const venue of venues) {
          const title = venue.stage ? `${venue.name} · ${venue.stage}` : venue.name;
          L.marker(venue.point, { icon: emojiPin(venue.emoji, 32, "#7a2e08"), title })
            .bindPopup(
              `<div style="font-family:inherit;min-width:150px">
                 <div style="font-weight:800;font-size:13px;color:${INK}">${esc(title)}</div>
                 <div style="font-size:11px;color:#a07040;margin-top:3px">${esc(venue.location)}</div>
                 ${venue.exact ? "" : `<div style="font-size:10px;color:#a07040;margin-top:4px">Cruce estimado: esa esquina no existe en el plano oficial.</div>`}
               </div>`
            )
            .addTo(venueGroup);
        }
        groupsRef.current.venues = venueGroup;

        for (const key of Object.keys(groupsRef.current) as LayerKey[]) {
          if (layers[key]) groupsRef.current[key].addTo(map);
        }

        // Se encuadra la ciudad, no la valla: dentro del trash fence sobra
        // desierto por todos lados y la ciudad saldría diminuta. La DMZ entra
        // porque es donde tocan la mitad de los art cars.
        map.fitBounds(streets.getBounds().extend(dmz.getBounds()), { padding: [12, 12] });
        syncRingLabels();
        syncCampSize();
        setTimeout(() => map && map.invalidateSize(), 180);
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
    // `layers` solo decide el estado inicial; los cambios los aplica el efecto
    // de abajo sin volver a montar el mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, camps]);

  // Marcar y desmarcar repinta los puntos, sin reconstruir el mapa.
  useEffect(() => {
    favouritesRef.current = new Set(favourites);
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    const radius = zoom >= 16 ? 5 : zoom >= 15 ? 3.5 : zoom >= 14 ? 2.5 : 1.5;
    for (const [uid, marker] of campMarkersRef.current) {
      const favourite = favouritesRef.current.has(uid);
      marker.setStyle(campStyle(favourite));
      marker.setRadius(favourite ? radius + 2 : radius);
    }
  }, [favourites, status]);

  // Ir al campamento que se acaba de buscar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const marker = campMarkersRef.current.get(focus.uid);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.8 });
    marker.openPopup();
  }, [focus, status]);

  // Encender y apagar capas sin reconstruir nada.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const key of Object.keys(groupsRef.current) as LayerKey[]) {
      const group = groupsRef.current[key];
      if (!group) continue;
      if (layers[key]) group.addTo(map);
      else map.removeLayer(group);
    }
  }, [layers, status]);

  if (status === "failed") {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold text-[#a07040]">
          No se ha podido cargar el mapa de la ciudad.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" style={{ background: PLAYA }} />;
}

/** Morado los del listado, naranja los que le interesan a alguien del grupo. */
function campStyle(favourite: boolean) {
  return favourite
    ? { radius: 5.5, color: "#7a2e08", weight: 1.5, fillColor: "#f0902a", fillOpacity: 1 }
    : { radius: 3.5, color: "#7a4ea9", weight: 1, fillColor: "#a982d8", fillOpacity: 0.85 };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
