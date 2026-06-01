import { saveRemoteImage } from "./storage";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const MOCK = process.env.AI_MOCK === "true";
const API_KEY = process.env.LEONARDO_API_KEY ?? "";

const BASE_V1 = "https://cloud.leonardo.ai/api/rest/v1";
const BASE_V2 = "https://cloud.leonardo.ai/api/rest/v2";

// Límite real confirmado: usuario + 3 referencias de prenda = 4 total
// Estrategia de referencias:
//   Ref 1 → foto del usuario (siempre sola)
//   Ref 2 → TOP (sola, si existe con foto)
//   Ref 3 → BOTTOM (sola, si existe con foto)
//   Ref 4 → COAT solo, o collage de ACCESSORY + SHOES juntos

export type GarmentInput = {
  url: string;
  name: string;
  slot: string; // TOP | BOTTOM | SHOES | ACCESSORY | COAT
};

// Fondo fijo: Black Rock Desert / Burning Man
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

/** Lee una imagen local o remota → Buffer + extensión */
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
 * Crea un collage grid con todas las prendas.
 * Cada prenda se redimensiona a 512×512 y se coloca en una cuadrícula.
 * Devuelve un Buffer PNG listo para subir.
 */
async function buildGarmentCollage(garments: GarmentInput[]): Promise<Buffer> {
  const CELL = 512;
  const cols = garments.length <= 2 ? garments.length : Math.ceil(Math.sqrt(garments.length));
  const rows = Math.ceil(garments.length / cols);
  const W = cols * CELL;
  const H = rows * CELL;

  // Fondo blanco
  const canvas = sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).png();

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < garments.length; i++) {
    const { buffer } = await readImage(garments[i].url);
    const resized = await sharp(buffer)
      .resize(CELL, CELL, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    const col = i % cols;
    const row = Math.floor(i / cols);
    composites.push({ input: resized, left: col * CELL, top: row * CELL });
  }

  return canvas.composite(composites).toBuffer();
}

/** Sube un Buffer PNG a Leonardo vía URL presignada S3 → imageId */
async function uploadBuffer(buffer: Buffer, ext = "png"): Promise<string> {
  const initRes = await fetch(`${BASE_V1}/init-image`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ extension: ext }),
  });
  if (!initRes.ok) throw new Error(`Error presigned URL: ${initRes.status} ${await initRes.text()}`);

  const initData = await initRes.json();
  const { id: imageId, url: s3Url, fields: fieldsRaw } = initData.uploadInitImage;
  const fields = JSON.parse(fieldsRaw) as Record<string, string>;

  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append("file", new Blob([new Uint8Array(buffer)], { type: `image/${ext}` }));

  const s3Res = await fetch(s3Url, { method: "POST", body: form });
  if (!s3Res.ok && s3Res.status !== 204) throw new Error(`S3 upload error: ${s3Res.status}`);

  return imageId;
}

/** Sube una imagen desde path/URL → imageId */
async function uploadImage(urlOrPath: string): Promise<string> {
  const { buffer, ext } = await readImage(urlOrPath);
  return uploadBuffer(buffer, ext);
}

