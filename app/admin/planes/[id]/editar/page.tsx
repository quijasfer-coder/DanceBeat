import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditPlanForm } from "./edit-form";

export const metadata = {
  title: "Admin · Editar plan",
  robots: { index: false },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPlanPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!plan) notFound();

  const perks = (plan.perks as string[] | null) ?? [];

  return (
    <div className="p-10 max-w-3xl pb-32">
      <Link
        href="/admin/planes"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al listado
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Editar plan · {plan.code}
        </p>
        <h1 className="font-display text-5xl mt-2">{plan.name}</h1>
      </div>

      {/* Nota informativa */}
      <div className="mb-10 rounded-2xl border border-lumen/30 bg-lumen/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
          Cómo funciona un plan
        </p>
        <p className="text-sm text-bone-mute leading-relaxed text-pretty">
          Cada plan otorga <strong className="text-bone">N créditos al mes</strong>.
          Cuando una alumna reserva una clase consume 1 crédito; si cancela ≥12h
          antes se le devuelve. Al cierre del ciclo mensual los créditos se
          reinician (no se acumulan).{" "}
          <span className="text-bone">El campo "Créditos al mes"</span> es el
          que controla este comportamiento — los demás campos son cosméticos
          o informativos.
        </p>
      </div>

      <EditPlanForm
        planId={plan.id}
        initial={{
          name: plan.name,
          tagline: plan.tagline ?? "",
          price_mxn: plan.price_cents / 100,
          cadence: plan.cadence,
          classes_per_week: plan.classes_per_week,
          credits_per_month: plan.credits_per_month,
          perks,
          featured: plan.featured,
          is_active: plan.is_active,
        }}
      />
    </div>
  );
}
