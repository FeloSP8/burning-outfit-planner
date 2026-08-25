import type { ChecklistItemData, Day, DjPicksBySet, FansByArtist, Garment } from "@/types";
import type { Ensemble, ModelForecast } from "@/lib/weather";
import type { CampPin, PlayaEvent } from "@/lib/brc-api";
import type { EventPicksByPass } from "@/lib/event-picks";
import type { CampPicksByUid } from "@/lib/camp-picks";

/**
 * Todo lo que hay que llevarse al playa en un solo objeto.
 *
 * Se descarga con cobertura, se guarda en IndexedDB y es lo único que lee la
 * pantalla `/playa` cuando no hay red. No lleva imágenes a propósito: en el
 * evento las fotos no se miran y multiplicarían por cien lo que ocupa.
 *
 * Los line-ups, las fichas de los artistas y la geometría de la ciudad no
 * están aquí porque no hacen falta: viven en el código y en `public/brc/`, así
 * que el service worker ya los tiene cacheados con el resto de la app.
 */
export interface PlayaSnapshot {
  /** Sube cuando cambia la forma del objeto: un snapshot viejo se descarta. */
  version: number;
  /** ISO del momento de la descarga: se enseña siempre, para saber si está rancio. */
  generatedAt: string;
  userName: string;
  /** setId → nombres de quienes lo han marcado. */
  picks: DjPicksBySet;
  /** artista → nombres de quienes lo tienen de favorito. */
  fans: FansByArtist;
  /** Días y turnos del usuario, con el outfit de cada uno. */
  days: Day[];
  garments: Garment[];
  checklist: ChecklistItemData[];
  /** Listado oficial de campamentos, para buscarlos en el mapa sin cobertura. */
  camps: CampPin[];
  /** Eventos oficiales con sus pases, ya situados. */
  events: PlayaEvent[];
  /** `uid|inicio` → quiénes quieren ir a ese pase. */
  eventPicks: EventPicksByPass;
  /** uid del campamento → quiénes lo tienen marcado. */
  campPicks: CampPicksByUid;
  /** Pronóstico congelado en el momento de la descarga. null si falló. */
  weather: { models: ModelForecast[]; ensemble: Ensemble | null } | null;
}

/** Formato actual. Cambiarlo invalida los snapshots ya descargados. */
export const SNAPSHOT_VERSION = 5;
