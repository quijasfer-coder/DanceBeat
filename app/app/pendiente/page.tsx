import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export const metadata = {
  title: "Solicitud en revisión",
  robots: { index: false },
};

export default async function PendientePage() {
  const profile = await requireAuth("/app/pendiente");

  // Si por alguna razón ya está aprobada, mándala al dashboard
  if (profile.account_status === "approved") redirect("/app");
  if (profile.account_status === "rejected") redirect("/app/rechazado");

  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("account_id", profile.id);

  const studentList = students ?? [];

  return (
    <div className="container py-16 max-w-2xl">
      <div className="text-center mb-12">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-warning/15 text-warning items-center justify-center mb-6">
          <Clock className="w-6 h-6" />
        </div>
        <p className="eyebrow text-warning mb-3">Solicitud en revisión</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95] text-balance">
          Tu solicitud está
          <br />
          <span className="italic text-bone-mute">en revisión.</span>
        </h1>
        <p className="mt-6 text-bone-mute text-pretty">
          Te notificaremos cuando tu acceso esté aprobado. Mientras tanto puedes
          terminar de capturar a quienes tomarán clases para que el equipo
          tenga toda la información cuando revise tu solicitud.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Alumnos registrados · {studentList.length}
          </p>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar alumno
          </Link>
        </div>

        {studentList.length === 0 ? (
          <Link
            href="/app/onboarding"
            className="block text-center rounded-xl border border-dashed border-bone-border/40 p-8 hover:border-lumen/40 transition-colors"
          >
            <Users className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              Aún no agregas a quién toma clases.
            </p>
            <p className="text-xs text-lumen mt-2 font-mono uppercase tracking-wider">
              Empezar →
            </p>
          </Link>
        ) : (
          <ul className="space-y-2">
            {studentList.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-bone-border/30 bg-ink-off px-4 py-3"
              >
                <p className="text-sm text-bone">{s.full_name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-bone-mute">
        ¿Pasó algo? Contacta a la academia por WhatsApp.
      </p>
    </div>
  );
}
