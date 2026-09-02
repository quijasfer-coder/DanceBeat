// Helpers de formato puros — sin dependencias de server.
// Importables desde client components.

export function formatMxn(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Todas las fechas/horas de la app se muestran en hora de Ciudad de México
// sin importar en qué zona horaria corra el servidor (Vercel corre en UTC).
// Sin esto, un timestamptz guardado como "lunes 18:30 CDMX" se mostraba
// como "martes 00:30" en producción — ver incidente 1 sep 2026.
const MX_TZ = "America/Mexico_City";

export function formatDateMX(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-MX", { ...options, timeZone: MX_TZ });
}

export function formatTimeMX(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("es-MX", { ...options, timeZone: MX_TZ });
}

// Fecha calendario (YYYY-MM-DD) en hora de CDMX — para agrupar/comparar por
// día. NUNCA usar `.toISOString().slice(0, 10)` para esto: da la fecha en
// UTC, que puede caer en el día siguiente para horarios de tarde/noche.
export function dateKeyMX(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: MX_TZ }).format(d);
}

// Para columnas `date` puras (sin hora, ej. gallery_albums.event_date),
// NUNCA con formatDateMX/timeZone CDMX: "2026-09-08" se parsea como
// medianoche UTC, y formatearlo en CDMX (UTC-6) la recorre al día
// anterior. Aquí se ancla a UTC — la misma zona en la que se parseó —
// así el calendario mostrado siempre coincide con el YYYY-MM-DD guardado,
// sin importar en qué zona horaria corra el proceso (server o dev local).
export function formatCalendarDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-MX", { ...options, timeZone: "UTC" });
}

export function formatDateTimeMX(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("es-MX", { ...options, timeZone: MX_TZ });
}
