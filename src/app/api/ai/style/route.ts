import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateStyleLookLeonardo } from "@/lib/leonardo";
import { LEONARDO_MODELS, type ModelId } from "@/lib/leonardo-models";
import { getStylePreset, STYLE_CATEGORIES, resolveStyleSelection } from "@/lib/style-presets";
import { z } from "zod";

const VALID_MODELS = LEONARDO_MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];
const CATEGORY_IDS = STYLE_CATEGORIES.map((c) => c.id) as [string, ...string[]];

const Schema = z.object({
  // Foto de partida: la del perfil o un look generado antes (para encadenar cambios).
  sourcePhotoUrl: z.string().min(1),
  presets:        z.array(z.string().min(1)).max(10).optional(),
  // Texto libre por categoría: { hairstyle: "melena con dos coletas", … }.
  // Alternativa al preset — si viene texto, manda sobre el preset de esa categoría.
  // partialRecord y no record: en Zod 4 un record con claves de enum es
  // EXHAUSTIVO y exigiría las tres categorías en cada petición.
  custom:         z.partialRecord(z.enum(CATEGORY_IDS), z.string().max(200)).optional(),
  model:          z.enum(VALID_MODELS).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    // Un string, no el objeto de flatten(): la UI solo sabe pintar texto, y con
    // un objeto acababa enseñando un "no se pudo generar" que no dice nada.
    const detalle = parsed.error.issues
      .map((i) => `${i.path.join(".") || "cuerpo"}: ${i.message}`)
      .join("; ");
    console.error("[ai/style] petición inválida:", detalle);
    return NextResponse.json({ error: `Petición inválida — ${detalle}` }, { status: 400 });
  }

  const { sourcePhotoUrl, presets = [], custom = {}, model = "gpt-image-2" } = parsed.data;

  // La foto de partida tiene que ser del usuario: su foto de modelo, un look
  // suyo, o la foto original de la que salió un look (sigue siendo elegible
  // aunque ya no sea la foto de modelo). Evita que se use este endpoint para
  // procesar imágenes arbitrarias.
  //
  // El try no es decorativo: si falta la migración de StyleLook, esta consulta
  // revienta y sin capturarla Next devuelve una página HTML de error, que en el
  // cliente ni siquiera se puede leer como JSON.
  let isOwnPhoto: boolean;
  try {
    isOwnPhoto =
      sourcePhotoUrl === user.photoUrl ||
      (await db.styleLook.count({
        where: {
          userId: user.id,
          OR: [{ imageUrl: sourcePhotoUrl }, { sourcePhoto: sourcePhotoUrl }],
        },
      })) > 0;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ai/style] error consultando StyleLook:", msg);
    return NextResponse.json(
      { error: "Error consultando tus looks: " + msg },
      { status: 500 }
    );
  }

  if (!isOwnPhoto)
    return NextResponse.json(
      { error: "La foto de partida no es tuya" },
      { status: 403 }
    );

  // Un id de preset desconocido es un error del cliente, no algo que ignorar.
  const unknown = presets.filter((id) => !getStylePreset(id));
  if (unknown.length > 0)
    return NextResponse.json(
      { error: `Estilismo desconocido: ${unknown.join(", ")}` },
      { status: 400 }
    );

  const { lines: styleLines, labels: labelParts } = resolveStyleSelection(presets, custom);

  if (styleLines.length === 0)
    return NextResponse.json(
      { error: "Elige al menos un estilismo o describe uno" },
      { status: 422 }
    );

  const label = labelParts.join(" · ").slice(0, 120);

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
