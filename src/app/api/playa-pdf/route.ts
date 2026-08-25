import { NextResponse } from "next/server";
import { createElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { buildSnapshot } from "@/lib/playa-snapshot";
import { PlayaPDF } from "@/lib/playaPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** El dossier de papel: agenda, outfits, checklist e inventario en un PDF. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const snapshot = await buildSnapshot(user.id, user.name);

  const now = new Date();
  const generatedAt = now.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Dynamic import para evitar que Next.js trate @react-pdf/renderer como
  // CJS externo — el paquete es ESM puro y necesita import() en runtime.
  const { renderToBuffer } = await import("@react-pdf/renderer");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(
    createElement(PlayaPDF, { snapshot, generatedAt }) as any
  );

  const dateStr = now.toISOString().slice(0, 10);

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossier-playa-${dateStr}.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
