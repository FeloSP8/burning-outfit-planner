import { PlayaClient } from "@/components/playa/PlayaClient";

export const metadata = {
  title: "Modo playa · Burning Outfit Planner",
  description: "La agenda, los outfits, la checklist y el mapa, también sin cobertura",
};

/**
 * Ruta pública a propósito (ver `PUBLIC_PATHS` en `src/proxy.ts`).
 *
 * Sin cobertura no se puede validar una sesión contra Supabase, así que si
 * esta pantalla exigiera login sería inútil justo cuando hace falta. No consulta
 * la base de datos: todo sale del snapshot que guarda el navegador, que solo se
 * puede descargar habiendo entrado antes.
 */
export default function PlayaPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p
          className="text-4xl leading-tight text-[#7a2e08] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Modo playa
        </p>
        <p className="mt-1 text-sm font-medium text-[#7a5030]">
          Lo que te llevas puesto cuando no hay cobertura ni datos.
        </p>
      </div>

      <PlayaClient />
    </div>
  );
}
