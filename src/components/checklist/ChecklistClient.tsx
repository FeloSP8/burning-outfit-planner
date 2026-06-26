"use client";

import { useMemo, useState } from "react";
import type { ChecklistItemData, ChecklistType } from "@/types";

export function ChecklistClient({
  initialItems,
  isAdmin,
  allUsers,
  currentUserName,
}: {
  initialItems: ChecklistItemData[];
  isAdmin: boolean;
  allUsers: string[];
  currentUserName: string;
}) {
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
      const created = await res.json(); // { id, text, type, tags, ... }

      // Añadir el ítem a la lista al instante (sin esperar a recargar).
      const newItem: ChecklistItemData = {
        id: created.id,
        text: t,
        type,
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        done: false,
        assigneeName: null,
        createdByName: currentUserName,
        checkedBy: [],
        iChecked: false,
      };
      setItems((prev) => [...prev, newItem]);
      setText("");
      setTags("");
    } finally {
      setAdding(false);
    }
  }

  async function toggleIndividual(item: ChecklistItemData) {
    // optimista: alternar mi check y reflejar mi nombre en la lista
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? {
            ...i,
            iChecked: !i.iChecked,
            checkedBy: i.iChecked
              ? i.checkedBy.filter((n) => n !== currentUserName)
              : [...i.checkedBy, currentUserName],
          }
        : i
    ));
    await fetch(`/api/checklist/${item.id}/check`, { method: "POST" });
  }

  async function toggleCommon(item: ChecklistItemData) {
    const next = !item.done;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: next } : i));
    await fetch(`/api/checklist/${item.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
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
              allUsers={allUsers}
              currentUserName={currentUserName}
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

function initial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

// Ficha de una persona: verde con ✓ si lo tiene, gris punteado si le falta.
function PersonChip({ name, has, isMe }: { name: string; has: boolean; isMe: boolean }) {
  const label = isMe ? "Tú" : name;
  return (
    <span
      title={`${name}${has ? " — lo tiene" : " — le falta"}`}
      className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold ${
        has
          ? `bg-emerald-100 text-emerald-800 ${isMe ? "border-2 border-emerald-500" : "border border-emerald-300"}`
          : `bg-[#f0e8d6] text-[#9a8560] border border-dashed border-[#c9b896] ${isMe ? "border-2 border-[#c84a10]/60" : ""}`
      }`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
        has ? "bg-emerald-500" : "bg-[#d8c9a8] text-[#8a7550]"
      }`}>
        {initial(name)}
      </span>
      {label}{has && " ✓"}
    </span>
  );
}

function ChecklistRow({
  item, isAdmin, allUsers, currentUserName, onToggleIndividual, onToggleCommon, onSetAssignee, onRemove,
}: {
  item: ChecklistItemData;
  isAdmin: boolean;
  allUsers: string[];
  currentUserName: string;
  onToggleIndividual: () => void;
  onToggleCommon: () => void;
  onSetAssignee: (name: string) => void;
  onRemove: () => void;
}) {
  const isCommon = item.type === "COMMON";
  const checked = new Set(item.checkedBy);
  const haveCount = item.checkedBy.length;
  const pct = allUsers.length > 0 ? Math.round((haveCount / allUsers.length) * 100) : 0;

  // Color de la barra: rojo → naranja → amarillo → verde según progreso
  const barColor =
    pct === 0   ? "#ef4444" :
    pct <= 25   ? "#f97316" :
    pct <= 50   ? "#eab308" :
    pct <= 75   ? "#84cc16" :
                  "#22c55e";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#c4906a]/30 bg-[#fdf4e0] px-4 py-3.5">
      {/* Cabecera: título + badges */}
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <span className="text-[15px] font-bold text-[#2a1a08]">{item.text}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isCommon ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
          }`}>
            {isCommon ? "común" : "cada uno"}
          </span>
          {item.tags.map((t) => (
            <span key={t} className="rounded-full bg-[#c4906a]/20 px-2 py-0.5 text-[10px] font-bold text-[#7a3a10]">
              #{t}
            </span>
          ))}
        </div>
        {!isCommon && (
          <span className="shrink-0 text-xs font-bold text-[#7a5030]">{haveCount}/{allUsers.length}</span>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Borrar"
            title="Borrar (admin)"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-sm text-red-500 hover:bg-red-100 transition-colors"
          >
            🗑️
          </button>
        )}
      </div>

      {isCommon ? (
        /* COMÚN: estado de quién se encarga */
        <CommonStatus item={item} onSetAssignee={onSetAssignee} onToggleDone={onToggleCommon} />
      ) : (
        /* INDIVIDUAL: barra de progreso + ficha por persona */
        <div className="flex flex-col gap-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e8dcc4]">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {allUsers.map((name) => {
              const has = checked.has(name);
              const isMe = name === currentUserName;
              return isMe ? (
                <button key={name} type="button" onClick={onToggleIndividual} className="transition-transform hover:scale-105">
                  <PersonChip name={name} has={has} isMe />
                </button>
              ) : (
                <PersonChip key={name} name={name} has={has} isMe={false} />
              );
            })}
          </div>
        </div>
      )}

      <span className="text-[10px] text-[#b09060]">Añadido por {item.createdByName}</span>
    </div>
  );
}

function CommonStatus({
  item, onSetAssignee, onToggleDone,
}: {
  item: ChecklistItemData;
  onSetAssignee: (name: string) => void;
  onToggleDone: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (item.assigneeName) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {initial(item.assigneeName)}
          </span>
          <span className="text-xs text-emerald-800">
            <b className="font-bold">{item.assigneeName}</b> lo trae ✓
          </span>
        </span>
        <button
          type="button"
          onClick={() => onSetAssignee("")}
          className="text-[11px] font-semibold text-[#a07040] underline-offset-2 hover:underline"
        >
          cambiar
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <input
        type="text"
        autoFocus
        defaultValue=""
        onBlur={(e) => { onSetAssignee(e.target.value); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder="¿Quién lo trae?"
        className="w-48 rounded-lg border-2 border-[#c4906a]/40 bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#2a1a08] focus:border-[#c84a10]/60 focus:outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-fit rounded-lg border border-dashed border-[#c9b896] px-3 py-1.5 text-xs font-semibold text-[#9a8560] hover:border-[#c84a10]/50 hover:text-[#7a3a10] transition-colors"
    >
      + ¿Quién se encarga?
    </button>
  );
}
