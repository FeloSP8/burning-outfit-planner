/**
 * Ficha de cada artista del cartel: género, Instagram y un set en vídeo.
 *
 * Todo sale de buscar a cada uno, no de memoria. La regla con los enlaces es
 * estricta: un handle de Instagram inventado apunta a un desconocido y un id
 * de YouTube inventado no lleva a ninguna parte, así que solo entra aquí lo
 * que aparece en una búsqueda y se puede comprobar. Un artista sin ficha —o
 * con la ficha a medias— sale igual en la lista, sin el dato que falte.
 *
 * La clave es el nombre exacto del catálogo de `src/lib/dj-lineups.ts`.
 *
 * Los géneros salen de cómo se describen ellos y su prensa. Unos cuantos vienen
 * del propio texto de curaduría de Robot Heart, que describe el sonido de casi
 * veinte de los artistas del cartel con nombre y apellido.
 */

export interface ArtistVideo {
  url: string;
  /** Qué set es: "Ultra Miami 2026", "Tomorrowland 2025"… */
  label: string;
}

export interface ArtistInfo {
  /** Género, tal y como lo describen sus fichas y su prensa. */
  genre?: string;
  /** Usuario de Instagram, sin la arroba. */
  instagram?: string;
  /** Un set en vídeo, lo más reciente que haya. */
  video?: ArtistVideo;
}

