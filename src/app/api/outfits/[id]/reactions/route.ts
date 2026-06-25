import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// Conjunto permitido de emojis de reacción (incluye ⭐ para favorito).
const ALLOWED_EMOJIS = ["⭐", "🔥", "😍", "👏", "🤩", "💜", "😂", "👌"];

const Schema = z.object({ emoji: z.enum(ALLOWED_EMOJIS as [string, ...string[]]) });

// Toggle de una reacción del usuario de sesión a un outfit compartido del muro.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: outfitId } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Emoji no permitido" }, { status: 400 });

  const { emoji } = parsed.data;

  // Solo se puede reaccionar a outfits compartidos en el muro.
  const outfit = await db.outfit.findUnique({ where: { id: outfitId }, select: { shared: true } });
  if (!outfit || !outfit.shared)
    return NextResponse.json({ error: "Outfit no disponible" }, { status: 404 });

  // Toggle: si ya existe esta reacción del usuario, la quita; si no, la crea.
  const existing = await db.reaction.findUnique({
    where: { userId_outfitId_emoji: { userId: user.id, outfitId, emoji } },
  });

  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
  } else {
    await db.reaction.create({ data: { emoji, outfitId, userId: user.id } });
  }

  // Devolver el recuento actualizado de ese emoji para este outfit.
  const count = await db.reaction.count({ where: { outfitId, emoji } });
  return NextResponse.json({ emoji, count, reacted: !existing });
}
