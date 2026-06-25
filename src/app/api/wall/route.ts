import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { WallOutfit, Garment } from "@/types";

// El muro es el ÚNICO endpoint que cruza usuarios a propósito: muestra los
// outfits que cada usuario ha marcado como `shared`. Exige sesión (solo los
// usuarios de la app pueden verlo), pero no filtra por propietario.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const outfits = await db.outfit.findMany({
    where: { shared: true },
    orderBy: { updatedAt: "desc" },
    include: {
      tryOn: true,
      items: { include: { garment: true }, orderBy: { id: "asc" } },
      shift: { include: { day: { include: { user: true } } } },
    },
  });

  const wall: WallOutfit[] = outfits
    // Solo outfits con al menos una prenda — un outfit vacío no aporta nada al muro
    .filter((o) => o.items.length > 0)
    .map((o) => ({
      id: o.id,
      authorName: o.shift.day.user.name,
      shiftType: o.shift.type as WallOutfit["shiftType"],
      date: o.shift.day.date.toISOString(),
      dayLabel: o.shift.day.label,
      tryOnUrl: o.tryOn?.imageUrl ?? null,
      items: o.items.map((it) => ({
        id: it.id,
        garment: {
          ...it.garment,
          createdAt: it.garment.createdAt.toISOString(),
        } as Garment,
      })),
    }));

  return NextResponse.json(wall);
}
