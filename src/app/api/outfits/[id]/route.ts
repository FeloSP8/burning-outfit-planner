import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, ownsOutfit } from "@/lib/auth";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const outfit = await db.outfit.findUnique({
    where: { id },
    include: {
      items: { include: { garment: true } },
      tryOn: true,
      shift: { include: { day: true } },
    },
  });
  if (!outfit || outfit.shift.day.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(outfit);
}

const PatchSchema = z.object({ shared: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  if (!(await ownsOutfit(id, user.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const outfit = await db.outfit.update({
    where: { id },
    data: { shared: parsed.data.shared },
  });
  return NextResponse.json({ shared: outfit.shared });
}
