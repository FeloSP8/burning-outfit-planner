"use client";

import { OfflineFrame, useSnapshot } from "@/components/offline/OfflineFrame";
import { EventsPanel } from "@/components/events/EventsPanel";

/** Los eventos oficiales sin cobertura: los mismos filtros, del snapshot. */
export function EventsOffline() {
  const { snapshot, reading } = useSnapshot();

  return (
    <OfflineFrame title="Eventos oficiales" snapshot={snapshot} reading={reading}>
      {snapshot && (
        <EventsPanel
          events={snapshot.events}
          picks={snapshot.picks}
          eventPicks={snapshot.eventPicks}
          currentUserName={snapshot.userName}
          canPick={false}
          note={
            snapshot.events.length === 0
              ? "Esta copia no trae los eventos oficiales: se descargó cuando la API no respondía."
              : null
          }
        />
      )}
    </OfflineFrame>
  );
}
