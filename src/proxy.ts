import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rutas accesibles sin sesión. El resto exige login.
 *
 * `/playa` entra aquí porque validar la sesión exige llamar a Supabase, y sin
 * cobertura eso no resuelve: la pantalla offline acabaría redirigiendo a login
 * justo cuando es la única que puede funcionar. No enseña nada por su cuenta —
 * lo que pinta sale del snapshot que ya está guardado en ese móvil.
 */
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/playa",
  // Lo que necesita el modo offline antes de que haya sesión que validar. Sin
  // esto el navegador pide /sw.js, el proxy le contesta con el HTML del login
  // y el service worker no llega ni a registrarse.
  "/sw.js",
  "/manifest.webmanifest",
  "/icons",
  "/fonts",
  "/brc",
  // El script de Vercel Analytics. Sin esto el proxy le devuelve el HTML del
  // login y el navegador intenta ejecutarlo como JavaScript.
  "/_vercel",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión (importante: no metas lógica entre createServerClient y getUser).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Sin sesión y ruta protegida -> a login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión y entrando a login -> a la home.
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Ejecuta en todo salvo estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
