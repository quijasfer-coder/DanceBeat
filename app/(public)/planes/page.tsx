import Link from "next/link";
import { Check, ArrowRight, AlertCircle, Lock } from "lucide-react";
import { getActivePlans, formatMxn } from "@/lib/queries/plans";
import { getSettings } from "@/lib/queries/settings";
import { getCurrentProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Planes",
  description:
    "Mensualidades desde $2,200 hasta $3,750. Elige tu plan según el ritmo con el que quieres bailar.",
};

const faqs = [
  {
    q: "¿La inscripción es por una vez o cada año?",
    a: "Es una sola vez al unirte a la academia. No se cobra de nuevo mientras tu cuenta siga activa.",
  },
  {
    q: "¿Puedo cambiar de plan?",
    a: "Sí, en cualquier momento desde tu dashboard. Si subes de plan a mitad de ciclo, se prorratea automáticamente.",
  },
  {
    q: "¿Qué pasa si no uso todos mis créditos?",
    a: "Los créditos expiran al cierre de cada ciclo mensual. No se acumulan al siguiente mes.",
  },
  {
    q: "¿Cómo cancelo mi suscripción?",
    a: "Puedes cancelar en cualquier momento desde tu dashboard. Mantienes acceso hasta el final del ciclo pagado.",
  },
  {
    q: "¿Cuál es la política de cancelación de clases?",
    a: "Puedes cancelar tu reserva hasta 12 horas antes y se te devuelve el crédito. Cancelaciones tardías liberan el cupo pero no devuelven crédito.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjeta de crédito o débito, OXXO y SPEI. Los pagos se procesan a través de Stripe, certificado PCI nivel 1.",
  },
];

