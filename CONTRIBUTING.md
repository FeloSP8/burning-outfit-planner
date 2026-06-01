# Guía de contribución y arquitectura

## Contexto del proyecto

**Burn Outfits** es una app de planificación de vestuario para el festival Burning Man. El problema concreto que resuelve: el festival dura ~9 días con una diferencia de temperatura brutal entre el día (40°C, polvo, sol) y la noche (5-10°C, frío). Planificar qué ponerse cada turno, saber qué prendas tienes compradas y cómo te va a quedar un outfit es el flujo principal.

La app está diseñada como **single-user, local-first**: sin auth, sin cloud, sin servidor externo. Toda la complejidad está en la lógica de negocio (outfits, turnos, try-on encadenado), no en infraestructura.

---

## Setup de desarrollo

```bash
npm install
cp .env.example .env.local   # editar con tus keys o dejar AI_MOCK=true
npx prisma migrate dev        # crea prisma/dev.db
npm run dev                   # http://localhost:3001
```

Para regenerar el cliente Prisma tras cambiar el schema:
```bash
npx prisma generate
```

Para crear una nueva migración:
```bash
npx prisma migrate dev --name nombre_descriptivo
```

---

## Decisiones de arquitectura

### ¿Por qué Next.js full-stack en lugar de React + Express separados?

Para single-user local, separar frontend y backend añade complejidad sin beneficio: dos procesos, CORS, contratos duplicados, dos deploys. Next.js App Router permite Route Handlers como backend y Server Components para fetching de datos, con tipos TypeScript compartidos entre ambos sin ningún boilerplate extra.

### ¿Por qué SQLite en lugar de PostgreSQL o MongoDB?

- **vs PostgreSQL**: para single-user local, PostgreSQL requiere un daemon corriendo. SQLite es un archivo. La migración es trivial: cambiar `provider = "sqlite"` → `"postgresql"` en `schema.prisma`.
- **vs MongoDB**: el modelo de datos es inherentemente relacional. La relación N:M `Outfit ↔ Garment` (una prenda reutilizable en muchos outfits) y las unicidades `[dayId, type]` y `[outfitId, garmentId]` son exactamente para lo que existe SQL. Mongo añadiría complejidad de joins manuales sin ninguna ventaja.

### ¿Por qué IDM-VTON y no FLUX/ControlNet/Stable Diffusion genérico?

Los modelos genéricos (FLUX, SD ControlNet) generan ropa *inspirada* en un prompt o referencia, pero **no preservan la prenda real**. El resultado visualmente parece la prenda pero no es la misma. IDM-VTON fue diseñado específicamente para virtual try-on: recibe `human_img` + `garment_img` y preserva tanto la identidad del usuario como el tejido, estampado y forma exacta de la prenda.

**Limitación conocida**: IDM-VTON procesa una prenda por pasada, solo `upper_body` y `lower_body`. El outfit completo se resuelve encadenando pasadas. Calzado y accesorios quedan fuera porque el modelo los maneja con baja fidelidad.

**Alternativa de calidad superior** (post-MVP): APIs especializadas como FASHN.ai o Revery.ai — mayor realismo, mejor manejo de múltiples prendas, pero con coste por llamada y otra cuenta que gestionar.

### ¿Por qué Vercel AI SDK + `generateObject` para las sugerencias?

`generateObject` con un schema Zod garantiza que la respuesta del LLM es siempre JSON estructurado válido, sin parseo frágil de texto libre. El SDK abstrae el proveedor (OpenAI/Anthropic/etc.) — cambiar de Claude a GPT-4 es cambiar una línea. El streaming está disponible si se necesita en el futuro.

### ¿Por qué filesystem local para las imágenes?

Para MVP single-user, S3/Cloudinary añade latencia, coste y configuración. Las imágenes viven en `/public/uploads/` y Next.js las sirve estáticamente. La función `saveBuffer` en `src/lib/storage.ts` es el único lugar a cambiar para migrar a S3.

---

## Convenciones del código

### Estructura de archivos

- **Server Components** por defecto para páginas (`app/*/page.tsx`) — fetching de datos directo con Prisma, serialización de fechas antes de pasar a cliente
- **Client Components** (`"use client"`) solo cuando se necesita: interactividad, estado local, efectos
- **Route Handlers** en `app/api/` — validación con Zod, errores con status codes explícitos, nunca silenciar errores con `catch(() => {})`

### Convención de IDs

El `userId` por defecto es `"user_default"` (definido en `SEED_USER_ID`). Todas las queries filtran por `userId`. Al añadir auth, reemplazar `DEFAULT_USER_ID` por `session.user.id` en cada page y route handler.

### Modos mock

Las funciones de IA en `src/lib/replicate.ts` y `src/lib/ai.ts` comprueban `process.env.AI_MOCK === "true"` al inicio y devuelven datos de ejemplo sin llamar a ninguna API. Esto permite desarrollar y testear el flujo completo sin costes.

### Serialización de fechas

Prisma devuelve `Date` objects. Los Server Components serializan las fechas a `string` (`.toISOString()`) antes de pasarlas a Client Components. Los tipos en `src/types/index.ts` usan `string` para fechas, no `Date`.

---

## Áreas de mejora conocidas

| Área | Descripción |
|------|-------------|
| **Try-on multi-prenda** | IDM-VTON encadena pasadas (degrada con cada pasada). Explorar FASHN.ai para outfit completo en una sola llamada |
| **Try-on calzado/accesorios** | Actualmente excluidos. Requeriría un modelo diferente o composición de imagen |
| **Cache de try-on** | El resultado se guarda en `TryOnResult` pero no se invalida al cambiar prendas del outfit. Añadir lógica de invalidación en `POST /outfits/:id/items` |
| **Multi-usuario** | El schema ya está preparado (`userId` en todas las entidades). Falta añadir auth y reemplazar `DEFAULT_USER_ID` |
| **Tests** | Sin cobertura de tests. Prioritario: tests de integración para los Route Handlers de outfits/items |
| **Offline** | Las imágenes de try-on se sirven desde `/public/uploads` — funcionan offline. El resto de la app requiere servidor local |

---

## Guía para añadir un nuevo slot de prenda

Si quisieras añadir una categoría nueva (ej. `BELT` para cinturones):

1. `prisma/schema.prisma` — no hay cambios necesarios (el slot es un `String` libre)
2. `src/types/index.ts` — añadir `"BELT"` al tipo `GarmentSlot`
3. `src/components/planner/ShiftCard.tsx` — añadir entrada en el array `SLOTS`
4. `src/components/inventory/GarmentForm.tsx` — añadir al array `SLOTS`
5. `src/app/inventory/page.tsx` — añadir al array `SLOTS`
6. `src/app/overview/page.tsx` — añadir al objeto `SLOT_LABEL`
7. `src/app/api/outfits/[id]/items/route.ts` — si el slot debe ser único, añadirlo a `UNIQUE_SLOTS`

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | `file:./prisma/dev.db` para local |
| `SEED_USER_ID` | Sí | ID del usuario por defecto (`user_default`) |
| `AI_MOCK` | No | `"true"` para modo demo sin API keys |
| `REPLICATE_API_TOKEN` | Solo si `AI_MOCK=false` | Token de Replicate para IDM-VTON |
| `ANTHROPIC_API_KEY` | Solo si `AI_MOCK=false` | API key de Anthropic para Claude |
| `NEXT_PUBLIC_BASE_URL` | No | URL pública del servidor (para try-on con imágenes locales en desarrollo con ngrok) |
