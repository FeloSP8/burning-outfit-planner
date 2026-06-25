import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [dayCount, garmentCount] = user
    ? await Promise.all([
        db.day.count({ where: { userId: user.id } }).catch(() => 0),
        db.garment.count({ where: { userId: user.id } }).catch(() => 0),
      ])
    : [0, 0];

  return (
    <div className="relative flex flex-col items-center justify-center gap-14 py-20 text-center">

      {/* Hero */}
      <div className="flex flex-col items-center gap-5">
        <p
          className="text-7xl md:text-9xl leading-none text-[#7a2e08]"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 900 }}
        >
          Burn<br />Outfits
        </p>
        <p className="max-w-xs text-sm font-medium text-[#7a5030] leading-relaxed">
          Planifica tu vestuario día a día.<br />
          <span className="text-[#b04010] font-semibold">Tarde de polvo y sol.</span>
          {" · "}
          <span className="text-[#3a2870] font-semibold">Noche de playa y frío.</span>
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-0 rounded-2xl border border-[#c4906a]/40 bg-[#f5e0b8]/60 overflow-hidden shadow-sm">
        <StatCell value={dayCount}     label="días"    accent="text-[#c84a10]" />
        <div className="w-px self-stretch bg-[#c4906a]/30" />
        <StatCell value={garmentCount} label="prendas" accent="text-[#4a2890]" />
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/planner"
          className="rounded-xl bg-[#c84a10] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c84a10]/30 hover:bg-[#a83a08] transition-all"
        >
          ☀️ · 🌙 &nbsp; Planificador
        </Link>
        <Link
          href="/inventory"
          className="rounded-xl border-2 border-[#c4906a]/50 bg-[#f5e0b8]/40 px-8 py-3.5 text-sm font-bold text-[#6a3a10] hover:bg-[#f5e0b8]/80 transition-all"
        >
          👕 &nbsp; Inventario
        </Link>
      </div>

      {/* Quick guide */}
      <div className="grid gap-3 sm:grid-cols-3 text-left max-w-2xl w-full">
        {[
          { n: "01", title: "Sube tu foto", desc: "Una foto de cuerpo completo en el Planificador." },
          { n: "02", title: "Añade prendas", desc: "Registra cada prenda con foto y estado de compra." },
          { n: "03", title: "Prueba el outfit", desc: "El probador virtual te muestra cómo quedarás." },
        ].map(({ n, title, desc }) => (
          <div key={n} className="rounded-xl border border-[#c4906a]/30 bg-[#f5e0b8]/50 p-4 flex flex-col gap-2">
            <span className="text-2xl font-black text-[#c4906a]/50" style={{ fontFamily: "var(--font-display)" }}>
              {n}
            </span>
            <p className="text-sm font-bold text-[#4a2a08]">{title}</p>
            <p className="text-xs text-[#7a5030] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCell({ value, label, accent }: { value: number; label: string; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-10 py-5">
      <span className={`text-4xl font-black tabular-nums ${accent}`}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a07040]">{label}</span>
    </div>
  );
}
