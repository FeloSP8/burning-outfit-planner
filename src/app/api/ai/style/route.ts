import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateStyleLookLeonardo } from "@/lib/leonardo";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";
import { getStylePreset } from "@/lib/style-presets";
import { z } from "zod";

const VALID_MODELS = LEONARDO_MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];

const Schema = z.object({
  // Foto de partida: la del perfil o un look generado antes (para encadenar cambios).
  sourcePhotoUrl: z.string().min(1),
  presets:        z.array(z.string().min(1)).max(10).optional(),
  customPrompt:   z.string().max(300).optional(),
  model:          z.enum(VALID_MODELS).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sourcePhotoUrl, presets = [], customPrompt, model = "gpt-image-2" } = parsed.data;

  // La foto de partida tiene que ser del usuario: su foto de modelo, un look
  // suyo, o la foto original de la que salió un look (sigue siendo elegible
  // aunque ya no sea la foto de modelo). Evita que se use este endpoint para
  // procesar imágenes arbitrarias.
  const isOwnPhoto =
    sourcePhotoUrl === user.photoUrl ||
    (await db.styleLook.count({
      where: {
        userId: user.id,
        OR: [{ imageUrl: sourcePhotoUrl }, { sourcePhoto: sourcePhotoUrl }],
      },
    })) > 0;
  if (!isOwnPhoto)
    return NextResponse.json(
      { error: "La foto de partida no es tuya" },
      { status: 403 }
    );

  // Presets → líneas de prompt en inglés. Un id desconocido es error del cliente.
  const chosen = presets.map((id) => ({ id, preset: getStylePreset(id) }));
  const unknown = chosen.filter((c) => !c.preset).map((c) => c.id);
  if (unknown.length > 0)
    return NextResponse.json(
      { error: `Estilismo desconocido: ${unknown.join(", ")}` },
      { status: 400 }
    );

  const styleLines = chosen.map((c) => c.preset!.prompt);
  const extra = customPrompt?.trim();
  if (extra) styleLines.push(extra);

  if (styleLines.length === 0)
    return NextResponse.json(
      { error: "Elige al menos un estilismo o describe uno" },
      { status: 422 }
    );

  const label =
    [...chosen.map((c) => c.preset!.label), ...(extra ? [extra] : [])]
      .join(" · ")
      .slice(0, 120);

  try {
    const imageUrl = await generateStyleLookLeonardo(user.id, sourcePhotoUrl, styleLines, model);

    const look = await db.styleLook.create({
      data: {
        userId: user.id,
        imageUrl,
        sourcePhoto: sourcePhotoUrl,
        label,
        prompt: styleLines.join("\n"),
        model,
      },
    });

    return NextResponse.json({ ...look, createdAt: look.createdAt.toISOString() });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error generando estilismo (Leonardo):", msg);
    return NextResponse.json(
      { error: "Error generando el estilismo: " + msg },
      { status: 500 }
    );
  }
}
