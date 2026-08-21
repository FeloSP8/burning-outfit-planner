import { getCurrentUser } from "@/lib/auth";
import { loadPicks } from "@/lib/dj-picks";
import { playaToday } from "@/lib/weather";
import { ALL_ARTISTS, ALL_SETS, DAYS_WITH_LINEUP, venueLabel } from "@/lib/dj-agenda";
import { VENUES } from "@/lib/dj-lineups";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export const metadata = {
  title: "Agenda de DJs · Burning Outfit Planner",
  description:
    "Line-ups por día de los campamentos del playa: elige qué sets quieres ver y arma tu agenda.",
};

export default async function AgendaPage() {
  const user = await getCurrentUser();
  if (!user) return null; // el proxy ya redirige a /login

  const picks = await loadPicks();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Agenda de DJs
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          {ALL_SETS.length} sets y {ALL_ARTISTS.length} artistas en {DAYS_WITH_LINEUP.length} días.
          Marca con ★ los que quieras ver: la agenda se arma sola y avisa cuando dos se pisan.
        </p>
      </div>

      <AgendaClient initialPicks={picks} currentUserName={user.name} today={playaToday()} />

      <p className="text-[11px] font-medium leading-relaxed text-[#a07040]">
        Line-ups transcritos de los carteles de{" "}
        {VENUES.map((v) => `${venueLabel(v)} (${v.location})`).join(" · ")}. Faltan campamentos y horarios: los carteles
        salen con cuentagotas y algunos solo publican el orden de los sets, no la hora. Cuando
        aparezca uno nuevo se añade a <span className="font-bold">src/lib/dj-lineups.ts</span>.
      </p>
    </div>
  );
}
