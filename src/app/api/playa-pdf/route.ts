import { NextResponse, type NextRequest } from "next/server";
import { createElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { buildSnapshot } from "@/lib/playa-snapshot";
import { loadPdfImages } from "@/lib/pdf-images";
import { PlayaPDF } from "@/lib/playaPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Bajar y encoger las fotos lleva su rato; con los 10 s por defecto de Vercel
// un dossier con veinte outfits se quedaría a medias.
export const maxDuration = 60;

/** Ancho al que se piden las fotos, en píxeles: el doble de lo que miden en el PDF. */
const TRY_ON_WIDTH = 260;
const THUMB_WIDTH = 150;

/**
 * El dossier de papel: agenda, outfits, checklist e inventario en un PDF.
 *
 * Lleva las fotos de los outfits del usuario —el try-on de cada turno y las
 * miniaturas de las prendas—. Solo las suyas: el snapshot se construye con su
 * `userId`, así que los outfits de los demás no llegan hasta aquí.
 *
 * Con `?fotos=0` sale la versión de texto, que pesa unos kB y se genera al
 * instante.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const wantsPhotos = request.nextUrl.searchParams.get("fotos") !== "0";
  const snapshot = await buildSnapshot(user.id, user.name);

  const images = wantsPhotos
    ? await loadPdfImages(
        snapshot.days.flatMap((day) =>
          day.shifts.flatMap((shift) => {
            const outfit = shift.outfit;
            if (!outfit || outfit.items.length === 0) return [];
            return [
              ...(outfit.tryOn ? [{ url: outfit.tryOn.imageUrl, width: TRY_ON_WIDTH }] : []),
              ...outfit.items
                .filter((item) => item.garment.photoUrl)
                .map((item) => ({ url: item.garment.photoUrl!, width: THUMB_WIDTH })),
            ];
          })
        )
      )
    : {};

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
    createElement(PlayaPDF, { snapshot, generatedAt, images }) as any
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
