import { saveRemoteImage } from "./storage";
import fs from "fs/promises";
import path from "path";

const MOCK = process.env.AI_MOCK === "true";
const API_KEY = process.env.LEONARDO_API_KEY ?? "";

// GPT Image 2 usa el endpoint v2
const BASE_V1 = "https://cloud.leonardo.ai/api/rest/v1";
const BASE_V2 = "https://cloud.leonardo.ai/api/rest/v2";

export type GarmentInput = {
  url: string;
  name: string;   // nombre real de la prenda para el prompt
  slot: string;   // TOP | BOTTOM | SHOES | ACCESSORY | COAT
};

// Fondo fijo: desierto de Black Rock / Burning Man
const DESERT_BACKGROUND = [
  "The background is the Black Rock Desert playa at Burning Man:",
  "cracked dry white alkali lake bed stretching to the horizon,",
  "dusty hazy sky with warm golden light, art installations in the far distance,",
  "festival atmosphere, cinematic lighting.",
].join(" ");

function headers(contentType = true) {
  return {
    authorization: `Bearer ${API_KEY}`,
    accept: "application/json",
    ...(contentType ? { "content-type": "application/json" } : {}),
  };
}

/** Lee una imagen local o remota y la devuelve como Buffer + extensión */
async function readImage(urlOrPath: string): Promise<{ buffer: Buffer; ext: string }> {
  if (urlOrPath.startsWith("/")) {
    const absPath = path.join(process.cwd(), "public", urlOrPath);
    const buffer = await fs.readFile(absPath);
    const ext = path.extname(urlOrPath).slice(1).replace("jpeg", "jpg") || "jpg";
    return { buffer, ext };
  }
  const res = await fetch(urlOrPath);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") ?? "";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  return { buffer, ext };
}

/**
 * Sube una imagen a Leonardo vía URL presignada S3.
 * Devuelve el imageId para usarlo en guidances.image_reference.
 */
async function uploadImage(urlOrPath: string): Promise<string> {
  const { buffer, ext } = await readImage(urlOrPath);

  // 1. Pedir URL presignada
  const initRes = await fetch(`${BASE_V1}/init-image`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ extension: ext }),
  });
  if (!initRes.ok) {
    throw new Error(`Error al pedir URL de subida: ${initRes.status} ${await initRes.text()}`);
  }
  const initData = await initRes.json();
  const { id: imageId, url: s3Url, fields: fieldsRaw } = initData.uploadInitImage;
  const fields = JSON.parse(fieldsRaw) as Record<string, string>;

  // 2. Subir a S3
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append("file", new Blob([new Uint8Array(buffer)], { type: `image/${ext}` }));

  const s3Res = await fetch(s3Url, { method: "POST", body: form });
  if (!s3Res.ok && s3Res.status !== 204) {
    throw new Error(`Error al subir a S3: ${s3Res.status}`);
  }

  return imageId;
}

/**
 * Polling sobre GET /v1/generations/:id hasta COMPLETE o FAILED.
 * GPT Image 2 suele responder en 20-60s.
 */
async function pollGeneration(generationId: string, maxMs = 180_000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 4000));

    const res = await fetch(`${BASE_V1}/generations/${generationId}`, {
      headers: headers(false),
    });
    if (!res.ok) throw new Error(`Error polling generación: ${res.status}`);

    const data = await res.json();
    const gen = data.generations_by_pk;
    if (!gen) throw new Error("Generación no encontrada en Leonardo");

    if (gen.status === "COMPLETE") {
      const images = gen.generated_images as { url: string }[];
      if (!images?.length) throw new Error("Generación completada pero sin imágenes");
      return images.map((i) => i.url);
    }
    if (gen.status === "FAILED") {
      throw new Error("La generación falló en Leonardo");
    }
    // PENDING / PROCESSING → seguir esperando
  }
  throw new Error("Timeout: Leonardo tardó más de 3 minutos");
}

/**
 * Virtual Try-On con GPT Image 2 de Leonardo.
 *
 * Estrategia:
 * - Sube la foto del usuario + fotos de las prendas como image_reference
 * - El prompt describe exactamente qué hacer con cada referencia
 * - GPT Image 2 no usa init_strength — trabaja por comprensión del prompt
 */
