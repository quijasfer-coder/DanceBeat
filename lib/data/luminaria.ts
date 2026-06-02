// Datos de la página /luminaria.
// Editar aquí para actualizar concepto, galería y show del año.
//
// TODO clienta:
//  · Reemplazar fotos de la galería de Luminaria City con archivos reales
//    (subir a /public/luminaria/gallery/* y actualizar las rutas)
//  · Agregar logo del show 2026 si lo tienen (subir a /public/luminaria/show-logo.png)
//  · Reemplazar el background image del show 2026 con uno propio

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
 * Por ahora con imágenes placeholder (Unsplash). Reemplazar con fotos
 * reales de Luminaria City 2025 cuando estén disponibles.
 */
export const conceptBlocks: ConceptBlock[] = [
  {
    title: "Formamos artistas",
    subtitle: "y personas",
    body: "Confianza, sensibilidad y amor por el arte.",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400&q=80",
  },
  {
    title: "Es experiencia",
    subtitle: "en el escenario",
    body: "Vivir la calidad y técnica de un espectáculo profesional, celebrando el esfuerzo, la disciplina y la pasión que los caracteriza.",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1400&q=80",
  },
  {
    title: "Producciones como",
    subtitle: "Luminaria City",
    body: "Reúnen a todas las categorías de la academia en un espectáculo único, donde la danza se acompaña de proyecciones digitales, música y un show de luces diseñado para elevar la experiencia.",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1400&q=80",
  },
  {
    title: "No es solo",
    subtitle: "una presentación",
    body: "Es la primera oportunidad de nuestros alumnos de vivir la emoción de un escenario real.",
    image:
      "https://images.unsplash.com/photo-1583500178690-f7fd39e44f4e?w=1400&q=80",
  },
];

/**
 * Galería completa de Luminaria City (edición 2025).
 * TODO: reemplazar con fotos reales subidas a /public/luminaria/gallery/
 */
export const luminariaCityGallery: GalleryPhoto[] = [
  {
    src: "https://images.unsplash.com/photo-1535525153412-5a092d46c54b?w=1200&q=80",
    alt: "Luminaria City — escena 1",
    size: "tall",
  },
  {
    src: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&q=80",
    alt: "Luminaria City — escena 2",
  },
  {
    src: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&q=80",
    alt: "Luminaria City — escena 3",
  },
  {
    src: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=1200&q=80",
    alt: "Luminaria City — escena 4",
    size: "wide",
  },
  {
    src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&q=80",
    alt: "Luminaria City — escena 5",
  },
  {
    src: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1200&q=80",
    alt: "Luminaria City — escena 6",
    size: "tall",
  },
  {
    src: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200&q=80",
    alt: "Luminaria City — escena 7",
  },
  {
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80",
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
  ticketsUrl: "https://www.goliiive.com/el-alma-y-el-mar",

  // Background del show — reemplazar por foto/render del show real
  showBackgroundImage:
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=2400&q=80",

  // Logo del show — opcional. Si null, se usa el título en August Bold.
  showLogoImage: null as string | null,
  // Cuando tengas el logo: showLogoImage: "/luminaria/show-logo.png",

  pitch: [
    "En Luminaria 2026 nos sumergimos en un universo donde el océano revela lo que guarda en lo más profundo.",
    "“El alma y el mar” es una experiencia escénica que invita a escuchar sus historias: la magia, la calma, la diversión y la sabiduría que habitan bajo la superficie.",
    "A través de la danza, la música, las luces y visuales inmersivos, nuestros alumnos transforman el escenario en un portal azul donde cada movimiento es una ola y cada coreografía una emoción.",
    "Acompáñanos y sé parte de esta experiencia única en escena.",
  ],
};
