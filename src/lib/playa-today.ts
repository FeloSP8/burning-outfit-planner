/**
 * La fecha de hoy en el playa.
 *
 * Vive suelto y no dentro de `weather.ts` porque lo necesita también la agenda
 * sin cobertura, que es cliente: importarlo de allí se llevaría al navegador
 * las siete APIs del tiempo para usar seis líneas de `Intl`.
 */
export function playaTodayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
