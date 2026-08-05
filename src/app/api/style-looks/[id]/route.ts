import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const look = await db.styleLook.findUnique({ where: { id } });
  if (!look || look.userId !== user.id)
    return NextResponse.json({ error: "Look no encontrado" }, { status: 404 });

  // Si el look es la foto de modelo actual, borrarlo dejaría al probador sin
  // imagen: mejor pedir que cambie la foto antes.
  if (look.imageUrl === user.photoUrl)
    return NextResponse.json(
      { error: "Este look es tu foto de modelo. Cambia de foto antes de borrarlo." },
      { status: 409 }
    );

  await db.styleLook.delete({ where: { id } });

  // Solo se borra el fichero si ningún otro look lo usa de foto de partida:
  // si no, se quedarían miniaturas rotas en el estudio.
  const stillReferenced = await db.styleLook.count({
    where: { userId: user.id, sourcePhoto: look.imageUrl },
  });
  if (stillReferenced === 0) await deleteFile(look.imageUrl);

  return NextResponse.json({ ok: true });
}
