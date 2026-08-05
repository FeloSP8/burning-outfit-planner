import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Looks de estilismo del usuario, del más reciente al más antiguo. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const looks = await db.styleLook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    looks.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }))
  );
}
