import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { photoUrl, name } = await req.json();

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  });

  return NextResponse.json(updated);
}
