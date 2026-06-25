import { NextResponse } from "next/server";
import { createElement } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { InventoryPDF } from "@/lib/inventoryPdf";
import type { Garment } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const rawGarments = await db.garment.findMany({
    where: { userId: user.id },
    orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
  });

  const garments = rawGarments.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
  })) as Garment[];

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
    createElement(InventoryPDF, { garments, generatedAt }) as any
  );

  const dateStr = now.toISOString().slice(0, 10);

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inventario-${dateStr}.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
