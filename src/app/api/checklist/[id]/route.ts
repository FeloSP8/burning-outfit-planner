import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { z } from "zod";

const PatchSchema = z.object({
  origin: z.enum(["ESPANA", "ALLI"]).nullable().optional(),
  type:   z.enum(["COMMON", "INDIVIDUAL"]).optional(),
});

// PATCH — actualiza origin y/o type de un ítem (cualquier usuario).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.origin !== undefined) data.origin = parsed.data.origin;
  if (parsed.data.type   !== undefined) {
    data.type = parsed.data.type;
    // Reset done/assigneeName when switching to INDIVIDUAL — they don't apply
    if (parsed.data.type === "INDIVIDUAL") {
      data.done         = false;
      data.assigneeName = null;
    }
  }

  const item = await db.checklistItem.update({ where: { id }, data });
  return NextResponse.json({ origin: item.origin, type: item.type });
}

// DELETE — borra un ítem. Solo el administrador.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Solo el administrador puede borrar" }, { status: 403 });

  const { id } = await params;
  await db.checklistItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
