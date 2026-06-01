import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTryOnLeonardo } from "@/lib/leonardo";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";
import { z } from "zod";

const VALID_MODELS = LEONARDO_MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];

const Schema = z.object({
  outfitId:    z.string().min(1),
  userPhotoUrl: z.string().min(1),
  extraPrompt: z.string().max(500).optional(),
  model:       z.enum(VALID_MODELS).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { outfitId, userPhotoUrl, extraPrompt, model = "gpt-image-2" } = parsed.data;

  const outfit = await db.outfit.findUnique({
    where: { id: outfitId },
    include: { items: { include: { garment: true } }, shift: true },
  });
  if (!outfit)
    return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });

  // Deduplicar por slot: si hay varias prendas del mismo slot (estado sucio anterior),
  // quedarse solo con la más reciente (último en el array = último asignado)
  const seenSlots = new Set<string>();
  const dedupedItems = [...outfit.items].reverse().filter((it) => {
    if (seenSlots.has(it.garment.slot)) return false;
    seenSlots.add(it.garment.slot);
    return true;
  });

  // Todas las prendas con foto — pasamos nombre y slot reales para el prompt
  const garments = dedupedItems
    .map((it) => it.garment)
    .filter((g) => g.photoUrl)
    .map((g) => ({
      url:  g.photoUrl!,
      name: g.name,
      slot: g.slot,
    }));

  // Log para depuración — confirma qué prendas van al try-on
  console.log(`[try-on] outfit ${outfitId} — ${garments.length} prendas con foto:`,
    garments.map((g) => `${g.slot}:"${g.name}"`).join(", "));

  if (garments.length === 0)
    return NextResponse.json(
      { error: "El outfit necesita al menos una prenda con foto asignada" },
      { status: 422 }
    );

  const warning =
    outfit.shift.type === "NOCHE" && !outfit.items.some((it) => it.garment.slot === "COAT")
      ? "Turno NOCHE sin abrigo asignado."
      : null;

  try {
    const isNight = outfit.shift.type === "NOCHE";
    const imageUrl = await generateTryOnLeonardo(userPhotoUrl, garments, extraPrompt, isNight, model);

    const result = await db.tryOnResult.upsert({
      where: { outfitId },
      create: { outfitId, imageUrl, userPhoto: userPhotoUrl },
      update: { imageUrl, userPhoto: userPhotoUrl, createdAt: new Date() },
    });

    return NextResponse.json({ imageUrl: result.imageUrl, warning });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error en Probador Virtual (Leonardo):", msg);
    return NextResponse.json(
      { error: "Error en el probador virtual: " + msg },
      { status: 500 }
    );
  }
}