/** Polling GET /v1/generations/:id hasta COMPLETE o FAILED */
async function pollGeneration(generationId: string, maxMs = 180_000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${BASE_V1}/generations/${generationId}`, { headers: headers(false) });
    if (!res.ok) throw new Error(`Poll error: ${res.status}`);
    const data = await res.json();
    const gen = data.generations_by_pk;
    if (!gen) throw new Error("Generación no encontrada");
    if (gen.status === "COMPLETE") {
      const imgs = gen.generated_images as { url: string }[];
      if (!imgs?.length) throw new Error("COMPLETE pero sin imágenes");
      return imgs.map((i) => i.url);
    }
    if (gen.status === "FAILED") throw new Error("La generación falló en Leonardo");
  }
  throw new Error("Timeout: Leonardo tardó más de 3 minutos");
}

/**
 * Virtual Try-On con GPT Image 2 de Leonardo.
 *
 * Límite real de la API: 3 referencias máximo (usuario + 2 prendas).
 * Con más prendas se componen en un collage 512×N que cuenta como 1 referencia.
 * Siempre: ref 1 = usuario, ref 2 = collage de prendas (o prenda única si solo hay 1).
 */
export async function generateTryOnLeonardo(
  userPhotoUrl: string,
  garments: GarmentInput[],
  extraPrompt?: string
): Promise<string> {
  if (MOCK || garments.length === 0) return userPhotoUrl;
  if (!API_KEY) throw new Error("LEONARDO_API_KEY no configurada");

  console.log(`[leonardo] ${garments.length} prendas:`, garments.map((g) => `${g.slot}:"${g.name}"`).join(", "));

  const slotDesc: Record<string, string> = {
    TOP:       "upper body garment (shirt, jacket, kimono, etc.)",
    BOTTOM:    "lower body garment (pants, skirt, shorts, etc.)",
    SHOES:     "footwear — place exactly on the person's feet",
    ACCESSORY: "accessory (hat → on head, glasses → on face, bag → on shoulder, etc.)",
    COAT:      "outer coat/cape — worn over the other garments",
  };

  // --- Subir foto del usuario ---
  const userImageId = await uploadImage(userPhotoUrl);
  console.log(`[leonardo] Usuario: ${userImageId}`);

  // --- Construir referencias por prioridad ---
  // TOP y BOTTOM siempre van solos. COAT solo. ACCESSORY+SHOES en collage si hay varios.
  const top       = garments.find((g) => g.slot === "TOP");
  const bottom    = garments.find((g) => g.slot === "BOTTOM");
  const coat      = garments.find((g) => g.slot === "COAT");
  const secondary = garments.filter((g) => g.slot === "ACCESSORY" || g.slot === "SHOES");

  // Slots individuales a subir: TOP → BOTTOM → COAT (en ese orden de prioridad)
  const soloSlots = [top, bottom, coat].filter(Boolean) as GarmentInput[];

  // Construimos las referencias respetando el límite de 3 garment refs
  // Orden: TOP, BOTTOM, luego o bien COAT solo o collage de accesorios/calzado
  type GarmentRef = { id: string; promptLine: string; refIndex: number };
  const garmentRefs: GarmentRef[] = [];
  let refIndex = 2; // ref 1 = usuario

  for (const g of soloSlots) {
    if (refIndex > 4) break; // máx 4 refs totales (1 usuario + 3 prendas)
    const id = await uploadImage(g.url);
    garmentRefs.push({
      id,
      promptLine: `- Reference image ${refIndex}: "${g.name}" — ${slotDesc[g.slot] ?? g.slot}. Apply exactly as shown.`,
      refIndex,
    });
    console.log(`[leonardo] ${g.slot} "${g.name}": ${id} (ref ${refIndex})`);
    refIndex++;
  }

  // Si quedan huecos y hay accesorios/calzado, añadirlos
  if (secondary.length > 0 && refIndex <= 4) {
    if (secondary.length === 1) {
      // Solo uno → referencia individual
      const g = secondary[0];
      const id = await uploadImage(g.url);
      garmentRefs.push({
        id,
        promptLine: `- Reference image ${refIndex}: "${g.name}" — ${slotDesc[g.slot] ?? g.slot}. Apply exactly as shown.`,
        refIndex,
      });
      console.log(`[leonardo] ${g.slot} "${g.name}": ${id} (ref ${refIndex})`);
    } else {
      // Varios → collage
      console.log(`[leonardo] ${secondary.length} accesorios/calzado → collage`);
      const collageBuffer = await buildGarmentCollage(secondary);
      const collageId = await uploadBuffer(collageBuffer, "png");
      const cols = secondary.length <= 4 ? 2 : Math.ceil(Math.sqrt(secondary.length));
      const cellList = secondary.map((g, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return `    [row ${row + 1}, col ${col + 1}] "${g.name}" — ${slotDesc[g.slot] ?? g.slot}`;
      }).join("\n");
      garmentRefs.push({
        id: collageId,
        promptLine: `- Reference image ${refIndex}: collage of accessories/footwear — apply ALL of them:\n${cellList}`,
        refIndex,
      });
      console.log(`[leonardo] Collage accesorios/calzado: ${collageId} (ref ${refIndex})`);
    }
  }

  // Prendas sin foto o que no caben → mencionarlas solo en el prompt
  const garmentIdsUsed = new Set([top, bottom, coat, ...secondary].filter(Boolean).map((g) => g!.url));
  const textOnlyGarments = garments.filter((g) => !g.url || !garmentIdsUsed.has(g.url));

  // --- Referencias finales ---
  const imageReferences = [
    { image: { id: userImageId, type: "UPLOADED" } },
    ...garmentRefs.map((r) => ({ image: { id: r.id, type: "UPLOADED" } })),
  ];

  // --- Instrucciones de prendas para el prompt ---
  const garmentInstructions = [
    ...garmentRefs.map((r) => r.promptLine),
    ...textOnlyGarments.map((g) => `- (no image) "${g.name}" — ${slotDesc[g.slot] ?? g.slot}. Include it based on its name.`),
  ].join("\n");

  const prompt = [
    "=== VIRTUAL TRY-ON TASK ===",
    "",
    "STEP 1 — PERSON (Reference image 1):",
    "This is the person to dress. You MUST preserve with 100% fidelity:",
    "- Their EXACT face: bone structure, eyes, nose, mouth, skin tone, expression",
    "- Their hair: color, length, style",
    "- Their body shape and proportions",
    "- Their pose",
    "⚠ CRITICAL: Do NOT alter the face under any circumstances. The face in the output must be IDENTICAL to reference image 1.",
    "",
    "STEP 2 — GARMENTS to apply:",
    garmentInstructions,
    "",
    "STEP 3 — OUTPUT RULES:",
    "- Show the person wearing ALL listed garments simultaneously",
    "- Each garment must match its reference exactly: same colors, patterns, textures",
    "- The final image must look like a real photograph — photorealistic",
    "- The person's face and identity must be perfectly preserved from reference image 1",
    "",
    DESERT_BACKGROUND,
    ...(extraPrompt?.trim() ? ["", `Additional instructions: ${extraPrompt.trim()}`] : []),
  ].join("\n");

  const requestBody = {
    model: "gpt-image-2",
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

  console.log(`[leonardo] ${imageReferences.length} referencias → IDs:`, imageReferences.map(r => r.image.id).join(", "));
  console.log(`[leonardo] Body completo:`, JSON.stringify(requestBody));

  const genRes = await fetch(`${BASE_V2}/generations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(requestBody),
  });

  const genRaw = await genRes.text();
  if (!genRes.ok) throw new Error(`Leonardo v2 ${genRes.status}: ${genRaw}`);

  const genData = JSON.parse(genRaw);

  if ((genData.images as { url: string }[] | undefined)?.length) {
    return saveRemoteImage(genData.images[0].url, "tryon");
  }

  const generationId: string | undefined =
    genData.generate?.generationId ?? genData.generationId ?? genData.sdGenerationJob?.generationId;

  if (!generationId) throw new Error(`Leonardo no devolvió generationId ni imágenes: ${genRaw}`);

  console.log(`[leonardo] generationId: ${generationId}`);
  const [imageUrl] = await pollGeneration(generationId);
  return saveRemoteImage(imageUrl, "tryon");
}
