import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const DEFAULT_USER_ID = process.env.SEED_USER_ID ?? "user_default";

const DayEntrySchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1),
  tarde: z.boolean(),
  noche: z.boolean(),
});

const BodySchema = z.object({
  days:      z.array(DayEntrySchema).min(1),
  eventName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { days, eventName } = parsed.data;

  await db.user.upsert({
    where:  { id: DEFAULT_USER_ID },
    create: { id: DEFAULT_USER_ID, name: eventName ?? "Burning Man 2026" },
    update: {},
  });

  const created = [];

  for (const entry of days) {
    const date = new Date(entry.date + "T12:00:00.000Z");

    const day = await db.day.upsert({
      where:  { userId_date: { userId: DEFAULT_USER_ID, date } },
      create: { userId: DEFAULT_USER_ID, date, label: entry.label },
      update: { label: entry.label },
    });

    const shifts = [
      ...(entry.tarde ? ["TARDE"] : []),
      ...(entry.noche ? ["NOCHE"] : []),
    ];

    for (const type of shifts) {
      const existing = await db.shift.findUnique({
        where: { dayId_type: { dayId: day.id, type } },
      });
      if (!existing) {
        const shift = await db.shift.create({ data: { dayId: day.id, type } });
        await db.outfit.create({ data: { shiftId: shift.id } });
      }
    }

    // Remove shifts that were deactivated
    const toRemove = ["TARDE", "NOCHE"].filter((t) => !shifts.includes(t));
    for (const type of toRemove) {
      await db.shift.deleteMany({ where: { dayId: day.id, type } });
    }

    created.push(day);
  }

  return NextResponse.json({ created: created.length, days: created });
}

export async function DELETE() {
  await db.day.deleteMany({ where: { userId: DEFAULT_USER_ID } });
  return NextResponse.json({ ok: true });
}
