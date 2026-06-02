import Link from "next/link";
import { ArrowRight, Trophy, Sparkles, Target, Shield } from "lucide-react";
import { getSettings } from "@/lib/queries/settings";

export const metadata = {
  title: "IMPULSE",
  description:
    "IMPULSE es la compañía representativa de Dance Beat: bailarines de alto nivel técnico, disciplina y mentalidad competitiva.",
};

const whatIsCopy = [
  "IMPULSE es la compañía representativa de Dance Beat.",
  "Un espacio donde se forman bailarines con alto nivel técnico, disciplina y mentalidad competitiva.",
  "Aquí no solo entrenas… te preparas para competir, destacar y llevar tu talento al siguiente nivel.",
  "IMPULSE reúne a los alumnos más comprometidos de la academia para participar en competencias nacionales e internacionales, así como en proyectos escénicos y experiencias de alto nivel.",
];

const selectionPillars = [
  {
    icon: Target,
    title: "Audición técnica",
    body: "Evaluamos nivel de ejecución, musicalidad, presencia escénica y capacidad de aprender coreografías rápido.",
  },
  {
    icon: Shield,
    title: "Compromiso real",
    body: "Asistencia, puntualidad, responsabilidad con el grupo y disposición para entrenar al ritmo que IMPULSE exige.",
  },
  {
    icon: Trophy,
    title: "Mentalidad competitiva",
    body: "Hambre de mejorar, resiliencia frente a la corrección y voluntad de dejarlo todo en el escenario.",
  },
];

export default async function ImpulsePage() {
  const settings = await getSettings([
    "impulse_auditions_open",
    "impulse_auditions_message",
  ]);
  const isOpen = settings.impulse_auditions_open === "true";
  const closedMessage =
    settings.impulse_auditions_message ??
    "Las audiciones para IMPULSE están cerradas por ahora. Síguenos en Instagram para enterarte de la próxima convocatoria.";

  return (
    <div>
      {/* HERO */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(184,164,255,0.18), rgba(0,0,0,0) 70%)",
          }}
        />

        <div className="container relative">
          <p className="eyebrow text-lumen">Compañía representativa</p>
          <h1 className="font-display text-7xl md:text-9xl lg:text-[12rem] mt-6 leading-[0.85] tracking-tight">
            IMPULSE
          </h1>
          <p className="font-display italic text-2xl md:text-3xl text-bone-mute mt-4">
            Bailarines preparados para competir.
          </p>
          <p className="mt-12 text-lg md:text-2xl text-bone leading-relaxed max-w-3xl text-pretty">
            Selección rigurosa. Entrenamiento intensivo. Escenarios nacionales e
            internacionales.
          </p>
        </div>
      </section>

      {/* QUÉ ES IMPULSE */}
      <section className="container py-20 md:py-32">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16">
          <div>
            <p className="eyebrow mb-6">Qué es</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.95] sticky top-24">
              No es un grupo
              <br />
              <span className="italic text-bone-mute">cualquiera.</span>
            </h2>
          </div>

          <div className="space-y-6 max-w-2xl">
            {whatIsCopy.map((p, i) => (
              <p
                key={i}
                className="text-lg md:text-xl text-bone leading-relaxed text-pretty"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO SE ENTRA */}
      <section className="relative py-24 md:py-32 bg-ink-off">
        <div className="container">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="eyebrow text-lumen">Cómo se entra</p>
            <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
              Formar parte de IMPULSE
              <br />
              <span className="italic text-bone-mute">no es automático.</span>
            </h2>
            <p className="mt-8 text-lg text-bone-mute text-pretty">
              Es un proceso de selección donde cada bailarín debe demostrar que
              tiene lo necesario para estar aquí.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {selectionPillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <article
                  key={i}
                  className="glass rounded-2xl p-8 flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-lumen/10 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-lumen" />
                  </div>
                  <h3 className="font-display text-2xl text-bone mb-3">
                    {p.title}
                  </h3>
                  <p className="text-bone-mute text-pretty">{p.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA AUDICIONES — condicional */}
      <section className="container py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {isOpen ? (
            <>
              <p className="eyebrow text-lumen">Convocatoria abierta</p>
              <h2 className="font-display text-5xl md:text-7xl mt-4 leading-[0.9] text-balance">
                Audiciones IMPULSE
                <br />
                <span className="italic text-lumen">abiertas.</span>
              </h2>
              <p className="mt-8 text-lg md:text-xl text-bone-mute text-pretty">
                Si crees que tienes lo necesario, llena la aplicación. El equipo
                revisará tu material y te contactará por email.
              </p>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/impulse/audiciones"
                  className="group inline-flex items-center justify-center gap-2 bg-lumen text-ink px-8 py-4 rounded-full text-base font-medium hover:bg-bone transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Aplicar a audiciones
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/clases"
                  className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-7 py-3.5 rounded-full text-bone hover:bg-bone/5 transition-all"
                >
                  Ver clases regulares
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Convocatoria</p>
              <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
                Audiciones
                <br />
                <span className="italic text-bone-mute">cerradas.</span>
              </h2>
              <div className="glass rounded-2xl p-8 md:p-12 mt-12 text-left">
                <p className="text-base md:text-lg text-bone leading-relaxed whitespace-pre-line text-pretty">
                  {closedMessage}
                </p>
              </div>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/clases"
                  className="group inline-flex items-center justify-center gap-2 bg-bone text-ink px-7 py-3.5 rounded-full font-medium hover:bg-lumen transition-colors"
                >
                  Conoce nuestras clases
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/academy"
                  className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-7 py-3.5 rounded-full text-bone hover:bg-bone/5 transition-all"
                >
                  Sobre la academia
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
