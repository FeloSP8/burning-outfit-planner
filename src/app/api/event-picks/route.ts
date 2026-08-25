import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadEventPicks } from "@/lib/event-picks";

// GET — quién del grupo quiere ir a cada pase.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json(await loadEventPicks());
}

/**
 * No se comprueba que el evento exista: el catálogo no es nuestro, vive en la
 * API de Burning Man y cambia. Una fila que ya no case con ningún pase
 * simplemente no se pinta, igual que pasa con los sets de un cartel corregido.
 */
const ToggleSchema = z.object({
  eventUid: z.string().min(1).max(120),
  startTime: z.string().min(10).max(40),
});

// POST — alterna un pase en la agenda del usuario actual.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { eventUid, startTime } = parsed.data;
  const existing = await db.eventPick.findUnique({
    where: { userId_eventUid_startTime: { userId: user.id, eventUid, startTime } },
  });

  if (existing) {
    await db.eventPick.delete({ where: { id: existing.id } });
  } else {
    await db.eventPick.create({ data: { userId: user.id, eventUid, startTime } });
  }

  return NextResponse.json({ picked: !existing });
}
