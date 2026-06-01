"use client";

import { useState } from "react";
import type { AISuggestion } from "@/types";

export function SuggestButton() {
  const [loading, setSaving]         = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null);
  const [error, setError]             = useState<string | null>(null);

  async function generate() {
    setSaving(true);
    setError(null);
    const res  = await fetch("/api/ai/suggest", { method: "POST" });
    const data = await res.json();
    setSaving(false);
    if (data.suggestions) setSuggestions(data.suggestions);
    else setError(data.error ?? "Error desconocido");
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-[#4a2890] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#4a2890]/20 hover:bg-[#3a1878] disabled:opacity-40 transition-all"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Generando ideas…
          </>
        ) : "✨  Sugerir combinaciones con IA"}
      </button>

      {error && (
        <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {suggestions && (
        <div className="flex flex-col gap-3">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border-2 border-[#4a2890]/20 bg-[#f0eaff] p-4">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="font-black text-[#2a1a08]">{s.title}</span>
                <span className={`rounded-full border-2 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  s.shift === "NOCHE"
                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>{s.shift}</span>
              </div>
              <p className="text-xs font-medium text-[#5a3a70] leading-relaxed">{s.rationale}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
