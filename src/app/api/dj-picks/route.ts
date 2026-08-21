import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SET_INDEX } from "@/lib/dj-agenda";
import { loadPicks } from "@/lib/dj-picks";
import { z } from "zod";

// GET — quién del grupo quiere ver cada set.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json(await loadPicks());
}

const ToggleSchema = z.object({ setId: z.string().min(1).max(120) });

// POST — alterna un set en la agenda del usuario actual.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { setId } = parsed.data;
  if (!SET_INDEX[setId])
    return NextResponse.json({ error: "Ese set no está en el cartel" }, { status: 404 });

  const existing = await db.djPick.findUnique({
    where: { userId_setId: { userId: user.id, setId } },
  });

  if (existing) {
    await db.djPick.delete({ where: { id: existing.id } });
  } else {
    await db.djPick.create({ data: { userId: user.id, setId } });
  }

  const count = await db.djPick.count({ where: { setId } });
  return NextResponse.json({ picked: !existing, count });
}
