import type { Metadata } from "next";
import { Syne } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { NavMenu } from "@/components/NavMenu";
import { BurningCountdown } from "@/components/BurningCountdown";
import { Analytics } from "@vercel/analytics/next";

// Body: Syne — geométrica, moderna, personalidad fuerte
const syne = Syne({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Display: Lunok — display de un solo corte (regular 400, sin cursiva ni negrita).
// Self-hosted: el CSS de cdnfonts no declara font-display y usa local(), que
// serviría una versión distinta si el usuario tiene Lunok instalada.
const lunok = localFont({
  src: "../../public/fonts/LunokRegular.woff",
  variable: "--font-display",
  display: "swap",
  weight: "400",
  style: "normal",
  // Fallback métrico: evita el salto de layout al cargar.
  fallback: ["Georgia", "serif"],
  // OJO: Lunok solo tiene 85 glifos dibujados. Los otros 163 (acentos, ñ, ¿, ¡,
  // y también ! $ & ? _) existen en la cmap pero apuntan a una caja de relleno
  // — todos con advance 830. Sin este unicode-range, "Estadísticas" pinta un
  // cuadro en vez de la í. Limitando el rango, esos caracteres caen al
  // fallback (Georgia) en lugar de romperse.
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0020, U+0022-0023, U+0025, U+0027-003E, U+0040-005D, U+0061-007A, U+00A0",
    },
  ],
});

export const metadata: Metadata = {
  title: "Burning Outfit Planner",
  description: "Planificador de outfits para Burning Man",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="es" className={`${syne.variable} ${lunok.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {user && (
          <header className="sticky top-0 z-40 border-b border-[#b8956a]/20 bg-[#e8c99a]/80 backdrop-blur-md">
            {/* Fila principal: logo + hamburguesa, o logo + links en xl */}
            <nav className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-5 sm:py-3.5">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <span className="text-xl">🔥</span>
                {/* En minúsculas a propósito: la "o" de Lunok solo lleva el
                    trazo interior en caja baja; en mayúscula sale limpia. */}
                <span
                  className="text-lg tracking-wide text-[#7a3a10] group-hover:text-[#c45010] transition-colors sm:text-xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  burn outfits
                </span>
              </Link>

              <NavMenu userName={user.name} />
            </nav>

            {/* Countdown siempre en su propia línea. En la fila principal no
                cabe: el nav está limitado a max-w-6xl (1152px) y logo + los 7
                enlaces + countdown suman ~1282px, así que "Vista general" se
                partía en dos líneas en cualquier monitor. */}
            <div className="flex justify-center border-t border-[#b8956a]/15 py-1.5">
              <BurningCountdown />
            </div>
          </header>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-5 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-[#b8956a]/20 py-4 text-center text-xs text-[#a08060]">
          Burning Man 2026 · Playa Mode 🌵
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
