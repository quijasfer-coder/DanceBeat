import Image from "next/image";
import { conceptBlocks, editions, nextEdition, type Edition } from "@/lib/data/luminaria";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Luminaria",
  description:
    "Cada ciclo Dance Beat Academy lleva a sus alumnos a un escenario profesional. Conoce las ediciones de Luminaria.",
};

export default function LuminariaPage() {
  const pastEditions = editions.slice(0, -1);
  const featuredEdition = editions[editions.length - 1];

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 overflow-hidden">
        {/* Gradiente Lumen sutil de fondo */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,164,255,0.15), rgba(0,0,0,0) 70%)",
          }}
        />

        <div className="container relative text-center">
          <p className="eyebrow text-lumen">El show del ciclo</p>
          <h1 className="font-display text-7xl md:text-9xl lg:text-[10rem] mt-6 leading-[0.9] text-balance">
            <span className="italic">Luminaria.</span>
          </h1>
          <p className="mt-10 text-lg md:text-xl text-bone-mute max-w-2xl mx-auto text-pretty">
            Cada ciclo culminamos con un proyecto especial que lleva el
            talento de nuestros alumnos a un escenario profesional.
          </p>
        </div>
      </section>

      {/* ─── BLOQUES CONCEPTUALES ─── */}
      <section className="container py-20 space-y-32 md:space-y-48">
        {conceptBlocks.map((block, i) => {
          const reverse = i % 2 === 1;
          return (
            <div
              key={i}
              className={cn(
                "grid lg:grid-cols-2 gap-10 lg:gap-20 items-center",
                reverse && "lg:[&>*:first-child]:order-2",
              )}
            >
              {/* Imagen */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-bone-border/30 grain">
                <Image
                  src={block.image}
                  alt={`${block.title} ${block.subtitle}`}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover grayscale"
                />
                {/* Grain editorial */}
                <div
                  aria-hidden
                  className="absolute inset-0 mix-blend-overlay opacity-25 pointer-events-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='3' /></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
                  }}
                />
              </div>

              {/* Texto */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-lumen mb-6">
                  0{i + 1}
                </p>
                <h2 className="font-display text-4xl md:text-6xl leading-[0.95] text-balance">
                  {block.title}
                  <br />
                  <span className="italic text-bone-mute">
                    {block.subtitle}
                  </span>
                </h2>
                <p className="mt-8 text-lg text-bone-mute text-pretty max-w-md">
                  {block.body}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── EDICIONES PASADAS ─── */}
      {pastEditions.map((edition) => (
        <EditionGallery key={edition.year} edition={edition} />
      ))}

      {/* ─── EDICIÓN DESTACADA (la más reciente) ─── */}
      <FeaturedEdition edition={featuredEdition} />
      <EditionGallery edition={featuredEdition} />

      {/* ─── PRÓXIMA EDICIÓN ─── */}
      <NextEditionTeaser />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Galería de una edición — se usa para ediciones pasadas y también */
/*  debajo del recap de la edición destacada                        */
/* ────────────────────────────────────────────────────────────── */

function EditionGallery({ edition }: { edition: Edition }) {
  return (
    <section className="container py-32">
      <div className="text-center mb-16">
        <p className="eyebrow text-lumen">{edition.label}</p>
        <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
          {edition.name}.
        </h2>
        <p className="mt-6 text-bone-mute max-w-md mx-auto">{edition.blurb}</p>
      </div>

      {/* Masonry grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[260px] gap-3 md:gap-4">
        {edition.gallery.map((photo, i) => (
          <div
            key={i}
            className={cn(
              "relative overflow-hidden rounded-xl border border-bone-border/30 group",
              photo.size === "wide" && "col-span-2",
              photo.size === "tall" && "row-span-2",
            )}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-[1.02] group-hover:scale-100"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Edición destacada — recap full-bleed de la edición más reciente */
/* ────────────────────────────────────────────────────────────── */

function FeaturedEdition({ edition }: { edition: Edition }) {
  const { name, label, pitch, heroImage, showLogoImage } = edition;

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background del show */}
      {heroImage && (
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Overlay oscuro para legibilidad — ajustable */}
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/70 pointer-events-none"
      />

      {/* Gradiente superior para fundir con la sección anterior */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
        }}
      />
      {/* Gradiente inferior — fundir con la siguiente sección */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
        }}
      />

      <div className="container relative z-10 text-center py-32">
        <p className="eyebrow text-lumen mb-8">{label}</p>

        {/* Logo del show — si hay imagen, mostrarla; si no, fallback a texto */}
        {showLogoImage ? (
          <Image
            src={showLogoImage}
            alt={name}
            width={800}
            height={400}
            className="mx-auto w-full max-w-md md:max-w-xl h-auto"
            priority
          />
        ) : (
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-balance">
            <span className="italic">{name}.</span>
          </h2>
        )}

        {pitch && (
          <div className="mt-12 max-w-2xl mx-auto space-y-6 text-bone text-pretty">
            {pitch.map((p, i) => (
              <p
                key={i}
                className={cn(
                  "text-lg md:text-xl leading-relaxed",
                  i === pitch.length - 1 && "text-lumen italic",
                )}
              >
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Próxima edición — placeholder hasta que se anuncie el show     */
/* ────────────────────────────────────────────────────────────── */

function NextEditionTeaser() {
  return (
    <section className="container py-32">
      <div className="max-w-lg mx-auto text-center border border-bone-border/30 rounded-2xl px-8 py-16">
        <p className="eyebrow text-lumen">Próximamente</p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95] text-balance">
          La siguiente <span className="italic text-bone-mute">edición.</span>
        </h2>
        <p className="mt-6 text-bone-mute">{nextEdition.hint}</p>
      </div>
    </section>
  );
}
