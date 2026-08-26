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
 */

/**
 * Vocabulario cerrado de géneros.
 *
 * Es una unión de TypeScript a propósito: la primera versión de esto eran
 * cadenas libres y acabó con 65 términos distintos para 104 artistas —
 * "House" y "house", "Melodic" y "Melodic house", y descripciones que no eran
 * géneros mezcladas con los que sí. Tipado, un término nuevo o mal escrito no
 * compila, y agrupar por estilo tiene sentido.
 *
 * Lo que no es un género pero merece contarse —que Seth Schwarz toca el
 * violín, que Syd Gris fundó Opulent Temple— va en `about`.
 */
export const GENRES = [
  "House",
  "Tech house",
  "Melodic house",
  "Organic house",
  "Deep house",
  "Afro house",
  "Progressive house",
  "Minimal house",
  "Techno",
  "Melodic techno",
  "Psytrance",
  "Trance",
  "Indie dance",
  "Disco",
  "Bass",
  "Downtempo",
  "Dancehall",
  "Pop electrónico",
  "Directo",
  "Sonido latino",
] as const;

export type Genre = (typeof GENRES)[number];

export interface ArtistVideo {
  url: string;
  /** Qué set es: "Ultra Miami 2026", "Tomorrowland 2025"… */
  label: string;
}

export interface ArtistInfo {
  /** Géneros del vocabulario cerrado, del principal al secundario. */
  genres?: Genre[];
  /** Una línea de contexto: quién es, qué toca en directo, qué fundó. */
  about?: string;
  /** Usuario de Instagram, sin la arroba. */
  instagram?: string;
  /** Un set en vídeo, lo más reciente que haya. */
  video?: ArtistVideo;
}

