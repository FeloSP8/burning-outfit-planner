import { getCurrentUser } from "@/lib/auth";
import { getCamps, toPins } from "@/lib/brc-api";
import { BRC_YEAR } from "@/lib/brc-city";
import { placeVenues } from "@/lib/playa-venues";
import { MapPanel } from "@/components/map/MapPanel";

export const metadata = {
  title: "Mapa de la ciudad · Burning Outfit Planner",
  description: "Black Rock City 2026 con los escenarios de la agenda situados en el plano",
};

export default async function MapPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const { placed, roving } = placeVenues();
  const { camps, error, locationsEmbargoed } = await getCamps();
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
