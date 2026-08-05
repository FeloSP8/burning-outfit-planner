import { saveRemoteImage } from "./storage";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import type { ModelId } from "./leonardo-models";
export type { ModelId };
export { LEONARDO_MODELS } from "./leonardo-models";

const MOCK    = process.env.AI_MOCK === "true";
const API_KEY = process.env.LEONARDO_API_KEY ?? "";

const BASE_V1 = "https://cloud.leonardo.ai/api/rest/v1";
const BASE_V2 = "https://cloud.leonardo.ai/api/rest/v2";

// ─── Fondos según turno ─────────────────────────────────────────────────────

const BG_TARDE = "Background: Black Rock Desert playa at Burning Man. Cracked white alkali ground, warm golden dusty sky, art installations in the distance. Daytime, cinematic light.";
const BG_NOCHE = "Background: Burning Man at night. Dark desert playa, crowd of festival people, vibrant neon LED lights and glowing art cars everywhere, electric atmosphere, deep blue night sky with stars. The subject is well-lit and clearly visible.";

// Límite de prompt confirmado experimentalmente: 1399 chars
const PROMPT_MAX = 1399;

// ─── Helpers internos ───────────────────────────────────────────────────────

export type GarmentInput = {
  url: string;
  name: string;
  slot: string;
};

function authHeaders(contentType = true) {
  return {
    authorization: `Bearer ${API_KEY}`,
    accept: "application/json",
    ...(contentType ? { "content-type": "application/json" } : {}),
  };
}

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

async function buildGarmentCollage(garments: GarmentInput[]): Promise<Buffer> {
  const CELL = 512;
  const cols = garments.length <= 2 ? garments.length : Math.ceil(Math.sqrt(garments.length));
  const rows = Math.ceil(garments.length / cols);
  const canvas = sharp({
    create: { width: cols * CELL, height: rows * CELL, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).png();
  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < garments.length; i++) {
    const { buffer } = await readImage(garments[i].url);
    const resized = await sharp(buffer)
      .resize(CELL, CELL, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png().toBuffer();
    composites.push({ input: resized, left: (i % cols) * CELL, top: Math.floor(i / cols) * CELL });
  }
  return canvas.composite(composites).toBuffer();
}

async function uploadBuffer(buffer: Buffer, ext = "png"): Promise<string> {
  const initRes = await fetch(`${BASE_V1}/init-image`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ extension: ext }),
  });
  if (!initRes.ok) throw new Error(`Presigned URL error: ${initRes.status}`);
  const { id, url: s3Url, fields: fieldsRaw } = (await initRes.json()).uploadInitImage;
  const fields = JSON.parse(fieldsRaw) as Record<string, string>;
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append("file", new Blob([new Uint8Array(buffer)], { type: `image/${ext}` }));
  const s3 = await fetch(s3Url, { method: "POST", body: form });
  if (!s3.ok && s3.status !== 204) throw new Error(`S3 upload error: ${s3.status}`);
  return id;
}

async function uploadImage(urlOrPath: string): Promise<string> {
  const { buffer, ext } = await readImage(urlOrPath);
  return uploadBuffer(buffer, ext);
}

