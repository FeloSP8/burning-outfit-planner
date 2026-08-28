import { getCurrentUser } from "@/lib/auth";
import { isShellRequest } from "@/lib/offline-routes";
import { EventsOffline } from "@/components/events/EventsOffline";
import { getEvents } from "@/lib/brc-api";
import { loadPicks } from "@/lib/dj-picks";
import { loadEventPicks } from "@/lib/event-picks";
import { EventsPanel } from "@/components/events/EventsPanel";

export const metadata = {
  title: "Eventos oficiales · Burning Outfit Planner",
  description: "Todo lo que pasa en Black Rock City, del listado oficial de Burning Man",
};

export default async function EventsPage() {
  // El armazón que sirve el service worker cuando no hay red: sin sesión,
  // sin base de datos y sin APIs. Se rellena ya en el móvil, con el snapshot.
  if (await isShellRequest()) return <EventsOffline />;

  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const [{ events, error }, picks, eventPicks] = await Promise.all([
    getEvents(),
    loadPicks(),
    loadEventPicks(),
  ]);
  const passes = events.reduce((total, event) => total + event.occurrences.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Eventos oficiales
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          {error
            ? "Ahora mismo no se pueden cargar."
            : `${events.length} eventos y ${passes} pases del listado oficial. La agenda de música la llevamos aparte: esto es todo lo demás — talleres, comida, charlas y fiestas de campamento. Marca con ★ a lo que quieras ir: sale en "Mi agenda" junto a los sets de DJs.`}
        </p>
      </div>

      <EventsPanel
        events={events}
        note={error ? `No se han podido cargar: ${error}` : null}
        picks={picks}
        eventPicks={eventPicks}
        currentUserName={user.name}
      />
    </div>
  );
}
