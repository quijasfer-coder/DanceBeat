import { createClient } from "@/lib/supabase/server";
import { EnrollmentTypeRow } from "./enrollment-type-row";
import { NewEnrollmentTypeForm } from "./new-enrollment-type-form";

export const metadata = {
  title: "Admin · Tipos de inscripción",
  robots: { index: false },
};

export default async function AdminInscripcionesPage() {
  const supabase = await createClient();

  const { data: types } = await supabase
    .from("enrollment_types")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Cobranza
        </p>
        <h1 className="font-display text-5xl mt-2">Tipos de inscripción</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Cada alumna se le asigna uno de estos tipos desde su ficha — define
          cuánto se le cobra de inscripción. Edita el monto o crea uno nuevo
          aquí.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {(types ?? []).map((t) => (
          <EnrollmentTypeRow
            key={t.id}
            id={t.id}
            code={t.code}
            name={t.name}
            priceMxn={t.price_cents / 100}
            isActive={t.is_active}
          />
        ))}
      </div>

      <NewEnrollmentTypeForm />
    </div>
  );
}
