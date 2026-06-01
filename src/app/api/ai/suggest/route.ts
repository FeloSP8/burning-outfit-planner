import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suggestOutfits } from "@/lib/ai";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

export async function POST() {
  const inventory = await db.garment.findMany({
    where: { userId: DEFAULT_USER_ID },
    select: { id: true, name: true, slot: true, status: true },
  });

  if (inventory.length < 2)
    return NextResponse.json(
      { error: "Añade al menos 2 prendas al inventario para generar sugerencias" },
      { status: 422 }
    );

  const suggestions = await suggestOutfits(inventory);
  return NextResponse.json({ suggestions });
}
