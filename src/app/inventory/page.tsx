import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GarmentCard } from "@/components/inventory/GarmentCard";
import { GarmentFormModal } from "@/components/inventory/GarmentFormModal";
import { DownloadReportButton } from "@/components/inventory/DownloadReportButton";
import type { Garment } from "@/types";

const SLOTS: { key: string; icon: string; label: string }[] = [
  { key: "TOP",       icon: "👕", label: "Parte de arriba" },
  { key: "BOTTOM",    icon: "👖", label: "Parte de abajo" },
  { key: "SHOES",     icon: "👟", label: "Calzado" },
  { key: "ACCESSORY", icon: "🕶️", label: "Accesorios" },
  { key: "COAT",      icon: "🧥", label: "Abrigos" },
];

const BIKE_SLOTS: { key: string; icon: string; label: string }[] = [
  { key: "BIKE_ACCESSORY", icon: "🚲", label: "Accesorios bici" },
];

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const rawGarments = await db.garment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const garments = rawGarments.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })) as Garment[];
  const bySlot = garments.reduce<Record<string, Garment[]>>((acc, g) => {
    if (!acc[g.slot]) acc[g.slot] = [];
    acc[g.slot].push(g);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Inventario
          </p>
          <p className="mt-1 text-sm font-medium text-[#7a5030]">
            {garments.length} {garments.length === 1 ? "prenda" : "prendas"} registradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadReportButton />
          <GarmentFormModal />
        </div>
      </div>


      {/* Garments by slot */}
      {SLOTS.map(({ key, icon, label }) => {
        const items = bySlot[key] ?? [];
        return (
          <section key={key}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="text-xl">{icon}</span>
              <span className="text-lg font-black text-[#2a1a08] tracking-tight" style={{ fontFamily: "var(--font-body)" }}>
                {label}
              </span>
              <span className="rounded-full bg-[#8a5a20]/20 px-2 py-0.5 text-xs font-bold text-[#5a3010]">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[#8a5a20]/40 bg-[#c49050]/10 py-8">
                <p className="text-sm font-semibold text-[#6a3a10]">Sin prendas en esta categoría</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((g) => <GarmentCard key={g.id} garment={g} />)}
              </div>
            )}
          </section>
        );
      })}

      {/* Bike accessories — separate section, not used in outfits */}
      <div className="border-t-2 border-dashed border-[#8a5a20]/30 pt-8">
        <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a5a20]/60">
          No aparecen en los outfits
        </p>
        {BIKE_SLOTS.map(({ key, icon, label }) => {
          const items = bySlot[key] ?? [];
          return (
            <section key={key}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="text-xl">{icon}</span>
                <span className="text-lg font-black text-[#2a1a08] tracking-tight" style={{ fontFamily: "var(--font-body)" }}>
                  {label}
                </span>
                <span className="rounded-full bg-[#8a5a20]/20 px-2 py-0.5 text-xs font-bold text-[#5a3010]">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-[#8a5a20]/40 bg-[#c49050]/10 py-8">
                  <p className="text-sm font-semibold text-[#6a3a10]">Sin accesorios en esta categoría</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((g) => <GarmentCard key={g.id} garment={g} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
