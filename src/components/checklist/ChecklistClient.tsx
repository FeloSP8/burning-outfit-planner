"use client";

import { useMemo, useState } from "react";
import type { ChecklistItemData, ChecklistOrigin, ChecklistType } from "@/types";

const ORIGINS: { value: ChecklistOrigin; label: string; icon: string; desc: string }[] = [
  { value: "ESPANA", label: "España",              icon: "✈️", desc: "Traer de España" },
  { value: "ALLI",   label: "Costco / Home Depot", icon: "🛒", desc: "Comprar allí" },
  { value: null,     label: "Sin clasificar",       icon: "❓", desc: "" },
];

const ORIGIN_META: Record<string, { icon: string; label: string; bg: string; border: string; header: string }> = {
  ESPANA: {
    icon: "✈️", label: "Traer de España",
    bg: "bg-sky-50/70", border: "border-sky-200",
    header: "bg-sky-100 border-sky-200 text-sky-800",
  },
  ALLI: {
    icon: "🛒", label: "Comprar allí · Costco / Home Depot",
    bg: "bg-emerald-50/70", border: "border-emerald-200",
    header: "bg-emerald-100 border-emerald-200 text-emerald-800",
  },
  NONE: {
    icon: "❓", label: "Sin clasificar",
    bg: "bg-[#fdf4e0]", border: "border-[#c4906a]/30",
    header: "bg-[#f5e0b8] border-[#c4906a]/30 text-[#7a4a20]",
  },
};

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
  const [items, setItems]       = useState(initialItems);
  const [text, setText]         = useState("");
  const [type, setType]         = useState<ChecklistType>("INDIVIDUAL");
  const [origin, setOrigin]     = useState<ChecklistOrigin>(null);
  const [tags, setTags]         = useState("");
  const [adding, setAdding]     = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("ALL");

  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags))).sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const visible = tagFilter === "ALL" ? items : items.filter((i) => i.tags.includes(tagFilter));

  // Grupos fijos en este orden
  const groups: { key: string; origin: ChecklistOrigin }[] = [
    { key: "ESPANA", origin: "ESPANA" },
    { key: "ALLI",   origin: "ALLI" },
    { key: "NONE",   origin: null },
  ];

  function isCompleted(item: ChecklistItemData): boolean {
    if (item.type === "COMMON") return item.done;
    return allUsers.length > 0 && item.checkedBy.length >= allUsers.length;
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, type, tags, origin }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      const newItem: ChecklistItemData = {
        id: created.id,
        text: t,
        type,
        origin,
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

  async function changeType(item: ChecklistItemData) {
    const next: ChecklistType = item.type === "COMMON" ? "INDIVIDUAL" : "COMMON";
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? { ...i, type: next, ...(next === "INDIVIDUAL" ? { done: false, assigneeName: null } : {}) }
        : i
    ));
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: next }),
    });
  }

  async function changeOrigin(item: ChecklistItemData, next: ChecklistOrigin) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, origin: next } : i));
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: next }),
    });
  }

  async function toggleIndividual(item: ChecklistItemData) {
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? { ...i, iChecked: !i.iChecked, checkedBy: i.iChecked ? i.checkedBy.filter((n) => n !== currentUserName) : [...i.checkedBy, currentUserName] }
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
    // Clearing the assignee also resets done to false
    const resetDone = !value && item.done;
    setItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, assigneeName: value, ...(resetDone ? { done: false } : {}) } : i
    ));
    await fetch(`/api/checklist/${item.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeName: value, ...(resetDone ? { done: false } : {}) }),
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
    <div className="flex flex-col gap-6">

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

        {/* Origen: selector visual */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a07040]">¿Dónde se compra?</span>
          <div className="flex flex-wrap gap-2">
            {ORIGINS.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => setOrigin(o.value)}
                className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  origin === o.value
                    ? "border-[#c84a10] bg-[#c84a10]/10 text-[#7a2e08]"
                    : "border-[#c4906a]/30 bg-[#fdf4e0] text-[#7a4a20] hover:border-[#c4906a]/60"
                }`}
              >
                <span>{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>

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

      {/* Lista agrupada por origen */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm font-semibold text-[#a07040]">
          {items.length === 0 ? "Aún no hay nada en la checklist. ¡Añade lo primero!" : "Nada con ese tag."}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(({ key, origin: groupOrigin }) => {
            const rawItems = visible.filter((i) => (i.origin ?? null) === groupOrigin);
            if (rawItems.length === 0) return null;
            // Completed items go to the end
            const groupItems = [...rawItems].sort(
              (a, b) => (isCompleted(a) ? 1 : 0) - (isCompleted(b) ? 1 : 0)
            );
            const meta = ORIGIN_META[key];
            return (
              <div key={key} className="flex flex-col gap-2">
                {/* Cabecera del grupo */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${meta.header}`}>
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-sm font-black tracking-tight">{meta.label}</span>
                  <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold">
                    {groupItems.length}
                  </span>
                </div>
                {/* Ítems */}
                <div className="flex flex-col gap-2">
                  {groupItems.map((item) => (
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
                      onChangeOrigin={(o) => changeOrigin(item, o)}
                      onChangeType={() => changeType(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function initial(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

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
  item, isAdmin, allUsers, currentUserName,
  onToggleIndividual, onToggleCommon, onSetAssignee, onRemove, onChangeOrigin, onChangeType,
}: {
  item: ChecklistItemData;
  isAdmin: boolean;
  allUsers: string[];
  currentUserName: string;
  onToggleIndividual: () => void;
  onToggleCommon: () => void;
  onSetAssignee: (name: string) => void;
  onRemove: () => void;
  onChangeOrigin: (o: ChecklistOrigin) => void;
  onChangeType: () => void;
}) {
  const isCommon  = item.type === "COMMON";
  const checked   = new Set(item.checkedBy);
  const haveCount = item.checkedBy.length;
  const pct       = allUsers.length > 0 ? Math.round((haveCount / allUsers.length) * 100) : 0;

  const barColor =
    pct === 0  ? "#ef4444" :
    pct <= 25  ? "#f97316" :
    pct <= 50  ? "#eab308" :
    pct <= 75  ? "#84cc16" :
                 "#22c55e";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#c4906a]/30 bg-[#fdf4e0] px-4 py-3.5">
      {/* Cabecera */}
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          <span className="text-[15px] font-bold text-[#2a1a08]">{item.text}</span>
          <button
            type="button"
            onClick={onChangeType}
            title={isCommon ? "Cambiar a individual" : "Cambiar a común"}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors hover:opacity-70 ${
              isCommon ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isCommon ? "común" : "cada uno"}
          </button>
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
        <CommonStatus
          item={item}
          allUsers={allUsers}
          needsAssignee={item.origin !== "ALLI"}
          onSetAssignee={onSetAssignee}
          onToggleDone={onToggleCommon}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e8dcc4]">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {allUsers.map((name) => {
              const has  = checked.has(name);
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

      {/* Cambiar origen inline */}
      <div className="flex items-center gap-1.5 border-t border-[#e8dcc4] pt-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#b09060]">Dónde:</span>
        {ORIGINS.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChangeOrigin(o.value)}
            title={o.desc || o.label}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
              (item.origin ?? null) === o.value
                ? "bg-[#c84a10] text-white"
                : "bg-[#f0e4cc] text-[#9a7040] hover:bg-[#e8d4b0]"
            }`}
          >
            <span>{o.icon}</span>
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[#b09060]">Añadido por {item.createdByName}</span>
      </div>
    </div>
  );
}

function CommonStatus({
  item, allUsers, needsAssignee, onSetAssignee, onToggleDone,
}: {
  item: ChecklistItemData;
  allUsers: string[];
  needsAssignee: boolean;
  onSetAssignee: (name: string) => void;
  onToggleDone: () => void;
}) {
  // Simple toggle for "buy there" items — no assignee needed
  if (!needsAssignee) {
    if (item.done) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            ✓ Comprado
          </span>
          <button
            type="button"
            onClick={onToggleDone}
            className="text-[11px] font-semibold text-[#a07040] underline-offset-2 hover:underline"
          >
            desmarcar
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={onToggleDone}
        className="w-fit rounded-lg border-2 border-dashed border-[#c9b896] px-3 py-1.5 text-xs font-semibold text-[#9a8560] hover:border-emerald-400 hover:text-emerald-700 transition-colors"
      >
        ✓ Marcar como comprado
      </button>
    );
  }

  // State 3: confirmed done ✓ → green
  if (item.done) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {initial(item.assigneeName ?? "?")}
          </span>
          <span className="text-xs font-semibold text-emerald-800">
            <b className="font-bold">{item.assigneeName ?? "Alguien"}</b> lo trae ✓
          </span>
        </span>
        <button
          type="button"
          onClick={onToggleDone}
          className="text-[11px] font-semibold text-[#a07040] underline-offset-2 hover:underline"
        >
          desmarcar
        </button>
      </div>
    );
  }

  // State 2: assignee set but not yet confirmed → dashed/muted (clearly pending)
  if (item.assigneeName) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#c9b896] bg-[#fdf4e0] px-2.5 py-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d8c9a8] text-[10px] font-bold text-[#7a6040]">
            {initial(item.assigneeName)}
          </span>
          <span className="text-xs font-semibold text-[#7a5030]">
            <b className="font-bold">{item.assigneeName}</b> se encarga
          </span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#b09060]">→</span>
        <button
          type="button"
          onClick={onToggleDone}
          className="rounded-lg border-2 border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors"
        >
          ✓ Marcar como listo
        </button>
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

  // State 1: no assignee → dropdown to pick
  return (
    <select
      defaultValue=""
      onChange={(e) => { if (e.target.value) onSetAssignee(e.target.value); }}
      className="w-fit rounded-lg border-2 border-dashed border-[#c9b896] bg-[#fdf4e0] px-3 py-1.5 text-xs font-semibold text-[#9a8560] focus:border-[#c84a10]/60 focus:outline-none hover:border-[#c84a10]/40 transition-colors"
    >
      <option value="">¿Quién se encarga?</option>
      {allUsers.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
}