export const ARTIST_INFO: Record<string, ArtistInfo> = {
  "Vintage Culture": {
    genres: ["House", "Tech house", "Melodic house"],
    instagram: "vintageculture",
    video: { url: "https://www.youtube.com/watch?v=xXRjglkAmq8", label: "Ultra Miami 2026" },
  },
  Vanjee: {
    genres: ["House"],
    instagram: "vanjeemusic",
    video: { url: "https://www.youtube.com/watch?v=ogh7wwR3hyc", label: "Sunrise set · Club Space Miami" },
  },
  Doozie: {
    genres: ["House", "Tech house"],
    instagram: "doozie",
    video: { url: "https://www.youtube.com/watch?v=p2NUdsmKqrk", label: "DNA Art Car, Camboriú 2026" },
  },
  "LP Giobbi": {
    genres: ["House", "Directo"],
    about: "Toca el piano en directo sobre sus sets; formada en jazz en Berkeley",
    instagram: "lpgiobbi",
    video: { url: "https://www.youtube.com/watch?v=-eOa77e_uJg", label: "Tomorrowland 2026" },
  },
  "Omri.": {
    genres: ["Afro house", "Melodic house"],
    video: { url: "https://www.youtube.com/watch?v=OSqNr4qXgNQ", label: "Green Valley, Carnaval Brasil 2026" },
  },
  "Marten Lou": {
    genres: ["Melodic house"],
    instagram: "martenlou",
    video: { url: "https://www.youtube.com/watch?v=wZEhpiIPZhg", label: "MAAT Lisboa 2026" },
  },
  "Mahmut Orhan": {
    genres: ["Melodic house", "Deep house"],
    instagram: "mahmutorhan",
    video: { url: "https://www.youtube.com/watch?v=ZlueBnl69VM", label: "Coachella 2026" },
  },
  "Michael Bibi": {
    genres: ["Tech house", "House"],
    instagram: "michael_bibi_",
    video: { url: "https://www.youtube.com/watch?v=g_umzDckot8", label: "Pacha NYC 2026" },
  },
  "Parra for Cuva": {
    genres: ["Downtempo", "Directo"],
    about: "Piano clásico y jazz de origen, formado en Berlín",
    instagram: "parra_for_cuva",
    video: { url: "https://www.youtube.com/watch?v=UolMU0sN6Uc", label: "Volcán Arenal, Costa Rica 2026" },
  },
  Monolink: {
    genres: ["Melodic house", "Directo"],
    about: "Canta y toca la guitarra dentro del set",
    instagram: "monolinkmusic",
    video: { url: "https://www.youtube.com/watch?v=_XiAmTl7oTM", label: "Fusion 2026 · set híbrido" },
  },
  "Lee Burridge": {
    genres: ["Melodic house", "Organic house"],
    about: "Fundador de All Day I Dream",
    instagram: "djleeburridge",
    video: { url: "https://www.youtube.com/watch?v=izypyqBBDPw", label: "All Day I Dream · The Lab NYC" },
  },
  "John Summit": {
    genres: ["Tech house", "House"],
    instagram: "johnsummit",
    video: { url: "https://www.youtube.com/watch?v=26IFqDrW6ZA", label: "Lollapalooza Chicago 2026" },
  },
  "Danny Tenaglia": {
    genres: ["House", "Techno"],
    about: "Sonido tribal; cincuenta años de carrera y debut en el playa",
    instagram: "dannytenagliaofficial",
    video: { url: "https://www.youtube.com/watch?v=-ep50fB1HFc", label: "Boiler Room Miami" },
  },
  "Infected Mushroom": {
    genres: ["Psytrance", "Directo"],
    about: "Dúo israelí; hacen show en directo y también DJ set",
    instagram: "infectedmushroom",
    video: { url: "https://www.youtube.com/watch?v=aEfsexE1TgY", label: "Psytrance set, Seúl 2025" },
  },
  Gordo: {
    genres: ["House", "Tech house", "Sonido latino"],
    instagram: "gordoszn",
    video: { url: "https://www.youtube.com/watch?v=Kd-F37pCcB8", label: "Kokun 2026" },
  },
  Carlita: {
    genres: ["Melodic house", "Organic house"],
    about: "Turco-italiana, multiinstrumentista",
    instagram: "carlita",
    video: { url: "https://www.youtube.com/watch?v=vFcpKlb5i_w", label: "Scorpios Mykonos 2026" },
  },
  "Deer Jade": {
    genres: ["Melodic house", "Techno"],
    about: "Suizo-francesa; edita en Innervisions, Diynamic y Kompakt",
    instagram: "deerjade",
    video: { url: "https://www.youtube.com/watch?v=-xQuhzez19I", label: "Hangar · The Gardens of Babylon" },
  },
  Orbit: {
    genres: ["Organic house", "Directo"],
    about: "Instrumentos acústicos y producción electrónica suave",
  },
  Alok: {
    genres: ["Melodic techno"],
    about: "Como Something Else: su lado underground, chuggers de tensión lenta",
    video: { url: "https://www.youtube.com/watch?v=kttWNVHJKDo", label: "Something Else · Tomorrowland Winter 2026" },
  },
  Miguelle: {
    genres: ["House", "Sonido latino"],
  },
  Tons: {
    genres: ["House", "Sonido latino"],
  },
  Miluhska: {
    genres: ["House", "Sonido latino"],
    instagram: "miluhska",
  },
  Madota: {
    genres: ["Tech house"],
  },
  "Aline Brooklyn": {
    genres: ["House"],
    about: "Groove con toques de funk y electro; mitad de Aline Umber",
  },
  "Major Lazer": {
    genres: ["Dancehall"],
    about: "En el playa traen un set de reggae y dub",
    video: { url: "https://www.youtube.com/watch?v=eifPgda7oKc", label: "Coachella 2026" },
  },
  "Jan Blomqvist": {
    genres: ["Melodic techno", "Directo"],
    video: { url: "https://www.youtube.com/watch?v=-vVtOVUHVzE", label: "Mayan Warrior, Burning Man 2024" },
  },
  "Jo.Ke": {
    genres: ["Organic house", "Directo"],
    about: "Estrena proyecto en directo, evolución de Feathered Sun",
  },
  "June Robin": {
    genres: ["Directo"],
    about: "Voz",
  },
  "Max Styler": {
    genres: ["Tech house"],
    video: { url: "https://www.youtube.com/watch?v=Ckd37fqkEoo", label: "Yuma Tent, Coachella 2026" },
  },
  "Franky Rizardo": {
    genres: ["House"],
    about: "Sonido de after hours",
    video: { url: "https://www.youtube.com/watch?v=CCumCaZRvkI", label: "Coachella 2026" },
  },
  Arodes: {
    genres: ["Melodic house"],
    about: "Español, Adrián Rodríguez",
    instagram: "arodes_ofc",
    video: { url: "https://www.youtube.com/watch?v=iMO30ETV1w8", label: "Coachella 2026" },
  },
  Darco: {
    genres: ["Melodic house", "Organic house"],
    about: "Israelí, Dar Cohen",
    instagram: "____darco____",
  },
  Rafael: {
    genres: ["Tech house"],
    about: "Suyo es el remix de My City's On Fire",
    instagram: "rafael___music",
  },
  Anna: {
    genres: ["Techno"],
    about: "Brasileña, Ana Miranda",
    instagram: "djannaofficial",
    video: { url: "https://www.youtube.com/watch?v=VnHG__953oE", label: "Day Zero, Brasil 2026" },
  },
  Beltran: {
    genres: ["House"],
    about: "Brasileño",
    instagram: "beltran",
    video: { url: "https://www.youtube.com/watch?v=YBEd7zgZChA", label: "HÖR Berlín 2026" },
  },
  Bender: {
    genres: ["Melodic house"],
    instagram: "bendermusic",
  },
  "Clüb de Combat": {
    genres: ["Tech house", "House"],
    instagram: "club_decombat",
  },
  "Double Touch": {
    genres: ["Organic house", "Directo"],
    about: "Van-Anh Nguyen a los teclados y Mark Olsen a la batería",
    instagram: "doubletouchofficial",
  },
  Kimonos: {
    genres: ["House"],
    instagram: "kimonos.music",
  },
  "Maxi Meraki": {
    genres: ["Melodic house"],
    instagram: "maximeraki",
    video: { url: "https://www.youtube.com/watch?v=2tVL-GRQnq8", label: "ARCANA Argentina" },
  },
  Xinobi: {
    genres: ["House", "Disco"],
    about: "Portugués; cofundador de Discotexas",
    instagram: "xinobi",
    video: { url: "https://www.youtube.com/watch?v=NgTSKQAKQRo", label: "Musicbox Lisboa" },
  },
  "Ahmed Spins": {
    genres: ["Afro house"],
    about: "Primer DJ marroquí de house en tocar en Coachella",
    instagram: "ahmedspins",
  },
  "Nora En Pure": {
    genres: ["Deep house", "Indie dance"],
    instagram: "noraenpure",
    video: { url: "https://www.youtube.com/watch?v=nikX4PBk8Ks", label: "Progresja, Varsovia 2026" },
  },
  "Natascha Polké": {
    genres: ["Directo"],
    about: "Suiza; canta, produce y toca en directo",
    instagram: "nataschapolke.ch",
  },
  "Lost Desert": {
    genres: ["Melodic house", "Organic house"],
    about: "De la casa de All Day I Dream",
    instagram: "lostdesertmusic",
  },
  "Sam Shure": {
    genres: ["Melodic house", "Melodic techno"],
    instagram: "sam_shure",
    video: { url: "https://www.youtube.com/watch?v=HiMSQ4Zd4Ho", label: "Ritter Butzke 2024" },
  },
  "Francis Mercier": {
    genres: ["Afro house"],
    about: "Haitiano; jefe del sello Deep Root Tribe",
    instagram: "francismercier",
  },
  "Roy Rosenfeld": {
    genres: ["Melodic house", "Melodic techno"],
    about: "Israelí; Lost Miracle",
    instagram: "royrosenfeld_ofc",
  },
  "Kaz James": {
    genres: ["House"],
    about: "Australiano",
    instagram: "kazjames",
  },
  "Mason Collective": {
    genres: ["Tech house"],
    about: "Trío de Manchester",
    instagram: "masoncollective",
  },
  Enamour: {
    genres: ["Melodic house", "Melodic techno"],
    instagram: "enamourmusic",
  },
  "Captain Hook": {
    genres: ["Psytrance"],
    instagram: "djcaptainhook",
  },
  "Nadav Vee": {
    genres: ["Melodic house"],
    instagram: "nadavvee",
  },
  "Nico Bernardini": {
    genres: ["House"],
    about: "Italiano",
    instagram: "nicobernardiniofc",
  },
  "Grace Arribas": {
    genres: ["House", "Tech house"],
    about: "De Florida",
    instagram: "grace.arribas",
  },
  "Sebastian Konrad": {
    genres: ["Melodic house", "Melodic techno"],
    about: "Suizo; residente en Nordstern Basel",
    instagram: "sebastian.konrad",
  },
  "Syd Gris": {
    genres: ["House", "Techno"],
    about: "Fundador del propio Opulent Temple, donde pincha",
    instagram: "syd_gris",
  },
  Annicka: {
    genres: ["Minimal house"],
    instagram: "foreverannicka",
  },
  Calussa: {
    genres: ["House"],
    instagram: "calussa",
  },
  "Josh Gigante": {
    genres: ["Melodic house", "Melodic techno"],
    about: "Edita en Afterlife y Diynamic",
    instagram: "joshgigante",
  },
  "Julia Sandstorm": {
    genres: ["House"],
    about: "Sueca",
    instagram: "juliasandstorm",
  },
  Diplo: {
    genres: ["House", "Dancehall"],
    about: "Mitad de Major Lazer",
    instagram: "diplo",
    video: { url: "https://www.youtube.com/watch?v=eiPQwmlOLQQ", label: "Stagecoach 2026" },
  },
  SLANDER: {
    genres: ["Bass"],
    about: "Dúo de Los Ángeles",
    instagram: "slanderofficial",
  },
  "Spencer Brown": {
    genres: ["Progressive house"],
    about: "De San Francisco",
    instagram: "spencerbrownofficial",
  },
  Goldfish: {
    genres: ["House", "Directo"],
    about: "Saxo y contrabajo en directo; dúo sudafricano",
    instagram: "goldfishlive",
  },
  "Fleetmac Wood": {
    genres: ["House"],
    about: "No es un DJ: es una fiesta de remezclas de Fleetwood Mac",
    instagram: "fleetmac_wood",
  },
  "Mike Posner": {
    genres: ["Pop electrónico"],
    instagram: "mikeposner",
  },
  "Maddy O'Neal": {
    genres: ["Bass"],
    instagram: "maddy_oneal",
  },
  Rampue: {
    genres: ["Indie dance", "Directo"],
    about: "Directo electrónico desde Berlín",
    instagram: "rampue",
  },
  "Tom & Collins": {
    genres: ["Tech house", "Sonido latino"],
    instagram: "tomandcollins",
  },
  "Seth Schwarz": {
    genres: ["Organic house", "Directo"],
    about: "Toca el violín dentro del set",
    instagram: "seth_schwarz",
  },
  Monobase: {
    genres: ["House"],
    instagram: "monobase",
  },
  Mishell: {
    genres: ["House"],
    instagram: "_mishell_____",
  },
  "London Grammar": {
    genres: ["Pop electrónico"],
    about: "DJ set del trío británico",
    instagram: "londongrammar",
  },
  "Igor Marijuan": {
    genres: ["House"],
    about: "Veterano de la escena de Ibiza",
    instagram: "igormarijuan",
  },
  "Obie Fernandez": {
    genres: ["Progressive house", "Trance"],
    about: "Edita en Armada y Black Hole",
    instagram: "obiefernandez",
  },
  Emanate: {
    genres: ["House", "Techno"],
    instagram: "emanatesound",
  },
  Kazami: {
    genres: ["House"],
    instagram: "kazamimusic",
  },
  AMÉMÉ: {
    genres: ["Afro house"],
    about: "Beninesa-nigeriana; fundadora de One Tribe NYC",
    instagram: "amemedj",
  },
  Rebolledo: {
    genres: ["House", "Disco"],
    about: "Cosmic disco; creador de Time",
    instagram: "rebolledo_____",
  },
  Joezi: {
    genres: ["Afro house"],
    instagram: "joezi_z",
  },
  "Thiccboi Drewski": {
    genres: ["House", "Bass"],
    about: "De Brooklyn",
    instagram: "thiccboidrewski",
  },
  Casmalia: {
    genres: ["House", "Bass"],
    about: "Instructora de Ableton",
    instagram: "casmaliamusic",
  },
  "DJ Icon": {
    genres: ["House"],
    about: "Residente de Opulent Temple",
    instagram: "djicon",
  },
  "Madison Orange": {
    genres: ["House"],
    about: "Pincha haciendo hoop dancing con LED",
    instagram: "madisonorange",
  },
  "Wrecked Machines": {
    genres: ["Psytrance"],
    instagram: "wrecked_machines",
  },
  Vermont: {
    genres: ["Psytrance"],
    about: "Rafael Ferrari",
    instagram: "vermontmusic",
  },
  Holmar: {
    genres: ["Techno"],
    about: "También conocido como Acid Tourist; islandés",
    instagram: "holmarmusik",
  },
  "Ashley Fitelson": {
    genres: ["House"],
    instagram: "ashleyfitelson",
  },
  "Ashley Ames": {
    genres: ["House"],
    instagram: "ashleyamesmusic",
  },
  "Mary Mesk": {
    genres: ["House"],
    about: "Además produce y compone",
    instagram: "marymeskmusic",
  },
  "Techno Tupac": {
    genres: ["Techno"],
    instagram: "techno_tupac",
  },
  GALLiVANTER: {
    genres: ["House"],
    instagram: "gallivanter__dj",
  },
  LIDIYA: {
    genres: ["Melodic house", "Indie dance"],
    about: "De San Francisco; parte de Titanic's End",
    instagram: "lidiya.music",
  },
  "Hedda Stenberg": {
    genres: ["Melodic house"],
    instagram: "heddastenberg",
  },
  "Oliver Marshak": {
    genres: ["House"],
    about: "Entre Los Ángeles e Ibiza",
    instagram: "olivermarshak",
  },
  "Luciano Scalioni": {
    genres: ["House", "Tech house"],
    instagram: "luciano_scalioni",
  },
  "Arianna Sunshine": {
    genres: ["House"],
    about: "Australiana",
    instagram: "ariannasunshine_",
  },
  Mooglie: {
    genres: ["House"],
    instagram: "mooglie",
  },
  Kream: {
    genres: ["House"],
    about: "Dúo noruego de hermanos",
    instagram: "wearekream",
  },
  Riche: {
    genres: ["House"],
    about: "Se define como dirty, bouncy, groovy",
    instagram: "riche",
  },
  Gawdat: {
    genres: ["Tech house", "Disco"],
    about: "Uno de The Egyptian Brothers; cofundador de Dancin Music",
    instagram: "gawdat.official",
  },
  Luch: {
    genres: ["House"],
    about: "Daniel Grossman",
  },
  "Don Gentry": {
    genres: ["House"],
    instagram: "d1creator",
  },
  Unders: {
    genres: ["Melodic house", "Organic house"],
    about: "Duncan Melema, holandés; se curtió montando fiestas y noches de sello antes de pinchar en Time Warp, Awakenings y ADE",
    instagram: "undersmusic",
  },
  "Ro Rousseau": {
    genres: ["Organic house", "Melodic house"],
    about: "Ucraniano afincado en Los Ángeles; músico, promotor y habitual del playa desde el Burning Man virtual de 2020 con el campamento Kurenivka",
  },
  "Admiral Fantastica": {
    genres: ["Directo", "Melodic house"],
    about: "Alex Jack, guitarrista ucraniano en Los Ángeles con 35 años tocando. No es un DJ: mete guitarra y sintetizador en directo sobre la sesión. No confundir con Admiral, que es otro",
    instagram: "admiral_fantastica",
  },
  Natipitch: {
    genres: ["Melodic techno", "Deep house", "Tech house"],
    about: "Israelí",
  },
  Madmotormiquel: {
    genres: ["Deep house", "Melodic house", "Techno", "Disco"],
    about: "Berlinés salido del Bar 25 y el Katerholzig; lleva el sello URSL y es de sesiones maratón que van subiendo despacio",
  },
  Kotoe: {
    genres: ["Disco", "House", "Melodic house", "Techno"],
    about: "Berlinesa; DJ, actriz y organizadora de festivales. Mezcla texturas asiáticas y sudamericanas con su propia voz encima",
    instagram: "kotoekk",
  },
  "Nacho Isa": {
    genres: ["Melodic house", "Melodic techno", "House"],
    about: "De Nueva York; director musical de HNWC y fundador de la escuela de producción 343 Labs. Pinchó en el Mayan Warrior en 2022",
    instagram: "nachoisa",
  },
  "Avi Snow": {
    genres: ["Directo", "Downtempo", "Organic house"],
    about: "Multiinstrumentista de Los Ángeles, un tercio de la banda City of the Sun; sus temas pasan de 250 millones de escuchas",
    instagram: "cityofthesnow",
  },
  "Black Rock Philharmonic": {
    genres: ["Directo"],
    about: "No es un DJ: es la orquesta del playa, tocando en Black Rock City desde 2018. Entra de todo, de críos que empiezan con el instrumento a músicos profesionales",
  },
  "Meir Briskman": {
    genres: ["Directo", "Melodic techno"],
    about: "Director y compositor israelí, máster en dirección de orquesta por la Academia de Música y Danza de Jerusalén; monta sets sinfónicos en directo sobre electrónica",
    video: {
      url: "https://www.youtube.com/watch?v=m8EAmSvzgAQ",
      label: "Mita Gami & Meir Briskman · Mayan Warrior · Burning Man 2024",
    },
  },
  "Rockin Morrocin": {
    genres: ["Disco", "Melodic house", "House"],
    about: "Nabz, del oeste de Londres; percusión, disco nuevo y melódico en sesiones oscuras. Él lo escribe Rockin Moroccin. Edita en Get Physical, Diynamic y MIDH",
    instagram: "rockinmoroccin",
  },
  "D'Witches": {
    genres: ["Techno", "Afro house"],
    about: "Dúo mexicano: las gemelas Thania y Thamara Ortiz, techno con sonidos afro",
    instagram: "dwitchesofficial",
  },
  "Off in Lala": {
    genres: ["Tech house", "House"],
    about: "De San Francisco; ha abierto para Cloonee y Kaskade",
    instagram: "offinlalaverse",
  },
  Rhye: {
    genres: ["Directo", "Downtempo", "Pop electrónico"],
    about: "El proyecto de Michael Milosh, canadiense. En Secular Sabbath no toca el repertorio: es improvisación, él cantando melodías sin estructura sobre teclas y loops",
    instagram: "rhye",
  },
  TOKiMONSTA: {
    genres: ["Bass", "Downtempo"],
    about: "Jennifer Lee, de Los Ángeles. Primera mujer que firmó Flying Lotus para Brainfeeder; ahora en Ninja Tune y con su propio sello, Young Art",
    instagram: "tokimonsta",
  },
  "The Human Experience": {
    genres: ["Downtempo", "Directo", "Organic house"],
    about: "David Block, californiano; compositor de electrónica en directo y multiinstrumentista. Downtempo con instrumentación del mundo, y veterano del playa",
    instagram: "humanexperiencecreations",
  },
  "Ariel Vromen": {
    genres: ["Techno", "Trance", "Tech house", "Afro house"],
    about: "El director de cine de The Iceman. Antes de rodar fue DJ y tuvo estudio en Londres, y sigue pinchando: techno y trance con casa afro y latina, y un punto cinematográfico",
    instagram: "arielvromen",
  },
  "Sam Baroni": {
    genres: ["Deep house", "Melodic house"],
    about: "Francés afincado en Los Ángeles; deep house con aire de jungla y de Oriente Medio",
    instagram: "sambaronii",
    video: { url: "https://www.youtube.com/watch?v=owDeP8wU5cw", label: "Ephimera Tulum 2022" },
  },
  "Arymé": {
    genres: ["Afro house", "Deep house", "Organic house", "Melodic techno"],
    about: "De Casablanca y afincado en París. Cofundó YOKO, la fiesta mensual de afro-deep más grande de la ciudad, que ya sale también en Marrakech, Nueva York y Beirut",
    instagram: "aryme_music",
  },
  Philou: {
    genres: ["House", "Indie dance", "Sonido latino"],
    about: "Parisina, residente del Silencio y fundadora de su propia serie de fiestas, UNTITLED. Sus años en São Paulo se le notan: house y acid con groove latino",
  },
  Artemistique: {
    genres: ["Deep house", "House"],
    about: "De las noches de París; deep house con aire soul y texturas jazz",
    instagram: "artemistique_",
  },
};