export default async function PlanesPage() {
  const [allPlans, settings, profile] = await Promise.all([
    getActivePlans(),
    getSettings([
      "enrollment_fee_cents",
      "late_fee_day_of_month",
      "late_fee_pct",
    ]),
    getCurrentProfile(),
  ]);

  const isLoggedIn = !!profile;

  // Impulse requiere audición — no es autoservicio, se asigna manualmente
  // tras seleccionar a la alumna. No se lista junto a los planes normales.
  const plans = allPlans.filter((plan) => plan.code !== "impulse");

  const enrollmentFeeCents = parseInt(
    settings.enrollment_fee_cents ?? "350000",
    10,
  );
  const lateFeeDayOfMonth = parseInt(
    settings.late_fee_day_of_month ?? "10",
    10,
  );
  const lateFeePct = parseFloat(settings.late_fee_pct ?? "0.10");

  return (
    <div>
      {/* HERO */}
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
          <p className="eyebrow">Mensualidades</p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl mt-6 leading-[0.9] text-balance">
            De <span className="italic">Rhythm</span>
            <br />
            a <span className="italic text-lumen">Cadence.</span>
          </h1>
          <p className="mt-12 text-lg md:text-xl text-bone-mute max-w-2xl text-pretty">
            Cada plan refleja tu compromiso con la disciplina. Subes de nivel,
            sube tu acceso. Cancelas o cambias cuando quieras.
          </p>
        </div>
      </section>

      {/* INSCRIPCIÓN */}
      <section className="container py-16">
        <div className="glass rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div>
              <p className="eyebrow text-lumen">Inscripción</p>
              {isLoggedIn ? (
                <p className="font-display text-5xl md:text-6xl mt-3">
                  {formatMxn(enrollmentFeeCents)}
                </p>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bone-mute">
                  <Lock className="w-3.5 h-3.5" />
                  Precio visible al crear cuenta
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-display text-2xl mb-3">Pago único</p>
              <p className="text-bone-mute text-pretty">
                Al unirte a la academia se cobra una sola vez. Cubre tu
                registro, kit de bienvenida y acceso a la plataforma. No se
                cobra de nuevo mientras tu cuenta siga activa.
              </p>
              {!isLoggedIn && (
                <Link
                  href="/auth/registro"
                  className="group mt-6 inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
                >
                  Crea tu cuenta
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <p className="eyebrow">Elige tu ritmo</p>
          <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
            Cuatro planes,
            <br />
            <span className="italic text-bone-mute">una academia.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const perks = (plan.perks as string[] | null) ?? [];
            return (
              <article
                key={plan.code}
                id={plan.code}
                className={cn(
                  "relative rounded-2xl p-8 flex flex-col scroll-mt-24 transition-all duration-300",
                  plan.featured
                    ? "bg-lumen text-ink border-2 border-lumen shadow-[0_0_30px_rgba(184,164,255,0.25)]"
                    : "glass hover:border-lumen/40",
                )}
              >
                {plan.featured && (
                  <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-widest bg-ink text-lumen px-2 py-1 rounded">
                    Más popular
                  </span>
                )}

                <p
                  className={cn(
                    "eyebrow",
                    plan.featured ? "!text-ink" : "text-bone-mute",
                  )}
                >
                  {plan.tagline}
                </p>
                <h3
                  className={cn(
                    "font-display text-4xl mt-3",
                    plan.featured ? "text-ink" : "text-bone",
                  )}
                >
                  {plan.name}
                </h3>

                {isLoggedIn ? (
                  <>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-display text-5xl",
                          plan.featured ? "text-ink" : "text-bone",
                        )}
                      >
                        {formatMxn(plan.price_cents)}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          plan.featured ? "text-ink/60" : "text-bone-mute",
                        )}
                      >
                        {plan.cadence}
                      </span>
                    </div>

                    {plan.credits_per_month !== null && (
                      <p
                        className={cn(
                          "mt-3 text-sm font-mono",
                          plan.featured ? "text-ink/70" : "text-bone-mute",
                        )}
                      >
                        ≈ {formatMxn(plan.price_cents / plan.credits_per_month)}{" "}
                        por clase
                      </p>
                    )}
                  </>
                ) : (
                  <div
                    className={cn(
                      "mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest",
                      plan.featured ? "text-ink/70" : "text-bone-mute",
                    )}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Crea tu cuenta para ver el precio
                  </div>
                )}

                <div
                  className={cn(
                    "h-px my-8",
                    plan.featured ? "bg-ink/15" : "bg-bone-border/40",
                  )}
                />

                <ul className="space-y-3 flex-1">
                  {perks.map((p) => (
                    <li
                      key={p}
                      className={cn(
                        "flex items-start gap-3 text-sm",
                        plan.featured ? "text-ink/80" : "text-bone-mute",
                      )}
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          plan.featured ? "text-ink" : "text-lumen",
                        )}
                      />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/auth/registro?plan=${plan.code}`}
                  className={cn(
                    "group mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-colors",
                    plan.featured
                      ? "bg-ink text-bone hover:bg-ink-surface"
                      : "border border-bone-border/60 hover:bg-bone hover:text-ink hover:border-bone",
                  )}
                >
                  {isLoggedIn ? `Elegir ${plan.name}` : "Crea tu cuenta"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* POLÍTICA DE PAGO TARDÍO */}
      <section className="container py-16">
        <div className="border border-warning/30 rounded-2xl p-8 max-w-3xl mx-auto bg-warning/5">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-2xl mb-3">
                Recargo por pago tardío
              </p>
              <p className="text-bone-mute text-pretty">
                Después del día{" "}
                <strong className="text-bone">{lateFeeDayOfMonth}</strong> de
                cada mes se cobra un{" "}
                <strong className="text-bone">+{lateFeePct * 100}%</strong>{" "}
                sobre el monto del plan. Configura tu tarjeta para cobro
                automático y olvídate del recargo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-32">
        <div className="grid lg:grid-cols-[400px_1fr] gap-16">
          <div>
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2 className="font-display text-4xl md:text-5xl mt-4 leading-[0.95] sticky top-24">
              Todo lo que
              <br />
              <span className="italic text-bone-mute">necesitas saber.</span>
            </h2>
          </div>

          <ul className="divide-y divide-bone-border/40">
            {faqs.map((f, i) => (
              <li key={i} className="py-6 first:pt-0">
                <p className="font-display text-xl md:text-2xl text-bone mb-3">
                  {f.q}
                </p>
                <p className="text-bone-mute text-pretty">{f.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container py-24 text-center">
        <p className="eyebrow text-lumen">¿Lista para empezar?</p>
        <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance max-w-2xl mx-auto">
          Tu primer paso al{" "}
          <span className="italic text-lumen">escenario.</span>
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/registro"
            className="group inline-flex items-center justify-center gap-2 bg-bone text-ink px-7 py-3.5 rounded-full font-medium hover:bg-lumen transition-colors"
          >
            Crear cuenta
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/clases"
            className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-7 py-3.5 rounded-full text-bone hover:bg-bone/5 transition-all"
          >
            Conoce las clases
          </Link>
        </div>
      </section>
    </div>
  );
}
