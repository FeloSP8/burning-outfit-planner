import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTryOnLeonardo } from "@/lib/leonardo";
import { z } from "zod";

const Schema = z.object({
  outfitId: z.string().min(1),
  userPhotoUrl: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { outfitId, userPhotoUrl } = parsed.data;

  const outfit = await db.outfit.findUnique({
    where: { id: outfitId },
    include: { items: { include: { garment: true } }, shift: true },
  });
  if (!outfit)
    return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });

  // Prendas con foto — usamos todas las que tengan imagen, no solo TOP/BOTTOM
  const garments = outfit.items
    .map((it) => it.garment)
    .filter((g) => g.photoUrl)
    .map((g) => ({
      url: g.photoUrl!,
      category: g.slot === "BOTTOM" ? ("lower_body" as const) : ("upper_body" as const),
    }));

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
    const imageUrl = await generateTryOnLeonardo(userPhotoUrl, garments);

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
