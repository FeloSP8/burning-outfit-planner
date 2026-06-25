import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const SLOT_LABEL: Record<string, string> = {
  TOP: "Arriba", BOTTOM: "Abajo", SHOES: "Calzado", ACCESSORY: "Accesorios", COAT: "Abrigo", BIKE_ACCESSORY: "Bici",
};
const SLOT_ICON: Record<string, string> = {
  TOP: "👕", BOTTOM: "👖", SHOES: "👟", ACCESSORY: "🕶️", COAT: "🧥", BIKE_ACCESSORY: "🚲",
};

function formatPrice(price: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(price);
}

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
    },
  });

  const wall = outfits.filter((o) => o.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <p className="text-5xl text-[#7a2e08] leading-tight"
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wall.map((o) => {
            const isNight  = o.shift.type === "NOCHE";
            const tryOnUrl = o.tryOn?.imageUrl ?? null;
            const date     = new Date(o.shift.day.date);
            const dateLabel = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });

            return (
              <div key={o.id} className={`flex flex-col overflow-hidden rounded-2xl border-2 ${
                isNight ? "bg-[#0e0c20] border-[#2a2060]" : "bg-[#fdf4e0] border-[#c4906a]/40"
              }`}>

                {/* Header: autor + turno */}
                <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${
                  isNight ? "border-[#2a2060]" : "border-[#c4906a]/20"
                }`}>
                  <span className="text-base">{isNight ? "🌙" : "☀️"}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-black leading-tight truncate ${isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
                      {o.shift.day.user.name}
                    </span>
                    <span className={`text-[10px] font-semibold ${isNight ? "text-[#6a6090]" : "text-[#a07040]"}`}>
                      {isNight ? "Noche" : "Tarde"} · {dateLabel}{o.shift.day.label ? ` · ${o.shift.day.label}` : ""}
                    </span>
                  </div>
                </div>

                {/* Try-on grande si existe */}
                {tryOnUrl && (
                  <div className={`relative h-72 w-full ${isNight ? "bg-white/5" : "bg-[#c4906a]/10"}`}>
                    <Image src={tryOnUrl} alt={`Outfit de ${o.shift.day.user.name}`} fill className="object-contain" />
                  </div>
                )}

                {/* Lista de prendas con link de compra */}
                <div className="flex flex-col gap-2 p-4">
                  {o.items.map((it) => {
                    const g = it.garment;
                    const price = formatPrice(g.price);
                    return (
                      <div key={it.id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                        isNight ? "bg-white/5" : "bg-[#c4906a]/10"
                      }`}>
                        {/* Miniatura */}
                        <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg flex items-center justify-center ${
                          isNight ? "bg-white/10" : "bg-[#c4906a]/20"
                        }`}>
                          {g.photoUrl
                            ? <Image src={g.photoUrl} alt={g.name} fill className="object-cover" />
                            : <span className="text-lg">{SLOT_ICON[g.slot] ?? "🧣"}</span>}
                        </div>

                        {/* Nombre + categoría + precio */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <span className={`text-xs font-bold leading-tight truncate ${isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"}`}>
                            {g.name}
                          </span>
                          <span className={`text-[10px] font-medium ${isNight ? "text-[#6a6090]" : "text-[#a07040]"}`}>
                            {SLOT_LABEL[g.slot] ?? g.slot}{price ? ` · ${price}` : ""}
                          </span>
                        </div>

                        {/* Link de compra (lo vital) */}
                        {g.purchaseUrl ? (
                          <a
                            href={g.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors ${
                              isNight ? "bg-[#4a38c0] hover:bg-[#5a48d0]" : "bg-[#c84a10] hover:bg-[#a83a08]"
                            }`}
                          >
                            Comprar ↗
                          </a>
                        ) : (
                          <span className={`shrink-0 text-[10px] font-medium italic ${isNight ? "text-[#4a4070]" : "text-[#c4906a]/70"}`}>
                            sin link
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
