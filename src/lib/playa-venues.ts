import { VENUES } from "@/lib/dj-lineups";
import { MAN } from "@/lib/brc-city";
import { distanceMeters, formatDistance, geocodeAddress, walkMinutes } from "@/lib/brc-geocode";
import type { MapVenue } from "@/components/map/CityMap";
import type { RovingVenue } from "@/components/map/MapPanel";

export interface PlacedVenue extends MapVenue {
  /** "1,2 km" desde el Hombre. */
  distance: string;
  walk: number;
}

/**
 * Los escenarios de la agenda, situados en el plano.
 *
 * Es cálculo puro sobre datos que están en el código, así que sale igual en el
 * servidor (la página `/map`) que en el navegador (la pantalla offline, que no
 * puede preguntarle nada a nadie).
 */
export function placeVenues(): { placed: PlacedVenue[]; roving: RovingVenue[] } {
  const placed: PlacedVenue[] = [];
  const roving: RovingVenue[] = [];

  for (const venue of VENUES) {
    const place = geocodeAddress(venue.location);
    if (!place) {
      roving.push({ id: venue.id, name: venue.name, emoji: venue.emoji, location: venue.location });
      continue;
    }
    const meters = distanceMeters(MAN, place.point);
    placed.push({
      id: venue.id,
      name: venue.name,
      stage: venue.stage,
      emoji: venue.emoji,
      location: venue.location,
      point: place.point,
      exact: place.exact,
      distance: formatDistance(meters),
      walk: walkMinutes(meters),
    });
  }

  return { placed, roving };
}
