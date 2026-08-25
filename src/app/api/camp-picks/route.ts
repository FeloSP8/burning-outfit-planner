import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadCampPicks } from "@/lib/camp-picks";

// GET — a quién del grupo le interesa cada campamento.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json(await loadCampPicks());
}

/**
 * No se comprueba que el campamento exista, por lo mismo que con los eventos:
 * el catálogo vive en la API de Burning Man y cambia. Un uid que ya no case con
 * nada simplemente no se pinta.
 */
const ToggleSchema = z.object({ campUid: z.string().min(1).max(120) });

// POST — alterna un campamento en la lista del usuario actual.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { campUid } = parsed.data;
  const existing = await db.campPick.findUnique({
    where: { userId_campUid: { userId: user.id, campUid } },
  });

  if (existing) {
    await db.campPick.delete({ where: { id: existing.id } });
  } else {
    await db.campPick.create({ data: { userId: user.id, campUid } });
  }

  return NextResponse.json({ picked: !existing });
}
