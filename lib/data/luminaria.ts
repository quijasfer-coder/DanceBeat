// Datos de la página /luminaria.
// Editar aquí para actualizar concepto, ediciones y próximo show.
//
// TODO clienta:
//  · Agregar logo del show 2026 si lo tienen (subir a
//    /public/luminaria/el-alma-y-el-mar/logo.png y usarlo en showLogoImage)

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

export type Edition = {
  year: number;
  /** Ej. "Luminaria 2026" */
  label: string;
  /** Nombre del show, ej. "El Alma y El Mar" */
  name: string;
  /** Frase corta — se usa en el bloque compacto de ediciones pasadas. */
  blurb: string;
  /** Párrafos de recap — se usan en la edición destacada (la más reciente). */
  pitch?: string[];
  /** Foto de fondo full-bleed — solo la edición destacada la usa. */
  heroImage?: string;
  /** Logo del show — opcional, reemplaza el título en texto si existe. */
  showLogoImage?: string | null;
  gallery: GalleryPhoto[];
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
    subtitle: "Luminaria",
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
 * Ediciones de Luminaria, en orden cronológico (la más antigua primero).
 * La ÚLTIMA del arreglo es la edición destacada (full-bleed, con `pitch`
 * y `heroImage`). Las anteriores se muestran como galería compacta de
 * "edición pasada" usando solo `blurb` y `gallery`.
 *
 * Para agregar una nueva edición: mueve la edición destacada actual a
 * formato compacto (agrégale `blurb`, quítale `pitch`/`heroImage`) y
 * agrega la nueva edición al final del arreglo.
 */
export const editions: Edition[] = [
  {
    year: 2025,
    label: "Luminaria 2025",
    name: "Luminaria City",
    blurb:
      "La primera vez que reunimos a todas las categorías de la academia bajo un mismo escenario.",
    gallery: [
      {
        src: "/luminaria/luminaria-city/gallery-1.jpg",
        alt: "Luminaria City 2025 — escena 1",
        size: "tall",
      },
      {
        src: "/luminaria/luminaria-city/gallery-2.jpg",
        alt: "Luminaria City 2025 — escena 2",
      },
      {
        src: "/luminaria/luminaria-city/gallery-3.jpg",
        alt: "Luminaria City 2025 — escena 3",
      },
      {
        src: "/luminaria/luminaria-city/gallery-4.jpg",
        alt: "Luminaria City 2025 — escena 4",
        size: "wide",
      },
      {
        src: "/luminaria/luminaria-city/gallery-5.jpg",
        alt: "Luminaria City 2025 — escena 5",
      },
      {
        src: "/luminaria/luminaria-city/gallery-6.jpg",
        alt: "Luminaria City 2025 — escena 6",
        size: "tall",
      },
      {
        src: "/luminaria/luminaria-city/gallery-7.jpg",
        alt: "Luminaria City 2025 — escena 7",
      },
      {
        src: "/luminaria/luminaria-city/gallery-8.jpg",
        alt: "Luminaria City 2025 — escena 8",
      },
    ],
  },
  {
    year: 2026,
    label: "Luminaria 2026",
    name: "El Alma y El Mar",
    blurb:
      "Un universo donde el océano reveló la magia, la calma y la sabiduría que habitan bajo la superficie.",
    heroImage: "/luminaria/el-alma-y-el-mar/hero.jpg",
    showLogoImage: null,
    pitch: [
      "En Luminaria 2026 nos sumergimos en un universo donde el océano reveló lo que guarda en lo más profundo.",
      "“El alma y el mar” fue una experiencia escénica que invitó a escuchar sus historias: la magia, la calma, la diversión y la sabiduría que habitan bajo la superficie.",
      "A través de la danza, la música, las luces y visuales inmersivos, nuestros alumnos transformaron el escenario en un portal azul donde cada movimiento fue una ola y cada coreografía una emoción.",
      "Gracias a todos los que nos acompañaron en esta experiencia única en escena.",
    ],
    gallery: [
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-1.jpg",
        alt: "El Alma y El Mar 2026 — escena 1",
        size: "tall",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-2.jpg",
        alt: "El Alma y El Mar 2026 — escena 2",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-3.jpg",
        alt: "El Alma y El Mar 2026 — escena 3",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-4.jpg",
        alt: "El Alma y El Mar 2026 — escena 4",
        size: "wide",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-5.jpg",
        alt: "El Alma y El Mar 2026 — escena 5",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-6.jpg",
        alt: "El Alma y El Mar 2026 — escena 6",
        size: "tall",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-7.jpg",
        alt: "El Alma y El Mar 2026 — escena 7",
      },
      {
        src: "/luminaria/el-alma-y-el-mar/gallery-8.jpg",
        alt: "El Alma y El Mar 2026 — escena 8",
      },
    ],
  },
];

/**
 * Placeholder de la próxima edición — reemplazar `label`/`year` cuando
 * se anuncie el show del siguiente ciclo.
 */
export const nextEdition = {
  year: 2027,
  hint: "La siguiente edición de Luminaria se anunciará pronto.",
};
