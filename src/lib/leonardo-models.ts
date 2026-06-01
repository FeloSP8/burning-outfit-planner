// Catálogo de modelos — sin dependencias de Node.js, seguro para importar en client components

export type ModelId = "gpt-image-2" | "nano-banana-2" | "phoenix";

export const LEONARDO_MODELS: {
  id: ModelId;
  label: string;
  description: string;
}[] = [
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    description: "Mayor fidelidad al outfit. Recomendado para try-on.",
  },
  {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    description: "Más rápido y ligero. Buen balance velocidad/calidad.",
  },
  {
    id: "phoenix",
    label: "Phoenix 1.0",
    description: "Modelo propio de Leonardo. Alta calidad fotorrealista.",
  },
];
