import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

export async function GET() {
  const user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  return NextResponse.json(user ?? { id: DEFAULT_USER_ID, photoUrl: null, name: "Yo" });
}

export async function PATCH(req: NextRequest) {
  const { photoUrl, name } = await req.json();

  const user = await db.user.upsert({
    where: { id: DEFAULT_USER_ID },
    create: { id: DEFAULT_USER_ID, name: name ?? "Yo", photoUrl: photoUrl ?? null },
    update: {
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  });

  return NextResponse.json(user);
}
