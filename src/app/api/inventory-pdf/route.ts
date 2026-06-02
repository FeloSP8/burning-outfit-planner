import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require("@react-pdf/renderer") as typeof import("@react-pdf/renderer");
import { createElement } from "react";
import { db } from "@/lib/db";
import { InventoryPDF } from "@/lib/inventoryPdf";
import type { Garment } from "@/types";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

export async function GET() {
  const rawGarments = await db.garment.findMany({
    where: { userId: DEFAULT_USER_ID },
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
