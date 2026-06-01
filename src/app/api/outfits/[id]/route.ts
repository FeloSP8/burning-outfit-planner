import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const outfit = await db.outfit.findUnique({
    where: { id },
    include: {
      items: { include: { garment: true } },
      tryOn: true,
      shift: true,
    },
  });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(outfit);
}
