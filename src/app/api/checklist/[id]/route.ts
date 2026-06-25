import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";

// DELETE — borra un ítem. Solo el administrador.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Solo el administrador puede borrar" }, { status: 403 });

  const { id } = await params;
  await db.checklistItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
