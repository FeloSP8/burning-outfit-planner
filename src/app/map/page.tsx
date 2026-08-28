import { getCurrentUser } from "@/lib/auth";
import { isShellRequest } from "@/lib/offline-routes";
import { MapOffline } from "@/components/map/MapOffline";
import { getCamps, getEvents, toPins } from "@/lib/brc-api";
import { toCampEvents } from "@/lib/camp-events";
import { loadCampPicks } from "@/lib/camp-picks";
import { BRC_YEAR } from "@/lib/brc-city";
import { placeVenues } from "@/lib/playa-venues";
import { MapPanel } from "@/components/map/MapPanel";

export const metadata = {
  title: "Mapa de la ciudad · Burning Outfit Planner",
  description: "Black Rock City 2026 con los escenarios de la agenda situados en el plano",
};

export default async function MapPage() {
  // El armazón que sirve el service worker cuando no hay red: sin sesión,
  // sin base de datos y sin APIs. Se rellena ya en el móvil, con el snapshot.
  if (await isShellRequest()) return <MapOffline />;

  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const { placed, roving } = placeVenues();
  const [{ camps, error, locationsEmbargoed }, { events }, campPicks] = await Promise.all([
    getCamps(),
    // Solo para poder enseñar qué monta cada campamento marcado. Van recortados
    // a lo que se pinta: enteros son cientos de kB de más en cada carga.
    getEvents(),
    loadCampPicks(),
  ]);
  const placedCamps = camps.filter((camp) => camp.point).length;

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

      <MapPanel
        venues={placed}
        roving={roving}
        camps={toPins(camps)}
        campEvents={toCampEvents(events)}
        campPicks={campPicks}
        currentUserName={user.name}
        campsNote={
          error
            ? `Campamentos oficiales no disponibles: ${error}`
            : locationsEmbargoed
              ? "El listado oficial está, pero sus direcciones no se pueden enseñar hasta el domingo previo al evento."
              : `${placedCamps} campamentos oficiales situados de ${camps.length}. Los que faltan no publican dirección todavía.`
        }
      />
    </div>
  );
}
