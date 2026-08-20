# 🔥 Burn Outfits — Festival Outfit Planner

Aplicación web para planificar el vestuario de un festival en el desierto (Burning Man) día a día, con soporte para dos turnos climáticamente opuestos: **Tarde** (calor extremo, 40°C+) y **Noche** (frío de desierto, 5-10°C), y probador virtual con IA.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite)
![Leonardo.Ai](https://img.shields.io/badge/Leonardo.Ai-GPT_Image_2-blueviolet)

---

## Funcionalidades

### 🗓️ Planificador de días y turnos
- Configura el rango de fechas del evento (por defecto: Burning Man 2026, 30 ago – 7 sep)
- Cada día tiene dos bloques independientes: **Tarde** y **Noche**
- Puedes activar/desactivar cada turno por día (ej. el primer día solo llegas de noche)
- Etiquetas personalizables por día
- Las asignaciones se guardan automáticamente al seleccionar, con feedback visual por slot (spinner → ✓ / !)

### 👕 Inventario de prendas
- Seis categorías: **Parte de arriba · Parte de abajo · Calzado · Accesorios · Abrigo · Accesorios bici**
- Cada prenda tiene: foto (subida por clic o **Ctrl+V desde el portapapeles**), estado (`PENDIENTE / COMPRADO / RECIBIDO`), precio, enlace de compra y notas
- La categoría **Accesorios bici** aparece en el inventario pero no en los outfits
- Las prendas son **reutilizables** en diferentes outfits y días
- Crear, editar (clic en la card) y eliminar prendas

### 📄 Informe PDF del inventario
- Botón "Informe PDF" en la cabecera del inventario
- Genera un PDF con: resumen global (total prendas, precio total, contadores por estado), tabla por categoría con badges de estado, precios, notas y **enlaces clickables** a los productos
- Subtotal de precio por categoría y pie de página con numeración

### 🤖 Probador Virtual (Virtual Try-On)
- Sube tu foto de cuerpo completo en el Planificador
- Al pulsar "Probador Virtual" se genera una imagen tuya con el outfit puesto usando **Leonardo.Ai GPT Image 2**
- Campo de **indicaciones extra** para añadir instrucciones al prompt (ej: "con niebla en el fondo", "al atardecer")
- El resultado se guarda en base de datos y se muestra en la card y en la Vista General
- Modo mock con `AI_MOCK=true` para desarrollar sin gastar créditos

### 💇 Estilismo (`/style`)
- Sección propia en el menú. Parte de la foto que ya tienes en la app y genera variantes cambiando **solo el pelo y el vello facial**: la cara, la ropa, la pose y el fondo se mantienen
- Tres categorías, una entrada por categoría: **Peinado** (12 presets) · **Color de pelo** (10) · **Vello facial** (11)
- Cada categoría tiene además su **campo de texto**: se escribe el estilismo en español en vez de elegir un preset. Son excluyentes — al escribir se desmarca el chip de esa categoría y al elegir chip se vacía el texto
- El texto libre llega al modelo con el mismo encabezado que los presets (`Hairstyle:`, `Hair color:`, `Facial hair:`), así que rinde igual
- Los cambios se pueden **encadenar**: el resultado queda seleccionado como foto de partida para la siguiente generación
- Cualquier look se puede marcar como **foto de modelo**, y a partir de ahí el Probador Virtual lo usa como base
- Los looks se guardan en la tabla `StyleLook` y se pueden borrar (excepto el que esté en uso como foto de modelo)
- Mismo selector de modelo que el probador (GPT Image 2 · Nano Banana 2 · Phoenix) y mismo modo mock con `AI_MOCK=true`

### 🌤️ El tiempo (`/weather`)
- **El pronóstico primero**: la semana del evento en tarjetas grandes, una por día — máxima y mínima, ráfaga máxima y lluvia acumulada — más una tira compacta de los próximos días para el viaje y las compras
- Los dos modelos (GFS+HRRR y ECMWF) se resumen en **una sola lectura conservadora**: media en temperatura, **peor caso en ráfaga y lluvia**, y el día se marca como "los modelos discrepan" cuando no cuentan la misma historia
- **San Francisco** en su propia sección, para los días de ciudad (27 y 28 de agosto, configurables en `SF_STAY`): ahí manda la **sensación térmica** —la capa marina deja tardes de 15 °C mientras el interior de la bahía va a 30— y la lluvia, y el viento solo se menciona cuando de verdad corta. Las tarjetas de ciudad se callan la jerga del playa: "Barro" o "Cierre" describen un lecho de arcilla, no una acera de SF
- **Código de color de la lluvia** en cinco tramos — Seco · Chispas (0,1-1 mm) · Pegajoso (1-6,4) · Barro (6,4-12,7) · Cierre (≥12,7) — porque en arcilla lo que decide no es cuánta cae sino que caiga: con la superficie mojada no se circula ni con 4x4, y la guía de travesía del Black Rock Desert desaconseja cruzar el playa hasta 72 h después de llover
- **La probabilidad de lluvia se avisa desde el 10 %**, con su propio chip (Posible ≥10 % · Probable ≥30 % · Muy probable ≥60 %) y sale del **ensemble GFS** cuando responde: cuántos de sus 31 miembros mojan, no un número de folleto. Los días con 0 mm previstos pero probabilidad alta lo dicen explícitamente en vez de enseñar un "0 mm" tranquilizador
- **Código de color del viento** en seis tramos con nombre, barra de progreso y una frase de qué se siente: Calma (<15 km/h) · Polvo suelto (15-24) · **Molesto (25-39)** · Fuerte (40-63) · Muy fuerte (64-79) · Extremo (≥80), con leyenda encima de las tarjetas
- Los tres cortes de arriba son los umbrales operativos del playa (25/40/50 mph). Los dos de abajo salen del polvo, no de las estructuras: Beaufort sitúa "levanta polvo" en 20-28 km/h *con vegetación*, y en lechos secos alterados —BRC es el caso extremo— el umbral de emisión de PM10 cae sobre los 25-30 km/h. Por eso ese tramo se llama "Molesto" y no "Moderado"
- Borde y chip de color por **umbral del playa**: ráfagas 25/40/50 mph, lluvia 0,25″/0,5″, mínima <50°F, máxima >100°F, UV >8. Los días fuera del horizonte de los modelos lo dicen en vez de inventar un número
- **Avisos oficiales del NWS** (flash flood, dust storm, high wind) arriba del todo, en corto y con la instrucción de actuación
- Todo lo demás va plegado en **"La letra pequeña"**: sobre qué se pronostica exactamente, los modelos uno a uno con el ensemble, el pronóstico oficial del NWS Reno, observaciones reales, polvo de CAMS, umbrales, climatología y fuentes
- **Sobre qué se pronostica**: no hay ninguna estación en el playa, así que se enseñan las coordenadas del nodo que responde por cada fuente (celda del NWS, GFS+HRRR, ECMWF IFS y CAMS) con su desvío al Hombre calculado al vuelo, más las estaciones reales y sus distancias
- Funciona **sin ninguna API key**. `SYNOPTIC_TOKEN` es opcional y solo añade el PWS de Gerlach (F0371), la observación más cercana al playa

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
| Try-On IA | **Leonardo.Ai — GPT Image 2** | Modelo multimodal con soporte de hasta 4 imágenes de referencia simultáneas. Estrategia: ref 1 = usuario, ref 2 = TOP, ref 3 = BOTTOM, ref 4 = collage de accesorios/calzado |
| PDF | **@react-pdf/renderer** | Generación server-side de PDFs con links clickables y diseño rico |
| Storage | **Filesystem local** `/public/uploads` | MVP single-user. Migrable a S3/R2 cambiando únicamente `src/lib/storage.ts` |
| Validación | **Zod 4** | En API routes |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                         # Home — stats del evento + guía de 3 pasos
│   ├── planner/page.tsx                 # Planificador — días × turnos × outfits
│   ├── style/page.tsx                   # Estilismo — variantes de pelo y vello facial
│   ├── inventory/page.tsx               # Inventario — prendas agrupadas por categoría
│   ├── overview/page.tsx                # Vista general — galería de todos los outfits
│   ├── weather/page.tsx                 # El tiempo — pronóstico diario + metodología plegada
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
│       ├── inventory-pdf/route.ts       # GET generar PDF del inventario completo
│       ├── style-looks/route.ts         # GET looks de estilismo del usuario
│       ├── style-looks/[id]/route.ts    # DELETE borrar un look (y su imagen)
│       ├── ai/try-on/route.ts           # POST try-on con Leonardo.Ai GPT Image 2
│       └── ai/style/route.ts            # POST estilismo de pelo/barba sobre tu foto
│
├── components/
│   ├── planner/
│   │   ├── DayPlanner.tsx              # Tabs de días + grid de turnos (client)
│   │   ├── ShiftCard.tsx               # Card Tarde/Noche: slots, guardado auto, try-on + campo extra
│   │   ├── RangeSetup.tsx              # Selector de fechas + tabla de toggles Tarde/Noche
│   │   └── UserPhotoWidget.tsx         # Avatar circular + subida de foto de perfil
│   ├── style/
│   │   └── StyleStudio.tsx             # Estilismo: presets de pelo/barba + galería de looks
│   ├── weather/
│   │   ├── WeatherRegions.tsx          # Qué punto responde por BRC en cada fuente + distancias
│   │   ├── DayCards.tsx                # Tarjetas grandes por día (vista principal)
│   │   ├── EventForecast.tsx           # Detalle por modelo + ensemble (en la letra pequeña)
│   │   └── format.ts                   # Unidades dobles (°C/°F, km/h/mph, mm/″) y semáforo
│   └── inventory/
│       ├── GarmentCard.tsx             # Card: hover → botones editar/eliminar
│       ├── GarmentForm.tsx             # Formulario crear/editar (paste Ctrl+V incluido)
│       ├── GarmentFormModal.tsx        # Wrapper modal para el formulario
│       └── DownloadReportButton.tsx    # Botón de descarga del informe PDF
│
├── lib/
│   ├── db.ts                           # Prisma singleton con adapter better-sqlite3
│   ├── leonardo.ts                     # Try-on y estilismo con Leonardo.Ai + collage + mock
│   ├── style-presets.ts                # Catálogo de estilismos (peinado, tinte, barba)
│   ├── inventoryPdf.tsx                # Documento PDF del inventario (@react-pdf/renderer)
│   ├── storage.ts                      # Guardar/leer imágenes en /public/uploads
│   ├── weather.ts                      # NWS + Open-Meteo + observaciones reales y umbrales
│   └── weather-guide.ts                # Umbrales, climatología, memoria del playa y fuentes
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
                           Garment  (slot: TOP|BOTTOM|SHOES|ACCESSORY|COAT|BIKE_ACCESSORY)

Outfit (1) ──────────────< TryOnResult  (imageUrl generada por Leonardo.Ai)

User   (1) ──────────────< StyleLook    (variante de la foto: peinado, tinte, barba)
```

**Reglas de negocio:**
- `Shift` unique `[dayId, type]` — máximo 1 Tarde + 1 Noche por día
- `Outfit` existe en relación 1:1 con su `Shift`, se crea automáticamente al crear el turno
- Slots `TOP`, `BOTTOM`, `SHOES`, `COAT` son únicos por outfit — asignar uno nuevo reemplaza el anterior
- `ACCESSORY` admite múltiples prendas en el mismo outfit
- `BIKE_ACCESSORY` solo aparece en el inventario, nunca en la lógica de outfits
- La card Noche muestra aviso si no tiene `COAT` asignado
- `StyleLook.sourcePhoto` guarda la foto de partida, así que la foto original sigue siendo recuperable aunque se marque un look como foto de modelo
- No se puede borrar el `StyleLook` que sea la foto de modelo actual (`User.photoUrl`)

---

## Instalación

### Requisitos
- Node.js ≥ 18
- npm ≥ 9

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/FeloSP8/burning-outfit-planner.git
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
LEONARDO_API_KEY=""
```

### 3. Crear la base de datos

```bash
npx prisma migrate dev --name init
```

En una base de datos que ya existe (producción incluida), aplicar las migraciones
pendientes — con `DIRECT_URL` apuntando al puerto 5432, el pooler de transacciones
no admite DDL:

```bash
npx prisma migrate deploy
```

Las migraciones de Prisma ya activan RLS en las tablas que crean. Los ficheros de
`supabase/migrations/` son la misma protección por la vía del Supabase CLI
(`supabase db push`) y son idempotentes.

### 4. Arrancar

```bash
npm run dev
# → http://localhost:3001
```

---

## Activar el Probador Virtual — Leonardo.Ai

> **Leonardo.Ai regala $5 en créditos al registrarse**, más que suficiente para cientos de pruebas a calidad LOW (~$0.012 por imagen).

1. Crea una cuenta gratis en **[leonardo.ai](https://leonardo.ai)** — no necesitas tarjeta
2. Ve a **Settings → API** y genera una API key
3. Añade la key en `.env.local`:

```env
LEONARDO_API_KEY="tu-key-aqui"
AI_MOCK="false"
```

El probador usa el modelo **GPT Image 2** con hasta 4 imágenes de referencia:
- Referencia 1 → foto tuya (para preservar cara, pelo y cuerpo)
- Referencia 2 → TOP (parte de arriba)
- Referencia 3 → BOTTOM (parte de abajo)
- Referencia 4 → collage de accesorios y calzado (si los hay)

El fondo es siempre el desierto de Black Rock (playa seca de Burning Man). Puedes añadir instrucciones extra antes de generar.

> **Límites conocidos:** el prompt tiene un máximo de 1399 caracteres (límite descubierto experimentalmente, no documentado por Leonardo). El código trunca automáticamente si se supera.

| Calidad | Key config | Coste aprox. |
|---------|-----------|-------------|
| LOW | `quality: "LOW"` | ~$0.012/imagen |
| MEDIUM | `quality: "MEDIUM"` | ~$0.050/imagen |
| HIGH | `quality: "HIGH"` | ~$0.097/imagen |

Por defecto está en calidad LOW para ahorrar créditos. Cámbialo en `src/lib/leonardo.ts` cuando quieras mayor resolución.

---

## Migrar a producción

La app está diseñada single-user pero el schema ya tiene `userId` en todas las entidades:

1. **Base de datos**: cambiar `provider = "sqlite"` → `"postgresql"` en `prisma/schema.prisma`
2. **Auth**: añadir NextAuth.js o Clerk; reemplazar `DEFAULT_USER_ID` por `session.user.id`
3. **Storage**: reemplazar `src/lib/storage.ts` con un cliente S3 / Cloudflare R2

---

## Licencia

MIT
