# Lunok — licencia

Fuente usada para los títulos de la app (`--font-display`).

- **Origen:** https://fonts.cdnfonts.com/lunok.font
- **Fichero:** `LunokRegular.woff` (WOFF/CFF, 1 corte: regular 400)
- **Autor:** Rochart Studio

## Condiciones

**Gratis solo para uso personal y sin ánimo de lucro.** El uso comercial exige
comprar licencia en Creative Market o en Rochart Studio.

Este proyecto es un planificador privado para un grupo de amigos, así que entra
en uso personal. **Si el proyecto pasara a ser comercial, hay que comprar la
licencia o cambiar de fuente.**

## Notas técnicas

- Lunok **solo tiene un corte**: regular 400, sin cursiva ni negrita. Por eso los
  títulos no llevan `italic` ni `font-black`/`fontWeight: 900`: el navegador los
  sintetizaría (falsa cursiva / falsa negrita) y en una fuente display se ve mal.
- Se sirve **self-hosted** vía `next/font/local` en `src/app/layout.tsx`. El CSS
  de cdnfonts no declara `font-display` (texto invisible mientras carga) y usa
  `local('Lunok')`, que serviría otra versión si el usuario la tiene instalada.
- **Cobertura real: solo 85 glifos dibujados** (ASCII básico sin `! $ & ? _`).
  Los otros 163 de la fuente —acentos, `ñ`, `¿`, `¡`— existen en la tabla `cmap`
  pero apuntan a una caja de relleno: todos comparten `advance` 830. Es decir,
  la fuente **no** tiene acentos, aunque cdnfonts anuncie soporte de español.
  Por eso `layout.tsx` declara un `unicode-range` que limita Lunok a los
  caracteres reales; el resto cae al fallback (Georgia) en vez de pintar un
  cuadro. Si se cambia de fuente, hay que quitar ese `unicode-range`.
- **Sus ligaduras también son cajas de relleno.** La tabla `GSUB` declara la
  feature `liga` con cuatro ligaduras —`st`, `er`, `ff` y `tt`— y los cuatro
  glifos (`s_t`, `e_r`, `f_f`, `t_t`) están sin dibujar: mismo `advance` 830 que
  los acentos. Como `liga` se aplica por defecto, "Estilismo" se pintaba
  "E▮ilismo" y "Estadisticas" o "Vista general" caían igual. El `unicode-range`
  no protege de esto: la sustitución la hace el motor de texto sobre glifos, no
  sobre code points. Por eso `globals.css` desactiva las ligaduras en `body`
  (`font-variant-ligatures: none`), en toda la app y no solo en los títulos,
  para que un título nuevo no vuelva a romperse. Si se cambia de fuente, esa
  regla se puede quitar.
  (Detalle: la caja de relleno es en realidad un QR de "BUY FONT LICENSE" de la
  fundición — de ahí el borrón cuadriculado.)

## Al escribir títulos nuevos

**Evita acentos y `¿ ¡ ! ? & $ _` en cualquier texto que use `--font-display`.**
Mezclar Lunok y Georgia dentro de una palabra queda mal, así que los títulos
se escriben sin tilde ("Estadisticas", "Maximos, minimos y medias"). Es una
decisión estética consciente: se prefiere el texto reconocible sin tilde antes
que reformularlo. El `unicode-range` se mantiene como red de seguridad para
texto dinámico (nombres de usuario, etiquetas) que sí pueda traerlos.

El texto de cuerpo y el menú usan Syne (`--font-body`), que tiene el juego
completo: ahí se escribe en español normal, con sus tildes.
