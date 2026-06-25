import { saveRemoteImage } from "./storage";

const MOCK = process.env.AI_MOCK === "true";
// IDM-VTON: recibe human_img + garment_img, preserva identidad y prenda real
const IDM_VTON_VERSION =
  "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

type GarmentInput = {
  url: string;
  category: "upper_body" | "lower_body";
};

export async function generateTryOn(
  userId: string,
  userPhotoUrl: string,
  garments: GarmentInput[]
): Promise<string> {
  if (MOCK || garments.length === 0) return userPhotoUrl;

  // Importación dinámica para que no rompa si no hay token configurado
  const Replicate = (await import("replicate")).default;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  let currentHuman = userPhotoUrl.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}${userPhotoUrl}`
    : userPhotoUrl;

  for (const g of garments) {
    const garmentUrl = g.url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}${g.url}`
      : g.url;

    const output = (await replicate.run(
      `cuuupid/idm-vton:${IDM_VTON_VERSION}`,
      {
        input: {
          human_img: currentHuman,
          garm_img: garmentUrl,
          category: g.category,
          garment_des: "festival desert outfit",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42,
        },
      }
    )) as unknown as string;

    currentHuman = output;
  }

  return saveRemoteImage(userId, currentHuman, "tryon");
}
