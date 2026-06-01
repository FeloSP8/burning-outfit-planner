import { saveRemoteImage } from "./storage";
import fs from "fs/promises";
import path from "path";

const MOCK = process.env.AI_MOCK === "true";
const API_KEY = process.env.LEONARDO_API_KEY ?? "";
const BASE = "https://cloud.leonardo.ai/api/rest/v1";

// FLUX.1 Kontext — edición controlada, preserva identidad del usuario
const MODEL_ID = "28aeddf8-bd19-4803-80fc-79602d1a9989";

type GarmentInput = {
  url: string;
  category: "upper_body" | "lower_body";
};

function auth() {
  return { authorization: `Bearer ${API_KEY}`, "content-type": "application/json", accept: "application/json" };
}

/** Sube una imagen local o remota a Leonardo y devuelve el imageId */
async function uploadImage(urlOrPath: string): Promise<string> {
  // Resolver URL local → buffer
  let buffer: Buffer;
  let ext = "jpg";

  if (urlOrPath.startsWith("/")) {
    const absPath = path.join(process.cwd(), "public", urlOrPath);
    buffer = await fs.readFile(absPath);
    ext = path.extname(urlOrPath).slice(1).replace("jpeg", "jpg") || "jpg";
  } else {
    const res = await fetch(urlOrPath);
    buffer = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("png")) ext = "png";
    else if (ct.includes("webp")) ext = "webp";
  }

  // 1. Pedir URL presignada de S3
  const initRes = await fetch(`${BASE}/init-image`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({ extension: ext }),
  });
  const initData = await initRes.json();
  const { id: imageId, url: s3Url, fields: fieldsRaw } = initData.uploadInitImage;
  const fields = JSON.parse(fieldsRaw) as Record<string, string>;

  // 2. Subir a S3 con multipart/form-data
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append("file", new Blob([new Uint8Array(buffer)], { type: `image/${ext}` }));

  const s3Res = await fetch(s3Url, { method: "POST", body: form });
  if (!s3Res.ok && s3Res.status !== 204) {
    throw new Error(`S3 upload failed: ${s3Res.status}`);
  }

  return imageId;
}

/** Espera a que una generación de Leonardo termine y devuelve las URLs de las imágenes */
async function pollGeneration(generationId: string, maxMs = 120_000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${BASE}/generations/${generationId}`, {
      headers: { authorization: `Bearer ${API_KEY}`, accept: "application/json" },
    });
    const data = await res.json();
    const gen = data.generations_by_pk;
    if (!gen) throw new Error("Generación no encontrada");
    if (gen.status === "COMPLETE") {
      return (gen.generated_images as { url: string }[]).map((i) => i.url);
    }
    if (gen.status === "FAILED") throw new Error("La generación falló en Leonardo");
  }
  throw new Error("Timeout esperando la generación de Leonardo");
}

/**
 * Try-on con Leonardo FLUX.1 Kontext.
 * Sube la foto del usuario como imagen base (init_image) y describe
 * las prendas en el prompt para que Kontext las aplique de forma controlada.
 */
export async function generateTryOnLeonardo(
  userPhotoUrl: string,
  garments: GarmentInput[]
): Promise<string> {
  if (MOCK || garments.length === 0) return userPhotoUrl;

  if (!API_KEY) throw new Error("LEONARDO_API_KEY no configurada");

  // Subir foto del usuario como imagen base
  const userImageId = await uploadImage(userPhotoUrl);

  // Construir descripción de prendas para el prompt
  const garmentDescriptions = garments.map((g) =>
    g.category === "upper_body" ? "the top garment shown" : "the bottom garment shown"
  );

  const prompt = `Photo of a person wearing a festival outfit at Burning Man desert.
Apply ${garmentDescriptions.join(" and ")} to the person while preserving their exact face, body shape, skin tone, and pose.
The result should look like a natural photograph of the person wearing these specific clothes.
Keep the original background. Festival aesthetic, photorealistic.`;

  // Lanzar generación con FLUX.1 Kontext en modo image-to-image
  const genRes = await fetch(`${BASE}/generations`, {
    method: "POST",
    headers: auth(),
    body: JSON.stringify({
      modelId: MODEL_ID,
      prompt,
      num_images: 1,
      width: 768,
      height: 1024,
      init_image_id: userImageId,
      init_strength: 0.35,        // 0.35 = preserva bien la persona, aplica la ropa
      guidanceScale: 7,
      photoReal: false,
    }),
  });

  const genData = await genRes.json();
  const generationId = genData.sdGenerationJob?.generationId;
  if (!generationId) {
    throw new Error(`Leonardo no devolvió generationId: ${JSON.stringify(genData)}`);
  }

  // Esperar resultado y guardar localmente
  const [imageUrl] = await pollGeneration(generationId);
  return saveRemoteImage(imageUrl, "tryon");
}
