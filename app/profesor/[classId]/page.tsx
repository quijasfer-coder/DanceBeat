import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";
import { GenerateSessionsForm } from "./generate-form";

export const metadata = {
  title: "Profesor · Detalle de clase",
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

type PageProps = { params: Promise<{ classId: string }> };

export default async function ProfesorClasePage({ params }: PageProps) {
  const { classId } = await params;
  const profile = await requireTeacher(`/profesor/${classId}`);
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const [classRes, stylesRes, studiosRes] = await Promise.all([
    supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
    supabase.from("styles").select("id, name"),
    supabase.from("studios").select("id, name"),
  ]);

  const danceClass = classRes.data;
  if (!danceClass) notFound();

  // Solo permitir ver si es admin o el profesor asignado
  if (profile.role !== "admin" && (!teacher || danceClass.teacher_id !== teacher.id)) {
    notFound();
  }

  const style = (stylesRes.data ?? []).find((s) => s.id === danceClass.style_id);
  const studio = (studiosRes.data ?? []).find((s) => s.id === danceClass.studio_id);

  // Sesiones próximas + recientes (4 semanas atrás)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .gte("starts_at", fourWeeksAgo.toISOString())
    .order("starts_at", { ascending: true });

  const now = new Date();
  const upcoming = (sessions ?? []).filter((s) => new Date(s.starts_at) >= now);
  const past = (sessions ?? [])
    .filter((s) => new Date(s.starts_at) < now)
    .reverse();

  return (
    <div className="container py-12 max-w-4xl">
      <Link
        href="/profesor"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis clases
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Clase recurrente
        </p>
        <h1 className="font-display text-5xl mt-2">{style?.name ?? "—"}</h1>
        <p className="font-mono text-[11px] uppercase tracking-widest text-bone-mute mt-3">
          {dayLabels[danceClass.day_of_week]} · {danceClass.starts_at_time.slice(0, 5)} ·{" "}
          {danceClass.duration_min} min · {studio?.name ?? "—"}
        </p>
      </div>

      {/* Generar sesiones */}
      <div className="mb-10 rounded-2xl border border-bone-border/30 bg-ink-surface p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-2">
          Generar sesiones
        </p>
        <p className="text-xs text-bone-mute mb-4 max-w-xl">
          Crea las sesiones reservables de las próximas semanas. Es seguro
          ejecutarlo varias veces — solo se crean fechas que no existen.
        </p>
        <GenerateSessionsForm classId={classId} />
      </div>

      {/* Próximas sesiones */}
      <section className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone mb-4">
          Próximas sesiones · {upcoming.length}
        </p>
        {upcoming.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Calendar className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              No hay sesiones programadas. Genera las próximas semanas arriba.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <SessionRow
                key={s.id}
                id={s.id}
                startsAt={s.starts_at}
                seatsTaken={s.seats_taken}
                capacity={danceClass.capacity}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Sesiones pasadas */}
      {past.length > 0 && (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-mute mb-4">
            Recientes · {past.length}
          </p>
          <ul className="space-y-2">
            {past.map((s) => (
              <SessionRow
                key={s.id}
                id={s.id}
                startsAt={s.starts_at}
                seatsTaken={s.seats_taken}
                capacity={danceClass.capacity}
                muted
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SessionRow({
  id,
  startsAt,
  seatsTaken,
  capacity,
  muted,
}: {
  id: string;
  startsAt: string;
  seatsTaken: number;
  capacity: number;
  muted?: boolean;
}) {
  const d = new Date(startsAt);
  const dateStr = d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li>
      <Link
        href={`/profesor/sesion/${id}`}
        className={`group flex items-center justify-between rounded-xl border border-bone-border/30 px-5 py-4 hover:border-lumen/40 transition-colors ${muted ? "opacity-70" : ""}`}
      >
        <div>
          <p className="text-sm text-bone capitalize">{dateStr}</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-bone-mute mt-0.5">
            {timeStr} · {seatsTaken}/{capacity} reservas
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-bone-mute group-hover:text-lumen group-hover:translate-x-0.5 transition-all" />
      </Link>
    </li>
  );
}
