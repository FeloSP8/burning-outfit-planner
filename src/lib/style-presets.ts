// Catálogo de estilismos de cara para el Estudio de Estilismo.
// Sin dependencias de Node.js — seguro para importar en client components.
//
// El alcance es deliberadamente estrecho: solo pelo y vello facial. Nada de
// ropa, maquillaje ni complementos — de eso ya se encarga el Probador Virtual.
//
// Cada preset lleva el texto en inglés que se inyecta en el prompt de Leonardo:
// los modelos responden mejor en inglés, pero la UI se mantiene en español.

export type StylePreset = {
  id: string;
  label: string;
  emoji: string;
  /** Fragmento en inglés que se añade al prompt de la generación. */
  prompt: string;
};

export type StyleCategory = {
  id: string;
  label: string;
  hint: string;
  /** Si es exclusiva, solo puede haber un preset seleccionado a la vez. */
  exclusive: boolean;
  presets: StylePreset[];
};

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: "hairstyle",
    label: "Peinado",
    hint: "elige uno",
    exclusive: true,
    presets: [
      { id: "mohawk",    emoji: "🦅", label: "Cresta mohawk",   prompt: "Hairstyle: tall spiked mohawk with shaved sides." },
      { id: "dreads",    emoji: "🧶", label: "Rastas",          prompt: "Hairstyle: long dreadlocks gathered back." },
      { id: "braids",    emoji: "🪢", label: "Trenzas pegadas", prompt: "Hairstyle: tight cornrow braids along the scalp." },
      { id: "spacebun",  emoji: "👽", label: "Moños espaciales",prompt: "Hairstyle: two high space buns." },
      { id: "ponytail",  emoji: "🎀", label: "Coleta alta",     prompt: "Hairstyle: slicked-back high ponytail." },
      { id: "undercut",  emoji: "✂️", label: "Undercut",        prompt: "Hairstyle: undercut, shaved sides with longer hair on top swept back." },
      { id: "buzzcut",   emoji: "🪒", label: "Rapado",          prompt: "Hairstyle: very short buzz cut." },
      { id: "waves",     emoji: "🌊", label: "Melena ondulada", prompt: "Hairstyle: shoulder-length loose wavy hair." },
      { id: "straight",  emoji: "📏", label: "Liso largo",      prompt: "Hairstyle: long straight hair with a center parting." },
      { id: "curls",     emoji: "🌀", label: "Rizos definidos", prompt: "Hairstyle: defined bouncy curls." },
      { id: "bangs",     emoji: "🖼️", label: "Flequillo recto", prompt: "Hairstyle: blunt straight fringe over the forehead." },
      { id: "bigvolume", emoji: "🌪️", label: "Volumen XXL",     prompt: "Hairstyle: huge teased voluminous hair." },
    ],
  },
  {
    id: "haircolor",
    label: "Color de pelo",
    hint: "elige uno",
    exclusive: true,
    presets: [
      { id: "pink",     emoji: "🩷", label: "Rosa neón",        prompt: "Hair color: vivid neon pink." },
      { id: "blue",     emoji: "💙", label: "Azul eléctrico",   prompt: "Hair color: electric blue." },
      { id: "purple",   emoji: "💜", label: "Morado",           prompt: "Hair color: deep violet purple." },
      { id: "lime",     emoji: "💚", label: "Verde lima",       prompt: "Hair color: bright lime green." },
      { id: "fire",     emoji: "🔥", label: "Rojo fuego",       prompt: "Hair color: fiery red-orange." },
      { id: "platinum", emoji: "🤍", label: "Platino",          prompt: "Hair color: platinum blonde, almost white." },
      { id: "jetblack", emoji: "🖤", label: "Negro azabache",   prompt: "Hair color: jet black with a glossy sheen." },
      { id: "silver",   emoji: "🪞", label: "Plata holográfico",prompt: "Hair color: holographic silver with iridescent sheen." },
      { id: "rainbow",  emoji: "🌈", label: "Mechas arcoíris",  prompt: "Hair color: multicolor rainbow streaks." },
      { id: "tips",     emoji: "🎨", label: "Puntas de color",  prompt: "Hair color: natural roots fading into brightly colored tips." },
    ],
  },
  {
    id: "facialhair",
    label: "Vello facial",
    hint: "elige uno",
    exclusive: true,
    presets: [
      { id: "handlebar",   emoji: "👨", label: "Bigote manillar", prompt: "Facial hair: thick handlebar moustache with curled tips." },
      { id: "moustache",   emoji: "🥸", label: "Bigote clásico",  prompt: "Facial hair: neat classic moustache, no beard." },
      { id: "walrus",      emoji: "🦭", label: "Bigote de morsa", prompt: "Facial hair: bushy walrus moustache covering the upper lip." },
      { id: "goatee",      emoji: "🐐", label: "Perilla",         prompt: "Facial hair: trimmed goatee." },
      { id: "soulpatch",   emoji: "🎷", label: "Mosca",           prompt: "Facial hair: small soul patch under the lower lip." },
      { id: "stubble",     emoji: "🌵", label: "Barba de 3 días", prompt: "Facial hair: short stubble, three-day beard." },
      { id: "fullbeard",   emoji: "🧔", label: "Barba larga",     prompt: "Facial hair: long full beard." },
      { id: "sideburns",   emoji: "📻", label: "Patillas largas", prompt: "Facial hair: long thick sideburns down to the jaw." },
      { id: "dyedbeard",   emoji: "🩵", label: "Barba teñida",    prompt: "Facial hair: full beard dyed a bright unnatural color." },
      { id: "glitterbeard",emoji: "✨", label: "Barba purpurina", prompt: "Facial hair: beard covered in golden glitter." },
      { id: "cleanshave",  emoji: "🧼", label: "Bien afeitado",   prompt: "Facial hair: completely clean shaven, smooth face, no beard or moustache." },
    ],
  },
];

const PRESETS_BY_ID = new Map(
  STYLE_CATEGORIES.flatMap((c) => c.presets.map((p) => [p.id, p] as const))
);

/** Devuelve el preset con ese id, o `undefined` si no existe. */
export function getStylePreset(id: string): StylePreset | undefined {
  return PRESETS_BY_ID.get(id);
}

/** Todos los ids válidos — útil para validar la entrada de la API. */
export const STYLE_PRESET_IDS = [...PRESETS_BY_ID.keys()];
