import Link from "next/link";
import { CheckCircle2, Edit3, Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMxn } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin · Planes",
  robots: { index: false },
};

type SearchParams = Promise<{ saved?: string }>;

export default async function AdminPlanesListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-12">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Mensualidades
          </p>
          <h1 className="font-display text-5xl mt-2">Planes</h1>
          <p className="text-sm text-bone-mute mt-3">
            {plans?.length ?? 0} planes configurados. Edita precio, nombre y
            beneficios o crea uno nuevo.
          </p>
        </div>
        <Link
          href="/admin/planes/nueva"
          className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </Link>
      </div>

      {saved === "1" && (
        <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm text-bone">Plan guardado correctamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(plans ?? []).map((plan) => {
          const perks = (plan.perks as string[] | null) ?? [];
          return (
            <article
              key={plan.id}
              className={cn(
                "rounded-2xl p-6 border transition-colors",
                plan.featured
                  ? "border-lumen/40 bg-lumen/5"
                  : "border-bone-border/30 bg-ink-off",
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                    {plan.code}
                  </p>
                  <h3 className="font-display text-2xl mt-1">{plan.name}</h3>
                  {plan.tagline && (
                    <p className="text-xs text-bone-mute mt-1">{plan.tagline}</p>
                  )}
                </div>
                {plan.featured && (
                  <span title="Plan destacado">
                    <Star className="w-4 h-4 text-lumen fill-lumen" />
                  </span>
                )}
              </div>

              <p className="font-display text-3xl text-bone">
                {formatMxn(plan.price_cents)}
                <span className="text-xs text-bone-mute ml-1 font-body">
                  {plan.cadence}
                </span>
              </p>
              {plan.credits_per_month !== null && (
                <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-2">
                  {plan.credits_per_month} créditos · {plan.classes_per_week}
                  /sem
                </p>
              )}

              <ul className="mt-5 space-y-1.5">
                {perks.slice(0, 4).map((p, i) => (
                  <li key={i} className="text-xs text-bone-mute truncate">
                    • {p}
                  </li>
                ))}
                {perks.length > 4 && (
                  <li className="text-xs text-bone-mute italic">
                    + {perks.length - 4} más
                  </li>
                )}
              </ul>

              <div className="mt-6 pt-4 border-t border-bone-border/30 flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded",
                    plan.is_active
                      ? "bg-success/10 text-success"
                      : "bg-bone-border/20 text-bone-mute",
                  )}
                >
                  {plan.is_active ? "Activo" : "Inactivo"}
                </span>
                <Link
                  href={`/admin/planes/${plan.id}/editar`}
                  className="inline-flex items-center gap-1.5 text-xs text-bone hover:text-lumen transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
