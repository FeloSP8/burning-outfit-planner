import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
