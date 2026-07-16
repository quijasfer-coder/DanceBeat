// Datos de la página /luminaria.
// Editar aquí para actualizar concepto, galería y show del año.
//
// TODO clienta:
//  · Agregar logo del show 2026 si lo tienen (subir a /public/luminaria/show-logo.png)

export type ConceptBlock = {
  title: string;
  subtitle: string;
  body: string;
  /** Foto que acompaña el bloque. Idealmente una imagen del show pasado. */
  image: string;
};

export type GalleryPhoto = {
  src: string;
  alt: string;
  /** "wide" ocupa 2 cols, "tall" ocupa 2 rows en el grid masonry */
  size?: "wide" | "tall" | "default";
};

/**
 * Bloques editoriales que explican qué es Luminaria.
 * Fotos reales de Luminaria City.
 */
export const conceptBlocks: ConceptBlock[] = [
  {
    title: "Formamos artistas",
    subtitle: "y personas",
    body: "Confianza, sensibilidad y amor por el arte.",
    image: "/luminaria/concept-1.jpg",
  },
  {
    title: "Es experiencia",
    subtitle: "en el escenario",
    body: "Vivir la calidad y técnica de un espectáculo profesional, celebrando el esfuerzo, la disciplina y la pasión que los caracteriza.",
    image: "/luminaria/concept-2.jpg",
  },
  {
    title: "Producciones como",
    subtitle: "Luminaria City",
    body: "Reúnen a todas las categorías de la academia en un espectáculo único, donde la danza se acompaña de proyecciones digitales, música y un show de luces diseñado para elevar la experiencia.",
    image: "/luminaria/concept-3.jpg",
  },
  {
    title: "No es solo",
    subtitle: "una presentación",
    body: "Es la primera oportunidad de nuestros alumnos de vivir la emoción de un escenario real.",
    image: "/luminaria/concept-4.jpg",
  },
];

/**
 * Galería completa de Luminaria City (edición 2025).
 */
export const luminariaCityGallery: GalleryPhoto[] = [
  {
    src: "/luminaria/gallery-1.jpg",
    alt: "Luminaria City — escena 1",
    size: "tall",
  },
  {
    src: "/luminaria/gallery-2.jpg",
    alt: "Luminaria City — escena 2",
  },
  {
    src: "/luminaria/gallery-3.jpg",
    alt: "Luminaria City — escena 3",
  },
  {
    src: "/luminaria/gallery-4.jpg",
    alt: "Luminaria City — escena 4",
    size: "wide",
  },
  {
    src: "/luminaria/gallery-5.jpg",
    alt: "Luminaria City — escena 5",
  },
  {
    src: "/luminaria/gallery-6.jpg",
    alt: "Luminaria City — escena 6",
    size: "tall",
  },
  {
    src: "/luminaria/gallery-7.jpg",
    alt: "Luminaria City — escena 7",
  },
  {
    src: "/luminaria/gallery-8.jpg",
    alt: "Luminaria City — escena 8",
  },
];

/**
 * Show vigente. Se sustituye cada año.
 * Para personalizar el background del show, reemplazar `showBackgroundImage`
 * con la ruta de una imagen subida en /public/luminaria/.
 *
 * Para usar un logo personalizado del show, subir el PNG a
 * /public/luminaria/show-logo.png y descomentar `showLogoImage`.
 */
export const currentShow = {
  year: 2026,
  edition: "Luminaria 2026",
  name: "El Alma y El Mar",

  // Background del show — reemplazar por foto/render del show real
  showBackgroundImage: "/luminaria/show-background.jpg",

  // Logo del show — opcional. Si null, se usa el título en August Bold.
  showLogoImage: null as string | null,
  // Cuando tengas el logo: showLogoImage: "/luminaria/show-logo.png",

  pitch: [
    "En Luminaria 2026 nos sumergimos en un universo donde el océano reveló lo que guarda en lo más profundo.",
    "“El alma y el mar” fue una experiencia escénica que invitó a escuchar sus historias: la magia, la calma, la diversión y la sabiduría que habitan bajo la superficie.",
    "A través de la danza, la música, las luces y visuales inmersivos, nuestros alumnos transformaron el escenario en un portal azul donde cada movimiento fue una ola y cada coreografía una emoción.",
    "Gracias a todos los que nos acompañaron en esta experiencia única en escena.",
  ],
};
