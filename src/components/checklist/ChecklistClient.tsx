"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistItemData, ChecklistType } from "@/types";

export function ChecklistClient({
  initialItems,
  isAdmin,
  totalUsers,
}: {
  initialItems: ChecklistItemData[];
  isAdmin: boolean;
  totalUsers: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [text, setText] = useState("");
  const [type, setType] = useState<ChecklistType>("INDIVIDUAL");
  const [tags, setTags] = useState("");
  const [adding, setAdding] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("ALL");

  // Todos los tags existentes para el filtro
  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags))).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const visible = tagFilter === "ALL" ? items : items.filter((i) => i.tags.includes(tagFilter));

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, type, tags }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setTags("");
      router.refresh(); // recarga la lista del servidor
    } finally {
      setAdding(false);
    }
  }

  async function toggleIndividual(item: ChecklistItemData) {
    // optimista
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? { ...i, iChecked: !i.iChecked, checkedBy: i.iChecked ? i.checkedBy.slice(0, -1) : [...i.checkedBy, "Tú"] }
        : i
    ));
    await fetch(`/api/checklist/${item.id}/check`, { method: "POST" });
    router.refresh();
  }

  async function toggleCommon(item: ChecklistItemData) {
    const next = !item.done;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: next } : i));
    await fetch(`/api/checklist/${item.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
    router.refresh();
  }

  async function setAssignee(item: ChecklistItemData, name: string) {
    const value = name.trim() || null;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, assigneeName: value } : i));
    await fetch(`/api/checklist/${item.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeName: value }),
    });
  }

  async function remove(item: ChecklistItemData) {
    if (!confirm(`¿Borrar "${item.text}" de la checklist?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/checklist/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  const inputCls =
    "rounded-lg border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-3 py-2 text-sm font-semibold text-[#2a1a08] placeholder-[#b09060] focus:border-[#c84a10]/60 focus:outline-none";

  return (
    <div className="flex flex-col gap-5">
      {/* Formulario de añadir */}
      <form onSubmit={addItem} className="flex flex-col gap-3 rounded-2xl border-2 border-[#c4906a]/30 bg-[#f5e0b8]/50 p-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Qué hay que comprar (ej. Toldo de sombra)"
          maxLength={120}
          className={`${inputCls} w-full`}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={type} onChange={(e) => setType(e.target.value as ChecklistType)} className={inputCls}>
            <option value="INDIVIDUAL">👤 Cada uno el suyo</option>
            <option value="COMMON">🤝 Común (con uno vale)</option>
          </select>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags separados por coma (ej. comida, camping)"
            maxLength={200}
            className={`${inputCls} flex-1`}
          />
          <button
            type="submit"
            disabled={adding || !text.trim()}
            className="rounded-lg bg-[#c84a10] px-5 py-2 text-sm font-bold text-white hover:bg-[#a83a08] disabled:opacity-50 transition-colors"
          >
            {adding ? "Añadiendo…" : "+ Añadir"}
          </button>
        </div>
      </form>

      {/* Filtro por tag */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">Filtrar:</span>
          <button
            onClick={() => setTagFilter("ALL")}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              tagFilter === "ALL" ? "bg-[#c84a10] text-white" : "bg-[#c4906a]/20 text-[#7a3a10] hover:bg-[#c4906a]/35"
            }`}
          >
            Todos
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                tagFilter === t ? "bg-[#c84a10] text-white" : "bg-[#c4906a]/20 text-[#7a3a10] hover:bg-[#c4906a]/35"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm font-semibold text-[#a07040]">
          {items.length === 0 ? "Aún no hay nada en la checklist. ¡Añade lo primero!" : "Nada con ese tag."}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              totalUsers={totalUsers}
              onToggleIndividual={() => toggleIndividual(item)}
              onToggleCommon={() => toggleCommon(item)}
              onSetAssignee={(n) => setAssignee(item, n)}
              onRemove={() => remove(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  item, isAdmin, totalUsers, onToggleIndividual, onToggleCommon, onSetAssignee, onRemove,
}: {
  item: ChecklistItemData;
  isAdmin: boolean;
  totalUsers: number;
  onToggleIndividual: () => void;
  onToggleCommon: () => void;
  onSetAssignee: (name: string) => void;
  onRemove: () => void;
}) {
  const isCommon = item.type === "COMMON";
  const done = isCommon ? item.done : item.iChecked;

  return (
    <div className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
      done ? "border-emerald-300 bg-emerald-50" : "border-[#c4906a]/30 bg-[#fdf4e0]"
    }`}>
      {/* Check */}
      <button
        type="button"
        onClick={isCommon ? onToggleCommon : onToggleIndividual}
        aria-pressed={done}
        title={isCommon ? "Marcar comprado" : "Marcar que ya lo tienes"}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#c4906a]/50 hover:border-[#c84a10]"
        }`}
      >
        {done && <span className="text-sm font-black">✓</span>}
      </button>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold ${done ? "text-emerald-800 line-through" : "text-[#2a1a08]"}`}>
            {item.text}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isCommon ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
          }`}>
            {isCommon ? "🤝 común" : "👤 cada uno"}
          </span>
          {item.tags.map((t) => (
            <span key={t} className="rounded-full bg-[#c4906a]/20 px-2 py-0.5 text-[10px] font-bold text-[#7a3a10]">
              #{t}
            </span>
          ))}
        </div>

        {/* Estado */}
        {isCommon ? (
          <div className="flex items-center gap-2 text-[11px] text-[#a07040]">
            <span className="font-semibold">Se encarga:</span>
            <input
              type="text"
              defaultValue={item.assigneeName ?? ""}
              onBlur={(e) => onSetAssignee(e.target.value)}
              placeholder="nadie aún"
              className="w-32 rounded border border-[#c4906a]/40 bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-[#2a1a08] focus:border-[#c84a10]/60 focus:outline-none"
            />
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-[#a07040]">
            {item.checkedBy.length} de {totalUsers} lo tienen
            {item.checkedBy.length > 0 && (
              <span className="font-normal"> · {item.checkedBy.join(", ")}</span>
            )}
          </span>
        )}
        <span className="text-[10px] text-[#b09060]">Añadido por {item.createdByName}</span>
      </div>

      {/* Borrar (solo admin) */}
      {isAdmin && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Borrar"
          title="Borrar (admin)"
          className="mt-0.5 shrink-0 rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-100 transition-colors"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
