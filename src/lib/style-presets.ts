// Catálogo de estilismos para el Estudio de Estilismo.
// Sin dependencias de Node.js — seguro para importar en client components.
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
  /** Si es exclusiva, solo puede haber un preset seleccionado a la vez. */
  exclusive: boolean;
  presets: StylePreset[];
};

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: "hairstyle",
    label: "Peinado",
    exclusive: true,
    presets: [
      { id: "mohawk",    emoji: "🦅", label: "Cresta mohawk",   prompt: "Hairstyle: tall spiked mohawk, shaved sides." },
      { id: "dreads",    emoji: "🧶", label: "Rastas",          prompt: "Hairstyle: long dreadlocks gathered back." },
      { id: "braids",    emoji: "🪢", label: "Trenzas pegadas", prompt: "Hairstyle: tight cornrow braids along the scalp." },
      { id: "spacebun",  emoji: "👽", label: "Moños espaciales",prompt: "Hairstyle: two high space buns." },
      { id: "buzzcut",   emoji: "🪒", label: "Rapado",          prompt: "Hairstyle: very short buzz cut." },
      { id: "waves",     emoji: "🌊", label: "Melena ondulada", prompt: "Hairstyle: shoulder-length loose wavy hair." },
      { id: "ponytails", emoji: "🎀", label: "Coletas altas",   prompt: "Hairstyle: two high ponytails." },
      { id: "bigvolume", emoji: "🌪️", label: "Volumen XXL",     prompt: "Hairstyle: huge teased voluminous hair." },
    ],
  },
  {
    id: "haircolor",
    label: "Color de pelo",
    exclusive: true,
    presets: [
      { id: "pink",     emoji: "🩷", label: "Rosa neón",     prompt: "Hair color: vivid neon pink." },
      { id: "blue",     emoji: "💙", label: "Azul eléctrico",prompt: "Hair color: electric blue." },
      { id: "platinum", emoji: "🤍", label: "Platino",       prompt: "Hair color: platinum blonde, almost white." },
      { id: "fire",     emoji: "🔥", label: "Rojo fuego",    prompt: "Hair color: fiery red-orange." },
      { id: "lime",     emoji: "💚", label: "Verde lima",    prompt: "Hair color: bright lime green." },
      { id: "rainbow",  emoji: "🌈", label: "Mechas arcoíris", prompt: "Hair color: multicolor rainbow streaks." },
      { id: "silver",   emoji: "🪞", label: "Plata holográfico", prompt: "Hair color: holographic silver with iridescent sheen." },
    ],
  },
  {
    id: "facialhair",
    label: "Vello facial",
    exclusive: true,
    presets: [
      { id: "handlebar", emoji: "👨", label: "Bigote manillar", prompt: "Facial hair: thick handlebar moustache with curled tips." },
      { id: "moustache", emoji: "🥸", label: "Bigote clásico",  prompt: "Facial hair: neat classic moustache." },
      { id: "goatee",    emoji: "🐐", label: "Perilla",         prompt: "Facial hair: trimmed goatee." },
      { id: "fullbeard", emoji: "🧔", label: "Barba larga",     prompt: "Facial hair: long full beard." },
      { id: "glitterbeard", emoji: "✨", label: "Barba con purpurina", prompt: "Facial hair: beard covered in golden glitter." },
      { id: "cleanshave",emoji: "🧼", label: "Bien afeitado",   prompt: "Facial hair: completely clean shaven, smooth face." },
    ],
  },
  {
    id: "makeup",
    label: "Cara y maquillaje",
    exclusive: false,
    presets: [
      { id: "glitter",  emoji: "🌟", label: "Purpurina",        prompt: "Makeup: glitter dusted across cheekbones and eyelids." },
      { id: "graphic",  emoji: "🖤", label: "Delineado gráfico",prompt: "Makeup: bold graphic eyeliner in geometric shapes." },
      { id: "warpaint", emoji: "🎨", label: "Pintura tribal",   prompt: "Makeup: tribal war paint stripes on the face." },
      { id: "gems",     emoji: "💎", label: "Gemas en la cara", prompt: "Makeup: small rhinestone gems applied around the eyes." },
      { id: "lashes",   emoji: "👁️", label: "Pestañas XXL",     prompt: "Makeup: dramatic oversized false eyelashes." },
      { id: "dust",     emoji: "🏜️", label: "Polvo de playa",   prompt: "Fine white playa dust on the face and hair, sun-worn look." },
    ],
  },
  {
    id: "extras",
    label: "Complementos de cabeza",
    exclusive: false,
    presets: [
      { id: "goggles",  emoji: "🥽", label: "Gogles de polvo",  prompt: "Dust goggles worn on the forehead." },
      { id: "shades",   emoji: "🕶️", label: "Gafas futuristas", prompt: "Futuristic wraparound sunglasses." },
      { id: "feathers", emoji: "🪶", label: "Tocado de plumas", prompt: "Feather headdress crowning the head." },
      { id: "leds",     emoji: "💡", label: "LEDs en el pelo",  prompt: "Glowing LED string lights woven into the hair." },
      { id: "bandana",  emoji: "🧣", label: "Pañuelo",          prompt: "Bandana tied around the head." },
      { id: "furhat",   emoji: "🧢", label: "Gorro de pelo",    prompt: "Fluffy fur hat on the head." },
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
