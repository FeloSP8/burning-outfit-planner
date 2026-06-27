"use client";

import { useState, useEffect } from "react";

// 30 ago 2026 00:00 PDT (Reno, Nevada) = 07:00 UTC
const TARGET = new Date("2026-08-30T07:00:00Z").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function BurningCountdown() {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setDiff(Math.max(0, TARGET - Date.now()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (diff === null) return null;

  if (diff === 0) {
    return (
      <span className="text-xs font-black tracking-tight text-[#c84a10] uppercase">
        🔥 ¡Burning Man!
      </span>
    );
  }

  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[#c84a10]/30 bg-[#c84a10]/8 px-2.5 py-1">
      <span className="text-[10px] text-[#a05020] font-bold uppercase tracking-widest hidden sm:inline">
        Playa en
      </span>
      {[
        { v: d, u: "d" },
        { v: h, u: "h" },
        { v: m, u: "m" },
        { v: s, u: "s" },
      ].map(({ v, u }) => (
        <span key={u} className="flex items-baseline gap-0.5">
          <span className="text-sm font-black tabular-nums text-[#7a2e08]">{u === "d" ? d : pad(v)}</span>
          <span className="text-[9px] font-bold text-[#a07040] uppercase">{u}</span>
        </span>
      ))}
    </div>
  );
}
