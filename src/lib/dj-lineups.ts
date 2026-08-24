/**
 * Line-ups de música del evento, transcritos de los carteles que publican los
 * campamentos. Es un catálogo fijo: no hay API que dé esto, así que vive en
 * código y se actualiza a mano cuando sale un cartel nuevo.
 *
 * Fuentes (Instagram de cada campamento, agosto 2026):
 *   • Playground — Arrival Stage (2 & C)
 *   • Playground — Dune Lounge  (2 & C)
 *   • Opulent Temple            (10 & Esplanade)
 *   • Symbio                    (2:30 & F)
 *   • The Melon Motel           (2:00 & I)
 *   • Favela ArtCar             (art car, sin sitio fijo)
 *   • Nova Heaven               (deep playa, la \"DMZ\")
 *   • Huofeng                   (10 & K)
 *   • Longfeng                  (art car, 10 & K)
 *   • Robot Heart               (el Bus, aparca en un sitio distinto cada día)
 *
 * OJO con los ids: `DjPick.setId` los guarda en base de datos. Cambiar un id
 * existente equivale a borrar la selección de todo el mundo para ese set.
 */

export interface Venue {
  id: string;
  /** Nombre del campamento o colectivo. */
  name: string;
  /** Escenario concreto, cuando el campamento tiene más de uno. */
  stage?: string;
  /** Dirección en la ciudad (calle & radial). */
  location: string;
  emoji: string;
  /** Clases Tailwind del acento de color; una paleta por escenario. */
  theme: {
    card: string;
    border: string;
    chip: string;
    text: string;
  };
}

export interface DjSet {
  /** Estable y único en todo el catálogo: se guarda en la base de datos. */
  id: string;
  /** Cómo se lee en el cartel: "Gordo B2B Marten Lou". */
  label: string;
  /** Artistas por separado, para el buscador. */
  artists: string[];
  /**
   * Hora de inicio en formato 24 h "HH:MM", o `null` cuando el cartel solo da
   * la hora de arranque de la fiesta y el orden de los sets (los dos
   * escenarios de Playground son así).
   */
  start: string | null;
  /** Set en directo, no pinchado. */
  live?: boolean;
  /** Cabeza de cartel — el ✳ que marca el cartel. */
  headliner?: boolean;
  /** Matiz del cartel: "madhaus set", "DJ set", "hybrid"… */
  note?: string;
  /**
   * Varios carteles marcan con un icono el set durante el cual sale o se pone
   * el sol. No es decoración: en una noche sin hora de cierre, saber que un
   * set concreto pilla el amanecer dice hasta dónde llega la fiesta.
   */
  sun?: "amanecer" | "atardecer";
}

export type PartyKind = "night" | "sunset" | "sunrise" | "day";

export interface Party {
  id: string;
  venueId: string;
  /** Fecha del día en que **arranca** la fiesta (YYYY-MM-DD). */
  date: string;
  /** Nombre de la fiesta en el cartel: "The Arrival", "Cosmic Dance"… */
  name: string;
  kind: PartyKind;
  /** Hora de arranque "HH:MM". */
  start: string;
  /** Hora de cierre "HH:MM"; si es menor que `start`, cruza la medianoche. */
  end?: string;
  /** Aclaración cuando el cartel no es legible del todo. */
  note?: string;
  /**
   * Dónde se monta esa fiesta concreta, cuando no es la dirección del
   * escenario. Robot Heart es un bus: cada noche aparca en otro sitio.
   */
  where?: string;
  /**
   * Cuánto dura cada set cuando el cartel no da horas, en minutos, para las
   * fiestas donde la regla general (`estimatedSlotMinutes`) se queda lejos.
   * Symbio la usa: a dos horas por set, sus seis nombres estiraban la mañana
   * hasta las nueve de la noche.
   */
  setMinutes?: number;
  sets: DjSet[];
}

/** Un día del evento, con su etiqueta de siempre. */
export interface EventDay {
  date: string;
  /** "Lunes", "Martes"… ya en español para no depender del locale. */
  weekday: string;
  /** Día del mes con mes corto: "31 ago". */
  short: string;
  /** Lo que pasa ese día, si es señalado. */
  label?: string;
}

/**
 * Burning Man 2026: domingo 30 de agosto → lunes 7 de septiembre.
 * El Hombre arde el sábado 5 y el Templo el domingo 6, que es lo que fija la
 * correspondencia entre el día de la semana de los carteles y la fecha real.
 */
export const EVENT_DAYS: EventDay[] = [
  { date: "2026-08-30", weekday: "Domingo",   short: "30 ago", label: "Apertura de puertas" },
  { date: "2026-08-31", weekday: "Lunes",     short: "31 ago" },
  { date: "2026-09-01", weekday: "Martes",    short: "1 sep" },
  { date: "2026-09-02", weekday: "Miércoles", short: "2 sep" },
  { date: "2026-09-03", weekday: "Jueves",    short: "3 sep" },
  { date: "2026-09-04", weekday: "Viernes",   short: "4 sep" },
  { date: "2026-09-05", weekday: "Sábado",    short: "5 sep", label: "Arde el Hombre" },
  { date: "2026-09-06", weekday: "Domingo",   short: "6 sep", label: "Arde el Templo" },
  { date: "2026-09-07", weekday: "Lunes",     short: "7 sep", label: "Cierre" },
];

export const VENUES: Venue[] = [
  {
    id: "playground-arrival",
    name: "Playground",
    stage: "Arrival Stage",
    location: "2 & C",
    emoji: "🎡",
    theme: {
      card: "bg-violet-50/70",
      border: "border-violet-200",
      chip: "bg-violet-100 text-violet-900",
      text: "text-violet-900",
    },
  },
  {
    id: "playground-dune",
    name: "Playground",
    stage: "Dune Lounge",
    location: "2 & C",
    emoji: "🏜️",
    theme: {
      card: "bg-sky-50/70",
      border: "border-sky-200",
      chip: "bg-sky-100 text-sky-900",
      text: "text-sky-900",
    },
  },
  {
    id: "opulent-temple",
    name: "Opulent Temple",
    location: "10 & Esplanade",
    emoji: "🔱",
    theme: {
      card: "bg-rose-50/70",
      border: "border-rose-200",
      chip: "bg-rose-100 text-rose-900",
      text: "text-rose-900",
    },
  },
  {
    id: "symbio",
    name: "Symbio",
    location: "2:30 & F",
    emoji: "🌴",
    theme: {
      card: "bg-amber-50/70",
      border: "border-amber-300",
      chip: "bg-amber-100 text-amber-900",
      text: "text-amber-900",
    },
  },
  {
    id: "melon-motel",
    name: "The Melon Motel",
    location: "2:00 & I",
    emoji: "🍉",
    theme: {
      card: "bg-emerald-50/70",
      border: "border-emerald-300",
      chip: "bg-emerald-100 text-emerald-900",
      text: "text-emerald-900",
    },
  },
  {
    id: "favela",
    name: "Favela ArtCar",
    location: "art car · sin sitio fijo",
    emoji: "💀",
    theme: {
      card: "bg-slate-100/80",
      border: "border-slate-400",
      chip: "bg-slate-200 text-slate-900",
      text: "text-slate-900",
    },
  },
  {
    id: "nova-heaven",
    name: "Nova Heaven",
    location: "deep playa · la DMZ",
    emoji: "✨",
    theme: {
      card: "bg-indigo-50/80",
      border: "border-indigo-300",
      chip: "bg-indigo-100 text-indigo-900",
      text: "text-indigo-900",
    },
  },
  {
    id: "huofeng",
    name: "Huofeng",
    location: "10 & K",
    emoji: "🦚",
    theme: {
      card: "bg-red-50/80",
      border: "border-red-300",
      chip: "bg-red-100 text-red-900",
      text: "text-red-900",
    },
  },
  {
    id: "longfeng",
    name: "Longfeng",
    location: "10 & K · art car",
    emoji: "🐉",
    theme: {
      card: "bg-fuchsia-50/80",
      border: "border-fuchsia-300",
      chip: "bg-fuchsia-100 text-fuchsia-900",
      text: "text-fuchsia-900",
    },
  },
  {
    id: "robot-heart",
    name: "Robot Heart",
    location: "el Bus · aparca donde toque",
    emoji: "🤖",
    theme: {
      card: "bg-teal-50/80",
      border: "border-teal-300",
      chip: "bg-teal-100 text-teal-900",
      text: "text-teal-900",
    },
  },
];

