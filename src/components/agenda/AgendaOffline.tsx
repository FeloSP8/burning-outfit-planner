"use client";

import { OfflineFrame, useSnapshot } from "@/components/offline/OfflineFrame";
import { AgendaClient } from "@/components/agenda/AgendaClient";
import { playaTodayLocal } from "@/lib/playa-today";

/**
 * La agenda de DJs sin cobertura.
 *
 * Es el mismo componente que con red y con todo dentro —los tres modos de ver,
 * los solapes, las fichas de los artistas—: los line-ups viven en el código,
 * así que lo único que hace falta del snapshot son las marcas del grupo.
 */
export function AgendaOffline() {
  const { snapshot, reading } = useSnapshot();

  return (
    <OfflineFrame title="Agenda de DJs" snapshot={snapshot} reading={reading}>
      {snapshot && (
        <AgendaClient
          initialPicks={snapshot.picks}
          initialFans={snapshot.fans}
          currentUserName={snapshot.userName}
          today={playaTodayLocal()}
          canPick={false}
        />
      )}
    </OfflineFrame>
  );
}
