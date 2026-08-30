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

### 🎧 Agenda de DJs (`/agenda`)
- **Line-ups por día** transcritos de los carteles de los campamentos: Playground · Arrival Stage y Dune Lounge (2 & C), Opulent Temple (10 & Esplanade), Symbio (2:30 & F), The Melon Motel (2:00 & I), Nova Heaven (deep playa, la DMZ), Huofeng y Longfeng (10 & K), Discotique (2 & G), Pink Mammoth (9 & G Plaza), PlayAlchemist (3:30 & D), Maison Phi (10 & B), Sahar (9:15 & J), Secular Sabbath, MAXA, Twilight, Robot Heart y los art cars Favela, Bipolar Express, Trion y Tommy Pinball. 366 sets, 233 artistas y 21 escenarios, **del domingo 30 al domingo 6**
- **Tres vistas de lo mismo**: `🗓️ Día`, con las fiestas de cada jornada en orden; `🎧 DJ`, la lista completa de artistas; y `🎚️ Estilo`, que agrupa por género — eliges uno y salen los DJs que lo pinchan. En las dos últimas, al tocar un nombre se despliega dónde y cuándo pincha, en orden de evento y con el ★ en cada set. Vintage Culture sale siete veces en siete escenarios distintos, y esa es la pregunta que la lista responde de un vistazo
- **Géneros con vocabulario cerrado**: los 20 estilos son una unión de TypeScript, no texto libre. La primera versión eran cadenas sueltas y acabó con **65 términos distintos para 104 artistas** — `House` y `house`, `Melodic` y `Melodic house`, y descripciones que no eran géneros mezcladas con los que sí. Tipado, un término nuevo o mal escrito no compila. Un artista sale en todos sus estilos: Vintage Culture está en House, tech house y melodic house porque las tres cosas son verdad
- **Cada cartel nuevo trae deberes**: los artistas que aparecen por primera vez se buscan uno a uno y se les rellena la ficha —género, contexto, Instagram, vídeo—. No todos salen: de los 19 nombres nuevos de Bipolar Express y Discotique se encontraron 13, y de los 7 de Trion, 5. Los 3 de Secular Sabbath entraron completos. El que no aparece en una búsqueda se queda sin ficha antes que con un handle inventado, que es un enlace a un desconocido
- Lo que no es un género pero merece contarse va en `about`: que Seth Schwarz toca el violín dentro del set, que Syd Gris fundó el propio Opulent Temple donde pincha, que Fleetmac Wood no es un DJ sino una fiesta de remezclas de Fleetwood Mac
- **♥ Mis DJs**: cada usuario marca los artistas que le interesan y suben a un bloque propio arriba de la lista, antes del resto. Con 233 nombres, rebuscar los cuatro que importan cada vez que abres la página no es agenda, es trabajo. Y es **compartido**: el corazón lleva al lado cuánta gente del grupo lo ha marcado y los nombres van en la propia fila, sin desplegar nada ("♥ también Ana, Juan"), porque eso sirve mientras recorres la lista, no después de abrir un DJ. Una sola consulta a `FavoriteArtist` da las dos cosas —el contador del grupo y mis favoritos, que son las entradas donde aparece mi nombre—, igual que `loadPicks` con los sets
- Cada set se marca con **★ Voy** y entra en tu agenda. Es compartido: debajo de cada set salen los demás del grupo que también van ("👥 también Ana")
- **Aviso de solapes**: si dos sets elegidos se pisan, los dos lo dicen y el resumen lleva la cuenta. El cálculo cruza días —un set de las 06:00 del miércoles compite con la fiesta de amanecer del jueves— porque las ventanas se miden en minutos absolutos, no por fecha del cartel
- Los carteles no publican todos igual: Opulent Temple da la hora exacta de cada set; Playground y Symbio, solo la de arranque de la fiesta y el orden de los sets. A esos se les **estima horario**, marcado siempre como `aprox.` y en otro color, con la fiesta rotulada `⏱ horas estimadas`
- **Robot Heart** no publica cartel, publica un texto: cuenta el día, dónde aparca el bus y el orden de los artistas, pero ni una hora. Se estima con el patrón del bus —amaneceres desde las 03:00, atardeceres desde las 18:00— y lo que el propio texto fija manda: Deer Giobbi toca al amanecer, Danny Tenaglia trae seis horas, Major Lazer cierra con el sol bajando
- **El Bipolar Express no publica ni una hora**: su cartel es solo el orden de cada salida más el sol del amanecer. Se estima entero desde ahí —23:00 las salidas de noche, como el resto de art cars; 06:00 las de amanecer— y el sol es el que valida el reparto: Marten Lou el lunes y Joezi B2B Arymé el sábado caen en las 06:30, la misma hora que Nova Heaven sí imprime para su set de amanecer
- **Secular Sabbath es el caso contrario al del Bipolar Express**: publica las tres horas exactas y no hay nada que estimar. Son las tres salidas de Rhye —ambient improvisado, con un invitado distinto cada día: TOKiMONSTA el martes al atardecer, Diplo el jueves al amanecer, The Human Experience el viernes—, cada una en un sitio del playa, así que las tres van con su `where` propio y ninguna lleva el sello de horas estimadas
- Una fiesta puede llevar su **propio sitio** (`Party.where`) cuando no es la dirección del escenario. Robot Heart es un bus: el martes está en los campos solares de 2 & K, el miércoles en Eiffela Broken Dreams, el jueves acaba en The Keyhole y el viernes toca en el Gothic Folly
- Cuidado con los **duplicados**: la misma fiesta se anuncia desde dos campamentos. Las noches de miércoles y viernes que Favela publicaba son las que Nova Heaven rotula como "art car >> Favela"; están una sola vez, en Nova Heaven, que es el cartel que trae las horas. Lo mismo con el Bipolar Express: dos de los seis bloques de su cartel ya estaban puestos —el miércoles es `nova-wed` y el viernes `lon-fri`, y las dos fiestas ya le acreditaban—, así que solo entraron los cuatro restantes. Antes de transcribir un cartel se cruzan fecha y artistas contra lo que ya hay
- **Trion es donde los soles hacen todo el trabajo**: su cartel da la hora de arranque de cada día y nada más, pero marca qué set pilla el amanecer o el atardecer. El miércoles trae los dos a la vez —el atardecer en la sesión especial, el amanecer en Mahmut Orhan— y con nueve nombres solo hay una duración de set que hace caer los dos donde el cartel los pone: 1 h 35. Las otras noches salen de la misma cuenta
- **Pink Mammoth es el único que cubre los ocho días**, domingo de apertura y domingo de cierre incluidos, que hasta entonces estaban vacíos. Y es el primero de día de verdad: abre a mediodía y cierra al caer el sol, así que su icono de sol marca el atardecer y no el amanecer, al revés que en los art cars. Como da hora de apertura y de cierre, los sets se reparten a partes iguales entre las dos, y ahí es donde cae el sol que marca el cartel
- **La agenda de un DJ vale por ocho carteles**: Marten Lou publicó la suya con hora exacta de sus ocho sets, y siete ya estaban en el catálogo con hora estimada. Sirvió para corregirlos y, de paso, para medir cuánto fallaba la estimación: diez minutos en Pink Mammoth y en Melon Motel, media hora en Longfeng y Discotique, hora y media en el Bipolar Express. Su ficha ya no tiene ni un `aprox.`
- **Las agendas de artista traen sitios que ningún campamento publica**: de Maison Phi, Sahar, Tommy Pinball y Twilight solo se sabe lo que pusieron Maxi Meraki y Gordo — su set y su hora, y del resto de esas noches nada. Y cuando dos artistas se contradicen se deja constancia en vez de elegir en silencio: Marten Lou dice 22:30 en Playground y Gordo dice 22:00
- Fijar una hora real puede desmontar una fiesta entera. Gordo publica 16:00–18:00 en el Melon Motel y el cartel del campamento lo lista el segundo de seis en una fiesta de amanecer: metido ahí dentro, el reparto le daba nueve horas al primero. Un campamento que abre a las 7 y cierra de noche tiene más de una sesión y un set de nueve horas no existe, así que va en una sesión de tarde aparte, dicho en la nota
- Varios carteles marcan con un icono **el set durante el cual sale o se pone el sol**. No es decoración: en una noche sin hora de cierre, saber que un set concreto pilla el amanecer dice hasta dónde llega la fiesta, así que esas noches reparten hasta las 8 en vez de hasta las 6. Con esa regla, los seis sets de amanecer estimados de Longfeng caen todos sobre las 06:29 reales
- Los carteles **mezclan** los dos casos: el de Favela del viernes son cinco sets sin hora, la ceremonia de las 06:29 —la salida del sol— y un cierre, tampoco con hora. El reparto va **por tramos**: las horas del cartel mandan y los sets sin hora se reparten el hueco que queda entre ellas. Es lo que coloca ese cierre después de la ceremonia y no antes
- La estimación son **dos horas por set**, salvo en las noches: ahí los sets se reparten a partes iguales lo que va del arranque **a las 6 de la mañana**, redondeando a cuartos de hora hacia abajo. Siete sets desde las 22:00 salen a una hora cada uno; seis desde las 21:00, a hora y media. Sin ese tope, una noche de siete sets a dos horas acabaría a mediodía. Una fiesta suelta puede además traer su propia duración (`setMinutes`) cuando la regla se le queda lejos: Symbio va a hora y media, porque a dos horas sus seis nombres estiraban la mañana hasta las nueve de la noche
- Estimar en vez de dar la fiesta entera por ocupada es lo que hace útil el aviso de solapes: antes cualquier par de sets de dos escenarios abiertos a la vez chocaba. Ahora el choque señala al set concreto, y sigue avisando de que la hora no es del cartel
- **La madrugada va donde toca**: un set de las 02:45 dentro de la fiesta del lunes se pinta bajo el lunes (así lo lee el cartel) pero marcado como `mar`, y para los solapes cuenta como martes
- **Vista "Solo mi agenda"**: el día en orden cronológico mezclando escenarios, que es como se recorre de verdad la ciudad
- **Buscador** por DJ, fiesta o escenario, sin acentos (`polke` encuentra a Natascha Polké) y con los resultados agrupados por día
- El catálogo vive en `src/lib/dj-lineups.ts`. Cuando salga un cartel nuevo se añade ahí — **sin tocar los ids ya publicados**, que son los que guarda `DjPick` en base de datos

