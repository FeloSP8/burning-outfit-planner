"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/auth/actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-8 text-center">
        <span className="text-3xl">🔥</span>
        <h1
          className="mt-2 text-2xl font-black tracking-tight text-[#7a3a10]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          BURN OUTFITS
        </h1>
        <p className="mt-1 text-sm text-[#a08060]">Crea tu cuenta</p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[#6a4a20]">
          Nombre
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Tu nombre"
            className="rounded-lg border border-[#b8956a]/40 bg-white/60 px-3 py-2 text-[#4a2a08] outline-none focus:border-[#c45010]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[#6a4a20]">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-[#b8956a]/40 bg-white/60 px-3 py-2 text-[#4a2a08] outline-none focus:border-[#c45010]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[#6a4a20]">
          Contraseña
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-lg border border-[#b8956a]/40 bg-white/60 px-3 py-2 text-[#4a2a08] outline-none focus:border-[#c45010]"
          />
        </label>

        {state?.error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-[#c45010] px-4 py-2.5 font-bold text-white transition-colors hover:bg-[#a53e08] disabled:opacity-60"
        >
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6a4a20]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-[#c45010] hover:underline">
          Entra
        </Link>
      </p>
    </div>
  );
}
