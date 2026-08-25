/**
 * Paleta y etiquetas compartidas por los PDF que genera la app.
 *
 * Viven aquí para que el inventario y el dossier del playa no se vayan
 * separando de color con el tiempo.
 */

export const C = {
  brand:      "#7a2e08",
  brandLight: "#c84a10",
  sand:       "#fdf4e0",
  sandDark:   "#f0e4c0",
  sandBorder: "#c4906a",
  text:       "#2a1a08",
  textMid:    "#7a5030",
  textLight:  "#a07040",
  green:      "#1a6a28",
  greenBg:    "#e6f4ea",
  amber:      "#92400e",
  amberBg:    "#fffbeb",
  sky:        "#075985",
  skyBg:      "#e0f2fe",
  white:      "#ffffff",
  rowAlt:     "#faf6ec",
  divider:    "#e8d5b0",
};

/** Categorías de prenda, en el orden en que se leen. */
export const ALL_SLOTS: { key: string; label: string; isBike?: boolean }[] = [
  { key: "TOP",            label: "Parte de arriba" },
  { key: "BOTTOM",         label: "Parte de abajo" },
  { key: "SHOES",          label: "Calzado" },
  { key: "ACCESSORY",      label: "Accesorios" },
  { key: "COAT",           label: "Abrigos" },
  { key: "BIKE_ACCESSORY", label: "Accesorios bici", isBike: true },
];