### 🗺️ Buscar campamentos en el mapa (`/map`)
- **Filtro por región del reloj**, aquí de una sola: en el mapa se busca "por dónde caigo", no se suman zonas sueltas como en los eventos. Con región y sin texto salen todos los de esa zona; con texto y sin región, todos los que se llamen así; con las dos, la intersección. Sin ninguna de las dos no se lista nada — mil y pico campamentos no son una lista útil. Los bordes se comparten igual que en los eventos, así que uno en las 3:00 clavadas sale en `2–3` y en `3–4:30`
- Cada resultado lleva **la descripción del campamento** debajo del nombre: para decidir si te acercas hace falta saber qué es, no solo cómo se llama. En la lista se ven dos líneas y **cualquiera se despliega** con la ficha entera — la descripción completa y **todos sus eventos** del listado oficial, con su tipo y sus horas. El nombre sigue llevando al plano y el desplegable va en un botón aparte: las dos cosas hacen falta y meterlas en un mismo clic obligaría a elegir
- **La descripción viaja entera.** Se intentó recortarla a 400 caracteres para que la copia offline pesara menos y fue un error: son justo las que se leen para decidir si te acercas, y cortarlas las dejaba a medias sin manera de ver el resto. Las dos líneas de la lista son un recorte visual (`line-clamp`), no de datos. Lo que ocupan de más son unos cientos de kB, al lado de los miles de eventos que ya van
- Los eventos sí viajan al mapa en una versión mínima (`CampEvent`: título, tipo y horas) — enteros son cientos de kB de más en cada carga, y sin cobertura salen gratis porque ya están en el snapshot

