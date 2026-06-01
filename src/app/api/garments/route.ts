import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

const VALID_SLOTS = ["TOP", "BOTTOM", "SHOES", "ACCESSORY", "COAT"] as const;
const VALID_STATUSES = ["COMPRADO", "RECIBIDO", "PENDIENTE"] as const;

const GarmentSchema = z.object({
  name: z.string().min(1),
  slot: z.enum(VALID_SLOTS),
  status: z.enum(VALID_STATUSES).default("PENDIENTE"),
  photoUrl: z.string().optional().nullable(),
  purchaseUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get("slot");
  const garments = await db.garment.findMany({
    where: {
      userId: DEFAULT_USER_ID,
      ...(slot ? { slot } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(garments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GarmentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.user.upsert({
    where: { id: DEFAULT_USER_ID },
    create: { id: DEFAULT_USER_ID },
    update: {},
  });

  const garment = await db.garment.create({
    data: { ...parsed.data, userId: DEFAULT_USER_ID },
  });
  return NextResponse.json(garment, { status: 201 });
}
