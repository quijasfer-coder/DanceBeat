import Link from "next/link";
import { Calendar, ArrowRight, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";

export const metadata = {
  title: "Profesor · Mis clases",
  robots: { index: false },
};

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function ProfesorHomePage() {
  const profile = await requireTeacher("/profesor");
  const supabase = await createClient();

  // Si es admin sin teacher row, mostramos un fallback amigable.
  // Si es teacher, buscamos su teacher row por profile_id.
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, full_name")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) {
    return (
      <div className="container py-16 max-w-2xl">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-2xl text-bone mb-2">
                Tu cuenta no está vinculada a un coreógrafo
              </p>
              <p className="text-sm text-bone-mute">
                {profile.role === "admin"
                  ? "Eres administrador y aún no estás registrada como coreógrafa. Pídele al equipo que te dé de alta en /admin/coreografos para ver este panel."
                  : "Pídele al equipo administrativo que te dé de alta en /admin/coreografos y vincule este email a tu perfil de coreógrafo."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [classesRes, stylesRes, studiosRes] = await Promise.all([
    supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", teacher.id)
      .order("day_of_week", { ascending: true })
      .order("starts_at_time", { ascending: true }),
    supabase.from("styles").select("id, name, slug"),
    supabase.from("studios").select("id, name"),
  ]);

  const classes = classesRes.data ?? [];
  const styleMap = new Map((stylesRes.data ?? []).map((s) => [s.id, s]));
  const studioMap = new Map((studiosRes.data ?? []).map((s) => [s.id, s]));

  return (
    <div className="container py-12 max-w-5xl">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Hola {teacher.full_name.split(" ")[0]}
        </p>
        <h1 className="font-display text-5xl mt-2">Mis clases</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          {classes.length === 0
            ? "Aún no tienes clases asignadas. Cuando el equipo te asigne una, aparecerá aquí."
            : `Tienes ${classes.length} clase${classes.length === 1 ? "" : "s"} asignada${classes.length === 1 ? "" : "s"}. Selecciona una para ver sus sesiones y tomar lista.`}
        </p>
      </div>

      {classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.map((c) => {
            const style = styleMap.get(c.style_id);
            const studio = studioMap.get(c.studio_id);
            return (
              <Link
                key={c.id}
                href={`/profesor/${c.id}`}
                className="group glass rounded-2xl p-6 hover:border-lumen/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <Calendar className="w-5 h-5 text-lumen" />
                  <ArrowRight className="w-4 h-4 text-bone-mute opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="font-display text-2xl text-bone">
                  {style?.name ?? "—"}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-2">
                  {dayLabels[c.day_of_week]} · {c.starts_at_time.slice(0, 5)} ·{" "}
                  {c.duration_min} min
                </p>
                <p className="text-xs text-bone-mute mt-3">
                  {studio?.name ?? "—"} · cupo {c.capacity}
                </p>
                {!c.is_active && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-warning mt-3">
                    Clase pausada
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
