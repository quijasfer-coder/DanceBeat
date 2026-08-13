import Link from "next/link";
import { Calendar, Clock, MapPin, User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";
import { getMyActiveBookings, getActiveSubscriptionsForStudents } from "@/lib/queries/bookings";
import { getSetting } from "@/lib/queries/settings";
import { CancelButton } from "./cancel-button";

export const metadata = {
  title: "Mis reservas",
  robots: { index: false },
};

export default async function MisReservasPage() {
  const profile = await requireApprovedAccount("/app/reservas");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("account_id", profile.id);

  const studentList = students ?? [];
  const studentMap = new Map(studentList.map((s) => [s.id, s.full_name]));
  const studentIds = studentList.map((s) => s.id);

  const [bookings, cancelWindowRaw, subsMap] = await Promise.all([
    getMyActiveBookings(studentIds),
    getSetting("cancel_window_hours", "12"),
    getActiveSubscriptionsForStudents(studentIds),
  ]);

  const cancelWindow = parseInt(cancelWindowRaw, 10);

  return (
    <div className="container py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Tu agenda
          </p>
          <h1 className="font-display text-5xl mt-2">Mis reservas</h1>
          <p className="text-sm text-bone-mute mt-3 max-w-xl">
            Cancela hasta <strong className="text-bone">{cancelWindow}h</strong>{" "}
            antes de la clase para recuperar tu crédito.
          </p>
        </div>
        <Link
          href="/app/reservar"
          className="group inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
        >
          Reservar otra
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Resumen de créditos por student */}
      {studentList.length > 0 && (
        <section className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-3">
            Créditos disponibles
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentList.map((s) => {
              const sub = subsMap.get(s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-bone-border/30 bg-ink-off p-4"
                >
                  <p className="font-display text-base text-bone">{s.full_name}</p>
                  {sub ? (
                    <p className="text-xs text-bone-mute mt-1 font-mono uppercase tracking-wider">
                      {sub.plans.name} ·{" "}
                      <span className="text-lumen">
                        {sub.credits_remaining}/{sub.credits_total}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-warning mt-1 font-mono uppercase tracking-wider">
                      Sin plan activo
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {bookings.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-2xl">
          <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute mb-6">
            No tienes reservas activas. Explora las próximas clases disponibles.
          </p>
          <Link
            href="/app/reservar"
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            Ver próximas clases
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const start = new Date(b.class_sessions.starts_at);
            const dateStr = start.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
            const timeStr = start.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const hoursUntil =
              (start.getTime() - Date.now()) / (1000 * 60 * 60);
            const isLate = hoursUntil < cancelWindow;
            const studentName = studentMap.get(b.student_id) ?? "—";

            return (
              <article
                key={b.id}
                className="rounded-2xl border border-bone-border/30 bg-ink-off p-5 flex flex-wrap items-start gap-4 justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute capitalize">
                    {dateStr} · {timeStr}
                  </p>
                  <h3 className="font-display text-2xl text-bone mt-1">
                    {b.class_sessions.classes.styles.name}
                  </h3>
                  <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-mute">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {studentName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {b.class_sessions.classes.studios.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {b.class_sessions.classes.duration_min} min
                    </div>
                    {b.class_sessions.classes.teacher_name && (
                      <div className="flex items-center gap-1.5">
                        Coreógrafo: {b.class_sessions.classes.teacher_name}
                      </div>
                    )}
                  </dl>
                </div>

                {b.is_fixed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider border border-lumen/30 text-lumen">
                    Clase fija
                  </span>
                ) : (
                  <CancelButton bookingId={b.id} isLate={isLate} />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
