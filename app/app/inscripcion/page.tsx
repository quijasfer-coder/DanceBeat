import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, MessageCircle, CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMxn } from "@/lib/format";

export const metadata = {
  title: "Inscripción pendiente",
  robots: { index: false },
};

export default async function InscripcionPage() {
  const profile = await requireAuth("/app/inscripcion");

  if (profile.account_status === "pending") redirect("/app/pendiente");
  if (profile.account_status === "rejected") redirect("/app/rechazado");

  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, enrolled_at, enrollment_type_id")
    .eq("account_id", profile.id);

  const allStudents = students ?? [];
  const hasEnrolledStudent = allStudents.some((s) => s.enrolled_at);

  // Con al menos una alumna inscrita ya se puede entrar al portal — el
  // resto se resuelve alumna por alumna dentro de /app.
  if (hasEnrolledStudent) redirect("/app");

  const pendingStudents = allStudents.filter((s) => !s.enrolled_at);
  const enrollmentTypeIds = Array.from(
    new Set(
      pendingStudents
        .map((s) => s.enrollment_type_id)
        .filter((id): id is string => !!id),
    ),
  );
  const { data: types } =
    enrollmentTypeIds.length > 0
      ? await supabase
          .from("enrollment_types")
          .select("id, price_cents")
          .in("id", enrollmentTypeIds)
      : { data: [] };
  const priceById = new Map((types ?? []).map((t) => [t.id, t.price_cents]));

  return (
    <div className="container py-16 max-w-2xl">
      <div className="text-center mb-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-success/15 text-success items-center justify-center mb-6">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="eyebrow text-success mb-3">Cuenta aprobada</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] text-balance">
          Falta el pago de
          <br />
          <span className="italic text-lumen">inscripción.</span>
        </h1>
        <p className="mt-6 text-bone-mute text-pretty">
          Para activar el acceso completo y empezar a contratar planes,
          completa el pago único de inscripción de cada alumna.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {pendingStudents.map((s) => {
          const price = s.enrollment_type_id
            ? priceById.get(s.enrollment_type_id)
            : undefined;
          return (
            <div
              key={s.id}
              className="glass rounded-2xl p-6 flex items-center justify-between gap-4"
            >
              <p className="font-display text-xl">{s.full_name}</p>
              <p className="font-mono text-sm">
                {price !== undefined ? (
                  formatMxn(price)
                ) : (
                  <span className="text-bone-mute text-xs">
                    Monto por confirmar
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium bg-bone-mute/10 text-bone-mute cursor-not-allowed"
        >
          <CreditCard className="w-4 h-4" />
          Pagar en línea (próximamente)
        </button>
        <a
          href="https://wa.me/5215588000185?text=Hola,%20quiero%20pagar%20mi%20inscripci%C3%B3n%20a%20Dance%20Beat"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium bg-bone text-ink hover:bg-lumen transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Pagar por WhatsApp / efectivo
        </a>
        <p className="text-center text-xs text-bone-mute mt-3">
          Una vez recibido el pago, el equipo lo registrará y esa alumna podrá
          empezar a reservar.
        </p>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/app/onboarding"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-bone transition-colors"
        >
          Agregar más alumnos a mi cuenta →
        </Link>
      </div>
    </div>
  );
}
