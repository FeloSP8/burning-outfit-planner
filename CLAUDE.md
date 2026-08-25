@AGENTS.md

# Git
Always commit and push directly to `master`. Never create feature branches or push to any other branch.

# Entorno del usuario
Trabaja **siempre desde el móvil**. No tiene terminal, ni el repo clonado, ni `.env`.

- Nunca le pases comandos para ejecutar en local (`npx prisma …`, `git …`, scripts). Si algo necesita uno, lánzalo tú aquí o busca otra vía.
- Lo que tenga que hacer él va como texto para pegar en una web: SQL para el SQL Editor de Supabase, una variable en Vercel, un botón de GitHub.
- El SQL para pegar: una sentencia por línea, sin líneas en blanco y re-ejecutable. Pegar en el móvil parte las sentencias multilínea, y un script a medio aplicar tiene que poder relanzarse sin romper.
- Verifica tú, no le pidas que ejecute una comprobación y te cuente el resultado.

# Carteles de DJs
Cuando llegue un cartel nuevo para la agenda (`/agenda`), el trabajo completo es:

1. **Comprobar duplicados antes de transcribir.** La misma fiesta se anuncia desde dos campamentos y desde los art cars. Cruzar fecha + artistas contra `src/lib/dj-lineups.ts`; si ya está, no se repite.
2. **Transcribir el cartel** a `src/lib/dj-lineups.ts`, respetando su ortografía de los nombres y anotando en `note` lo que el cartel no dice y se ha estimado.
3. **Rellenar la ficha de todos los artistas nuevos** en `src/lib/dj-artists.ts`: género (del vocabulario cerrado `GENRES`, nunca uno inventado), algo de contexto en `about`, Instagram y un vídeo de un set reciente. Buscarlo en internet, no de memoria, y no meter nunca un handle ni un id de YouTube sin haberlo visto en los resultados. Lo que no se encuentre se deja vacío y se dice.