export const PARTIES: Party[] = [
  // ─────────────────────────── Opulent Temple ───────────────────────────
  {
    id: "ot-mon",
    venueId: "opulent-temple",
    date: "2026-08-31",
    name: "Axis of Opulence",
    kind: "night",
    start: "21:00",
    end: "03:45",
    sets: [
      { id: "ot-mon-opening",     label: "Ceremonia de apertura", artists: [],                  start: "21:00" },
      { id: "ot-mon-enmi",        label: "ENMI",                  artists: ["ENMI"],            start: "21:15" },
      { id: "ot-mon-syd-gris",    label: "Syd Gris",              artists: ["Syd Gris"],        start: "22:15" },
      { id: "ot-mon-artemistique",label: "Artemistique",          artists: ["Artemistique"],    start: "23:15" },
      { id: "ot-mon-maddy-oneal", label: "Maddy O'Neal",          artists: ["Maddy O'Neal"],    start: "00:15", note: "madhaus set" },
      { id: "ot-mon-slander",     label: "SLANDER presents Before Dawn", artists: ["SLANDER"],  start: "01:15" },
      { id: "ot-mon-casmalia",    label: "Casmalia",              artists: ["Casmalia"],        start: "02:45" },
    ],
  },
  {
    id: "ot-tue",
    venueId: "opulent-temple",
    date: "2026-09-01",
    name: "Energy Mundi",
    kind: "night",
    start: "21:00",
    end: "05:00",
    sets: [
      { id: "ot-tue-thiccboi",      label: "Thiccboi Drewski",  artists: ["Thiccboi Drewski"],  start: "21:00" },
      { id: "ot-tue-just-b",        label: "Just B",            artists: ["Just B"],            start: "22:15" },
      { id: "ot-tue-infected-live", label: "Infected Mushroom", artists: ["Infected Mushroom"], start: "23:30", live: true },
      { id: "ot-tue-infected-dj",   label: "Infected Mushroom", artists: ["Infected Mushroom"], start: "01:15", note: "DJ set" },
      { id: "ot-tue-speaker-honey", label: "Speaker Honey",     artists: ["Speaker Honey"],     start: "02:45" },
      { id: "ot-tue-dj-icon",       label: "DJ Icon",           artists: ["DJ Icon"],           start: "04:00" },
    ],
  },
  {
    id: "ot-wed",
    venueId: "opulent-temple",
    date: "2026-09-02",
    name: "Sacred Dance · The White Party",
    kind: "night",
    start: "20:00",
    end: "07:30",
    sets: [
      { id: "ot-wed-lyss",           label: "Lyss",            artists: ["Lyss"],            start: "20:00" },
      { id: "ot-wed-offskee",        label: "Offskee",         artists: ["Offskee"],         start: "21:00" },
      { id: "ot-wed-syd-gris",       label: "Syd Gris",        artists: ["Syd Gris"],        start: "22:00" },
      { id: "ot-wed-doozie",         label: "Doozie",          artists: ["Doozie"],          start: "23:00" },
      { id: "ot-wed-vintage-culture",label: "Vintage Culture", artists: ["Vintage Culture"], start: "00:00", headliner: true },
      { id: "ot-wed-beltran",        label: "Beltran",         artists: ["Beltran"],         start: "02:00" },
      { id: "ot-wed-grammar",        label: "Grammar",         artists: ["Grammar"],         start: "04:00" },
      { id: "ot-wed-crispy",         label: "Crispy",          artists: ["Crispy"],          start: "05:00" },
      { id: "ot-wed-madison-orange", label: "Madison Orange",  artists: ["Madison Orange"],  start: "06:00", sun: "amanecer" },
    ],
  },
  {
    id: "ot-thu-sunset",
    venueId: "opulent-temple",
    date: "2026-09-03",
    name: "Golden Hour",
    kind: "sunset",
    start: "16:00",
    end: "21:00",
    note: "La hora del primer set queda tapada en el cartel; se asume 16:00 como el viernes.",
    sets: [
      { id: "ot-thu-mr-bounceman",  label: "Mr Bounceman",   artists: ["Mr Bounceman"],   start: "16:00" },
      { id: "ot-thu-fleetmac-wood", label: "Fleetmac Wood",  artists: ["Fleetmac Wood"],  start: "18:00" },
      { id: "ot-thu-don-gentry",    label: "Don Gentry",     artists: ["Don Gentry"],     start: "20:00" },
    ],
  },
  {
    id: "ot-thu",
    venueId: "opulent-temple",
    date: "2026-09-03",
    name: "Playa Pure",
    kind: "night",
    start: "21:00",
    end: "07:30",
    sets: [
      { id: "ot-thu-zenti",         label: "Zenti",          artists: ["Zenti"],          start: "21:00" },
      { id: "ot-thu-kazami",        label: "Kazami",         artists: ["Kazami"],         start: "22:00" },
      { id: "ot-thu-spencer-brown", label: "Spencer Brown",  artists: ["Spencer Brown"],  start: "23:00" },
      { id: "ot-thu-nora-en-pure",  label: "Nora En Pure",   artists: ["Nora En Pure"],   start: "00:30", headliner: true },
      { id: "ot-thu-marten-lou",    label: "Marten Lou",     artists: ["Marten Lou"],     start: "02:30" },
      { id: "ot-thu-admiral",       label: "Admiral",        artists: ["Admiral"],        start: "04:00" },
      { id: "ot-thu-fiers",         label: "Fiers",          artists: ["Fiers"],          start: "05:00" },
      { id: "ot-thu-obie-fernandez",label: "Obie Fernandez", artists: ["Obie Fernandez"], start: "06:00", sun: "amanecer" },
    ],
  },
  {
    id: "ot-fri-sunset",
    venueId: "opulent-temple",
    date: "2026-09-04",
    name: "Golden Hour",
    kind: "sunset",
    start: "16:00",
    end: "21:00",
    sets: [
      { id: "ot-fri-nadav-vee",      label: "Nadav Vee",      artists: ["Nadav Vee"],      start: "16:00" },
      { id: "ot-fri-club-de-combat", label: "Clüb de Combat", artists: ["Clüb de Combat"], start: "17:00" },
      { id: "ot-fri-rafael",         label: "Rafael",         artists: ["Rafael"],         start: "18:30" },
      { id: "ot-fri-sage-ferris",    label: "Sage Ferris",    artists: ["Sage Ferris"],    start: "20:00" },
    ],
  },
  {
    id: "ot-fri",
    venueId: "opulent-temple",
    date: "2026-09-04",
    name: "Cosmic Dance",
    kind: "night",
    start: "21:00",
    end: "07:30",
    sets: [
      { id: "ot-fri-josh-forster",    label: "Josh Forster",           artists: ["Josh Forster"],                start: "21:00" },
      { id: "ot-fri-mobad",           label: "Mobâd",                  artists: ["Mobâd"],                       start: "22:00" },
      { id: "ot-fri-sebastian-konrad",label: "Sebastian Konrad",       artists: ["Sebastian Konrad"],            start: "23:00" },
      { id: "ot-fri-maxi-meraki",     label: "Maxi Meraki",            artists: ["Maxi Meraki"],                 start: "00:00" },
      { id: "ot-fri-mahmut-arodes",   label: "Mahmut Orhan B2B Arodes",artists: ["Mahmut Orhan", "Arodes"],      start: "01:30", headliner: true },
      { id: "ot-fri-dj-icon",         label: "DJ Icon",                artists: ["DJ Icon"],                     start: "03:15" },
      { id: "ot-fri-ashley-ames",     label: "Ashley Ames",            artists: ["Ashley Ames"],                 start: "04:15" },
      { id: "ot-fri-azriel",          label: "Azriel",                 artists: ["Azriel"],                      start: "05:15" },
      { id: "ot-fri-major-nisene",    label: "Major Trouble & Nisene", artists: ["Major Trouble", "Nisene"],     start: "06:00", sun: "amanecer" },
    ],
  },
  {
    id: "ot-sat",
    venueId: "opulent-temple",
    date: "2026-09-05",
    name: "Still Burning",
    kind: "night",
    start: "22:30",
    end: "03:15",
    sets: [
      { id: "ot-sat-emanate",       label: "Emanate",       artists: ["Emanate"],       start: "22:30" },
      { id: "ot-sat-vanjee",        label: "Vanjee",        artists: ["Vanjee"],        start: "23:45" },
      { id: "ot-sat-alex-amaro",    label: "Alex Amaro",    artists: ["Alex Amaro"],    start: "01:15" },
      { id: "ot-sat-richard-mixon", label: "Richard Mixon", artists: ["Richard Mixon"], start: "02:15" },
    ],
  },

  // ────────────────────── Playground · Arrival Stage ──────────────────────
  {
    id: "pg-arr-tue",
    venueId: "playground-arrival",
    date: "2026-09-01",
    name: "The Arrival",
    kind: "night",
    start: "21:00",
    sets: [
      { id: "pg-arr-tue-calussa",        label: "Calussa",         artists: ["Calussa"],         start: null },
      { id: "pg-arr-tue-doozie",         label: "Doozie",          artists: ["Doozie"],          start: null },
      { id: "pg-arr-tue-beltran",        label: "Beltran",         artists: ["Beltran"],         start: null },
      { id: "pg-arr-tue-carlita",        label: "Carlita",         artists: ["Carlita"],         start: null },
      { id: "pg-arr-tue-anna",           label: "Anna",            artists: ["Anna"],            start: null },
      { id: "pg-arr-tue-vintage-culture",label: "Vintage Culture", artists: ["Vintage Culture"], start: null, headliner: true },
    ],
  },
  {
    id: "pg-arr-wed",
    venueId: "playground-arrival",
    date: "2026-09-02",
    name: "Halo Dust",
    kind: "night",
    start: "21:00",
    sets: [
      { id: "pg-arr-wed-darco",      label: "Darco",       artists: ["Darco"],       start: null },
      { id: "pg-arr-wed-rafael",     label: "Rafael",      artists: ["Rafael"],      start: null },
      { id: "pg-arr-wed-omri",       label: "Omri.",       artists: ["Omri."],       start: null },
      { id: "pg-arr-wed-ahmed-spins",label: "Ahmed Spins", artists: ["Ahmed Spins"], start: null },
      { id: "pg-arr-wed-deer-jade",  label: "Deer Jade",   artists: ["Deer Jade"],   start: null },
    ],
  },
  {
    id: "pg-arr-thu",
    venueId: "playground-arrival",
    date: "2026-09-03",
    name: "Afrika",
    kind: "night",
    start: "22:00",
    sets: [
      { id: "pg-arr-thu-sparrow-aryme",  label: "Sparrow B2B Arymé",             artists: ["Sparrow", "Arymé"],              start: null },
      { id: "pg-arr-thu-gordo-marten",   label: "Gordo B2B Marten Lou",          artists: ["Gordo", "Marten Lou"],           start: null },
      { id: "pg-arr-thu-maxi-meraki",    label: "Maxi Meraki",                   artists: ["Maxi Meraki"],                   start: null },
      { id: "pg-arr-thu-arodes",         label: "Arodes",                        artists: ["Arodes"],                        start: null },
      { id: "pg-arr-thu-mahmut-francis", label: "Mahmut Orhan B2B Francis Mercier", artists: ["Mahmut Orhan", "Francis Mercier"], start: null },
      { id: "pg-arr-thu-goldfish",       label: "Goldfish",                      artists: ["Goldfish"],                      start: null, headliner: true },
    ],
  },
  {
    id: "pg-arr-fri",
    venueId: "playground-arrival",
    date: "2026-09-04",
    name: "We Are Live",
    kind: "night",
    start: "22:00",
    sets: [
      { id: "pg-arr-fri-double-touch",  label: "Double Touch",   artists: ["Double Touch"],   start: null, live: true },
      { id: "pg-arr-fri-orbit",         label: "Orbit",          artists: ["Orbit"],          start: null, live: true },
      { id: "pg-arr-fri-natascha-polke",label: "Natascha Polké", artists: ["Natascha Polké"], start: null, live: true },
      { id: "pg-arr-fri-jan-blomqvist", label: "Jan Blomqvist",  artists: ["Jan Blomqvist"],  start: null, live: true },
      { id: "pg-arr-fri-santiago-garcia",label: "Santiago Garcia",artists: ["Santiago Garcia"],start: null },
      { id: "pg-arr-fri-xinobi",        label: "Xinobi",         artists: ["Xinobi"],         start: null },
      { id: "pg-arr-fri-parra-for-cuva",label: "Parra for Cuva", artists: ["Parra for Cuva"], start: null, live: true, headliner: true },
    ],
  },
  {
    id: "pg-arr-sat",
    venueId: "playground-arrival",
    date: "2026-09-05",
    name: "Man Burns",
    kind: "night",
    start: "22:30",
    sets: [
      { id: "pg-arr-sat-igor-marijuan", label: "Igor Marijuan", artists: ["Igor Marijuan"], start: null },
      { id: "pg-arr-sat-lee-burridge",  label: "Lee Burridge",  artists: ["Lee Burridge"],  start: null },
      { id: "pg-arr-sat-rampue",        label: "Rampue",        artists: ["Rampue"],        start: null },
      { id: "pg-arr-sat-enamour",       label: "Enamour",       artists: ["Enamour"],       start: null },
      { id: "pg-arr-sat-bender",        label: "Bender",        artists: ["Bender"],        start: null, headliner: true },
    ],
  },

  // ─────────────────────── Playground · Dune Lounge ───────────────────────
  {
    id: "pg-dune-mon",
    venueId: "playground-dune",
    date: "2026-08-31",
    name: "The Opening",
    kind: "night",
    start: "20:30",
    note: "El cartel los agrupa bajo un mismo B4B: los tres nombres y Riche.",
    sets: [
      {
        id: "pg-dune-mon-b4b",
        label: "Hedda Stenberg B4B Julia Sandstorm B4B LP Giobbi + Riche",
        artists: ["Hedda Stenberg", "Julia Sandstorm", "LP Giobbi", "Riche"],
        start: null,
        note: "B4B",
      },
    ],
  },
  {
    id: "pg-dune-tue",
    venueId: "playground-dune",
    date: "2026-09-01",
    name: "Ceremony",
    kind: "day",
    start: "16:00",
    sets: [
      { id: "pg-dune-tue-tijax",   label: "Ceremonia de cacao por Tijax", artists: ["Tijax"],   start: null },
      { id: "pg-dune-tue-syrcles", label: "Syrcles",                      artists: ["Syrcles"], start: null, live: true },
    ],
  },
  {
    id: "pg-dune-wed",
    venueId: "playground-dune",
    date: "2026-09-02",
    name: "Friends",
    kind: "day",
    start: "13:00",
    sets: [
      { id: "pg-dune-wed-guido-la-vespa",  label: "Guido La Vespa",         artists: ["Guido La Vespa"],          start: null },
      { id: "pg-dune-wed-groovecreator",   label: "Groovecreator",          artists: ["Groovecreator"],           start: null },
      { id: "pg-dune-wed-solaris-fritz",   label: "Solaris B2B Onthefritz", artists: ["Solaris", "Onthefritz"],   start: null },
      { id: "pg-dune-wed-miramar",         label: "Miramar",                artists: ["Miramar"],                 start: null },
    ],
  },
  {
    id: "pg-dune-thu",
    venueId: "playground-dune",
    date: "2026-09-03",
    name: "Sunrise Animal Party",
    kind: "sunrise",
    start: "07:00",
    sets: [
      { id: "pg-dune-thu-miguelle-tons",  label: "Miguelle & Tons", artists: ["Miguelle", "Tons"],  start: null },
      { id: "pg-dune-thu-vintage-culture",label: "Vintage Culture", artists: ["Vintage Culture"],   start: null },
      { id: "pg-dune-thu-beltran",        label: "Beltran",         artists: ["Beltran"],           start: null },
    ],
  },
  {
    id: "pg-dune-fri",
    venueId: "playground-dune",
    date: "2026-09-04",
    name: "Melodica",
    kind: "day",
    start: "14:00",
    sets: [
      { id: "pg-dune-fri-lost-desert", label: "Lost Desert", artists: ["Lost Desert"], start: null },
      { id: "pg-dune-fri-annicka",     label: "Annicka",     artists: ["Annicka"],     start: null },
      { id: "pg-dune-fri-sam-shure",   label: "Sam Shure",   artists: ["Sam Shure"],   start: null },
    ],
  },
  // ────────────────────────────── Symbio ──────────────────────────────
  // Fiestas de mañana: arrancan a las 9:00 y el cartel no da hora de cierre
  // ni hora por set, solo el orden.
  {
    id: "sym-tue",
    venueId: "symbio",
    date: "2026-09-01",
    name: "Symbio",
    kind: "day",
    start: "09:00",
    setMinutes: 90,
    sets: [
      { id: "sym-tue-franky-rizardo",  label: "Franky Rizardo",   artists: ["Franky Rizardo"],   start: null },
      { id: "sym-tue-vanjee",          label: "Vanjee",           artists: ["Vanjee"],           start: null },
      { id: "sym-tue-mason-collective",label: "Mason Collective", artists: ["Mason Collective"], start: null },
      { id: "sym-tue-monobase",        label: "Monobase",         artists: ["Monobase"],         start: null },
      { id: "sym-tue-shimon",          label: "Shimon",           artists: ["Shimon"],           start: null },
      { id: "sym-tue-nadav-vee",       label: "Nadav Vee",        artists: ["Nadav Vee"],        start: null },
    ],
  },
  {
    id: "sym-thu",
    venueId: "symbio",
    date: "2026-09-03",
    name: "Symbio",
    kind: "day",
    start: "09:00",
    setMinutes: 90,
    sets: [
      { id: "sym-thu-kaz-james",       label: "Kaz James",       artists: ["Kaz James"],       start: null },
      { id: "sym-thu-nico-bernardini", label: "Nico Bernardini", artists: ["Nico Bernardini"], start: null },
      { id: "sym-thu-lp-giobbi",       label: "LP Giobbi",       artists: ["LP Giobbi"],       start: null },
      { id: "sym-thu-luch",            label: "Luch",            artists: ["Luch"],            start: null },
      { id: "sym-thu-grace-arribas",   label: "Grace Arribas",   artists: ["Grace Arribas"],   start: null },
      { id: "sym-thu-mike-whitmore",   label: "Mike Whitmore",   artists: ["Mike Whitmore"],   start: null },
    ],
  },
  {
    id: "sym-sat",
    venueId: "symbio",
    date: "2026-09-05",
    name: "Sixty Palms",
    kind: "day",
    start: "09:00",
    note: "El cartel firma el sábado con Sixty Palms.",
    setMinutes: 90,
    sets: [
      { id: "sym-sat-nico-vanjee", label: "Nico B2B Vanjee", artists: ["Nico Bernardini", "Vanjee"], start: null, note: "disco set" },
      { id: "sym-sat-omri",        label: "Omri.",           artists: ["Omri."],                     start: null },
      { id: "sym-sat-bender",      label: "Bender",          artists: ["Bender"],                    start: null },
      { id: "sym-sat-luis",        label: "Luis",            artists: ["Luis"],                      start: null },
    ],
  },
  // ──────────────────────────── Melon Motel ────────────────────────────
  {
    id: "mel-tue",
    venueId: "melon-motel",
    date: "2026-09-01",
    name: "Tuesday Night",
    kind: "night",
    start: "20:00",
    end: "08:00",
    sets: [
      { id: "mel-tue-mooglie",        label: "Mooglie",              artists: ["Mooglie"],                start: "20:00" },
      { id: "mel-tue-lizzie-angelica",label: "Liz(zie) B2B Angelica",artists: ["Liz(zie)", "Angelica"],   start: "21:00" },
      { id: "mel-tue-purple",         label: "Purple",               artists: ["Purple"],                 start: "22:30" },
      { id: "mel-tue-doozie",         label: "Doozie",               artists: ["Doozie"],                 start: "00:00" },
      { id: "mel-tue-vintage-culture",label: "Vintage Culture",      artists: ["Vintage Culture"],        start: "01:00" },
      { id: "mel-tue-omri-friends",   label: "Omri. & Friends",      artists: ["Omri."],                  start: "03:00", note: "hasta las 8" },
    ],
  },
  {
    id: "mel-thu",
    venueId: "melon-motel",
    date: "2026-09-03",
    name: "Playa Animals",
    kind: "sunrise",
    start: "07:00",
    sets: [
      { id: "mel-thu-vanjee",   label: "Vanjee",   artists: ["Vanjee"],   start: null },
      { id: "mel-thu-gordo",    label: "Gordo",    artists: ["Gordo"],    start: null },
      { id: "mel-thu-kimonos",  label: "Kimonos",  artists: ["Kimonos"],  start: null },
      { id: "mel-thu-darco",    label: "Darco",    artists: ["Darco"],    start: null },
      { id: "mel-thu-monobase", label: "Monobase", artists: ["Monobase"], start: null },
      { id: "mel-thu-nevos",    label: "Nevos",    artists: ["Nevos"],    start: null },
    ],
  },

  // ─────────────────────────── Favela ArtCar ───────────────────────────
  // El cartel no publica ni una hora, pero el campamento confirma que el art
  // car sale a las 23:00 todos los días. Esa hora es buena; el reparto de cada
  // set dentro de la noche sigue siendo estimación.
  //
  // El miércoles y el viernes NO están aquí: son las mismas fiestas que el
  // cartel de Nova Heaven anuncia como "art car >> Favela", y allí vienen con
  // hora exacta. Estaban duplicadas y se quedan en nova-heaven.
  {
    id: "fav-tue",
    venueId: "favela",
    date: "2026-09-01",
    name: "First Favela ArtCar Outing",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "fav-tue-mary-du-serena", label: "Mary Mesk B2B Du Serena", artists: ["Mary Mesk", "Du Serena"], start: null },
      { id: "fav-tue-ines-rau",       label: "Ines Rau",                artists: ["Ines Rau"],               start: null },
      { id: "fav-tue-ruback",         label: "Ruback",                  artists: ["Ruback"],                 start: null },
      { id: "fav-tue-gabe",           label: "Gabe",                    artists: ["Gabe"],                   start: null },
      { id: "fav-tue-greggio",        label: "Greggio",                 artists: ["Greggio"],                start: null },
    ],
  },
  {
    id: "fav-thu",
    venueId: "favela",
    date: "2026-09-03",
    name: "Favela Baile",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "fav-thu-xinobi",         label: "Xinobi",           artists: ["Xinobi"],           start: null },
      { id: "fav-thu-parra-for-cuva", label: "Parra for Cuva",   artists: ["Parra for Cuva"],   start: null, live: true },
      { id: "fav-thu-jackson-anna",   label: "Jackson B2B Anna", artists: ["Jackson", "Anna"],  start: null },
      { id: "fav-thu-joezi",          label: "Joezi",            artists: ["Joezi"],            start: null },
      { id: "fav-thu-rod-brito",      label: "Rod Brito",        artists: ["Rod Brito"],        start: null },
    ],
  },
  {
    id: "fav-sat",
    venueId: "favela",
    date: "2026-09-05",
    name: "Man Burn",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "fav-sat-orbit", label: "Orbit", artists: ["Orbit"], start: null, live: true },
    ],
  },
  // ──────────────────────────── Nova Heaven ────────────────────────────
  // El único cartel que publica hora de cada set y qué art cars aparcan esa
  // noche. Las noches de miércoles y viernes son las que Favela anunciaba por
  // su lado; estas mandan, porque llevan las horas.
  {
    id: "nova-mon",
    venueId: "nova-heaven",
    date: "2026-08-31",
    name: "Opening",
    kind: "night",
    start: "21:00",
    end: "08:00",
    note: "Art cars: Eden, Saboku, Blue Bull y Kuker.",
    sets: [
      { id: "nova-mon-opening",   label: "Ceremonia de apertura", artists: [],                             start: "21:00" },
      { id: "nova-mon-light",     label: "Let There Be Light",    artists: [],                             start: "21:30", live: true, note: "live show" },
      { id: "nova-mon-sasi",      label: "Sasi",                  artists: ["Sasi"],                       start: "22:00" },
      { id: "nova-mon-ashley",    label: "Ashley Fitelson",       artists: ["Ashley Fitelson"],            start: "23:30" },
      { id: "nova-mon-gabe",      label: "Gabe",                  artists: ["Gabe"],                       start: "01:00" },
      { id: "nova-mon-enamour",   label: "Enamour",               artists: ["Enamour"],                    start: "02:30" },
      { id: "nova-mon-max-mishell",label: "Max Styler B2B Mishell",artists: ["Max Styler", "Mishell"],     start: "04:00" },
      { id: "nova-mon-darco-luch",label: "Darco B2B Luch",        artists: ["Darco", "Luch"],              start: "06:30", sun: "amanecer" },
    ],
  },
  {
    id: "nova-tue",
    venueId: "nova-heaven",
    date: "2026-09-01",
    name: "Nova Heaven",
    kind: "night",
    start: "23:00",
    end: "08:00",
    note: "Art cars: Trion y Forest House.",
    sets: [
      { id: "nova-tue-philou",       label: "Philou",                    artists: ["Philou"],                     start: "23:00" },
      { id: "nova-tue-roy-vanjee",   label: "Roy Rosenfeld B2B Vanjee",  artists: ["Roy Rosenfeld", "Vanjee"],    start: "00:30" },
      { id: "nova-tue-lp-giobbi",    label: "LP Giobbi",                 artists: ["LP Giobbi"],                  start: "02:30" },
      { id: "nova-tue-rafael",       label: "Rafael",                    artists: ["Rafael"],                     start: "04:00", sun: "amanecer" },
    ],
  },
  {
    id: "nova-wed",
    venueId: "nova-heaven",
    date: "2026-09-02",
    name: "Nova Heaven",
    kind: "night",
    start: "23:00",
    end: "08:30",
    note: "Art cars: Favela y Bipolar Express.",
    sets: [
      { id: "nova-wed-mary-du-serena",  label: "Mary Mesk B2B Du Serena",   artists: ["Mary Mesk", "Du Serena"],     start: "23:00" },
      { id: "nova-wed-doozie",          label: "Doozie",                    artists: ["Doozie"],                     start: "01:00" },
      { id: "nova-wed-vintage-omri",    label: "Vintage Culture B2B Omri.", artists: ["Vintage Culture", "Omri."],   start: "02:30" },
      { id: "nova-wed-anna",            label: "Anna",                      artists: ["Anna"],                       start: "04:00" },
      { id: "nova-wed-infected-mushroom",label: "Infected Mushroom",        artists: ["Infected Mushroom"],          start: "05:30", sun: "amanecer" },
      { id: "nova-wed-wrecked-vermont", label: "Wrecked Machines vs Vermont",artists: ["Wrecked Machines", "Vermont"],start: "07:00" },
    ],
  },
  {
    id: "nova-fri",
    venueId: "nova-heaven",
    date: "2026-09-04",
    name: "Ascension · Memorian Celebration",
    kind: "night",
    start: "23:00",
    note: "Art cars: Eden, Favela, The Giving Tree y Saboku. El cartel cierra en \"06:29 – close\", sin hora.",
    sets: [
      { id: "nova-fri-you-and-i",      label: "YØU&I",                 artists: ["YØU&I"],                 start: "23:00" },
      { id: "nova-fri-nevos",          label: "Nevos",                 artists: ["Nevos"],                 start: "00:00" },
      { id: "nova-fri-club-de-combat", label: "Clüb de Combat",        artists: ["Clüb de Combat"],        start: "01:30" },
      { id: "nova-fri-kimonos",        label: "Kimonos",               artists: ["Kimonos"],               start: "03:00" },
      { id: "nova-fri-rafael",         label: "Rafael",                artists: ["Rafael"],                start: "04:30" },
      { id: "nova-fri-ceremonia",      label: "Ceremonia de las 6:29", artists: [],                        start: "06:00", sun: "amanecer" },
      { id: "nova-fri-sasi-captain",   label: "Sasi B2B Captain Hook", artists: ["Sasi", "Captain Hook"],  start: "06:29" },
    ],
  },
  // ─────────────────── Melon Motel × Playground (viernes) ───────────────────
  {
    id: "mel-fri",
    venueId: "melon-motel",
    date: "2026-09-04",
    name: "Play with Melons",
    kind: "day",
    start: "14:00",
    end: "00:00",
    note: "Con Playground. El cartel da la franja (2pm–12am) pero no la hora de cada set.",
    sets: [
      { id: "mel-fri-arianna-sunshine", label: "Arianna Sunshine",        artists: ["Arianna Sunshine"],        start: null },
      { id: "mel-fri-grace-stavi",      label: "Grace Arribas B2B Stavi", artists: ["Grace Arribas", "Stavi"],  start: null },
      { id: "mel-fri-miramar",          label: "Miramar",                 artists: ["Miramar"],                 start: null },
      { id: "mel-fri-bender",           label: "Bender",                  artists: ["Bender"],                  start: null },
      { id: "mel-fri-marten-arodes",    label: "Marten Lou B2B Arodes",   artists: ["Marten Lou", "Arodes"],    start: null },
      { id: "mel-fri-josh-gigante",     label: "Josh Gigante",            artists: ["Josh Gigante"],            start: null },
    ],
  },

  // ────────────────────────────── Huofeng ──────────────────────────────
  // Todas las tardes de 18:00 a 23:00. El cartel marca con un icono el set
  // que pilla la puesta de sol.
  {
    id: "huo-mon",
    venueId: "huofeng",
    date: "2026-08-31",
    name: "Huofeng",
    kind: "sunset",
    start: "18:00",
    end: "23:00",
    sets: [
      { id: "huo-mon-ascension-knob", label: "Ascension B2B Knob Ross",     artists: ["Ascension", "Knob Ross"],     start: null },
      { id: "huo-mon-techno-tupac",   label: "Techno Tupac",                artists: ["Techno Tupac"],               start: null, sun: "atardecer" },
      { id: "huo-mon-lidiya",         label: "LIDIYA",                      artists: ["LIDIYA"],                     start: null },
      { id: "huo-mon-seventh-sisyphos",label: "Seventh Axis B2B Sisyphos",  artists: ["Seventh Axis", "Sisyphos"],   start: null },
      { id: "huo-mon-chaske",         label: "Chaske",                      artists: ["Chaske"],                     start: null },
    ],
  },
  {
    id: "huo-tue",
    venueId: "huofeng",
    date: "2026-09-01",
    name: "Huofeng",
    kind: "sunset",
    start: "18:00",
    end: "23:00",
    sets: [
      { id: "huo-tue-natascha-polke", label: "Natascha Polké", artists: ["Natascha Polké"], start: null, live: true },
      { id: "huo-tue-michael-bibi",   label: "Michael Bibi",   artists: ["Michael Bibi"],   start: null, sun: "atardecer" },
      { id: "huo-tue-gallivanter",    label: "GALLiVANTER",    artists: ["GALLiVANTER"],    start: null },
    ],
  },
  {
    id: "huo-wed",
    venueId: "huofeng",
    date: "2026-09-02",
    name: "Huofeng",
    kind: "sunset",
    start: "18:00",
    end: "23:00",
    sets: [
      { id: "huo-wed-double-touch",  label: "Double Touch",                 artists: ["Double Touch"],                 start: null, live: true },
      { id: "huo-wed-franky-rizardo",label: "Franky Rizardo",               artists: ["Franky Rizardo"],               start: null, sun: "atardecer" },
      { id: "huo-wed-deer-julia",    label: "Deer Jade B2B Julia Sandstorm",artists: ["Deer Jade", "Julia Sandstorm"], start: null },
    ],
  },
  {
    id: "huo-thu",
    venueId: "huofeng",
    date: "2026-09-03",
    name: "Huofeng",
    kind: "sunset",
    start: "18:00",
    end: "23:00",
    sets: [
      { id: "huo-thu-london-grammar", label: "London Grammar", artists: ["London Grammar"], start: null, note: "DJ set" },
      { id: "huo-thu-ahmed-spins",    label: "Ahmed Spins",    artists: ["Ahmed Spins"],    start: null, sun: "atardecer" },
      { id: "huo-thu-gawdat",         label: "Gawdat",         artists: ["Gawdat"],         start: null },
    ],
  },
  {
    id: "huo-fri",
    venueId: "huofeng",
    date: "2026-09-04",
    name: "Huofeng",
    kind: "sunset",
    start: "18:00",
    end: "23:00",
    sets: [
      { id: "huo-fri-purple",         label: "Purple",          artists: ["Purple"],          start: null },
      { id: "huo-fri-vintage-culture",label: "Vintage Culture", artists: ["Vintage Culture"], start: null, sun: "atardecer" },
      { id: "huo-fri-anna",           label: "Anna",            artists: ["Anna"],            start: null },
    ],
  },
  // ────────────────────────────── Longfeng ──────────────────────────────
  // Art car en 10 & K, arranca a las 23:00 (23:45 el sábado). Sin hora por set
  // y sin cierre, pero el cartel marca en cada noche cuál pilla el amanecer,
  // y eso es lo que estira el reparto hasta las 8 en vez de las 6.
  {
    id: "lon-mon",
    venueId: "longfeng",
    date: "2026-08-31",
    name: "Longfeng",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "lon-mon-red-gecko",    label: "Red Gecko",              artists: ["Red Gecko"],              start: null },
      { id: "lon-mon-manu-seve",    label: "Manu Seve",              artists: ["Manu Seve"],              start: null },
      { id: "lon-mon-danni-juju",   label: "Danni G B2B Juju Star",  artists: ["Danni G", "Juju Star"],   start: null },
      { id: "lon-mon-sonder",       label: "Sonder",                 artists: ["Sonder"],                 start: null },
      { id: "lon-mon-solos",        label: "SOLØS",                  artists: ["SOLØS"],                  start: null, live: true },
      { id: "lon-mon-philou",       label: "Philou",                 artists: ["Philou"],                 start: null },
      { id: "lon-mon-roy-rosenfeld",label: "Roy Rosenfeld",          artists: ["Roy Rosenfeld"],          start: null, sun: "amanecer" },
      { id: "lon-mon-betical",      label: "Betical",                artists: ["Betical"],                start: null },
    ],
  },
  {
    id: "lon-tue",
    venueId: "longfeng",
    date: "2026-09-01",
    name: "Longfeng",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "lon-tue-lp-giobbi",       label: "LP Giobbi",              artists: ["LP Giobbi"],             start: null },
      { id: "lon-tue-max-styler",      label: "Max Styler",             artists: ["Max Styler"],            start: null },
      { id: "lon-tue-mason-collective",label: "Mason Collective",       artists: ["Mason Collective"],      start: null },
      { id: "lon-tue-franky-rizardo",  label: "Franky Rizardo",         artists: ["Franky Rizardo"],        start: null },
      { id: "lon-tue-arodes-marten",   label: "Arodes B2B Marten Lou",  artists: ["Arodes", "Marten Lou"],  start: null, sun: "amanecer" },
      { id: "lon-tue-calussa-mishell", label: "Calussa B2B Mishell",    artists: ["Calussa", "Mishell"],    start: null },
    ],
  },
  {
    id: "lon-wed",
    venueId: "longfeng",
    date: "2026-09-02",
    name: "Longfeng",
    kind: "night",
    start: "23:00",
    sets: [
      { id: "lon-wed-mike-posner",   label: "Mike Posner",           artists: ["Mike Posner"],            start: null, note: "hybrid" },
      { id: "lon-wed-josh-luch",     label: "Josh Gigante B2B Luch", artists: ["Josh Gigante", "Luch"],   start: null },
      { id: "lon-wed-major-lazer",   label: "Major Lazer",           artists: ["Major Lazer"],            start: null },
      { id: "lon-wed-kaz-james",     label: "Kaz James & Friends",   artists: ["Kaz James"],              start: null },
      { id: "lon-wed-michael-bibi",  label: "Michael Bibi",          artists: ["Michael Bibi"],           start: null, sun: "amanecer" },
      { id: "lon-wed-darco-rafael",  label: "Darco B2B Rafael",      artists: ["Darco", "Rafael"],        start: null },
    ],
  },
  {
    id: "lon-thu",
    venueId: "longfeng",
    date: "2026-09-03",
    name: "Longfeng · Dragon Awakening",
    kind: "night",
    start: "23:00",
    note: "El cartel lo rotula como \"Dragon Awakening tie-up\".",
    sets: [
      { id: "lon-thu-tom-collins",    label: "Tom & Collins",     artists: ["Tom & Collins"],       start: null },
      { id: "lon-thu-kimonos",        label: "Kimonos",           artists: ["Kimonos"],             start: null },
      { id: "lon-thu-diplo-gordo",    label: "Diplo B2B Gordo",   artists: ["Diplo", "Gordo"],      start: null },
      { id: "lon-thu-carlita-riche",  label: "Carlita B2B Riche", artists: ["Carlita", "Riche"],    start: null },
      { id: "lon-thu-francis-mercier",label: "Francis Mercier",   artists: ["Francis Mercier"],     start: null, sun: "amanecer" },
      { id: "lon-thu-academe-vanjee", label: "AMÉMÉ B2B Vanjee",  artists: ["AMÉMÉ", "Vanjee"],     start: null },
    ],
  },
  {
    id: "lon-fri",
    venueId: "longfeng",
    date: "2026-09-04",
    name: "Longfeng · Bipolar Express",
    kind: "night",
    start: "23:00",
    note: "El cartel lo rotula como \"Bipolar Express tie-up\".",
    sets: [
      { id: "lon-fri-seth-schwarz",  label: "Seth Schwarz",                  artists: ["Seth Schwarz"],                  start: null, live: true },
      { id: "lon-fri-kream-tripps",  label: "Kream B2B Tripps",              artists: ["Kream", "Tripps"],               start: null },
      { id: "lon-fri-aryme-maxi",    label: "Arymé B2B Maxi Meraki",         artists: ["Arymé", "Maxi Meraki"],          start: null },
      { id: "lon-fri-sam-sebastian", label: "Sam Shure B2B Sebastian Konrad",artists: ["Sam Shure", "Sebastian Konrad"], start: null },
      { id: "lon-fri-monolink",      label: "Monolink",                      artists: ["Monolink"],                      start: null, note: "hybrid", sun: "amanecer" },
      { id: "lon-fri-mahmut-orhan",  label: "Mahmut Orhan",                  artists: ["Mahmut Orhan"],                  start: null },
    ],
  },
  {
    id: "lon-sat",
    venueId: "longfeng",
    date: "2026-09-05",
    name: "Longfeng",
    kind: "night",
    start: "23:45",
    sets: [
      { id: "lon-sat-oliver-marshak",  label: "Oliver Marshak",                 artists: ["Oliver Marshak"],                 start: null },
      { id: "lon-sat-luciano-talon",   label: "Luciano Scalioni B2B Talón",     artists: ["Luciano Scalioni", "Talón"],      start: null },
      { id: "lon-sat-club-de-combat",  label: "Clüb de Combat",                 artists: ["Clüb de Combat"],                 start: null },
      { id: "lon-sat-amour-propre",    label: "Amour Propre",                   artists: ["Amour Propre"],                   start: null },
      { id: "lon-sat-annicka-xinobi",  label: "Annicka B2B Xinobi",             artists: ["Annicka", "Xinobi"],              start: null },
      { id: "lon-sat-vintage-doozie",  label: "Vintage Culture B2B Doozie",     artists: ["Vintage Culture", "Doozie"],      start: null, sun: "amanecer" },
    ],
  },
  // ──────────────────────────── Robot Heart ────────────────────────────
  // El anuncio de Robot Heart no es un cartel: es un texto que cuenta el día,
  // el sitio donde aparca el bus y el orden de los artistas, pero ni una hora.
  //
  // Las horas de arranque son estimación con el patrón de siempre del bus:
  // amaneceres a partir de las 03:00 y atardeceres desde las 18:00. Donde el
  // texto sí dice algo —que Deer Giobbi toca al amanecer, que Danny Tenaglia
  // trae seis horas, que Major Lazer cierra con el sol bajando— eso manda y el
  // reparto se ajusta alrededor.
  {
    id: "rh-tue-am",
    venueId: "robot-heart",
    date: "2026-09-01",
    name: "Robot Heart × Solar Punks",
    kind: "sunrise",
    start: "03:00",
    where: "2 & K · los campos solares",
    setMinutes: 90,
    note: "Fiesta de apertura. El orden es el del anuncio; las horas, estimación.",
    sets: [
      { id: "rh-tue-am-miluhska",      label: "Miluhska",       artists: ["Miluhska"],       start: null },
      { id: "rh-tue-am-madota",        label: "Madota",         artists: ["Madota"],         start: null },
      { id: "rh-tue-am-aline-brooklyn",label: "Aline Brooklyn", artists: ["Aline Brooklyn"], start: null },
      { id: "rh-tue-am-jan-blomqvist", label: "Jan Blomqvist",  artists: ["Jan Blomqvist"],  start: null },
      { id: "rh-tue-am-omri",          label: "Omri.",          artists: ["Omri."],          start: null },
    ],
  },
  {
    id: "rh-tue-pm",
    venueId: "robot-heart",
    date: "2026-09-01",
    name: "Procesión al Templo",
    kind: "sunset",
    start: "18:00",
    end: "21:00",
    where: "procesión por el playa hasta el Templo",
    note: "En memoria de Nico Stojan y Phillip Jung.",
    sets: [
      { id: "rh-tue-pm-holmar", label: "Holmar", artists: ["Holmar"], start: null },
      { id: "rh-tue-pm-gunita", label: "Gunita", artists: ["Gunita"], start: null, sun: "atardecer" },
    ],
  },
  {
    id: "rh-wed-am",
    venueId: "robot-heart",
    date: "2026-09-02",
    name: "Maxa Tie-Up",
    kind: "sunrise",
    start: "03:00",
    where: "Eiffela Broken Dreams",
    setMinutes: 90,
    note: "El texto sitúa a Deer Giobbi en el amanecer, y el reparto se cuadra para que caiga ahí.",
    sets: [
      { id: "rh-wed-am-alok",        label: "Alok · Something Else",        artists: ["Alok"],                        start: null, note: "su único set del playa" },
      { id: "rh-wed-am-max-styler",  label: "Max Styler",                   artists: ["Max Styler"],                  start: null, note: "MAXA" },
      { id: "rh-wed-am-deer-giobbi", label: "Deer Giobbi · Deer Jade B2B LP Giobbi", artists: ["Deer Jade", "LP Giobbi"], start: null, sun: "amanecer", note: "con el Black Rock Quartet" },
      { id: "rh-wed-am-bibi-franky", label: "Michael Bibi B2B Franky Rizardo", artists: ["Michael Bibi", "Franky Rizardo"], start: null, note: "MAXA" },
    ],
  },
  {
    id: "rh-wed-pm",
    venueId: "robot-heart",
    date: "2026-09-02",
    name: "Apotheneum × Robot Heart",
    kind: "night",
    start: "21:00",
    where: "Apotheneum",
    note: "Noche de directo: música que no se puede repetir en otro sitio.",
    sets: [
      { id: "rh-wed-pm-parra-orbit", label: "Parra for Cuva B2B Orbit", artists: ["Parra for Cuva", "Orbit"], start: null, live: true },
      { id: "rh-wed-pm-joke",        label: "Jo.Ke",                    artists: ["Jo.Ke"],                   start: null, live: true, note: "estreno del directo nuevo" },
    ],
  },
  {
    id: "rh-thu",
    venueId: "robot-heart",
    date: "2026-09-03",
    name: "Art Day",
    kind: "sunset",
    start: "16:00",
    end: "21:00",
    where: "acaba en The Keyhole to Other Dimensions",
    note: "Ruta de arte por el playa; el bus termina en la pieza de John Dill.",
    sets: [
      { id: "rh-thu-june-robin",     label: "June Robin",           artists: ["June Robin"],          start: null, note: "voz" },
      { id: "rh-thu-bilal-rebolledo",label: "Bilal B2B Rebolledo",  artists: ["Bilal", "Rebolledo"],  start: null },
      { id: "rh-thu-major-lazer",    label: "Major Lazer",          artists: ["Major Lazer"],         start: null, sun: "atardecer", note: "reggae y dub" },
    ],
  },
  {
    id: "rh-fri-am",
    venueId: "robot-heart",
    date: "2026-09-04",
    name: "Danny T Marathon",
    kind: "sunrise",
    start: "03:00",
    end: "11:00",
    where: "Gothic Folly",
    note: "Las seis horas de Danny Tenaglia son las que anuncia él; la hora de arranque es estimación.",
    sets: [
      { id: "rh-fri-am-john-summit",    label: "John Summit",     artists: ["John Summit"],     start: null },
      { id: "rh-fri-am-danny-tenaglia", label: "Danny Tenaglia",  artists: ["Danny Tenaglia"],  start: "05:00", sun: "amanecer", note: "6 horas · su debut en el playa" },
    ],
  },
  {
    id: "rh-fri-pm",
    venueId: "robot-heart",
    date: "2026-09-04",
    name: "Titanic Burn",
    kind: "sunset",
    start: "18:00",
    where: "la quema del Titanic",
    sets: [
      { id: "rh-fri-pm-monolink",       label: "Monolink",        artists: ["Monolink"],           start: null, sun: "atardecer", note: "hybrid" },
      { id: "rh-fri-pm-miguelle-tons",  label: "Miguelle & Tons", artists: ["Miguelle", "Tons"],   start: null },
    ],
  },
  {
    id: "rh-sat-am",
    venueId: "robot-heart",
    date: "2026-09-05",
    name: "Lee Burridge & Friends",
    kind: "sunrise",
    start: "03:00",
    setMinutes: 105,
    note: "El anuncio no publica el orden de los cinco; va como los nombra. Avisan de que se alargará más de lo normal.",
    sets: [
      { id: "rh-sat-am-lee-burridge", label: "Lee Burridge",  artists: ["Lee Burridge"],  start: null },
      { id: "rh-sat-am-double-touch", label: "Double Touch",  artists: ["Double Touch"],  start: null },
      { id: "rh-sat-am-lost-desert",  label: "Lost Desert",   artists: ["Lost Desert"],   start: null },
      { id: "rh-sat-am-rod-jr",       label: "Rod Jr.",       artists: ["Rod Jr."],       start: null },
      { id: "rh-sat-am-pippi-ciez",   label: "Pippi Ciez",    artists: ["Pippi Ciez"],    start: null },
    ],
  },
];
