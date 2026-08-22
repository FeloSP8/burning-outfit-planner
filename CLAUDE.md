@AGENTS.md

# Git
Always commit and push directly to `master`. Never create feature branches or push to any other branch.

# Entorno del usuario
Trabaja **siempre desde el móvil**. No tiene terminal, ni el repo clonado, ni `.env`.

- Nunca le pases comandos para ejecutar en local (`npx prisma …`, `git …`, scripts). Si algo necesita uno, lánzalo tú aquí o busca otra vía.
- Lo que tenga que hacer él va como texto para pegar en una web: SQL para el SQL Editor de Supabase, una variable en Vercel, un botón de GitHub.
- El SQL para pegar: una sentencia por línea, sin líneas en blanco y re-ejecutable. Pegar en el móvil parte las sentencias multilínea, y un script a medio aplicar tiene que poder relanzarse sin romper.
- Verifica tú, no le pidas que ejecute una comprobación y te cuente el resultado.
