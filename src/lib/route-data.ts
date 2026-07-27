/**
 * Ruta de aprovisionamiento y traslado: Newark (CA) → Black Rock City (NV).
 * Burning Man 2026 · RV Cruise America C25ft.
 *
 * Fuente: ruta-newark-black-rock-city-2026.md
 */

export interface RouteStop {
  /** Orden de la parada en la ruta. */
  order: number;
  name: string;
  address: string;
  /** [lat, lng] — usadas para construir el embed de Google Maps. */
  coords: [number, number];
  purpose: string;
  emoji: string;
  /** Teléfono, si la parada lo tiene. */
  phone?: string;
}

export interface RouteLeg {
  label: string;
  distance: string;
  duration: string;
  /** Marca el total de la tabla, que se pinta distinto. */
  isTotal?: boolean;
}

/** Enlace canónico a la ruta guardada en Google Maps. */
export const ROUTE_SHARE_URL = "https://maps.app.goo.gl/2BEPzAZXgF9P5Woe9";

export const ROUTE_META = {
  title: "Newark → Black Rock City",
  subtitle: "Ruta de aprovisionamiento y traslado",
  vehicle: "RV Cruise America C25ft",
  booking: "R47579 (Felipe Sordo)",
  people: 4,
  pickup: {
    date: "29 agosto 2026",
    window: "13:00–16:00",
    place: "Cruise America San Francisco",
  },
  return: {
    date: "5 septiembre 2026",
    window: "09:00–11:00",
    place: "misma sede",
  },
  totalDistance: "~595 km",
  totalDriving: "~7 h 30 min",
} as const;

export const ROUTE_STOPS: RouteStop[] = [
  {
    order: 1,
    name: "Cruise America RV Rental & Sales",
    address: "5623 John Muir Dr, Newark, CA 94560",
    phone: "(510) 661-6719",
    coords: [37.52527, -121.99543],
    purpose: "Recogida del RV",
    emoji: "🚐",
  },
  {
    order: 2,
    name: "Costco Wholesale",
    address: "350 Newpark Mall Rd, Newark, CA 94560",
    coords: [37.52669, -121.99946],
    purpose: "Comida, agua, bebidas a granel",
    emoji: "🛒",
  },
  {
    order: 3,
    name: "The Home Depot",
    address: "43900 Ice House Terrace, Fremont, CA 94538",
    coords: [37.51104, -121.94582],
    purpose: "Estacas, cinta, lonas, bidones, cubos, herramienta",
    emoji: "🔨",
  },
  {
    order: 4,
    name: "Walmart",
    address: "44009 Osgood Rd, Fremont, CA 94539",
    coords: [37.51135, -121.94322],
    purpose: "Complemento: hielo, textil, portabicis, misceláneo",
    emoji: "🧊",
  },
  {
    order: 5,
    name: "Recogida de bicicletas",
    address: "5305 Mill St, Reno, NV 89502 · dirección particular",
    coords: [39.51396, -119.7499],
    purpose: "Recoger las bicis compradas previamente",
    emoji: "🚲",
  },
  {
    order: 6,
    name: "Love's Travel Stop",
    address: "825 Commerce Center Dr, Fernley, NV 89408",
    coords: [39.618, -119.26651],
    purpose: "Último repostaje real, agua, dump station, hielo",
    emoji: "⛽",
  },
  {
    order: 7,
    name: "Black Rock City",
    address: "Gerlach, NV",
    coords: [40.78741, -119.20333],
    purpose: "Destino",
    emoji: "🔥",
  },
];

export const ROUTE_LEGS: RouteLeg[] = [
  {
    label: "1 → 4 · cluster Newark/Fremont",
    distance: "~15 km",
    duration: "30–40 min + compras",
  },
  { label: "4 → 5 · Fremont → Reno", distance: "~380 km", duration: "4 h 30 – 5 h" },
  { label: "5 → 6 · Reno → Fernley", distance: "~50 km", duration: "40 min" },
  { label: "6 → 7 · Fernley → BRC (NV-447)", distance: "~150 km", duration: "2 h" },
  {
    label: "Total Newark → BRC",
    distance: "~595 km",
    duration: "~7 h 30 min de volante",
    isTotal: true,
  },
];

export const ROUTE_NOTES: { title: string; body: string; emoji: string }[] = [
  {
    emoji: "📏",
    title: "Millas incluidas: 1000 (1609 km)",
    body: "Ida y vuelta Newark–BRC son ~1190 km, quedan ~420 km de margen. El exceso se cobra a $0.39/milla + impuestos.",
  },
  {
    emoji: "⏰",
    title: "La recogida 13:00–16:00 aprieta el día 29",
    body: "Deja poco margen para hacer las 3 compras y conducir 7h30 el mismo día. Considerar pernocta intermedia (Reno o Fernley) o comprimir compras.",
  },
  {
    emoji: "⛽",
    title: "Fernley es el último punto con servicios completos",
    body: "Después de Fernley, la NV-447 no tiene repostaje fiable ni dump station. Salir con depósito lleno, agua limpia llena y tanques grises/negros vacíos.",
  },
  {
    emoji: "🔨",
    title: "Home Depot antes que Walmart",
    body: "Están a 300 m uno de otro, se pueden hacer en la misma parada.",
  },
  {
    emoji: "⚠️",
    title: "Gerlach no está en la ruta",
    body: "A ~15 km antes de BRC tiene gasolina, pero con precios altos y colas largas en semana de evento.",
  },
  {
    emoji: "🚲",
    title: "Las 4 bicis van dentro del RV",
    body: "Decisión tomada: no hace falta portabicis. Cargarlas al final (se recogen en Reno). Protege el interior con mantas o cartón — los daños se descuentan de la fianza de $1.000. Sujétalas para el tramo de la NV-447.",
  },
  {
    emoji: "🏷️",
    title: "Marcar las bicis antes de entrar a BRC",
    body: "Bicis sin identificar en el playa se pierden o acaban en Lost & Found. Etiqueta con nombre, campamento y coordenadas de calle.",
  },
];

export const ROUTE_PENDING: string[] = [
  "Añadir el 4º personal kit (o llevar ropa de cama y toallas propias para esa persona). Se puede añadir en la recogida.",
  "Decidir si se pernocta en ruta el 29 de agosto.",
  "Confirmar hora exacta de pickup (se agenda llamando a la sede 1–3 días antes).",
];

/**
 * El mapa ya no se incrusta con un iframe de Google.
 *
 * El endpoint antiguo `maps.google.com/maps?saddr=…&daddr=…&output=embed`
 * ignora los waypoints múltiples y cae a un mapa del mundo sin ruta ni
 * marcadores; la Embed API que sí los dibuja exige clave con facturación.
 * El mapa se pinta ahora con Leaflet y teselas de OpenStreetMap
 * (ver `route-geometry.ts` y `components/route/RouteMap.tsx`).
 */

/** Enlace "abrir en Google Maps" reconstruido, como alternativa al enlace corto. */
export function buildDirectionsOpenUrl(): string {
  const params = new URLSearchParams({
    api: "1",
    origin: ROUTE_STOPS[0].coords.join(","),
    destination: ROUTE_STOPS[ROUTE_STOPS.length - 1].coords.join(","),
    waypoints: ROUTE_STOPS.slice(1, -1).map((s) => s.coords.join(",")).join("|"),
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
