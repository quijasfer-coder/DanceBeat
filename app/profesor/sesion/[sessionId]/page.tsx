import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";
import { AttendanceList } from "./attendance-list";

export const metadata = {
  title: "Profesor · Pase de lista",
  robots: { index: false },
};

type PageProps = { params: Promise<{ sessionId: string }> };

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default async function ProfesorSesionPage({ params }: PageProps) {
  const { sessionId } = await params;
  const profile = await requireTeacher(`/profesor/sesion/${sessionId}`);
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: danceClass } = await supabase
    .from("classes")
    .select("*")
    .eq("id", session.class_id)
    .maybeSingle();

  if (!danceClass) notFound();

  // Permiso: admin o profesor de esta clase
  if (profile.role !== "admin") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!teacher || danceClass.teacher_id !== teacher.id) {
      notFound();
    }
  }

  const [styleRes, studioRes, bookingsRes] = await Promise.all([
    supabase
      .from("styles")
      .select("name")
      .eq("id", danceClass.style_id)
      .maybeSingle(),
    supabase
      .from("studios")
      .select("name")
      .eq("id", danceClass.studio_id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["confirmed", "attended", "no_show"])
      .order("booked_at", { ascending: true }),
  ]);

  const bookings = bookingsRes.data ?? [];
  const studentIds = bookings.map((b) => b.student_id);

  const { data: students } = studentIds.length
    ? await supabase.from("students").select("*").in("id", studentIds)
    : { data: [] };

  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

  const startsAt = new Date(session.starts_at);
  const dateStr = startsAt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = startsAt.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const attendedCount = bookings.filter((b) => b.status === "attended").length;
  const noShowCount = bookings.filter((b) => b.status === "no_show").length;
  const pendingCount = bookings.filter((b) => b.status === "confirmed").length;

  const items = bookings
    .map((b) => ({
      booking: b,
      student: studentMap.get(b.student_id) ?? null,
    }))
    .filter((it) => it.student !== null)
    .sort((a, b) =>
      (a.student!.full_name).localeCompare(b.student!.full_name, "es"),
    );

  return (
    <div className="container py-12 max-w-4xl">
      <Link
        href={`/profesor/${danceClass.id}`}
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Sesiones de la clase
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Pase de lista
        </p>
        <h1 className="font-display text-5xl mt-2">
          {styleRes.data?.name ?? "—"}
        </h1>
        <p className="text-sm text-bone-mute mt-3 capitalize">
          {dayLabels[danceClass.day_of_week]} — {dateStr} · {timeStr}
        </p>
        <p className="text-xs text-bone-mute mt-1">
          {studioRes.data?.name ?? "—"}
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Reservadas" value={bookings.length} />
        <Stat label="Asistencia" value={attendedCount} accent="success" />
        <Stat label="No vinieron" value={noShowCount} accent="danger" />
      </div>

      {pendingCount > 0 && (
        <p className="text-xs text-bone-mute mb-4">
          {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} por marcar.
        </p>
      )}

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            Aún no hay reservas para esta sesión.
          </p>
        </div>
      ) : (
        <AttendanceList
          sessionId={sessionId}
          items={items.map((it) => ({
            bookingId: it.booking.id,
            status: it.booking.status,
            studentName: it.student!.full_name,
            birthdate: it.student!.birthdate,
            school: it.student!.school,
            grade: it.student!.grade,
            notes: it.student!.notes,
          }))}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "danger";
}) {
  const accentClass =
    accent === "success"
      ? "text-success"
      : accent === "danger"
      ? "text-danger"
      : "text-bone";
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <p className={`font-display text-4xl ${accentClass}`}>{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-2">
        {label}
      </p>
    </div>
  );
}