export async function generateTryOnLeonardo(
  userPhotoUrl: string,
  garments: GarmentInput[],
  extraPrompt?: string
): Promise<string> {
  if (MOCK || garments.length === 0) return userPhotoUrl;
  if (!API_KEY) throw new Error("LEONARDO_API_KEY no configurada");

  // Subir todas las imágenes en paralelo
  const [userImageId, ...garmentImageIds] = await Promise.all([
    uploadImage(userPhotoUrl),
    ...garments.map((g) => uploadImage(g.url)),
  ]);

  // Construir referencias: usuario primero, luego prendas
  const imageReferences = [
    { image: { id: userImageId, type: "UPLOADED" } },
    ...garmentImageIds.map((id) => ({ image: { id, type: "UPLOADED" } })),
  ];

  // Descripción de slot en inglés para el prompt
  const slotDesc: Record<string, string> = {
    TOP:       "upper body garment / top (shirt, jacket, kimono, etc.)",
    BOTTOM:    "lower body garment / bottoms (pants, skirt, shorts, etc.)",
    SHOES:     "footwear (shoes, boots, sandals, etc.) — place on the person's feet",
    ACCESSORY: "accessory (hat, glasses, mask, bag, etc.) — place on the appropriate body part",
    COAT:      "outer layer / coat / cape — wear over the rest of the outfit",
  };

  const garmentLines = garments.map((g, i) =>
    `- Reference image ${i + 2}: "${g.name}" — this is a ${slotDesc[g.slot] ?? g.slot}. Apply it to the person exactly as it appears in the reference.`
  );

  const promptParts = [
    "Virtual try-on task. The person in reference image 1 must be shown wearing all the garments from the other reference images.",
    "",
    "Reference image 1: the PERSON. Preserve their exact face, hair color and style, skin tone, body proportions, and pose. Do NOT change anything about the person.",
    "",
    "Garments to apply:",
    ...garmentLines,
    "",
    "Rules:",
    "- Every single garment listed above MUST appear in the final image.",
    "- Accessories (hats, glasses, etc.) must be placed on the correct body part.",
    "- The garments must look exactly like their reference images — same color, pattern, and texture.",
    "- The result must look like a real photograph. Photorealistic quality.",
    "",
    DESERT_BACKGROUND,
  ];

  if (extraPrompt?.trim()) {
    promptParts.push("", `Additional instructions: ${extraPrompt.trim()}`);
  }

  const prompt = promptParts.join("\n");

  // Lanzar generación con GPT Image 2 en endpoint v2
  // Los parámetros van anidados bajo "parameters" según la doc de Leonardo
  const genRes = await fetch(`${BASE_V2}/generations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: "gpt-image-2",
      public: false,
      parameters: {
        prompt,
        quantity: 1,
        width: 1024,   // mínimo válido probado — 512x512 está por debajo del límite de píxeles
        height: 1024,
        quality: "LOW", // $0.012 por imagen — subir a MEDIUM/HIGH cuando esté validado
        prompt_enhance: "OFF",
        guidances: {
          image_reference: imageReferences,
        },
      },
    }),
  });

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Leonardo v2 error ${genRes.status}: ${errText}`);
  }

  const genData = await genRes.json();

  // GPT Image 2 puede devolver el resultado directamente (síncrono)
  // o un generationId para polling (asíncrono)
  const directImages =
    genData.images as { url: string }[] | undefined;

  if (directImages?.length) {
    const remoteUrl = directImages[0].url;
    return saveRemoteImage(remoteUrl, "tryon");
  }

  // GPT Image 2 devuelve { generate: { generationId: "..." } }
  const generationId: string | undefined =
    genData.generate?.generationId ?? genData.generationId ?? genData.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error(`Leonardo no devolvió generationId ni imágenes: ${JSON.stringify(genData)}`);
  }

  const [imageUrl] = await pollGeneration(generationId);
  return saveRemoteImage(imageUrl, "tryon");
}
