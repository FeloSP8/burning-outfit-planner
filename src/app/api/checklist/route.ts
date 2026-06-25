import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

// GET — lista todos los ítems de la checklist compartida con su estado.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const items = await db.checklistItem.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      createdBy: { select: { name: true } },
      checks: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(items.map((it) => ({
    id: it.id,
    text: it.text,
    type: it.type,
    tags: it.tags ? it.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    done: it.done,
    assigneeName: it.assigneeName,
    createdByName: it.createdBy.name,
    checkedBy: it.checks.map((c) => c.user.name),
    iChecked: it.checks.some((c) => c.userId === user.id),
  })));
}

const CreateSchema = z.object({
  text: z.string().min(1).max(120),
  type: z.enum(["COMMON", "INDIVIDUAL"]),
  tags: z.string().max(200).optional().default(""),
});

// POST — crea un ítem (cualquier usuario autenticado).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { text, type, tags } = parsed.data;
  const item = await db.checklistItem.create({
    data: { text: text.trim(), type, tags: tags.trim(), createdById: user.id },
  });
  return NextResponse.json(item, { status: 201 });
}
