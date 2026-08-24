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
    video: { url: "https://www.youtube.com/watch?v=p2NUdsmKqrk", label: "DNA Art Car, Camboriú 2026" },
  },
  "LP Giobbi": {
    genre: "House · piano en directo",
    instagram: "lpgiobbi",
    video: { url: "https://www.youtube.com/watch?v=-eOa77e_uJg", label: "Tomorrowland 2026" },
  },
  "Omri.": {
    genre: "Afro house · melodic house",
    video: { url: "https://www.youtube.com/watch?v=OSqNr4qXgNQ", label: "Green Valley, Carnaval Brasil 2026" },
  },
  "Marten Lou": {
    genre: "Melodic house",
    instagram: "martenlou",
    video: { url: "https://www.youtube.com/watch?v=wZEhpiIPZhg", label: "MAAT Lisboa 2026" },
  },
  "Mahmut Orhan": {
    genre: "Melodic house · deep house",
    instagram: "mahmutorhan",
    video: { url: "https://www.youtube.com/watch?v=ZlueBnl69VM", label: "Coachella 2026" },
  },
  "Michael Bibi": {
    genre: "Tech house · house",
    instagram: "michael_bibi_",
    video: { url: "https://www.youtube.com/watch?v=g_umzDckot8", label: "Pacha NYC 2026" },
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
    video: { url: "https://www.youtube.com/watch?v=Kd-F37pCcB8", label: "Kokun 2026" },
  },
  Carlita: {
    genre: "Melodic house · organic house",
    instagram: "carlita",
    video: { url: "https://www.youtube.com/watch?v=vFcpKlb5i_w", label: "Scorpios Mykonos 2026" },
  },
  "Deer Jade": {
    genre: "Melodic house · techno",
    instagram: "deerjade",
    video: { url: "https://www.youtube.com/watch?v=-xQuhzez19I", label: "Hangar · The Gardens of Babylon" },
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
    instagram: "miluhska",
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
    video: { url: "https://www.youtube.com/watch?v=Ckd37fqkEoo", label: "Yuma Tent, Coachella 2026" },
  },
  "Franky Rizardo": {
    genre: "House · after hours",
    video: { url: "https://www.youtube.com/watch?v=CCumCaZRvkI", label: "Coachella 2026" },
  },
  Arodes: {
    genre: "Melodic house",
    instagram: "arodes_ofc",
    video: { url: "https://www.youtube.com/watch?v=iMO30ETV1w8", label: "Coachella 2026" },
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
  "AMÉMÉ": {
    genre: "Afro house",
    instagram: "amemedj",
  },
  Rebolledo: {
    genre: "House · cosmic disco",
    instagram: "rebolledo_____",
  },
  Joezi: {
    genre: "Afro house",
    instagram: "joezi_z",
  },
  "Thiccboi Drewski": {
    genre: "House · bass",
    instagram: "thiccboidrewski",
  },
  Casmalia: {
    genre: "House · bass",
    instagram: "casmaliamusic",
  },
  "DJ Icon": {
    genre: "House · residente de Opulent Temple",
    instagram: "djicon",
  },
  "Madison Orange": {
    genre: "House · hoop dancing con LED",
    instagram: "madisonorange",
  },
  "Wrecked Machines": {
    genre: "Psytrance",
    instagram: "wrecked_machines",
  },
  Vermont: {
    genre: "Psytrance",
    instagram: "vermontmusic",
  },
  Holmar: {
    genre: "Acid · electrónica",
    instagram: "holmarmusik",
  },
  "Ashley Fitelson": {
    genre: "House",
    instagram: "ashleyfitelson",
  },
  "Ashley Ames": {
    genre: "House",
    instagram: "ashleyamesmusic",
  },
  "Mary Mesk": {
    genre: "House · producción y composición",
    instagram: "marymeskmusic",
  },
  "Techno Tupac": {
    genre: "Techno",
    instagram: "techno_tupac",
  },
  GALLiVANTER: {
    genre: "House",
    instagram: "gallivanter__dj",
  },
  LIDIYA: {
    genre: "Melodic house · indie dance",
    instagram: "lidiya.music",
  },
  "Hedda Stenberg": {
    genre: "Melodic house",
    instagram: "heddastenberg",
  },
  "Oliver Marshak": {
    genre: "House",
    instagram: "olivermarshak",
  },
  "Luciano Scalioni": {
    genre: "House · tech house",
    instagram: "luciano_scalioni",
  },
  "Arianna Sunshine": {
    genre: "House",
    instagram: "ariannasunshine_",
  },
  Mooglie: {
    genre: "House",
    instagram: "mooglie",
  },
  Kream: {
    genre: "House · dance",
    instagram: "wearekream",
  },
  Riche: {
    genre: "House · groove",
    instagram: "riche",
  },
  Gawdat: {
    genre: "Tech house · disco",
    instagram: "gawdat.official",
  },
  Luch: {
    // Daniel Grossman. La cuenta no se puede confirmar entre los homónimos.
    genre: "House",
  },
  "Don Gentry": {
    genre: "House",
    instagram: "d1creator",
  },
};
