import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewPlanForm } from "./new-form";

export const metadata = {
  title: "Admin · Nuevo plan",
  robots: { index: false },
};

export default function NewPlanPage() {
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
          Crear plan
        </p>
        <h1 className="font-display text-5xl mt-2">Nuevo plan</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Define un nuevo tier de mensualidad. Una vez guardado puedes
          editarlo, marcarlo como destacado o desactivarlo en cualquier
          momento desde el listado.
        </p>
      </div>

      <div className="mb-10 rounded-2xl border border-lumen/30 bg-lumen/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
          Antes de empezar
        </p>
        <p className="text-sm text-bone-mute leading-relaxed text-pretty">
          El <strong className="text-bone">código</strong> es un identificador
          interno que se usa en URLs y como referencia futura para Stripe.
          Debe ser único y solo aceptar letras minúsculas, números, guiones o
          guiones bajos. Ejemplos: <code>impulse</code>,{" "}
          <code>summer_special</code>, <code>vip-2026</code>. No se puede
          cambiar después.
        </p>
      </div>

      <NewPlanForm />
    </div>
  );
}
