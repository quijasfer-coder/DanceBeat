import Link from "next/link";
import { Calendar, Clock, MapPin, User, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";
import {
  getUpcomingBookableSessions,
  getActiveSubscriptionsForStudents,
  getActiveBookingsForStudents,
} from "@/lib/queries/bookings";
import { ReserveButton } from "./reserve-button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Reservar clase",
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

export default async function ReservarPage() {
  const profile = await requireApprovedAccount("/app/reservar");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, enrolled_at")
    .eq("account_id", profile.id);

  const studentList = students ?? [];
  const studentIds = studentList.map((s) => s.id);

  const [sessions, subsMap, bookingsMap] = await Promise.all([
    getUpcomingBookableSessions(14),
    getActiveSubscriptionsForStudents(studentIds),
    getActiveBookingsForStudents(studentIds),
  ]);

  // Agrupar sesiones por día
  const grouped = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const dateKey = new Date(s.starts_at).toISOString().slice(0, 10);
    const arr = grouped.get(dateKey) ?? [];
    arr.push(s);
    grouped.set(dateKey, arr);
  }
  const dayKeys = Array.from(grouped.keys()).sort();

  // Construir options de student por sesión (con su info de plan + reserva)
  const studentOptions = (sessionId: string) =>
    studentList.map((s) => {
      const sub = subsMap.get(s.id);
      const bookedSet = bookingsMap.get(sessionId);
      return {
        id: s.id,
        full_name: s.full_name,
        isEnrolled: !!s.enrolled_at,
        hasActivePlan: !!sub,
        creditsRemaining: sub?.credits_remaining ?? 0,
        alreadyBooked: bookedSet?.has(s.id) ?? false,
      };
    });

  const noPlans = studentIds.length > 0 && subsMap.size === 0;

  return (
    <div className="container py-12">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Próximas dos semanas
        </p>
        <h1 className="font-display text-5xl mt-2">Reservar</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Cada reserva consume un crédito de tu plan. Puedes cancelar hasta 12
          horas antes para recuperar el crédito.
        </p>
      </div>

      {studentList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-2xl">
          <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute mb-6">
            Antes de reservar necesitas registrar al menos a una alumna.
          </p>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            Empezar onboarding
          </Link>
        </div>
      ) : noPlans ? (
        <div className="glass rounded-2xl p-8 max-w-2xl border border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-2xl mb-2">
                Aún no tienes plan activo
              </p>
              <p className="text-bone-mute text-pretty">
                Para reservar clases necesitas un plan asignado. Contacta a la
                academia por WhatsApp o espera a que el admin active tu plan
                desde el panel interno.
              </p>
            </div>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-2xl">
          <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            No hay clases programadas en las próximas dos semanas. Vuelve en un
            par de días.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {dayKeys.map((dateKey) => {
            const list = grouped.get(dateKey)!;
            const date = new Date(dateKey + "T12:00:00");
            const dayLabel = dayLabels[date.getDay()];
            const fullLabel = date.toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <section key={dateKey}>
                <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-bone-border/30">
                  <h2 className="font-display text-3xl">
                    {dayLabel}{" "}
                    <span className="text-bone-mute italic">· {fullLabel}</span>
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                    {list.length} clase{list.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((s) => {
                    const start = new Date(s.starts_at);
                    const timeStr = start.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const seatsLeft = s.capacity - s.seats_taken;
                    const full = seatsLeft <= 0;
                    return (
                      <article
                        key={s.id}
                        className="rounded-2xl border border-bone-border/30 bg-ink-off p-5 flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                              {s.classes.styles.tagline ?? ""}
                            </p>
                            <h3 className="font-display text-xl text-bone mt-1">
                              {s.classes.styles.name}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded",
                              full
                                ? "bg-danger/10 text-danger"
                                : seatsLeft <= 3
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success",
                            )}
                          >
                            {full ? "Lleno" : `${seatsLeft} lugares`}
                          </span>
                        </div>

                        <dl className="space-y-1.5 text-xs text-bone-mute mb-5">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {timeStr} · {s.classes.duration_min} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{s.classes.studios.name}</span>
                          </div>
                          {s.classes.teacher_name && (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span>{s.classes.teacher_name}</span>
                            </div>
                          )}
                          <div className="font-mono text-[10px] uppercase tracking-wider pt-1">
                            {s.classes.level}
                          </div>
                        </dl>

                        <div className="mt-auto">
                          <ReserveButton
                            sessionId={s.id}
                            students={studentOptions(s.id)}
                            full={full}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