async function pollGeneration(generationId: string, maxMs = 180_000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${BASE_V1}/generations/${generationId}`, { headers: authHeaders(false) });
    if (!res.ok) throw new Error(`Poll error: ${res.status}`);
    const gen = (await res.json()).generations_by_pk;
    if (!gen) throw new Error("Generación no encontrada");
    if (gen.status === "COMPLETE") {
      const imgs = gen.generated_images as { url: string }[];
      if (!imgs?.length) throw new Error("COMPLETE pero sin imágenes");
      return imgs.map((i) => i.url);
    }
    if (gen.status === "FAILED") throw new Error("FAILED");
  }
  throw new Error("Timeout: Leonardo tardó más de 3 minutos");
}

/** Lanza una generación y reintenta hasta MAX_RETRIES veces si Leonardo devuelve FAILED */
async function generateWithRetry(
  generateFn: () => Promise<string>,
  maxRetries = 2
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateFn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message === "FAILED" && attempt < maxRetries) {
        console.warn(`[leonardo] Generación fallida (intento ${attempt}/${maxRetries}) — reintentando...`);
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        break;
      }
    }
  }
  throw lastError ?? new Error("Error desconocido en Leonardo");
}

// ─── Builders de prompt y referencias ──────────────────────────────────────

const SLOT_DESC: Record<string, string> = {
  TOP:       "upper body garment (shirt, jacket, kimono, etc.)",
  BOTTOM:    "lower body garment (pants, skirt, shorts, etc.)",
  SHOES:     "footwear — place exactly on the person's feet",
  ACCESSORY: "accessory (hat → on head, glasses → on face, bag → on shoulder, etc.)",
  COAT:      "outer coat/cape — worn over the other garments",
};

type GarmentRef = { id: string; promptLine: string };

async function buildRefs(garments: GarmentInput[]): Promise<{
  userUploadFn: (url: string) => Promise<string>;
  garmentRefs: GarmentRef[];
  textOnlyLines: string[];
}> {
  const top       = garments.find((g) => g.slot === "TOP");
  const bottom    = garments.find((g) => g.slot === "BOTTOM");
  const coat      = garments.find((g) => g.slot === "COAT");
  const secondary = garments.filter((g) => g.slot === "ACCESSORY" || g.slot === "SHOES");
  const soloSlots = [top, bottom, coat].filter(Boolean) as GarmentInput[];

  const garmentRefs: GarmentRef[] = [];
  let refIndex = 2;

  for (const g of soloSlots) {
    if (refIndex > 4) break;
    const id = await uploadImage(g.url);
    garmentRefs.push({ id, promptLine: `- Ref ${refIndex}: "${g.name}" — ${SLOT_DESC[g.slot] ?? g.slot}. Apply exactly as shown.` });
    console.log(`[leonardo] ${g.slot} "${g.name}": ${id} (ref ${refIndex})`);
    refIndex++;
  }

  if (secondary.length > 0 && refIndex <= 4) {
    if (secondary.length === 1) {
      const g = secondary[0];
      const id = await uploadImage(g.url);
      garmentRefs.push({ id, promptLine: `- Ref ${refIndex}: "${g.name}" — ${SLOT_DESC[g.slot] ?? g.slot}. Apply exactly as shown.` });
      console.log(`[leonardo] ${g.slot} "${g.name}": ${id} (ref ${refIndex})`);
    } else {
      console.log(`[leonardo] ${secondary.length} accesorios/calzado → collage`);
      const cols = secondary.length <= 4 ? 2 : Math.ceil(Math.sqrt(secondary.length));
      const collageId = await uploadBuffer(await buildGarmentCollage(secondary), "png");
      const cellList = secondary.map((g, i) =>
        `    [row ${Math.floor(i / cols) + 1}, col ${i % cols + 1}] "${g.name}" — ${SLOT_DESC[g.slot] ?? g.slot}`
      ).join("\n");
      garmentRefs.push({ id: collageId, promptLine: `- Ref ${refIndex}: collage accessories/footwear — apply ALL:\n${cellList}` });
      console.log(`[leonardo] Collage: ${collageId} (ref ${refIndex})`);
    }
  }

  const usedUrls = new Set([top, bottom, coat, ...secondary].filter(Boolean).map((g) => g!.url));
  const textOnlyLines = garments
    .filter((g) => !usedUrls.has(g.url))
    .map((g) => `- "${g.name}" — ${SLOT_DESC[g.slot] ?? g.slot}. Include based on name.`);

  return { userUploadFn: uploadImage, garmentRefs, textOnlyLines };
}

// Pose de editorial — específica por turno para encajar con el mood del fondo
const POSE_TARDE = "Editorial fashion pose: confident stance, slight weight shift to one hip, relaxed shoulders, natural arm position. Expression: calm and self-assured. Full body visible. Shot like a fashion magazine editorial.";
const POSE_NOCHE = "Editorial fashion pose: dynamic and expressive, slight forward lean or hand gesture, body language full of energy and confidence. Expression: intense, festival mood. Full body visible. Shot like a fashion magazine editorial at night.";

function buildPrompt(garmentInstructions: string, isNight: boolean, extraPrompt?: string): string {
  const faceRule = "CRITICAL: face in output = IDENTICAL to ref 1. Do NOT change face, hair, skin.";
  const parts = [
    `Virtual try-on. ${faceRule}`,
    garmentInstructions,
    "Show person wearing ALL garments. Photorealistic. Keep face identical to ref 1.",
    isNight ? POSE_NOCHE : POSE_TARDE,
    isNight ? BG_NOCHE : BG_TARDE,
  ];
  if (extraPrompt?.trim()) parts.push(extraPrompt.trim());
  let prompt = parts.join("\n");
  if (prompt.length > PROMPT_MAX) {
    prompt = prompt.slice(0, PROMPT_MAX);
    console.warn(`[leonardo] Prompt truncado a ${PROMPT_MAX} chars`);
  }
  console.log(`[leonardo] Prompt (${prompt.length} chars)`);
  return prompt;
}

// ─── Generadores por modelo ─────────────────────────────────────────────────

async function generateV2WithRefs(
  userId: string,
  model: "gpt-image-2" | "nano-banana-2",
  prompt: string,
  imageReferences: { image: { id: string; type: string } }[],
  prefix = "tryon"
): Promise<string> {
  const body = {
    model,
    public: false,
    parameters: {
      prompt,
      quantity: 1,
      width: 1024,
      height: 1024,
      quality: "LOW",
      prompt_enhance: "OFF",
      guidances: { image_reference: imageReferences },
    },
  };

  const res = await fetch(`${BASE_V2}/generations`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Leonardo v2 ${res.status}: ${raw}`);

  const data = JSON.parse(raw);
  if ((data.images as { url: string }[] | undefined)?.length)
    return saveRemoteImage(userId, data.images[0].url, prefix);

  const generationId =
    data.generate?.generationId ?? data.generationId ?? data.sdGenerationJob?.generationId;
  if (!generationId) throw new Error(`Sin generationId: ${raw}`);

  const [url] = await pollGeneration(generationId);
  return saveRemoteImage(userId, url, prefix);
}

