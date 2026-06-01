"use client";

import { useState } from "react";
import { ShiftCard } from "./ShiftCard";
import type { Day, Garment } from "@/types";

export function DayPlanner({ days, inventory, userPhotoUrl }: {
  days: Day[];
  inventory: Garment[];
  userPhotoUrl: string | null;
}) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const activeDay = days.find((d) => d.id === activeDayId);

  return (
    <div className="flex flex-col gap-6">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const date = new Date(d.date);
          const isActive = d.id === activeDayId;
          const label = d.label ?? `Día ${date.getUTCDate()}`;
          const sub = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
          const shifts = d.shifts.map((s) => s.type);

          return (
            <button
              key={d.id}
              onClick={() => setActiveDayId(d.id)}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 transition-all border-2 ${
                isActive
                  ? "bg-[#c84a10] border-[#c84a10] text-white shadow-lg shadow-[#c84a10]/30"
                  : "bg-[#f5e0b8]/60 border-[#c4906a]/30 text-[#7a4a20] hover:bg-[#f5e0b8] hover:border-[#c4906a]/60"
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wide">{label}</span>
              <span className={`text-[10px] font-medium ${isActive ? "opacity-75" : "opacity-60"}`}>{sub}</span>
              <div className="mt-1 flex gap-1">
                {shifts.includes("TARDE") && <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white/80" : "bg-amber-500"}`} />}
                {shifts.includes("NOCHE") && <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white/80" : "bg-indigo-400"}`} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Shifts */}
      {activeDay && (
        <div className="grid gap-5 md:grid-cols-2">
          {(["TARDE", "NOCHE"] as const).map((type) => {
            const shift = activeDay.shifts.find((s) => s.type === type);
            if (!shift) return null;
            return (
              <ShiftCard key={shift.id} shift={shift} inventory={inventory} requireCoat={type === "NOCHE"} userPhotoUrl={userPhotoUrl} />
            );
          })}
        </div>
      )}
    </div>
  );
}
