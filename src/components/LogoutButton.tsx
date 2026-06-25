"use client";

import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#6a4a20] hover:bg-[#c4822a]/20 hover:text-[#4a2a08] transition-all"
      >
        Salir
      </button>
    </form>
  );
}
