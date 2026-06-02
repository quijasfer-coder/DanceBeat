import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../event-form";
import { AssignmentsPanel } from "./assignments-panel";

export const metadata = {
  title: "Admin · Detalle de evento",
  robots: { index: false },
};

type PageProps = { params: Promise<{ id: string }> };

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function AdminEventoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const [
    studiosRes,
    assignmentsRes,
    classesRes,
    stylesRes,
    studentsRes,
    profilesRes,
  ] = await Promise.all([
    supabase.from("studios").select("id, name").eq("is_active", true),
    supabase
      .from("event_assignments")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("classes")
      .select("id, style_id, day_of_week, starts_at_time")
      .eq("is_active", true)
      .order("day_of_week"),
    supabase.from("styles").select("id, name"),
    supabase.from("students").select("id, full_name, account_id, birthdate"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const styleMap = new Map(
    (stylesRes.data ?? []).map((s) => [s.id, s.name]),
  );
  const studentMap = new Map(
    (studentsRes.data ?? []).map((s) => [s.id, s]),
  );
  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const classOptions = (classesRes.data ?? []).map((c) => ({
    id: c.id,
    label: `${styleMap.get(c.style_id) ?? "—"} · ${dayLabels[c.day_of_week]} ${c.starts_at_time.slice(0, 5)}`,
  }));

  const allStudentsOptions = (studentsRes.data ?? [])
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "es"))
    .map((s) => {
      const profile = profileMap.get(s.account_id);
      return {
        id: s.id,
        label: `${s.full_name}${profile ? ` (${profile.full_name})` : ""}`,
      };
    });

  const assignments = (assignmentsRes.data ?? []).map((a) => {
    const student = studentMap.get(a.student_id);
    const profile = student ? profileMap.get(student.account_id) : null;
    return {
      ...a,
      student_name: student?.full_name ?? "—",
      tutor_name: profile?.full_name ?? null,
      tutor_email: profile?.email ?? null,
    };
  });

  return (
    <div className="p-10 max-w-5xl pb-32">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Eventos
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Evento
        </p>
        <h1 className="font-display text-5xl mt-2">{event.title}</h1>
      </div>

      {/* TABS visuales — secciones apiladas en el mismo scroll */}

      <section className="mb-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-2">
          Datos del evento
        </p>
        <p className="text-xs text-bone-mute mb-6 max-w-xl">
          Edita aquí cualquier campo. Recuerda marcar{" "}
          <strong className="text-bone">"Publicar"</strong> cuando esté listo
          para que las alumnas asignadas lo vean.
        </p>

        <EventForm
          mode="edit"
          eventId={event.id}
          studios={studiosRes.data ?? []}
          initial={{
            kind: event.kind,
            title: event.title,
            description: event.description,
            requirements: event.requirements,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            location: event.location,
            studio_id: event.studio_id,
            cost_cents: event.cost_cents,
            is_published: event.is_published,
          }}
        />
      </section>

      <div className="hairline my-12" />

      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-2">
          Asignaciones · {assignments.length} alumna{assignments.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-bone-mute mb-6 max-w-xl">
          Asigna por clase (lo más rápido) o manualmente. Para cada alumna
          puedes marcar pago, asistencia o quitarla del evento.
        </p>

        <AssignmentsPanel
          eventId={event.id}
          hasCost={(event.cost_cents ?? 0) > 0}
          classOptions={classOptions}
          allStudents={allStudentsOptions}
          assignments={assignments}
        />
      </section>
    </div>
  );
}
