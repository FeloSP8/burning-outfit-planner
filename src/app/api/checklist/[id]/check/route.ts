import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  // Para ítems COMMON: marcar/desmarcar comprado, y quién se encarga (opcional).
  done: z.boolean().optional(),
  assigneeName: z.string().max(60).nullable().optional(),
});

// POST — alterna el estado de un ítem (cualquier usuario autenticado).
// - INDIVIDUAL: toggle del check del usuario actual.
// - COMMON: actualiza `done` y/o `assigneeName` globales.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const item = await db.checklistItem.findUnique({ where: { id }, select: { type: true } });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (item.type === "INDIVIDUAL") {
    // Toggle del check personal.
    const existing = await db.checklistCheck.findUnique({
      where: { itemId_userId: { itemId: id, userId: user.id } },
    });
    if (existing) {
      await db.checklistCheck.delete({ where: { id: existing.id } });
    } else {
      await db.checklistCheck.create({ data: { itemId: id, userId: user.id } });
    }
    const count = await db.checklistCheck.count({ where: { itemId: id } });
    return NextResponse.json({ iChecked: !existing, count });
  }

  // COMMON: actualizar done / assignee globales.
  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.checklistItem.update({
    where: { id },
    data: {
      ...(parsed.data.done !== undefined ? { done: parsed.data.done } : {}),
      ...(parsed.data.assigneeName !== undefined ? { assigneeName: parsed.data.assigneeName } : {}),
    },
  });
  return NextResponse.json({ done: updated.done, assigneeName: updated.assigneeName });
}