async function generatePhoenix(
  userId: string,
  prompt: string,
  userImageId: string,
  prefix = "tryon"
): Promise<string> {
  // Phoenix usa v1 + controlnets. Character Reference (preprocessorId 397) preserva la persona.
  const body = {
    modelId: "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3", // Phoenix 1.0
    prompt,
    num_images: 1,
    width: 1024,
    height: 1024,
    alchemy: true,
    contrast: 3.5,
    controlnets: [
      {
        initImageId: userImageId,
        initImageType: "UPLOADED",
        preprocessorId: 397, // Character Reference
        strengthType: "Mid",
      },
    ],
  };

  const res = await fetch(`${BASE_V1}/generations`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Leonardo Phoenix ${res.status}: ${raw}`);

  const data = JSON.parse(raw);
  const generationId =
    data.sdGenerationJob?.generationId ?? data.generationId;
  if (!generationId) throw new Error(`Phoenix sin generationId: ${raw}`);

  const [url] = await pollGeneration(generationId);
  return saveRemoteImage(userId, url, prefix);
}

// ─── Función principal exportada ────────────────────────────────────────────

export async function generateTryOnLeonardo(
  userId: string,
  userPhotoUrl: string,
  garments: GarmentInput[],
  extraPrompt?: string,
  isNight = false,
  model: ModelId = "gpt-image-2"
): Promise<string> {
  if (MOCK || garments.length === 0) return userPhotoUrl;
  if (!API_KEY) throw new Error("LEONARDO_API_KEY no configurada");

  console.log(`[leonardo] modelo: ${model} | ${garments.length} prendas:`,
    garments.map((g) => `${g.slot}:"${g.name}"`).join(", "));

  // ── Modelos con referencias de imagen ──
  const userImageId = await uploadImage(userPhotoUrl);
  console.log(`[leonardo] Usuario: ${userImageId}`);

  const { garmentRefs, textOnlyLines } = await buildRefs(garments);

  const garmentInstructions = [
    ...garmentRefs.map((r) => r.promptLine),
    ...textOnlyLines,
  ].join("\n");

  const prompt = buildPrompt(garmentInstructions, isNight, extraPrompt);

  // ── Phoenix: controlnet Character Reference ──
  if (model === "phoenix") {
    return generateWithRetry(() => generatePhoenix(userId, prompt, userImageId));
  }

  // ── GPT Image 2 y Nano Banana 2: guidances.image_reference ──
  const imageReferences = [
    { image: { id: userImageId, type: "UPLOADED" } },
    ...garmentRefs.map((r) => ({ image: { id: r.id, type: "UPLOADED" } })),
  ];
  console.log(`[leonardo] ${imageReferences.length} refs → generando con ${model}...`);

  return generateWithRetry(() =>
    generateV2WithRefs(userId, model as "gpt-image-2" | "nano-banana-2", prompt, imageReferences)
  );
}

// ─── Estilismo (peinado, tinte, bigote, maquillaje…) ────────────────────────

/**
 * Construye el prompt de estilismo. A diferencia del try-on, aquí NO se toca la
 * ropa ni el fondo: la foto de partida se mantiene y solo cambia lo pedido.
 */
function buildStylePrompt(styleLines: string[]): string {
  const parts = [
    "Restyle the person in ref 1. It is the SAME real person: keep the face shape, eyes, nose, mouth, skin tone and body identical.",
    "Keep the same clothes, same pose, same framing, same background and same lighting as ref 1.",
    "Change ONLY the styling listed below:",
    ...styleLines.map((l) => `- ${l}`),
    "Photorealistic, natural skin texture, sharp detail. No other changes.",
  ];
  let prompt = parts.join("\n");
  if (prompt.length > PROMPT_MAX) {
    prompt = prompt.slice(0, PROMPT_MAX);
    console.warn(`[leonardo] Prompt de estilismo truncado a ${PROMPT_MAX} chars`);
  }
  console.log(`[leonardo] Prompt estilismo (${prompt.length} chars)`);
  return prompt;
}

/**
 * Genera una variante de la foto del usuario alterando solo el estilismo
 * (peinado, color de pelo, vello facial, maquillaje, complementos de cabeza).
 * Devuelve la URL pública de la imagen ya guardada en Storage.
 */
export async function generateStyleLookLeonardo(
  userId: string,
  sourcePhotoUrl: string,
  styleLines: string[],
  model: ModelId = "gpt-image-2"
): Promise<string> {
  if (styleLines.length === 0) throw new Error("Sin instrucciones de estilismo");
  if (MOCK) return sourcePhotoUrl;
  if (!API_KEY) throw new Error("LEONARDO_API_KEY no configurada");

  console.log(`[leonardo] estilismo con ${model}:`, styleLines.join(" | "));

  const prompt = buildStylePrompt(styleLines);
  const sourceImageId = await uploadImage(sourcePhotoUrl);
  console.log(`[leonardo] Foto base: ${sourceImageId}`);

  if (model === "phoenix") {
    return generateWithRetry(() => generatePhoenix(userId, prompt, sourceImageId, "style"));
  }

  return generateWithRetry(() =>
    generateV2WithRefs(
      userId,
      model as "gpt-image-2" | "nano-banana-2",
      prompt,
      [{ image: { id: sourceImageId, type: "UPLOADED" } }],
      "style"
    )
  );
}
