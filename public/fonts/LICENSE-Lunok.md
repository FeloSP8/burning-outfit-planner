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
- Cobertura: Basic Latin + Latin-1. Los acentos y signos del español
  (`á é í ó ú ñ ¿ ¡`) están cubiertos — verificado.
