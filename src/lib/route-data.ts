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

/**
 * Enlace canónico a la ruta guardada en Google Maps.
 *
 * Solo alimenta el botón "Ver ruta completa". El mapa, las paradas y la tabla
 * de tramos se construyen aparte desde las coordenadas de `ROUTE_STOPS`, así
 * que si esta ruta guardada cambia de paradas hay que actualizarlas también o
 * el botón y la página contarán cosas distintas.
 */
export const ROUTE_SHARE_URL = "https://maps.app.goo.gl/awViKdPTZSKEajxA6";

export const ROUTE_META = {
  title: "Newark → Black Rock City",
  subtitle: "Ruta de aprovisionamiento y traslado",
  vehicle: "RV Cruise America C25ft",
  booking: "R47579 (Felipe Sordo)",
  people: 4,
  pickup: {
    date: "29 agosto 2026",
    /** La ventana del contrato. La sede no cierra hora concreta por teléfono. */
    window: "13:00–16:00",
    /** Lo que se va a hacer: plantarse allí temprano y salir en cuanto la den. */
    plan: "Estar en la sede a las 7:00 y salir en cuanto la entreguen",
    place: "Cruise America San Francisco",
  },
  return: {
    date: "5 septiembre 2026",
    window: "09:00–11:00",
    place: "misma sede",
  },
  totalDistance: "~595 km",
  totalDriving: "7 h 21 min",
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
    name: "The Home Depot",
    address: "43900 Ice House Terrace, Fremont, CA 94538",
    coords: [37.51104, -121.94582],
    purpose: "Estacas, cinta, lonas, bidones, cubos, herramienta",
    emoji: "🔨",
  },
  {
    order: 3,
    name: "Walmart",
    address: "44009 Osgood Rd, Fremont, CA 94539",
    coords: [37.51135, -121.94322],
    purpose: "Complemento: hielo, textil, portabicis, misceláneo",
    emoji: "🧊",
  },
  {
    // El Costco ya no es el de Newark (350 Newpark Mall Rd): ese obligaba a
    // volver atrás nada más salir. Este cae en la I-680 subiendo hacia la
    // I-80, así que la compra grande se hace de paso y no de rodeo.
    order: 4,
    name: "Costco Wholesale",
    address: "7200 Johnson Dr, Pleasanton, CA 94588",
    coords: [37.695759, -121.917744],
    purpose: "Comida, agua, bebidas a granel",
    emoji: "🛒",
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

/**
 * Tramos tal y como los da Google Maps para esta ruta, convertidos de millas.
 *
 * El total son las 370 millas / 7 h 21 min que Maps calcula para el recorrido
 * entero con el tráfico del momento. Sumar los tramos uno a uno da unos 40
 * minutos menos: son dos cálculos distintos de Google, no un error de cuentas.
 */
export const ROUTE_LEGS: RouteLeg[] = [
  {
    label: "1 → 3 · cluster Fremont (Home Depot + Walmart)",
    distance: "~7 km",
    duration: "16 min + compras",
  },
  { label: "3 → 4 · Fremont → Pleasanton (Costco)", distance: "~27 km", duration: "22 min" },
  { label: "4 → 5 · Pleasanton → Reno", distance: "~362 km", duration: "3 h 36 min" },
  { label: "5 → 6 · Reno → Fernley", distance: "~50 km", duration: "33 min" },
  { label: "6 → 7 · Fernley → BRC (NV-447)", distance: "~149 km", duration: "1 h 51 min" },
  {
    label: "Total Newark → BRC",
    distance: "~595 km",
    duration: "7 h 21 min de volante",
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
    title: "El día 29 se hace entero: sin pernocta en ruta",
    body: "Decisión tomada: las 3 compras y las 7h30 de volante van el mismo día, sin parar a dormir en Reno ni en Fernley. La hora de recogida no se puede cerrar por teléfono —la ventana del contrato es 13:00–16:00 y hay contratada la Early Bird Departure Option—, así que el plan es estar en la sede a las 7:00 y salir en cuanto la entreguen.",
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

/**
 * Enlace de navegación real: omite `origin`, así Google Maps arranca desde la
 * ubicación actual del móvil y ofrece «Iniciar» en vez de «Vista previa».
 *
 * Con el origen fijado en Newark, Google solo puede previsualizar la ruta
 * mientras no estés allí — por eso hace falta esta variante para usarlo de
 * navegador durante el viaje. Las paradas pasan todas a waypoints (6, dentro
 * del límite de 9 que admite la API de URLs) y BRC queda como destino.
 */
export function buildNavigateFromHereUrl(): string {
  const params = new URLSearchParams({
    api: "1",
    destination: ROUTE_STOPS[ROUTE_STOPS.length - 1].coords.join(","),
    waypoints: ROUTE_STOPS.slice(0, -1).map((s) => s.coords.join(",")).join("|"),
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
