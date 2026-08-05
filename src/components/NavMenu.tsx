"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

const LINKS = [
  { href: "/wall",      label: "Muro" },
  { href: "/checklist", label: "Checklist" },
  { href: "/planner",   label: "Planificador" },
  { href: "/inventory", label: "Inventario" },
  { href: "/style",     label: "Estilismo" },
  { href: "/overview",  label: "Vista general" },
  { href: "/stats",     label: "Estadísticas" },
  { href: "/route",     label: "Ruta" },
];

export function NavMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // whitespace-nowrap: sin esto "Vista general" se parte en dos líneas cuando
  // la barra va justa de ancho y descuadra la fila entera.
  const linkClass = (href: string) =>
    `whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all xl:px-3 ${
      pathname === href
        ? "bg-[#c4822a]/25 text-[#4a2a08]"
        : "text-[#6a4a20] hover:bg-[#c4822a]/20 hover:text-[#4a2a08]"
    }`;

  return (
    <>
      {/* Desktop: menú horizontal a partir de xl. El bloque de enlaces mide
          ~737px y con el logo se desborda por debajo de 1280px. */}
      <div className="ml-auto hidden items-center gap-0.5 xl:flex">
        {LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            {label}
          </Link>
        ))}
        <span className="ml-2 text-sm font-semibold text-[#a08060]">{userName}</span>
        <LogoutButton />
      </div>

      {/* Móvil y tablet: botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#7a3a10] hover:bg-[#c4822a]/20 xl:hidden"
      >
        <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {/* Móvil y tablet: panel desplegable */}
      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-[#b8956a]/20 bg-[#e8c99a]/95 backdrop-blur-md xl:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`${linkClass(href)} block`}
              >
                {label}
              </Link>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-[#b8956a]/30 pt-2">
              <span className="text-sm font-semibold text-[#a08060]">{userName}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