export const ARTIST_INFO: Record<string, ArtistInfo> = {
  "Vintage Culture": {
    genre: "House · tech house · melodic house",
    instagram: "vintageculture",
    video: { url: "https://www.youtube.com/watch?v=xXRjglkAmq8", label: "Ultra Miami 2026" },
  },
  Vanjee: {
    genre: "House · electrónica",
    instagram: "vanjeemusic",
    video: { url: "https://www.youtube.com/watch?v=ogh7wwR3hyc", label: "Sunrise set · Club Space Miami" },
  },
  Doozie: {
    genre: "House · tech house",
    instagram: "doozie",
  },
  "LP Giobbi": {
    genre: "House · piano en directo",
    instagram: "lpgiobbi",
  },
  "Omri.": {
    genre: "Afro house · melodic house",
  },
  "Marten Lou": {
    genre: "Melodic house",
    instagram: "martenlou",
  },
  "Mahmut Orhan": {
    genre: "Melodic house · deep house",
    instagram: "mahmutorhan",
  },
  "Michael Bibi": {
    genre: "Tech house · house",
    instagram: "michael_bibi_",
  },
  "Parra for Cuva": {
    genre: "Electrónica melódica · downtempo",
    instagram: "parra_for_cuva",
  },
  Monolink: {
    genre: "Melodic house · directo con guitarra y voz",
    instagram: "monolinkmusic",
  },
  "Lee Burridge": {
    genre: "Melodic · organic house",
    instagram: "djleeburridge",
  },
  "John Summit": {
    genre: "Tech house · house",
    instagram: "johnsummit",
  },
  "Danny Tenaglia": {
    genre: "House · techno · tribal",
    instagram: "dannytenagliaofficial",
  },
  "Infected Mushroom": {
    genre: "Psytrance",
    instagram: "infectedmushroom",
  },
  Gordo: {
    genre: "House · tech house · sonido latino",
    instagram: "gordoszn",
  },
  Carlita: {
    genre: "Melodic house · organic house",
    instagram: "carlita",
  },
  "Deer Jade": {
    genre: "Melodic house · techno",
    instagram: "deerjade",
  },
  // Los que siguen tienen el género descrito en el texto de Robot Heart.
  Orbit: {
    genre: "Electrónica orgánica · instrumentos acústicos",
  },
  Alok: {
    genre: "Underground · chuggers",
  },
  "Miguelle": {
    genre: "House rítmico con acento latino",
  },
  Tons: {
    genre: "House rítmico con acento latino",
  },
  Miluhska: {
    genre: "House con acento latino",
  },
  Madota: {
    genre: "Tech house",
  },
  "Aline Brooklyn": {
    genre: "House con funk y electro",
  },
  "Major Lazer": {
    genre: "Dancehall · reggae · dub",
  },
  Rebolledo: {
    genre: "House · cosmic disco",
  },
  "Jan Blomqvist": {
    genre: "Melodic techno · directo",
  },
  "Jo.Ke": {
    genre: "Electrónica en directo",
  },
  "June Robin": {
    genre: "Voz",
  },
  "Max Styler": {
    genre: "Tech house",
  },
  "Franky Rizardo": {
    genre: "House · after hours",
  },
  Arodes: {
    genre: "Melodic house",
    instagram: "arodes_ofc",
  },
  Darco: {
    genre: "Melodic house · organic house",
    instagram: "____darco____",
  },
  Rafael: {
    genre: "Tech house",
    instagram: "rafael___music",
  },
  Anna: {
    genre: "Techno",
    instagram: "djannaofficial",
  },
  Beltran: {
    genre: "House",
    instagram: "beltran",
  },
  Bender: {
    genre: "Melodic house",
    instagram: "bendermusic",
  },
  "Clüb de Combat": {
    genre: "Tech house · house",
    instagram: "club_decombat",
  },
  "Double Touch": {
    genre: "Organic house en directo · teclados y batería",
    instagram: "doubletouchofficial",
  },
  Kimonos: {
    genre: "House",
    instagram: "kimonos.music",
  },
  "Maxi Meraki": {
    genre: "Melodic house",
    instagram: "maximeraki",
  },
  Xinobi: {
    genre: "House · nu-disco",
    instagram: "xinobi",
  },
  "Ahmed Spins": {
    genre: "Afro house",
    instagram: "ahmedspins",
  },
  "Nora En Pure": {
    genre: "Deep house · indie dance",
    instagram: "noraenpure",
  },
  "Natascha Polké": {
    genre: "Electrónica en directo · voz",
    instagram: "nataschapolke.ch",
  },
  "Lost Desert": {
    genre: "Melodic · organic house",
    instagram: "lostdesertmusic",
  },
  "Sam Shure": {
    genre: "Melodic house · techno",
    instagram: "sam_shure",
  },
  "Francis Mercier": {
    genre: "Afro house",
    instagram: "francismercier",
  },
  "Roy Rosenfeld": {
    genre: "Melodic house · techno",
    instagram: "royrosenfeld_ofc",
  },
  "Kaz James": {
    genre: "House",
    instagram: "kazjames",
  },
  "Mason Collective": {
    genre: "Tech house",
    instagram: "masoncollective",
  },
  Enamour: {
    genre: "Melodic house · techno",
    instagram: "enamourmusic",
  },
  "Captain Hook": {
    genre: "Psytrance",
    instagram: "djcaptainhook",
  },
  "Nadav Vee": {
    genre: "Melodic house",
    instagram: "nadavvee",
  },
  "Nico Bernardini": {
    genre: "House",
    instagram: "nicobernardiniofc",
  },
  "Grace Arribas": {
    genre: "House · tech house",
    instagram: "grace.arribas",
  },
  "Sebastian Konrad": {
    genre: "Melodic house · techno",
    instagram: "sebastian.konrad",
  },
  "Syd Gris": {
    genre: "House · techno",
    instagram: "syd_gris",
  },
  Annicka: {
    genre: "Minimal house",
    instagram: "foreverannicka",
  },
  Calussa: {
    genre: "House",
    instagram: "calussa",
  },
  "Josh Gigante": {
    genre: "Melodic house · techno",
    instagram: "joshgigante",
  },
  "Julia Sandstorm": {
    genre: "House",
    instagram: "juliasandstorm",
  },
  Diplo: {
    genre: "House · dancehall · electrónica",
    instagram: "diplo",
  },
  SLANDER: {
    genre: "Bass music · dubstep melódico",
    instagram: "slanderofficial",
  },
  "Spencer Brown": {
    genre: "Progressive house",
    instagram: "spencerbrownofficial",
  },
  Goldfish: {
    genre: "Electrónica en directo · saxo y contrabajo",
    instagram: "goldfishlive",
  },
  "Fleetmac Wood": {
    genre: "Remixes y fiesta dedicada a Fleetwood Mac",
    instagram: "fleetmac_wood",
  },
  "Mike Posner": {
    genre: "Pop electrónico",
    instagram: "mikeposner",
  },
  "Maddy O'Neal": {
    genre: "Electrónica · bass",
    instagram: "maddy_oneal",
  },
  Rampue: {
    genre: "Electrónica en directo",
    instagram: "rampue",
  },
  "Tom & Collins": {
    genre: "Tech house · sonido latino",
    instagram: "tomandcollins",
  },
  "Seth Schwarz": {
    genre: "Electrónica en directo · violín",
    instagram: "seth_schwarz",
  },
  Monobase: {
    genre: "House",
    instagram: "monobase",
  },
  Mishell: {
    genre: "House",
    instagram: "_mishell_____",
  },
  "London Grammar": {
    genre: "Indie · electrónica (DJ set)",
    instagram: "londongrammar",
  },
  "Igor Marijuan": {
    genre: "House · Ibiza",
    instagram: "igormarijuan",
  },
  "Obie Fernandez": {
    genre: "Progressive · trance",
    instagram: "obiefernandez",
  },
  Emanate: {
    genre: "House · techno",
    instagram: "emanatesound",
  },
  Kazami: {
    genre: "House",
    instagram: "kazamimusic",
  },
};
