export type ShiftType = "TARDE" | "NOCHE";
export type GarmentSlot = "TOP" | "BOTTOM" | "SHOES" | "ACCESSORY" | "COAT" | "BIKE_ACCESSORY";
export type GarmentStatus = "COMPRADO" | "RECIBIDO" | "PENDIENTE";

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

export interface WallOutfit {
  id: string;
  authorName: string;
  shiftType: ShiftType;
  date: string;
  dayLabel?: string | null;
  tryOnUrl?: string | null;
  items: OutfitItem[];
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
