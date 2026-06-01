import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Todos los slots son únicos por outfit — el select solo puede mostrar una prenda a la vez
const UNIQUE_SLOTS = ["TOP", "BOTTOM", "SHOES", "COAT", "ACCESSORY"];

const AssignSchema = z.object({ garmentId: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: outfitId } = await params;
  const body = await req.json();
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { garmentId } = parsed.data;

  const [outfit, garment] = await Promise.all([
    db.outfit.findUnique({ where: { id: outfitId }, include: { items: { include: { garment: true } }, shift: true } }),
    db.garment.findUnique({ where: { id: garmentId } }),
  ]);

  if (!outfit) return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });
  if (!garment) return NextResponse.json({ error: "Prenda no encontrada" }, { status: 404 });

  // Enforce unique slots: remove existing garment in same slot before assigning
  if (UNIQUE_SLOTS.includes(garment.slot)) {
    const existing = outfit.items.find((it) => it.garment.slot === garment.slot);
    if (existing) {
      await db.outfitItem.delete({ where: { id: existing.id } });
    }
  }

  const item = await db.outfitItem.upsert({
    where: { outfitId_garmentId: { outfitId, garmentId } },
    create: { outfitId, garmentId },
    update: {},
    include: { garment: true },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: outfitId } = await params;
  const garmentId = req.nextUrl.searchParams.get("garmentId");
  if (!garmentId)
    return NextResponse.json({ error: "garmentId requerido" }, { status: 400 });

  await db.outfitItem.deleteMany({ where: { outfitId, garmentId } });
  return NextResponse.json({ ok: true });
}
