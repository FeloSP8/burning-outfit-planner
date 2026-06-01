import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

export async function GET() {
  const days = await db.day.findMany({
    where: { userId: DEFAULT_USER_ID },
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
