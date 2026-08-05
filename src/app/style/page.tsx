import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StyleStudio } from "@/components/style/StyleStudio";
import type { StyleLook } from "@/types";

export default async function StylePage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const rawLooks = await db.styleLook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const looks = rawLooks.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  })) as StyleLook[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p
          className="text-4xl text-[#7a2e08] leading-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Estilismo
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Prueba peinados, tintes y barbas sobre tu foto. La ropa y el fondo no cambian.
        </p>
      </div>

      <StyleStudio userPhotoUrl={user.photoUrl ?? null} initialLooks={looks} />
    </div>
  );
}
