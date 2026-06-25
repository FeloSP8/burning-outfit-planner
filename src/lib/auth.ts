import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * Devuelve el registro `User` de la base de datos para el usuario autenticado,
 * o `null` si no hay sesión válida.
 *
 * Vincula la identidad de Supabase Auth (email) con la tabla `User` de Prisma:
 * en el primer login crea la fila automáticamente (upsert por email).
 *
 * Memoizado con React `cache` para no repetir la consulta dentro de un mismo render.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const user = await db.user.upsert({
    where: { email: authUser.email },
    update: {},
    create: {
      email: authUser.email,
      name: (authUser.user_metadata?.name as string | undefined) ?? "Yo",
    },
  });

  return user;
});

/**
 * Igual que `getCurrentUser` pero lanza si no hay sesión.
 * Útil en Route Handlers/Server Actions que exigen usuario autenticado.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("No autenticado", { status: 401 });
  }
  return user;
}

/**
 * Comprueba si un outfit pertenece a un usuario (vía outfit -> shift -> day -> userId).
 * Devuelve `true` solo si existe y es del usuario.
 */
export async function ownsOutfit(outfitId: string, userId: string): Promise<boolean> {
  const outfit = await db.outfit.findUnique({
    where: { id: outfitId },
    select: { shift: { select: { day: { select: { userId: true } } } } },
  });
  return outfit?.shift.day.userId === userId;
}

/** Comprueba si una prenda pertenece a un usuario. */
export async function ownsGarment(garmentId: string, userId: string): Promise<boolean> {
  const garment = await db.garment.findUnique({
    where: { id: garmentId },
    select: { userId: true },
  });
  return garment?.userId === userId;
}

// Email del usuario administrador (puede borrar ítems de la checklist).
// Configurable vía ADMIN_EMAIL; por defecto, el dueño de la app.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "felipesrmd@gmail.com").toLowerCase();

/** ¿Es este usuario el administrador? */
export function isAdmin(user: { email: string } | null): boolean {
  return !!user && user.email.toLowerCase() === ADMIN_EMAIL;
}
