"use client";

import {
  NoSnapshot,
  OfflineFrame,
  formatWhen,
  useSnapshot,
} from "@/components/offline/OfflineFrame";
import { AgendaClient } from "@/components/agenda/AgendaClient";
import { playaTodayLocal } from "@/lib/playa-today";

/**
 * La agenda de DJs sin cobertura.
 *
 * Es el mismo componente que con red y con todo dentro: los tres modos de ver,
 * los solapes, las fichas de los artistas.
 *
 * Y es la única de las tres secciones que funciona **sin copia descargada**:
 * los line-ups, los artistas y los géneros viven en el código, así que lo único
 * que se pierde sin snapshot son las marcas del grupo —quién va a qué y qué DJs
 * le gustan a quién—. Dejar la pantalla en blanco por eso sería tirar el cartel
 * entero por no saber quién lo ha marcado.
 */
export function AgendaOffline() {
  const { snapshot, reading } = useSnapshot();

  const status = snapshot
    ? `Copia del ${formatWhen(snapshot.generatedAt)}. Se puede consultar y filtrar todo; marcar necesita red.`
    : "Sin copia guardada: sale el cartel entero, pero no quién ha marcado qué.";

  return (
    <OfflineFrame title="Agenda de DJs" status={status} reading={reading}>
      <AgendaClient
        initialPicks={snapshot?.picks ?? {}}
        initialFans={snapshot?.fans ?? {}}
        currentUserName={snapshot?.userName ?? ""}
        today={playaTodayLocal()}
        canPick={false}
      />
      {!snapshot && <NoSnapshot what="Lo que el grupo ha marcado" />}
    </OfflineFrame>
  );
}