### 📴 Sin cobertura: la agenda, los eventos y el mapa
- **`/agenda`, `/events` y `/map` funcionan sin red, y son las mismas páginas**, no una versión recortada: los tres modos de ver la agenda, el aviso de solapes, las fichas de los artistas, los filtros de eventos por día, tipo, texto y sector, y el plano de la ciudad entero con sus capas. Lo único que se apaga es marcar: el ★ y el ♥ se siguen viendo —contar quién va es media agenda— pero no responden
- **La agenda de DJs abre sin red aunque no hayas descargado nada.** Los line-ups, los artistas y los géneros viven en el código, así que lo único que se pierde sin copia son las marcas del grupo —quién va a qué y a quién le gusta quién—. Dejar la pantalla en blanco por eso sería tirar el cartel entero por no saber quién lo ha marcado. Los eventos y el mapa sí necesitan la copia, y lo dicen en vez de quedarse vacíos
- **Los armazones se guardan solos**, al activarse el service worker y cada vez que visitas una de las tres secciones con cobertura. Antes dependían del botón de descargar de `/playa`: quien no pasaba por ahí se quedaba sin agenda justo cuando se caía la cobertura, que es cuando hace falta. De paso, visitarlas con red deja la copia al día, así que una versión nueva de la app llega sola
- Funciona con **armazones**: la misma página, en la misma URL, servida sin datos ninguno. El service worker la guarda con el resto de la app y la sirve cuando una navegación se queda sin red; ya en el móvil, la propia pantalla se rellena leyendo el snapshot de IndexedDB. Se guarda el armazón y no la página entera porque los miles de eventos oficiales **ya viajan en el snapshot**: cachear el HTML con todo dentro sería llevarse lo mismo dos veces, y encima congelado en el momento en que se cacheó
- Por eso el armazón se pide con una cabecera (`x-playa-shell`) y no con `?shell=1`. La copia se sirve como respuesta a `/events`, así que tiene que **ser** `/events`: servida desde otra URL, el router de Next se encuentra una página que no es la que pidió y la vacía. Costó un rato averiguarlo
- Navegar con el menú no pide el documento, pide el *flight* de Next (`?_rsc=…`). Sin red esa petición se cae y el router se queda a medias, con la página anterior puesta, así que el worker le devuelve el armazón: como es HTML y no flight, Next recarga entera y ahí ya entra el caso anterior
- **Leaflet va en un `import()` dinámico**, así que su trozo no aparece en el HTML de ninguna página. Se fuerza a cargarlo antes de leer qué hay que guardar; sin eso el plano salía en blanco justo cuando hace falta, y el fallo solo aparecía al cortar la red de verdad

