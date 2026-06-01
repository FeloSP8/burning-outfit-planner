# 🔥 Burn Outfits — Festival Outfit Planner

Aplicación web para planificar el vestuario de un festival en el desierto (Burning Man) día a día, con soporte para dos turnos climáticamente opuestos: **Tarde** (calor extremo, 40°C+) y **Noche** (frío de playa, 5-10°C), probador virtual con IA y sugerencias de outfits.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite)
![Replicate](https://img.shields.io/badge/Replicate-IDM--VTON-purple)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-orange)

---

## Funcionalidades

### 🗓️ Planificador de días y turnos
- Configura el rango de fechas del evento (por defecto: Burning Man 2026, 24 ago – 1 sep)
- Cada día tiene dos bloques independientes: **Tarde** y **Noche**
- Puedes activar/desactivar cada turno por día (ej. el primer día solo llegas de noche)
- Etiquetas personalizables por día
- Las asignaciones se guardan automáticamente al seleccionar, con feedback visual por slot (spinner → ✓ / !)

### 👕 Inventario de prendas
- Cinco categorías: **Parte de arriba · Parte de abajo · Calzado · Accesorios · Abrigo**
- Cada prenda tiene: foto (subida por clic o **Ctrl+V desde el portapapeles**), estado (`PENDIENTE / COMPRADO / RECIBIDO`), enlace de compra y notas
- Las prendas son **reutilizables** en diferentes outfits y días
- Crear, editar (clic en la card) y eliminar prendas

### 🤖 Probador Virtual (Virtual Try-On)
- Sube tu foto de cuerpo completo en el Planificador
- Al pulsar "Probador Virtual" en un turno, la app encadena llamadas a **IDM-VTON** (Replicate): `foto_base → +TOP → resultado → +BOTTOM → resultado final`
- El resultado se guarda en base de datos y se muestra en la card y en la Vista General
- Modo mock con `AI_MOCK=true` para desarrollar sin gastar créditos

### ✨ Sugerencias de outfits con IA
- Botón en el Inventario que analiza todas tus prendas y pide a **Claude** (Anthropic) que proponga 3 combinaciones nuevas respetando la estética y el clima de BM
- Las sugerencias de turno `NOCHE` siempre incluyen abrigo

### 🖼️ Vista General
- Galería de todos los días y turnos del evento
- Muestra la imagen del try-on cuando existe, o placeholder con enlace directo a generarla
- Lista de prendas del outfit con thumbnail, nombre, categoría y estado de compra

---

## Stack técnico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Next.js 16** App Router | Full-stack en un repo. Route Handlers = API. Server Components = sin fetch boilerplate |
| Lenguaje | **TypeScript** | Tipos compartidos cliente/servidor sin contratos duplicados |
| ORM | **Prisma 7** | Schema declarativo + migraciones + tipos generados. SQLite → Postgres = 1 línea |
| Base de datos | **SQLite** (local, `better-sqlite3`) | Cero infraestructura para single-user. La relación N:M Outfit↔Prenda es relacional pura |
| Estilos | **Tailwind CSS 4** | Utilidades directas sin CSS custom |
| Fuentes | **Syne** (body) + **Playfair Display** (display) | Personalidad festival, legibilidad sobre fondo arena |
| Try-On IA | **Replicate — IDM-VTON** | Único modelo público que preserva la prenda real Y la identidad del usuario. FLUX no sirve: genera ropa "inspirada", no la prenda exacta |
| LLM | **Anthropic Claude** vía Vercel AI SDK | `generateObject` + schema Zod garantiza JSON estructurado sin parseo frágil |
| Storage | **Filesystem local** `/public/uploads` | MVP single-user. Migrable a S3/R2 cambiando únicamente `src/lib/storage.ts` |
| Validación | **Zod 4** | En API routes y en respuestas del LLM |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                         # Home — stats del evento + guía de 3 pasos
│   ├── planner/page.tsx                 # Planificador — días × turnos × outfits
│   ├── inventory/page.tsx               # Inventario — prendas agrupadas por categoría
│   ├── overview/page.tsx                # Vista general — galería de todos los outfits
│   ├── layout.tsx                       # Shell: nav, fuentes (Syne+Playfair), fondo arena
│   ├── globals.css                      # Degradado arena, tokens CSS, scrollbar, selects
│   └── api/
│       ├── user/route.ts                # GET · PATCH  perfil del usuario
│       ├── days/route.ts                # GET  días con shifts y outfits anidados
│       ├── days/range/route.ts          # POST crear rango  ·  DELETE limpiar todo
│       ├── garments/route.ts            # GET lista (filtro ?slot=)  ·  POST crear
│       ├── garments/[id]/route.ts       # GET · PATCH editar · DELETE eliminar
│       ├── outfits/[id]/route.ts        # GET outfit completo con items y try-on
│       ├── outfits/[id]/items/route.ts  # POST asignar prenda  ·  DELETE quitar
│       ├── upload/route.ts              # POST subir imagen → { url }  (max 5 MB)
│       ├── ai/try-on/route.ts           # POST try-on encadenado (Replicate IDM-VTON)
│       └── ai/suggest/route.ts         # POST sugerencias de combinaciones (Claude)
│
├── components/
│   ├── planner/
│   │   ├── DayPlanner.tsx              # Tabs de días + grid de turnos (client)
│   │   ├── ShiftCard.tsx               # Card Tarde/Noche: slots, guardado auto, try-on
│   │   ├── RangeSetup.tsx              # Selector de fechas + tabla de toggles Tarde/Noche
│   │   └── UserPhotoWidget.tsx         # Avatar circular + subida de foto de perfil
│   ├── inventory/
│   │   ├── GarmentCard.tsx             # Card: hover → botones editar/eliminar
│   │   ├── GarmentForm.tsx             # Formulario crear/editar (paste Ctrl+V incluido)
│   │   └── GarmentFormModal.tsx        # Wrapper modal para el formulario
│   └── ai/
│       └── SuggestButton.tsx           # Botón + resultados de sugerencias IA
│
├── lib/
│   ├── db.ts                           # Prisma singleton con adapter better-sqlite3
│   ├── replicate.ts                    # Try-on encadenado IDM-VTON + modo mock
│   ├── ai.ts                           # Sugerencias Claude (generateObject+Zod) + mock
│   └── storage.ts                      # Guardar/leer imágenes en /public/uploads
│
└── types/
    └── index.ts                        # Tipos compartidos: Day, Shift, Outfit, Garment…

prisma/
├── schema.prisma                       # Modelos de datos
├── migrations/                         # Historial SQL de migraciones
└── dev.db                              # Base de datos SQLite (git-ignored)
```

---

## Modelo de datos

```
User (1) ──< Day (1) ──< Shift  (type: TARDE|NOCHE)
                              │
                              ▼ 1:1
                           Outfit
                              │  
                              ▼ N:M (tabla puente OutfitItem)
                           Garment  (slot: TOP|BOTTOM|SHOES|ACCESSORY|COAT)

Outfit (1) ──────────────< TryOnResult  (imageUrl generada por IDM-VTON)
```

**Reglas de negocio:**
- `Shift` unique `[dayId, type]` — máximo 1 Tarde + 1 Noche por día
- `Outfit` existe en relación 1:1 con su `Shift`, se crea automáticamente al crear el turno
- Slots `TOP`, `BOTTOM`, `SHOES`, `COAT` son únicos por outfit — asignar uno nuevo reemplaza el anterior
- `ACCESSORY` admite múltiples prendas en el mismo outfit
- La card Noche muestra aviso si no tiene `COAT` asignado

---

## Instalación

### Requisitos
- Node.js ≥ 18
- npm ≥ 9

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/burning-outfit-planner.git
cd burning-outfit-planner
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DATABASE_URL="file:./prisma/dev.db"
SEED_USER_ID="user_default"

# Con AI_MOCK=true la app funciona sin API keys (modo demo)
AI_MOCK="true"
REPLICATE_API_TOKEN=""
ANTHROPIC_API_KEY=""
```

### 3. Crear la base de datos

```bash
npx prisma migrate dev --name init
```

### 4. Arrancar

```bash
npm run dev
# → http://localhost:3001
```

---

## Activar la IA real

| Servicio | Dónde conseguir la key | Variable |
|----------|------------------------|----------|
| Virtual Try-On | [replicate.com](https://replicate.com) → API tokens | `REPLICATE_API_TOKEN` |
| Sugerencias de outfits | [console.anthropic.com](https://console.anthropic.com) | `ANTHROPIC_API_KEY` |

Cambia `AI_MOCK="false"` en `.env.local` para activarlas.

**Nota sobre el Try-On:** IDM-VTON aplica una prenda por pasada. El outfit completo se genera encadenando llamadas. Calzado y accesorios se excluyen del núcleo porque el modelo los maneja con baja fidelidad — se aplican solo `TOP` y `BOTTOM`.

---

## Migrar a producción

La app está diseñada single-user pero el schema ya tiene `userId` en todas las entidades:

1. **Base de datos**: cambiar `provider = "sqlite"` → `"postgresql"` en `prisma/schema.prisma`
2. **Auth**: añadir NextAuth.js o Clerk; reemplazar `DEFAULT_USER_ID` por `session.user.id`
3. **Storage**: reemplazar `src/lib/storage.ts` con un cliente S3 / Cloudflare R2

---

## Licencia

MIT
