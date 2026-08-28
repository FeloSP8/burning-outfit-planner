"use client";

import { OfflineFrame, useSnapshot } from "@/components/offline/OfflineFrame";
import { MapPanel } from "@/components/map/MapPanel";
import { placeVenues } from "@/lib/playa-venues";
import { toCampEvents } from "@/lib/camp-events";

/**
 * El mapa sin cobertura.
 *
 * Los escenarios se sitúan aquí mismo: `placeVenues` es cálculo puro sobre el
 * catálogo y la geometría de la ciudad, que van en el código. Del snapshot solo
 * salen los campamentos oficiales, que sí vienen de una API.
 */
export function MapOffline() {
  const { snapshot, reading } = useSnapshot();
  const { placed, roving } = placeVenues();

  return (
    <OfflineFrame title="Mapa de la ciudad" snapshot={snapshot} reading={reading}>
      {snapshot && (
        <MapPanel
          venues={placed}
          roving={roving}
          camps={snapshot.camps}
          // Sale gratis: los eventos ya van enteros en el snapshot.
          campEvents={toCampEvents(snapshot.events)}
          campPicks={snapshot.campPicks}
          currentUserName={snapshot.userName}
          canPick={false}
          campsNote={
            snapshot.camps.length === 0
              ? "Esta copia no trae el listado oficial de campamentos."
              : `${snapshot.camps.filter((c) => c.point).length} campamentos oficiales situados de ${snapshot.camps.length}.`
          }
        />
      )}
    </OfflineFrame>
  );
}
