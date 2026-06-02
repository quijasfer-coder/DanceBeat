import Link from "next/link";
import { Check, MessageCircle, CreditCard, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";
import { getActivePlans, formatMxn } from "@/lib/queries/plans";
import { getActiveSubscriptionsForStudents } from "@/lib/queries/bookings";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Mis planes",
  robots: { index: false },
};

export default async function AppPlanesPage() {
  const profile = await requireApprovedAccount("/app/planes");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("account_id", profile.id);

  const studentList = students ?? [];
  const studentIds = studentList.map((s) => s.id);

  const [plans, subsMap] = await Promise.all([
    getActivePlans(),
    getActiveSubscriptionsForStudents(studentIds),
  ]);

  const studentsWithoutPlan = studentList.filter((s) => !subsMap.get(s.id));

  return (
    <div className="container py-12 max-w-6xl">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Tus planes activos
        </p>
        <h1 className="font-display text-5xl mt-2">Planes</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Cada alumna lleva su propio plan. Aquí ves el plan vigente de cada
          una y puedes contratar uno nuevo cuando lo necesites.
        </p>
      </div>

      {/* Estado por alumna */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {studentList.map((s) => {
            const sub = subsMap.get(s.id);
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-2xl border p-5",
                  sub
                    ? "border-bone-border/30 bg-ink-off"
                    : "border-warning/30 bg-warning/5",
                )}
              >
                <p className="font-display text-lg">{s.full_name}</p>
                {sub ? (
                  <>
                    <p className="text-xs text-bone-mute mt-1 font-mono uppercase tracking-wider">
                      {sub.plans.name}
                    </p>
                    <p className="text-sm text-bone mt-2">
                      <span className="text-lumen font-mono">
                        {sub.credits_remaining}
                      </span>{" "}
                      <span className="text-bone-mute font-mono text-xs">
                        / {sub.credits_total} créditos
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-warning mt-1 font-mono uppercase tracking-wider">
                    Sin plan asignado
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {studentsWithoutPlan.length > 0 && (
          <p className="mt-4 text-xs text-bone-mute">
            {studentsWithoutPlan.length} alumna
            {studentsWithoutPlan.length === 1 ? "" : "s"} sin plan asignado.
            Elige uno abajo.
          </p>
        )}
      </section>

      {/* Cards de planes */}
      <section>
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-6">
          Planes disponibles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const perks = (plan.perks as string[] | null) ?? [];
            return (
              <article
                key={plan.code}
                className={cn(
                  "relative rounded-2xl p-6 flex flex-col transition-all duration-300",
                  plan.featured
                    ? "bg-lumen text-ink border border-lumen shadow-[0_0_60px_rgba(184,164,255,0.25)]"
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
                    plan.featured ? "text-ink/60" : "text-bone-mute",
                  )}
                >
                  {plan.tagline}
                </p>
                <h3
                  className={cn(
                    "font-display text-3xl mt-2",
                    plan.featured ? "text-ink" : "text-bone",
                  )}
                >
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-display text-4xl",
                      plan.featured ? "text-ink" : "text-bone",
                    )}
                  >
                    {formatMxn(plan.price_cents)}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      plan.featured ? "text-ink/60" : "text-bone-mute",
                    )}
                  >
                    {plan.cadence}
                  </span>
                </div>
                {plan.credits_per_month !== null && (
                  <p
                    className={cn(
                      "mt-2 text-xs font-mono",
                      plan.featured ? "text-ink/70" : "text-bone-mute",
                    )}
                  >
                    {plan.credits_per_month} créditos / mes
                  </p>
                )}

                <div
                  className={cn(
                    "h-px my-6",
                    plan.featured ? "bg-ink/15" : "bg-bone-border/40",
                  )}
                />

                <ul className="space-y-2.5 flex-1">
                  {perks.map((p) => (
                    <li
                      key={p}
                      className={cn(
                        "flex items-start gap-2 text-sm",
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

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    disabled
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider cursor-not-allowed",
                      plan.featured
                        ? "bg-ink/20 text-ink/50"
                        : "bg-bone-mute/10 text-bone-mute",
                    )}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Contratar en línea (próximamente)
                  </button>
                  <a
                    href={`https://wa.me/525500000000?text=Hola,%20quiero%20contratar%20el%20plan%20${encodeURIComponent(plan.name)}%20para%20mi%20cuenta`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                      plan.featured
                        ? "bg-ink text-bone hover:bg-ink-surface"
                        : "bg-bone text-ink hover:bg-lumen",
                    )}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contratar por WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-16 text-center">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-bone transition-colors"
        >
          <ArrowRight className="w-3 h-3 rotate-180" />
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
