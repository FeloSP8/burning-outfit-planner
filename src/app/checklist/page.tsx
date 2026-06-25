import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { ChecklistClient } from "@/components/checklist/ChecklistClient";
import type { ChecklistItemData, ChecklistType } from "@/types";

export default async function ChecklistPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const [rawItems, totalUsers] = await Promise.all([
    db.checklistItem.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { name: true } },
        checks: { include: { user: { select: { name: true } } } },
      },
    }),
    db.user.count(),
  ]);

  const items: ChecklistItemData[] = rawItems.map((it) => ({
    id: it.id,
    text: it.text,
    type: it.type as ChecklistType,
    tags: it.tags ? it.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    done: it.done,
    assigneeName: it.assigneeName,
    createdByName: it.createdBy.name,
    checkedBy: it.checks.map((c) => c.user.name),
    iChecked: it.checks.some((c) => c.userId === user.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 900 }}>
          Checklist de compras
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Lista compartida. Marca lo que ya tengas; los comunes basta con que uno lo traiga.
        </p>
      </div>

      <ChecklistClient initialItems={items} isAdmin={isAdmin(user)} totalUsers={totalUsers} />
    </div>
  );
}
