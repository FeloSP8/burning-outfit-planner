import { getCurrentUser } from "@/lib/auth";
import { VENUES } from "@/lib/dj-lineups";
import { geocodeAddress, distanceMeters, formatDistance, walkMinutes } from "@/lib/brc-geocode";
import { MAN, BRC_YEAR } from "@/lib/brc-city";
import { MapPanel, type RovingVenue } from "@/components/map/MapPanel";
import type { MapVenue } from "@/components/map/CityMap";

export const metadata = {
  title: "Mapa de la ciudad · Burning Outfit Planner",
  description: "Black Rock City 2026 con los escenarios de la agenda situados en el plano",
};

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const placed: (MapVenue & { distance: string; walk: number })[] = [];
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Mapa de la ciudad
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Black Rock City {BRC_YEAR} con el plano oficial: {placed.length} escenarios situados,{" "}
          {roving.length} sin sitio fijo. Las direcciones son un reloj — las radiales son horas y
          las anulares van de la Esplanade a la K.
        </p>
      </div>

      <MapPanel venues={placed} roving={roving} />
    </div>
  );
}
