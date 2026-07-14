import Link from "next/link";
import { Check, ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { getActivePlans, formatMxn } from "@/lib/queries/plans";
import { getCurrentProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function PlansPreview() {
  const [plans, profile] = await Promise.all([
    getActivePlans(),
    getCurrentProfile(),
  ]);
  const isLoggedIn = !!profile;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Watermark "Planes" gigante de fondo */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <span className="font-display text-[20vw] leading-none text-bone/[0.03]">
          Planes
        </span>
      </div>

      <div className="container relative">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <p className="eyebrow">Mensualidades</p>
            <h2 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95] text-balance">
              De <span className="italic">Pulse</span> a{" "}
              <span className="italic text-lumen">Stage.</span>
            </h2>
          </div>
          <Link
            href="/planes"
            className="group inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors w-fit"
          >
            Ver todos los planes
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.slice(0, 6).map((plan) => {
            const perks = (plan.perks as string[] | null) ?? [];
            return (
              <div
                key={plan.code}
                className={cn(
                  "relative rounded-2xl p-8 flex flex-col transition-all duration-300",
                  plan.featured
                    ? "bg-lumen text-ink border border-lumen shadow-[0_0_30px_rgba(184,164,255,0.25)]"
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

                <ul className="mt-8 space-y-3 flex-1">
                  {perks.slice(0, 3).map((p) => (
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
                  href={`/planes#${plan.code}`}
                  className={cn(
                    "mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors",
                    plan.featured
                      ? "bg-ink text-bone hover:bg-ink-surface"
                      : "border border-bone-border/60 hover:bg-bone hover:text-ink hover:border-bone",
                  )}
                >
                  Elegir {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
