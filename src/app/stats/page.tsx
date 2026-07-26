import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const SLOTS = [
  { key: "TOP",            label: "Parte de arriba", icon: "👕" },
  { key: "BOTTOM",         label: "Parte de abajo",  icon: "👖" },
  { key: "SHOES",          label: "Calzado",          icon: "👟" },
  { key: "ACCESSORY",      label: "Accesorios",       icon: "🕶️" },
  { key: "COAT",           label: "Abrigo",           icon: "🧥" },
  { key: "BIKE_ACCESSORY", label: "Accesorio bici",   icon: "🚲" },
];

const SLOT_ICON: Record<string, string> = Object.fromEntries(SLOTS.map((s) => [s.key, s.icon]));
const SLOT_LABEL: Record<string, string> = Object.fromEntries(SLOTS.map((s) => [s.key, s.label]));

function eur(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function pct(n: number, total: number) {
  return total === 0 ? "—" : Math.round((n / total) * 100) + "%";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl tracking-tight text-[#7a2e08]"
        style={{ fontFamily: "var(--font-display)" }}>
      {children}
    </h2>
  );
}

function Card({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border-2 px-4 py-4 ${accent ?? "border-[#c4906a]/30 bg-[#f5e8cc]/70"}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">{label}</span>
      <span className="text-2xl font-black text-[#2a1a08] leading-tight">{value}</span>
      {sub && <span className="text-xs font-medium text-[#a07040]">{sub}</span>}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#c4906a]/20">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const users = await db.user.findMany({
    include: {
      garments: {
        select: { id: true, slot: true, status: true, price: true, name: true, photoUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Solo usuarios con al menos una prenda
  const activeUsers = users.filter((u) => u.garments.length > 0);

  type G = { id: string; slot: string; status: string; price: number | null; name: string; photoUrl: string | null; userName: string };
  const all: G[] = users.flatMap((u) => u.garments.map((g) => ({ ...g, userName: u.name })));

  const priced = all.filter((g) => g.price !== null);
  const prices = priced.map((g) => g.price as number);

  const totalSpent    = all.filter((g) => g.status !== "PENDIENTE").reduce((s, g) => s + (g.price ?? 0), 0);
  const totalPending  = all.filter((g) => g.status === "PENDIENTE").reduce((s, g) => s + (g.price ?? 0), 0);
  const avgPrice      = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const maxPrice      = prices.length ? Math.max(...prices) : 0;
  const minPrice      = prices.length ? Math.min(...prices.filter((p) => p > 0)) : 0;
  const withPhoto     = all.filter((g) => g.photoUrl).length;

  const statusCounts = {
    COMPRADO: all.filter((g) => g.status === "COMPRADO").length,
    RECIBIDO: all.filter((g) => g.status === "RECIBIDO").length,
    PENDIENTE: all.filter((g) => g.status === "PENDIENTE").length,
  };

  // Per user
  const userStats = activeUsers.map((u) => {
    const gs = u.garments;
    const spent   = gs.filter((g) => g.status !== "PENDIENTE").reduce((s, g) => s + (g.price ?? 0), 0);
    const toPay   = gs.filter((g) => g.status === "PENDIENTE").reduce((s, g) => s + (g.price ?? 0), 0);
    const pricedG = gs.filter((g) => g.price !== null);
    const maxG    = pricedG.length ? pricedG.reduce((a, b) => (a.price! > b.price! ? a : b)) : null;
    const avgG    = pricedG.length ? pricedG.reduce((s, g) => s + g.price!, 0) / pricedG.length : 0;
    return {
      name: u.name,
      total: gs.length,
      comprado: gs.filter((g) => g.status === "COMPRADO").length,
      recibido: gs.filter((g) => g.status === "RECIBIDO").length,
      pendiente: gs.filter((g) => g.status === "PENDIENTE").length,
      spent,
      toPay,
      maxG,
      avgG,
    };
  }).sort((a, b) => b.total - a.total);

  // Per slot
  const slotStats = SLOTS.map(({ key, label, icon }) => {
    const gs = all.filter((g) => g.slot === key);
    const p  = gs.filter((g) => g.price !== null).map((g) => g.price as number);
    return {
      key, label, icon,
      count: gs.length,
      avg:   p.length ? p.reduce((a, b) => a + b, 0) / p.length : null,
      max:   p.length ? Math.max(...p) : null,
      min:   p.length ? Math.min(...p.filter((x) => x > 0)) : null,
      total: gs.reduce((s, g) => s + (g.price ?? 0), 0),
    };
  }).sort((a, b) => b.count - a.count);

  // Per slot per user
  const crossStats = activeUsers.map((u) => ({
    name: u.name,
    slots: Object.fromEntries(
      SLOTS.map(({ key }) => [key, u.garments.filter((g) => g.slot === key).length])
    ),
  }));

  // Top expensive
  const topExpensive = [...all]
    .filter((g) => g.price !== null && g.price > 0)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, 10);

  const maxSlotCount = Math.max(...slotStats.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-10">

      {/* Título */}
      <div>
        <h1 className="text-4xl text-[#7a2e08] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}>
          Estadísticas
        </h1>
        <p className="mt-1 text-sm font-medium text-[#a07040]">
          {activeUsers.length} persona{activeUsers.length !== 1 ? "s" : ""} · {all.length} prendas registradas
        </p>
      </div>

      {/* ── Resumen global ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Resumen global</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Total prendas"  value={all.length} sub={`${withPhoto} con foto (${pct(withPhoto, all.length)})`} />
          <Card label="Ya gastado"     value={eur(totalSpent)}   sub="comprado + recibido" accent="border-emerald-200 bg-emerald-50/60" />
          <Card label="Por gastar"     value={eur(totalPending)} sub="prendas pendientes"  accent="border-amber-200 bg-amber-50/60" />
          <Card label="Precio medio"   value={eur(avgPrice)}     sub={`máx ${eur(maxPrice)} · mín ${eur(minPrice)}`} />
        </div>
      </section>

      {/* ── Estado de las prendas ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Estado del armario</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "COMPRADO", label: "Compradas",  color: "bg-emerald-500", text: "text-emerald-700", bg: "border-emerald-200 bg-emerald-50/60" },
            { key: "RECIBIDO", label: "Recibidas",  color: "bg-sky-500",     text: "text-sky-700",     bg: "border-sky-200 bg-sky-50/60" },
            { key: "PENDIENTE",label: "Pendientes", color: "bg-amber-500",   text: "text-amber-700",   bg: "border-amber-200 bg-amber-50/60" },
          ].map(({ key, label, color, text, bg }) => {
            const n = statusCounts[key as keyof typeof statusCounts];
            return (
              <div key={key} className={`flex flex-col gap-2 rounded-2xl border-2 px-4 py-4 ${bg}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${text}`}>{label}</span>
                <span className={`text-3xl font-black ${text}`}>{n}</span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div className={`h-full rounded-full ${color}`} style={{ width: pct(n, all.length) }} />
                </div>
                <span className="text-xs font-semibold text-[#a07040]">{pct(n, all.length)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Por persona ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Por persona</SectionTitle>
        <div className="flex flex-col gap-3">
          {userStats.map((u) => (
            <div key={u.name} className="rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e8cc]/70 p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-base font-black text-[#2a1a08]">{u.name}</span>
                <span className="text-sm font-bold text-[#c84a10]">{u.total} prendas</span>
              </div>

              {/* Status pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {u.comprado} compradas
                </span>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                  {u.recibido} recibidas
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  {u.pendiente} pendientes
                </span>
              </div>

              {/* Money */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Gastado</span>
                  <span className="text-base font-black text-emerald-700">{eur(u.spent)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Por gastar</span>
                  <span className="text-base font-black text-amber-600">{eur(u.toPay)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Precio medio</span>
                  <span className="text-base font-black text-[#2a1a08]">{u.avgG > 0 ? eur(u.avgG) : "—"}</span>
                </div>
              </div>

              {u.maxG && (
                <p className="mt-2 text-xs font-medium text-[#7a4a20]">
                  Prenda más cara: <span className="font-bold">{u.maxG.name}</span> — {eur(u.maxG.price!)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Por tipo de prenda ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Por tipo de prenda</SectionTitle>
        <div className="flex flex-col gap-2">
          {slotStats.map((s) => (
            <div key={s.key} className="rounded-xl border-2 border-[#c4906a]/25 bg-[#f5e8cc]/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{s.icon}</span>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-[#2a1a08] truncate">{s.label}</span>
                    <span className="shrink-0 text-sm font-black text-[#c84a10]">{s.count}</span>
                  </div>
                  <Bar value={s.count} max={maxSlotCount} color="bg-[#c84a10]" />
                </div>
              </div>
              {s.count > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 pl-9">
                  {s.avg  !== null && <span className="text-[11px] text-[#a07040] font-semibold">Media: <b className="text-[#2a1a08]">{eur(s.avg)}</b></span>}
                  {s.max  !== null && <span className="text-[11px] text-[#a07040] font-semibold">Máx: <b className="text-[#2a1a08]">{eur(s.max)}</b></span>}
                  {s.min  !== null && <span className="text-[11px] text-[#a07040] font-semibold">Mín: <b className="text-[#2a1a08]">{eur(s.min)}</b></span>}
                  {s.total > 0     && <span className="text-[11px] text-[#a07040] font-semibold">Total: <b className="text-[#2a1a08]">{eur(s.total)}</b></span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Por tipo y persona ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Prendas por tipo y persona</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border-2 border-[#c4906a]/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c4906a]/20 bg-[#f5e0b8]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Persona</th>
                {SLOTS.map((s) => (
                  <th key={s.key} className="px-3 py-3 text-center text-base" title={s.label}>{s.icon}</th>
                ))}
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Total</th>
              </tr>
            </thead>
            <tbody>
              {crossStats.map((u, i) => (
                <tr key={u.name} className={i % 2 === 0 ? "bg-[#f5e8cc]/60" : "bg-[#f5e8cc]/30"}>
                  <td className="px-4 py-3 font-bold text-[#2a1a08] whitespace-nowrap">{u.name}</td>
                  {SLOTS.map((s) => (
                    <td key={s.key} className="px-3 py-3 text-center font-semibold text-[#2a1a08]">
                      {u.slots[s.key] || <span className="text-[#c4906a]/40">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-black text-[#c84a10]">
                    {Object.values(u.slots).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-[#c4906a]/30 bg-[#f5e0b8] font-black">
                <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#a07040]">Total</td>
                {SLOTS.map((s) => (
                  <td key={s.key} className="px-3 py-3 text-center text-[#c84a10]">
                    {all.filter((g) => g.slot === s.key).length || <span className="text-[#c4906a]/40">—</span>}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-[#c84a10]">{all.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Top prendas más caras ──────────────────────────────────── */}
      {topExpensive.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle>Top prendas más caras</SectionTitle>
          <div className="flex flex-col gap-2">
            {topExpensive.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 rounded-xl border-2 border-[#c4906a]/25 bg-[#f5e8cc]/60 px-4 py-3">
                <span className="shrink-0 w-6 text-center text-sm font-black text-[#c4906a]">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className="text-lg shrink-0">{SLOT_ICON[g.slot] ?? "👗"}</span>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="truncate text-sm font-bold text-[#2a1a08]">{g.name}</span>
                  <span className="text-[11px] font-semibold text-[#a07040]">{g.userName} · {SLOT_LABEL[g.slot]}</span>
                </div>
                <span className="shrink-0 text-base font-black text-[#c84a10]">{eur(g.price!)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Máximos, mínimos y medias globales ────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Máximos, mínimos y medias</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e8cc]/70 px-4 py-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Precio máximo</span>
            <span className="text-2xl font-black text-[#c84a10]">{eur(maxPrice)}</span>
            {topExpensive[0] && (
              <span className="text-xs font-medium text-[#7a4a20]">{topExpensive[0].name} ({topExpensive[0].userName})</span>
            )}
          </div>
          <div className="rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e8cc]/70 px-4 py-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Precio medio</span>
            <span className="text-2xl font-black text-[#2a1a08]">{eur(avgPrice)}</span>
            <span className="text-xs font-medium text-[#7a4a20]">sobre {priced.length} prendas con precio</span>
          </div>
          <div className="rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e8cc]/70 px-4 py-4 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Precio mínimo</span>
            <span className="text-2xl font-black text-emerald-700">{eur(minPrice)}</span>
            {(() => {
              const cheapest = all.filter((g) => g.price !== null && g.price > 0).sort((a, b) => a.price! - b.price!)[0];
              return cheapest ? (
                <span className="text-xs font-medium text-[#7a4a20]">{cheapest.name} ({cheapest.userName})</span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Medias por tipo */}
        <div className="overflow-x-auto rounded-2xl border-2 border-[#c4906a]/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c4906a]/20 bg-[#f5e0b8]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Tipo</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Uds.</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Mín</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Media</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Máx</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Total</th>
              </tr>
            </thead>
            <tbody>
              {slotStats.filter((s) => s.count > 0).map((s, i) => (
                <tr key={s.key} className={i % 2 === 0 ? "bg-[#f5e8cc]/60" : "bg-[#f5e8cc]/30"}>
                  <td className="px-4 py-3 font-semibold text-[#2a1a08]">
                    <span className="mr-1.5">{s.icon}</span>{s.label}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#c84a10]">{s.count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#2a1a08]">{s.min !== null ? eur(s.min) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#2a1a08]">{s.avg !== null ? eur(s.avg) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#2a1a08]">{s.max !== null ? eur(s.max) : "—"}</td>
                  <td className="px-4 py-3 text-right font-black text-[#c84a10]">{s.total > 0 ? eur(s.total) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
