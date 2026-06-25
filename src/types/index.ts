export type ShiftType = "TARDE" | "NOCHE";
export type GarmentSlot = "TOP" | "BOTTOM" | "SHOES" | "ACCESSORY" | "COAT" | "BIKE_ACCESSORY";
export type GarmentStatus = "COMPRADO" | "RECIBIDO" | "PENDIENTE";

export type ChecklistType = "COMMON" | "INDIVIDUAL";

export interface ChecklistItemData {
  id: string;
  text: string;
  type: ChecklistType;
  tags: string[];
  done: boolean;             // COMMON: comprado/conseguido
  assigneeName: string | null; // COMMON: quién se encarga
  createdByName: string;
  checkedBy: string[];       // INDIVIDUAL: nombres que ya lo tienen
  iChecked: boolean;         // INDIVIDUAL: ¿yo lo tengo?
}

export interface Garment {
  id: string;
  name: string;
  slot: GarmentSlot;
  status: GarmentStatus;
  photoUrl?: string | null;
  purchaseUrl?: string | null;
  notes?: string | null;
  price?: number | null;
  userId: string;
  createdAt: string;
}

export interface OutfitItem {
  id: string;
  garment: Garment;
}

export interface TryOnResult {
  id: string;
  imageUrl: string;
  userPhoto: string;
  createdAt: string;
}

export interface Outfit {
  id: string;
  shiftId: string;
  items: OutfitItem[];
  tryOn?: TryOnResult | null;
  shared?: boolean;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  mine: boolean;      // ¿el usuario actual reaccionó con este emoji?
  who: string[];      // nombres de quienes reaccionaron
}

export interface WallOutfit {
  id: string;
  authorName: string;
  shiftType: ShiftType;
  date: string;
  dayLabel?: string | null;
  tryOnUrl?: string | null;
  items: OutfitItem[];
  reactions: ReactionSummary[];
  favoriteCount: number;  // nº de ⭐ (para ordenar por más votados)
}

export interface Shift {
  id: string;
  type: ShiftType;
  dayId: string;
  outfit: Outfit | null;
}

export interface Day {
  id: string;
  date: string;
  label?: string | null;
  userId: string;
  shifts: Shift[];
}
