import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { WallClient } from "@/components/wall/WallClient";
import type { WallOutfit, Garment } from "@/types";

export default async function WallPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const outfits = await db.outfit.findMany({
    where: { shared: true },
    orderBy: { updatedAt: "desc" },
    include: {
      tryOn: true,
      items: { include: { garment: true }, orderBy: { id: "asc" } },
      shift: { include: { day: { include: { user: true } } } },
      reactions: { include: { user: { select: { name: true } } } },
    },
  });

  const wall: WallOutfit[] = outfits
    .filter((o) => o.items.length > 0)
    .map((o) => {
      // Agrupar reacciones por emoji
      const byEmoji = new Map<string, { count: number; mine: boolean; who: string[] }>();
      for (const r of o.reactions) {
        const e = byEmoji.get(r.emoji) ?? { count: 0, mine: false, who: [] };
        e.count++;
        e.who.push(r.user.name);
        if (r.userId === user.id) e.mine = true;
        byEmoji.set(r.emoji, e);
      }
      const reactions = Array.from(byEmoji.entries())
        .map(([emoji, v]) => ({ emoji, ...v }))
        .sort((a, b) => b.count - a.count);

      return {
        id: o.id,
        authorName: o.shift.day.user.name,
        shiftType: o.shift.type as WallOutfit["shiftType"],
        date: o.shift.day.date.toISOString(),
        dayLabel: o.shift.day.label,
        tryOnUrl: o.tryOn?.imageUrl ?? null,
        items: o.items.map((it) => ({
          id: it.id,
          garment: { ...it.garment, createdAt: it.garment.createdAt.toISOString() } as Garment,
        })),
        reactions,
        favoriteCount: o.reactions.filter((r) => r.emoji === "⭐").length,
      };
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 900 }}>
          Muro de outfits
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Outfits que la gente ha compartido. Sigue el link de cada prenda para comprar la misma.
        </p>
      </div>

      {wall.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="text-5xl opacity-30">🧵</span>
          <p className="text-base font-semibold text-[#7a5030]">
            Todavía no hay outfits compartidos.
          </p>
          <p className="text-sm text-[#a07040]">
            Activa el toggle “Compartir en el muro” en el Planificador para publicar el tuyo.
          </p>
          <Link href="/planner"
            className="rounded-xl bg-[#c84a10] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#a83a08] transition-colors">
            Ir al Planificador
          </Link>
        </div>
      ) : (
        <WallClient outfits={wall} />
      )}
    </div>
  );
}
