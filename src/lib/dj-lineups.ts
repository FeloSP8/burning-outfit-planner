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
  /** Matiz del cartel: "madhaus set", "sunrise set", "DJ set"… */
  note?: string;
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
      { id: "ot-wed-madison-orange", label: "Madison Orange",  artists: ["Madison Orange"],  start: "06:00", note: "sunrise set" },
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
      { id: "ot-thu-obie-fernandez",label: "Obie Fernandez", artists: ["Obie Fernandez"], start: "06:00", note: "sunrise set" },
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
      { id: "ot-fri-major-nisene",    label: "Major Trouble & Nisene", artists: ["Major Trouble", "Nisene"],     start: "06:00", note: "sunrise set" },
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
    sets: [
      { id: "sym-sat-nico-vanjee", label: "Nico B2B Vanjee", artists: ["Nico Bernardini", "Vanjee"], start: null, note: "disco set" },
      { id: "sym-sat-omri",        label: "Omri.",           artists: ["Omri."],                     start: null },
      { id: "sym-sat-bender",      label: "Bender",          artists: ["Bender"],                    start: null },
      { id: "sym-sat-luis",        label: "Luis",            artists: ["Luis"],                      start: null },
    ],
  },
];