### 📋 Eventos oficiales (`/events`)
- **Filtro por sectores del reloj**, multiselección: la ciudad es un arco de las 2:00 a las 10:00 y nadie se mueve por ella pensando en coordenadas, sino en "lo que hay entre las 3 y las 4:30". Los seis trozos son `2–3`, `3–4:30`, `4:30–6`, `6–7:30`, `7:30–9` y `9–10`; sin nada marcado sale toda la ciudad, y cada chip lleva **cuántos pases caen ahí con los demás filtros ya puestos** — si estás mirando el jueves, el chip dice cuántos hay el jueves. Un sector que se queda a cero se apaga
- **Los bordes son compartidos**: los dos extremos entran, así que algo en las 3:00 clavadas sale tanto en `2–3` como en `3–4:30`. Es lo que pasa andando por la ciudad —esa esquina es la frontera, no pertenece a un lado— y buscando sitio es mejor que salga de más a que se pierda por estar justo en la raya. De los 295 cruces del GIS, 59 caen en una frontera y viven en dos sectores. Por eso los números de los chips no suman el total, y está bien que no lo hagan: marcar los dos lados no duplica ninguna fila
- El sector sale de `sectorOf()` (`src/lib/brc-sectors.ts`), y no de leer la dirección: manda el punto, porque cuando la API da GPS es lo más fiable que hay y la dirección que lo acompaña puede no ser del callejero ("Center Camp Plaza"). Solo si no hay punto se lee la radial del texto. La conversión de coordenadas a hora del reloj es el inverso exacto de la que sitúa los escenarios, validada contra los **295 cruces del GIS oficial**: el peor desvío son 0,4 minutos de reloj
- Los eventos de los que la API aún no dice dónde caen quedan fuera al filtrar, y se dice cuántos son en vez de que desaparezcan sin explicación
- Sale gratis sin cobertura: el snapshot de `/playa` ya se lleva la dirección y el punto de cada evento, así que la misma pantalla filtra igual sin red

### 🌤️ El tiempo (`/weather`)
- **Orden del viaje**: San Francisco (27-28 ago) → La semana del evento (29 ago — 7 sep, arranca el día de recoger el RV) → Tendencia previa. Cada sección se recorta a partir de hoy —los días pasados desaparecen solos— y la tendencia se apaga sola en cuanto entra el 29, cuando ya no queda ningún día "antes de llegar"
- Las **leyendas de color van debajo del pronóstico**, no encima: se consultan cuando un color extraña, no antes de haber visto un solo día
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
│   ├── agenda/page.tsx                  # Agenda de DJs — line-ups por día y selección personal
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
│       ├── dj-picks/route.ts            # GET selecciones del grupo  ·  POST toggle de un set
│       ├── dj-favorites/route.ts        # GET mis DJs favoritos  ·  POST toggle de un artista
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
│   ├── agenda/
│   │   └── AgendaClient.tsx            # Días, buscador, line-up por fiesta y avisos de solape
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
│   ├── dj-lineups.ts                   # Catálogo de line-ups transcrito de los carteles
│   ├── dj-agenda.ts                    # Horas, ventanas de cada fiesta y detección de solapes
│   ├── dj-picks.ts                     # Lectura de las selecciones del grupo (server-only)
│   ├── dj-favorites.ts                 # Lectura de los DJs favoritos del usuario (server-only)
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

User   (1) ──────────────< DjPick       (setId → set del catálogo de src/lib/dj-lineups.ts)

User   (1) ──────────────< FavoriteArtist (nombre del artista en ese mismo catálogo)
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
- `DjPick` unique `[userId, setId]` — un usuario elige un set una sola vez; la API hace toggle
- `DjPick.setId` **no es una FK**: los line-ups son un catálogo en código, no filas. Un id que ya no exista en `src/lib/dj-lineups.ts` se ignora al pintar la agenda en vez de romperla
- `FavoriteArtist` unique `[userId, artist]`, y `artist` tampoco es una FK: mismo criterio, un nombre que desaparezca del catálogo se ignora

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
