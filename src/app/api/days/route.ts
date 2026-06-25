import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const days = await db.day.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    include: {
      shifts: {
        orderBy: { type: "asc" },
        include: {
          outfit: {
            include: {
              items: { include: { garment: true } },
              tryOn: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json(days);
}
