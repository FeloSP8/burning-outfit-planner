import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { z } from "zod";

const VALID_SLOTS = ["TOP", "BOTTOM", "SHOES", "ACCESSORY", "COAT"] as const;
const VALID_STATUSES = ["COMPRADO", "RECIBIDO", "PENDIENTE"] as const;

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  slot: z.enum(VALID_SLOTS).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  photoUrl: z.string().optional().nullable(),
  purchaseUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const garment = await db.garment.findUnique({ where: { id } });
  if (!garment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(garment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const garment = await db.garment.update({ where: { id }, data: parsed.data });
  return NextResponse.json(garment);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const garment = await db.garment.findUnique({ where: { id } });
  if (!garment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (garment.photoUrl) await deleteFile(garment.photoUrl);
  await db.garment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
