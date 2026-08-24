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
};
