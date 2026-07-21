/**
 * Convierte links normales de "compartir" de Google Drive (los que
 * cualquiera copia con el botón Compartir) a una URL que sí se puede
 * usar como <img src>. El link de compartir apunta al visor HTML de
 * Drive, no a los bytes de la imagen — por eso las portadas se veían
 * como ícono roto aunque el link "funcionara" al abrirlo en el navegador.
 *
 * Si la URL no es de Drive, o no se reconoce el patrón, se regresa tal
 * cual (para no romper Cloudinary/otros hosts que ya guardan un link
 * directo).
 */
export function normalizeDriveImageUrl(url: string): string {
  if (!/drive\.google\.com/.test(url)) return url;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // .../file/d/<id>/view
    /[?&]id=([a-zA-Z0-9_-]+)/, // .../open?id=<id>, .../uc?id=<id>
  ];

  for (const re of patterns) {
    const match = url.match(re);
    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }

  return url;
}
