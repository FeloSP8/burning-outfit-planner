import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const VALID_SLOTS = ["TOP", "BOTTOM", "SHOES", "ACCESSORY", "COAT", "BIKE_ACCESSORY"] as const;
const VALID_STATUSES = ["COMPRADO", "RECIBIDO", "PENDIENTE"] as const;

const GarmentSchema = z.object({
  name: z.string().min(1),
  slot: z.enum(VALID_SLOTS),
  status: z.enum(VALID_STATUSES).default("PENDIENTE"),
  photoUrl: z.string().optional().nullable(),
  purchaseUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const slot = req.nextUrl.searchParams.get("slot");
  const garments = await db.garment.findMany({
    where: {
      userId: user.id,
      ...(slot ? { slot } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(garments);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = GarmentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const garment = await db.garment.create({
    data: { ...parsed.data, userId: user.id },
  });
  return NextResponse.json(garment, { status: 201 });
}
