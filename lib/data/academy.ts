// Datos de la página /academy.
// TODO clienta:
//  · Reemplazar imágenes placeholder con fotos reales de las clases/alumnas
//  · Confirmar handle de Instagram y horario de atención del WhatsApp

export type Pillar = {
  eyebrow: string;
  title: string;
  body: string;
  extra?: string;
  image: string;
};

export const lead =
  "Somos una academia de baile que ofrece una formación integral para niños, jóvenes y adultos, donde combinamos técnica, expresión y bienestar en cada etapa del aprendizaje.";

export const manifesto =
  "Creemos en el baile como una herramienta de crecimiento personal, que fortalece la confianza, la seguridad y la conexión con el propio cuerpo.";

export const pillars: Pillar[] = [
  {
    eyebrow: "Comunidad",
    title: "Trabajo en equipo,\nacompañamiento cercano.",
    body: "Creamos un ambiente cálido, motivador y de apoyo constante, donde cada alumno se siente contenido, valorado y acompañado de manera personalizada.",
    extra:
      "Aquí se forman no solo bailarines, sino también vínculos reales y amistades para toda la vida.",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80",
  },
  {
    eyebrow: "Técnica",
    title: "Calidad,\nconsciencia,\nbienestar.",
    body: "Nuestras clases tienen un enfoque de alta calidad, moderno y consciente, cuidando la técnica, la alineación y el bienestar físico.",
    extra:
      "Resultados visibles y duraderos, sin dejar de disfrutar el proceso.",
    image:
      "https://images.unsplash.com/photo-1518614368389-1f0e3a4e0a78?w=1400&q=80",
  },
];

export const impulse = {
  name: "IMPULSE",
  tagline: "La compañía de la academia.",
  body: "Nos distinguimos por impulsar el talento, la expresión y la confianza de cada uno de nuestros alumnos. Para quienes quieren llevar su crecimiento artístico y personal al siguiente nivel, IMPULSE es el espacio donde la formación se vuelve compañía y la disciplina, escenario.",
  image:
    "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1600&q=80",
};

export const closing = {
  intro:
    "Transformamos la pasión por el baile en disciplina, confianza y resultados.",
  body: "Aquí, cada clase es una experiencia estética y formativa: combinamos excelencia técnica, un ambiente inspirador y una filosofía que impulsa a nuestras alumnas a crecer en el escenario y en la vida.",
  punchline:
    "En Dance Beat Academy no solo se aprende a bailar, se aprende a crear, expresarse y brillar.",
};

export type Studio = {
  name: string;
  address: string;
  neighborhood: string;
  zip: string;
  note: string;
  mapsUrl: string;
  /** false = solo alumnas internas (no se muestra al cliente externo) */
  isPublic: boolean;
};

export const studios: Studio[] = [
  {
    name: "Av. Stim",
    address: "Av. Stim 1348, Sótano 1",
    neighborhood: "Lomas del Chamizal, Cuajimalpa de Morelos",
    zip: "05129 Ciudad de México",
    note: "A partir de 4:30 PM",
    mapsUrl: "https://maps.google.com/?q=Av.+Stim+1348+Cuajimalpa+CDMX",
    isPublic: true,
  },
  {
    // Sucursal interna del colegio Cumbres. NO se muestra en UI pública.
    // Existe en el dataset porque eventualmente se administra internamente.
    name: "Cumbres International School",
    address: "Recepción Cumbres International School",
    neighborhood: "Ciudad de México",
    zip: "",
    note: "",
    mapsUrl: "https://maps.google.com/?q=Cumbres+International+School+CDMX",
    isPublic: false,
  },
];

export const contact = {
  phone: "+52 1 55 8800 0185",
  whatsappUrl: "https://wa.me/5215588000185",
  instagramUrl: "https://instagram.com/dancebeat.studio", // TODO: confirmar handle real
};
