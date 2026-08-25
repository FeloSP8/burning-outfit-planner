import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildSnapshot } from "@/lib/playa-snapshot";

export const dynamic = "force-dynamic";

/**
 * Todo lo que hay que llevarse al playa, en una sola respuesta.
 *
 * Lo pide el botón de descarga de `/playa` con cobertura; a partir de ahí vive
 * en IndexedDB y la app no vuelve a necesitar red.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const snapshot = await buildSnapshot(user.id, user.name);

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
