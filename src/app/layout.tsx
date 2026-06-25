import type { Metadata } from "next";
import { Syne, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

// Body: Syne — geométrica, moderna, personalidad fuerte
const syne = Syne({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Display: Playfair Display — elegante, contraste alto
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Burning Outfit Planner",
  description: "Planificador de outfits para Burning Man",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="es" className={`${syne.variable} ${playfair.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {user && (
          <header className="sticky top-0 z-40 border-b border-[#b8956a]/20 bg-[#e8c99a]/80 backdrop-blur-md">
            <nav className="mx-auto flex max-w-6xl items-center gap-8 px-5 py-3.5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="text-xl">🔥</span>
                <span
                  className="text-base font-black tracking-tight text-[#7a3a10] group-hover:text-[#c45010] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  BURN OUTFITS
                </span>
              </Link>

              <div className="flex gap-1 ml-auto items-center">
                {[
                  { href: "/planner",   label: "Planificador" },
                  { href: "/inventory", label: "Inventario" },
                  { href: "/overview",  label: "Vista general" },
                  { href: "/wall",      label: "Muro" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg px-4 py-1.5 text-sm font-semibold text-[#6a4a20] hover:bg-[#c4822a]/20 hover:text-[#4a2a08] transition-all"
                  >
                    {label}
                  </Link>
                ))}
                <span className="ml-2 hidden text-sm font-semibold text-[#a08060] sm:inline">
                  {user.name}
                </span>
                <LogoutButton />
              </div>
            </nav>
          </header>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {children}
        </main>

        <footer className="border-t border-[#b8956a]/20 py-4 text-center text-xs text-[#a08060]">
          Burning Man 2026 · Playa Mode 🌵
        </footer>
      </body>
    </html>
  );
}
