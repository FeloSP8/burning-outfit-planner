import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DayPlanner } from "@/components/planner/DayPlanner";
import { RangeSetup } from "@/components/planner/RangeSetup";
import { UserPhotoWidget } from "@/components/planner/UserPhotoWidget";
import { StyleStudio } from "@/components/planner/StyleStudio";
import type { Day, Garment, StyleLook } from "@/types";

export default async function PlannerPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const [rawDays, rawGarments, rawLooks] = await Promise.all([
    db.day.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
      include: {
        shifts: {
          orderBy: { type: "asc" },
          include: {
            outfit: {
              include: { items: { include: { garment: true } }, tryOn: true },
            },
          },
        },
      },
    }),
    db.garment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.styleLook.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const days = rawDays.map((d) => ({
    ...d,
    date: d.date.toISOString(),
    shifts: d.shifts.map((s) => ({
      ...s,
      outfit: s.outfit ? {
        ...s.outfit,
        updatedAt: s.outfit.updatedAt.toISOString(),
        tryOn: s.outfit.tryOn ? { ...s.outfit.tryOn, createdAt: s.outfit.tryOn.createdAt.toISOString() } : null,
        items: s.outfit.items.map((it) => ({
          ...it,
          garment: { ...it.garment, createdAt: it.garment.createdAt.toISOString() },
        })),
      } : null,
    })),
  })) as Day[];

  const garments = rawGarments.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })) as Garment[];
  const styleLooks = rawLooks.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })) as StyleLook[];
  const userPhotoUrl = user.photoUrl ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p
          className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Planificador
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Configura los días y asigna outfits por turno.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <section className="rounded-2xl border border-[#c4906a]/30 bg-[#f5e0b8]/50 p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#a07040]">
            Días del evento
          </p>
          <RangeSetup hasDays={days.length > 0} />
        </section>

        <section className="rounded-2xl border border-[#c4906a]/30 bg-[#f5e0b8]/50 p-5 flex flex-col gap-4 md:min-w-[280px]">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a07040]">
            Tu foto · Probador
          </p>
          {/* key: al cambiar la foto desde el estudio, el widget se remonta con la nueva */}
          <UserPhotoWidget key={userPhotoUrl ?? "sin-foto"} initialPhotoUrl={userPhotoUrl} initialName={user.name} />
        </section>
      </div>

      <StyleStudio userPhotoUrl={userPhotoUrl} initialLooks={styleLooks} />

      {days.length > 0 ? (
        <DayPlanner days={days} inventory={garments} userPhotoUrl={userPhotoUrl} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#c4906a]/30 py-16 text-center">
          <span className="text-5xl opacity-30">📅</span>
          <p className="text-sm font-medium text-[#a07040]">Configura el rango del evento para ver los días.</p>
        </div>
      )}
    </div>
  );
}
