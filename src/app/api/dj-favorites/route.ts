import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ARTIST_INDEX } from "@/lib/dj-agenda";
import { loadFavoriteArtists } from "@/lib/dj-favorites";
import { z } from "zod";

// GET — los artistas favoritos del usuario actual.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  return NextResponse.json(await loadFavoriteArtists(user.id));
}

const ToggleSchema = z.object({ artist: z.string().min(1).max(120) });

// POST — alterna un artista en los favoritos del usuario actual.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { artist } = parsed.data;
  if (!ARTIST_INDEX.has(artist))
    return NextResponse.json({ error: "Ese artista no está en el cartel" }, { status: 404 });

  const existing = await db.favoriteArtist.findUnique({
    where: { userId_artist: { userId: user.id, artist } },
  });

  if (existing) {
    await db.favoriteArtist.delete({ where: { id: existing.id } });
  } else {
    await db.favoriteArtist.create({ data: { userId: user.id, artist } });
  }

  return NextResponse.json({ favorite: !existing });
}
