import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { AISuggestion } from "@/types";

const MOCK = process.env.AI_MOCK === "true";

const SuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      rationale: z.string(),
      garmentIds: z.array(z.string()),
      shift: z.enum(["TARDE", "NOCHE"]),
    })
  ),
});

type InventoryItem = {
  id: string;
  name: string;
  slot: string;
  status: string;
};

export async function suggestOutfits(
  inventory: InventoryItem[]
): Promise<AISuggestion[]> {
  if (MOCK) {
    const top = inventory.find((i) => i.slot === "TOP");
    const bottom = inventory.find((i) => i.slot === "BOTTOM");
    const coat = inventory.find((i) => i.slot === "COAT");
    return [
      {
        title: "Look Tarde Minimalista",
        rationale:
          "Combinación simulada (AI_MOCK=true). Activa ANTHROPIC_API_KEY para sugerencias reales.",
        garmentIds: [top?.id, bottom?.id].filter(Boolean) as string[],
        shift: "TARDE",
      },
      {
        title: "Look Noche Desértico",
        rationale:
          "Combinación nocturna simulada con abrigo para el frío del desierto.",
        garmentIds: [top?.id, bottom?.id, coat?.id].filter(
          Boolean
        ) as string[],
        shift: "NOCHE",
      },
    ];
  }

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: SuggestionSchema,
    prompt: `Eres estilista especialista en festivales en el desierto (Burning Man).
Condiciones climáticas: TARDE = calor extremo (40°C+), sol fuerte, polvo. NOCHE = frío intenso (5-10°C), requiere abrigo obligatorio.
Principios estéticos de BM: expresión artística, colores vibrantes, lentejuelas, reflejos, LEDs, capas, prendas únicas.

Inventario disponible (id · nombre · categoría · estado):
${inventory.map((i) => `- ${i.id} · ${i.name} · ${i.slot} · ${i.status}`).join("\n")}

Propón exactamente 3 combinaciones NUEVAS, coherentes y con personalidad BM que el usuario quizá no haya considerado.
Reglas:
- Usa únicamente ids del inventario proporcionado
- Toda combinación NOCHE debe incluir al menos un COAT
- Cada combinación debe tener al menos TOP + BOTTOM
- El rationale debe explicar por qué funciona estéticamente en el contexto del festival`,
  });

  return object.suggestions as AISuggestion[];
}
