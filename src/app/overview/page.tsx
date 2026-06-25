import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const SLOT_LABEL: Record<string, string> = {
  TOP: "Arriba", BOTTOM: "Abajo", SHOES: "Calzado", ACCESSORY: "Accesorios", COAT: "Abrigo",
};

const STATUS_STYLE: Record<string, string> = {
  COMPRADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  RECIBIDO: "bg-sky-100 text-sky-700 border-sky-200",
  PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
};

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const days = await db.day.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    include: {
      shifts: {
        orderBy: { type: "asc" },
        include: {
          outfit: {
            include: {
              tryOn: true,
              items: {
                include: { garment: true },
                orderBy: { id: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!days.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="text-5xl opacity-30">🗓️</span>
        <p className="text-base font-semibold text-[#7a5030]">
          No hay días configurados todavía.
        </p>
        <Link href="/planner"
          className="rounded-xl bg-[#c84a10] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#a83a08] transition-colors">
          Ir al Planificador
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 900 }}>
          Vista General
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Todos los outfits del evento de un vistazo.
        </p>
      </div>

      {/* Days grid */}
      <div className="flex flex-col gap-8">
        {days.map((day) => {
          const date = new Date(day.date);
          const dateLabel = date.toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
          });

          return (
            <div key={day.id}>
              {/* Day header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c84a10] shadow-md shadow-[#c84a10]/20">
                  <span className="text-sm font-black text-white">
                    {date.toLocaleDateString("es-ES", { day: "numeric", timeZone: "UTC" })}
                  </span>
                </div>
                <div>
                  <p className="text-base font-black capitalize text-[#2a1a08]">{dateLabel}</p>
                  <p className="text-xs font-semibold text-[#a07040]">{day.label}</p>
                </div>
              </div>

              {/* Shifts row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {day.shifts.map((shift) => {
                  const isNight  = shift.type === "NOCHE";
                  const outfit   = shift.outfit;
                  const tryOnUrl = outfit?.tryOn?.imageUrl ?? null;
                  const garments = outfit?.items.map((it) => it.garment) ?? [];
                  const hasItems = garments.length > 0;

                  return (
                    <div key={shift.id} className={`relative flex flex-col overflow-hidden rounded-2xl border-2 ${
                      isNight
                        ? "bg-[#0e0c20] border-[#2a2060]"
                        : "bg-[#fdf4e0] border-[#c4906a]/40"
                    }`}>

                      {/* Shift label */}
                      <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${
                        isNight ? "border-[#2a2060]" : "border-[#c4906a]/20"
                      }`}>
                        <span className="text-base">{isNight ? "🌙" : "☀️"}</span>
                        <span className={`text-sm font-black ${isNight ? "text-[#a098e0]" : "text-[#7a2e08]"}`}
                          style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                          {isNight ? "Noche" : "Tarde"}
                        </span>
                        {tryOnUrl && (
                          <span className="ml-auto rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ✓ Try-on
                          </span>
                        )}
                      </div>

                      <div className="flex gap-4 p-4">

                        {/* Try-on image or placeholder */}
                        <div className={`relative shrink-0 overflow-hidden rounded-xl ${
                          tryOnUrl ? "w-28 h-36" : "w-20 h-28"
                        } ${isNight ? "bg-white/5" : "bg-[#c4906a]/10"} flex items-center justify-center`}>
                          {tryOnUrl ? (
                            <Image src={tryOnUrl} alt="Try-on" fill className="object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                              <span className="text-2xl opacity-30">🧍</span>
                              <span className={`text-[10px] font-semibold leading-tight ${
                                isNight ? "text-[#4a4070]" : "text-[#c4906a]/60"
                              }`}>
                                {hasItems ? "Sin try-on" : "Sin outfit"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Garment list */}
                        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                          {hasItems ? (
                            garments.map((g) => (
                              <div key={g.id} className="flex items-center gap-2 min-w-0">
                                {/* Garment photo thumbnail */}
                                <div className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg ${
                                  isNight ? "bg-white/10" : "bg-[#c4906a]/20"
                                } flex items-center justify-center`}>
                                  {g.photoUrl ? (
                                    <Image src={g.photoUrl} alt={g.name} fill className="object-cover" />
                                  ) : (
                                    <span className="text-xs">
                                      {{ TOP: "👕", BOTTOM: "👖", SHOES: "👟", ACCESSORY: "🕶️", COAT: "🧥" }[g.slot] ?? "🧣"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col min-w-0">
                                  <span className={`text-xs font-bold truncate leading-tight ${
                                    isNight ? "text-[#d8d0f0]" : "text-[#2a1a08]"
                                  }`}>{g.name}</span>
                                  <span className={`text-[10px] font-medium ${
                                    isNight ? "text-[#6a6090]" : "text-[#a07040]"
                                  }`}>{SLOT_LABEL[g.slot] ?? g.slot}</span>
                                </div>
                                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  STATUS_STYLE[g.status] ?? ""
                                }`}>
                                  {g.status === "COMPRADO" ? "✓" : g.status === "RECIBIDO" ? "↓" : "…"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex h-full items-center">
                              <Link href="/planner"
                                className={`text-xs font-semibold underline underline-offset-2 ${
                                  isNight ? "text-[#4a4070] hover:text-[#8a80c0]" : "text-[#c4906a]/60 hover:text-[#c84a10]"
                                } transition-colors`}>
                                + Asignar outfit
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* If has try-on, show link to regenerate */}
                      {hasItems && (
                        <div className={`border-t px-4 py-2 flex items-center justify-between ${
                          isNight ? "border-[#2a2060]" : "border-[#c4906a]/15"
                        }`}>
                          <span className={`text-[10px] font-semibold ${
                            isNight ? "text-[#4a4070]" : "text-[#c4906a]/60"
                          }`}>
                            {garments.length} {garments.length === 1 ? "prenda" : "prendas"}
                          </span>
                          {!tryOnUrl && (
                            <Link href="/planner"
                              className={`text-[10px] font-bold transition-colors ${
                                isNight ? "text-[#6a60b0] hover:text-[#a098e0]" : "text-[#c84a10]/70 hover:text-[#c84a10]"
                              }`}>
                              Generar try-on →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
