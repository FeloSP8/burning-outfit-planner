"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DayConfig = { date: string; label: string; tarde: boolean; noche: boolean };

function buildDayList(start: string, end: string): DayConfig[] {
  const days: DayConfig[] = [];
  const current = new Date(start + "T12:00:00Z");
  const endDate = new Date(end + "T12:00:00Z");
  let idx = 1;
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const isFirst = idx === 1;
    const isLast  = current.toDateString() === endDate.toDateString();
    days.push({ date: dateStr, label: `Día ${idx}`, tarde: !isFirst, noche: !isLast });
    current.setUTCDate(current.getUTCDate() + 1);
    idx++;
  }
  return days;
}

export function RangeSetup({ hasDays }: { hasDays: boolean }) {
  const router = useRouter();
  const [start, setStart]       = useState("2026-08-30");
  const [end, setEnd]           = useState("2026-09-07");
  const [days, setDays]         = useState<DayConfig[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!start || !end || start > end) return;
    setDays(buildDayList(start, end));
  }, [start, end]);

  function toggleShift(idx: number, shift: "tarde" | "noche") {
    setDays((prev) => prev.map((d, i) => {
      if (i !== idx) return d;
      return { ...d, [shift]: !d[shift] };
    }));
  }

  function updateLabel(idx: number, label: string) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, label } : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const valid = days.filter((d) => d.tarde || d.noche);
    if (!valid.length) { setError("Activa al menos un turno."); return; }
    setSaving(true);
    await fetch("/api/days/range", { method: "DELETE" });
    const res = await fetch("/api/days/range", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: valid }),
    });
    setSaving(false);
    if (!res.ok) { setError("Error al guardar."); return; }
    router.refresh();
  }

  const shiftCount = days.reduce((n, d) => n + (d.tarde ? 1 : 0) + (d.noche ? 1 : 0), 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateField label="Inicio" value={start} onChange={setStart} />
        <span className="pb-2.5 text-[#a07040] font-bold">→</span>
        <DateField label="Fin"    value={end}   onChange={setEnd}   />
        {days.length > 0 && (
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border-2 border-[#c4906a]/40 bg-[#f5e0b8]/60 px-3 py-2 text-xs font-bold text-[#7a4a20] hover:bg-[#f5e0b8] transition-colors">
            {expanded ? "▲ ocultar" : `▼ ${days.length} días`}
          </button>
        )}
      </div>

      {expanded && days.length > 0 && (
        <div className="overflow-hidden rounded-xl border-2 border-[#c4906a]/30 bg-[#fdf4e0]">
          <div className="grid grid-cols-[1fr_2fr_auto_auto] items-center gap-4 border-b-2 border-[#c4906a]/20 bg-[#f5e0b8] px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Fecha</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Etiqueta</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 text-center">☀️ Tarde</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 text-center">🌙 Noche</span>
          </div>

          {days.map((d, i) => {
            const isActive = d.tarde || d.noche;
            return (
              <div key={d.date} className={`grid grid-cols-[1fr_2fr_auto_auto] items-center gap-4 border-b border-[#c4906a]/15 px-4 py-2.5 last:border-0 hover:bg-[#f5e0b8]/60 transition-all duration-200 ${!isActive ? "opacity-40 bg-[#7a4a20]/5" : ""}`}>
                <span className={`text-xs font-semibold text-[#7a5030] whitespace-nowrap tabular-nums transition-all ${!isActive ? "line-through opacity-50" : ""}`}>
                  {new Date(d.date + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <input
                  value={d.label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  disabled={!isActive}
                  className={`rounded-lg border-2 border-[#c4906a]/30 bg-[#f5e8cc] px-2.5 py-1.5 text-xs font-semibold text-[#2a1a08] focus:border-[#c84a10]/50 focus:outline-none transition-all ${!isActive ? "opacity-40 cursor-not-allowed border-[#c4906a]/10" : ""}`}
                />
                <div className="flex justify-center"><Toggle active={d.tarde} onToggle={() => toggleShift(i, "tarde")} color="amber" /></div>
                <div className="flex justify-center"><Toggle active={d.noche} onToggle={() => toggleShift(i, "noche")} color="indigo" /></div>
              </div>
            );
          })}

          <div className="border-t border-[#c4906a]/20 bg-[#f5e0b8]/50 px-4 py-2 text-[10px] font-bold text-[#a07040]">
            {days.length} días · {shiftCount} turnos
          </div>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !days.length}
          className="rounded-xl bg-[#c84a10] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#c84a10]/20 hover:bg-[#a83a08] disabled:opacity-40 transition-all"
        >
          {saving ? "Guardando…" : hasDays ? "Reconfigurar" : "Configurar días"}
        </button>
        {hasDays && !saving && (
          <span className="text-[11px] font-medium text-[#a07040]">Borrará la config actual</span>
        )}
      </div>
    </form>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-2 border-[#c4906a]/40 bg-[#f5e8cc] px-3.5 py-2 text-sm font-semibold text-[#2a1a08] focus:border-[#c84a10]/60 focus:outline-none transition-colors"
      />
    </div>
  );
}

function Toggle({ active, onToggle, color }: { active: boolean; onToggle: () => void; color: "amber" | "indigo" }) {
  const track = active
    ? color === "amber" ? "bg-amber-500 border-amber-400" : "bg-indigo-500 border-indigo-400"
    : "bg-[#c4906a]/20 border-[#c4906a]/40";
  return (
    <button type="button" onClick={onToggle} aria-pressed={active}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-all focus:outline-none ${track}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
