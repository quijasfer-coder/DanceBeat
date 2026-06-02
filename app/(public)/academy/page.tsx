import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Instagram, MessageCircle } from "lucide-react";
import {
  lead,
  manifesto,
  pillars,
  impulse,
  closing,
  studios,
  contact,
} from "@/lib/data/academy";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Academy",
  description:
    "Dance Beat Academy: formación integral, comunidad y técnica. Bailar como herramienta de crecimiento personal.",
};

export default function AcademyPage() {
  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="relative pt-40 pb-20 md:pt-56 md:pb-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(184,164,255,0.12), rgba(0,0,0,0) 70%)",
          }}
        />

        <div className="container relative">
          <p className="eyebrow">Sobre nosotros</p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl mt-6 leading-[0.9] text-balance">
            Dance Beat
            <br />
            <span className="italic text-bone-mute">Academy.</span>
          </h1>
          <p className="mt-12 text-lg md:text-2xl text-bone leading-relaxed max-w-3xl text-pretty">
            {lead}
          </p>
        </div>
      </section>

      {/* ─── MANIFESTO QUOTE ─── */}
      <section className="container py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <p className="eyebrow text-lumen mb-8">Filosofía</p>
          <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.1] text-balance italic">
            “{manifesto}”
          </p>
        </div>
      </section>

      {/* ─── PILARES (Comunidad, Técnica) ─── */}
      <section className="container py-20 space-y-32 md:space-y-48">
        {pillars.map((pillar, i) => {
          const reverse = i % 2 === 1;
          return (
            <div
              key={i}
              className={cn(
                "grid lg:grid-cols-2 gap-10 lg:gap-20 items-center",
                reverse && "lg:[&>*:first-child]:order-2",
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-bone-border/30">
                <Image
                  src={pillar.image}
                  alt={pillar.eyebrow}
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

              <div>
                <p className="eyebrow text-lumen mb-6">{pillar.eyebrow}</p>
                <h2 className="font-display text-4xl md:text-6xl leading-[0.95] text-balance whitespace-pre-line">
                  {pillar.title}
                </h2>
                <p className="mt-8 text-lg text-bone-mute text-pretty max-w-md">
                  {pillar.body}
                </p>
                {pillar.extra && (
                  <p className="mt-6 text-base text-lumen italic max-w-md">
                    {pillar.extra}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── IMPULSE (diferenciador) ─── */}
      <section className="relative my-32 md:my-48">
        <div className="relative h-[70svh] min-h-[500px] overflow-hidden">
          <Image
            src={impulse.image}
            alt="IMPULSE"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-ink/70" />
          {/* Gradiente superior/inferior para fundir con secciones */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-32"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))",
            }}
          />

          <div className="container relative z-10 h-full flex flex-col items-center justify-center text-center py-20">
            <p className="eyebrow text-lumen mb-6">Compañía representativa</p>
            <h2 className="font-display text-7xl md:text-9xl lg:text-[10rem] leading-[0.85] tracking-tight">
              {impulse.name}
            </h2>
            <p className="font-display italic text-2xl md:text-3xl text-bone-mute mt-4">
              {impulse.tagline}
            </p>
            <p className="mt-10 max-w-2xl text-base md:text-lg text-bone leading-relaxed text-pretty">
              {impulse.body}
            </p>
            <Link
              href="/impulse"
              className="group mt-10 inline-flex items-center gap-2 bg-lumen text-ink px-7 py-3.5 rounded-full text-sm font-medium hover:bg-bone transition-colors"
            >
              Conoce IMPULSE
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CLOSING MANIFESTO ─── */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <p className="text-lg md:text-xl text-bone-mute text-pretty">
            {closing.intro}
          </p>
          <p className="text-base md:text-lg text-bone-mute leading-relaxed text-pretty">
            {closing.body}
          </p>

          <div className="hairline" />

          <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.05] text-balance">
            En Dance Beat Academy{" "}
            <span className="italic text-lumen">no solo se aprende a bailar</span>
            , se aprende a{" "}
            <span className="italic">crear, expresarse y brillar.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/clases"
              className="group inline-flex items-center justify-center gap-2 bg-bone text-ink px-7 py-3.5 rounded-full font-medium hover:bg-lumen transition-colors"
            >
              Conoce nuestras clases
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/planes"
              className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-7 py-3.5 rounded-full text-bone hover:bg-bone/5 transition-all"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SUCURSALES + CONTACTO ─── */}
      <section className="container py-32">
        <div className="hairline mb-16" />

        <div className="grid lg:grid-cols-[1fr_400px] gap-16">
          {/* Sucursales */}
          <div>
            <p className="eyebrow mb-6">Sucursales</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.95] mb-12">
              Nuestro espacio
              <br />
              <span className="italic text-bone-mute">en CDMX.</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {studios.filter((s) => s.isPublic).map((s) => (
                <a
                  key={s.name}
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass rounded-2xl p-6 hover:border-lumen/40 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-lumen mb-4" />
                  <h3 className="font-display text-2xl mb-3">{s.name}</h3>
                  <p className="text-sm text-bone leading-relaxed">{s.address}</p>
                  {s.neighborhood && (
                    <p className="text-sm text-bone-mute leading-relaxed mt-1">
                      {s.neighborhood}
                    </p>
                  )}
                  {s.zip && (
                    <p className="text-sm text-bone-mute leading-relaxed">
                      {s.zip}
                    </p>
                  )}
                  {s.note && (
                    <p className="font-mono text-xs uppercase tracking-wider text-lumen mt-4">
                      {s.note}
                    </p>
                  )}
                  <p className="text-xs text-bone-mute mt-6 group-hover:text-bone transition-colors">
                    Ver en mapa →
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="eyebrow mb-6">Contacto</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.95] mb-12">
              Hablemos.
            </h2>

            <ul className="space-y-5">
              <li>
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 text-bone hover:text-lumen transition-colors"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="font-mono text-xs text-bone-mute group-hover:text-lumen transition-colors">
                      {contact.phone}
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`tel:+52${contact.phone.replace(/\s/g, "")}`}
                  className="group flex items-center gap-4 text-bone hover:text-lumen transition-colors"
                >
                  <Phone className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="font-mono text-xs text-bone-mute group-hover:text-lumen transition-colors">
                      {contact.phone}
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 text-bone hover:text-lumen transition-colors"
                >
                  <Instagram className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="font-mono text-xs text-bone-mute group-hover:text-lumen transition-colors">
                      @dancebeat.studio
                    </p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
