/**
 * Dominio fijo para links que van en correos (invites, recovery, etc).
 *
 * NO usar `process.env.NEXT_PUBLIC_SITE_URL` para esto: en producción esa
 * variable quedó apuntando a un alias de deployment que cambia (o expira)
 * en vez del dominio estable — un invite generado con ese valor termina en
 * un link muerto (404 DEPLOYMENT_NOT_FOUND) en cuanto se vuelve a desplegar.
 * Hasta que se corrija la variable en Vercel, estos links usan el dominio
 * fijo directamente.
 */
export const SITE_URL = "https://www.dancebeat.studio";
