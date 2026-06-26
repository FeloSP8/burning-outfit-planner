import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, ownsOutfit } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id: outfitId } = await params;

  if (!(await ownsOutfit(outfitId, user.id)))
    return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });

  const { targetDayId } = await req.json();
  if (!targetDayId) return NextResponse.json({ error: "Falta targetDayId" }, { status: 400 });

  const outfit = await db.outfit.findUnique({
    where: { id: outfitId },
    include: { items: true, tryOn: true, shift: true },
  });
  if (!outfit) return NextResponse.json({ error: "Outfit no encontrado" }, { status: 404 });

  if (outfit.shift.dayId === targetDayId)
    return NextResponse.json({ error: "Ya está en ese día" }, { status: 400 });

  const targetShift = await db.shift.findUnique({
    where: { dayId_type: { dayId: targetDayId, type: outfit.shift.type } },
    include: { outfit: { include: { items: true, tryOn: true } }, day: true },
  });

  if (!targetShift)
    return NextResponse.json({ error: "El día destino no tiene ese turno" }, { status: 400 });

  if (targetShift.day.userId !== user.id)
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  if (!targetShift.outfit)
    return NextResponse.json({ error: "El turno destino no tiene outfit" }, { status: 400 });

  const sourceId = outfit.id;
  const targetId = targetShift.outfit.id;
  const sourceGarments = outfit.items.map((i) => i.garmentId);
  const targetGarments = targetShift.outfit.items.map((i) => i.garmentId);
  const sourceShared = outfit.shared;
  const targetShared = targetShift.outfit.shared;
  const sourceTryOn = outfit.tryOn;
  const targetTryOn = targetShift.outfit.tryOn;

  await db.$transaction(async (tx) => {
    await tx.outfitItem.deleteMany({ where: { outfitId: { in: [sourceId, targetId] } } });
    await tx.tryOnResult.deleteMany({ where: { outfitId: { in: [sourceId, targetId] } } });

    if (targetGarments.length > 0) {
      await tx.outfitItem.createMany({
        data: targetGarments.map((garmentId) => ({ outfitId: sourceId, garmentId })),
      });
    }
    if (sourceGarments.length > 0) {
      await tx.outfitItem.createMany({
        data: sourceGarments.map((garmentId) => ({ outfitId: targetId, garmentId })),
      });
    }

    if (sourceTryOn) {
      await tx.tryOnResult.create({
        data: { outfitId: targetId, imageUrl: sourceTryOn.imageUrl, userPhoto: sourceTryOn.userPhoto },
      });
    }
    if (targetTryOn) {
      await tx.tryOnResult.create({
        data: { outfitId: sourceId, imageUrl: targetTryOn.imageUrl, userPhoto: targetTryOn.userPhoto },
      });
    }

    await tx.outfit.update({ where: { id: sourceId }, data: { shared: targetShared } });
    await tx.outfit.update({ where: { id: targetId }, data: { shared: sourceShared } });
  });

  return NextResponse.json({ ok: true });
}
