import Link from "next/link";
import { redirect } from "next/navigation";
import { WelcomeBanner } from "@/components/app/welcome-banner";
import {
  Calendar,
  Pencil,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import {
  getActiveSubscriptionsForStudents,
  getMyActiveBookings,
  type MyBooking,
} from "@/lib/queries/bookings";
import { dateKeyMX, formatDateMX, formatTimeMX } from "@/lib/format";

export const metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default async function AppDashboardPage() {
  const profile = await requireApprovedAccount("/app");
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("account_id", profile.id);

  // Si no hay alumnos registrados, redirigir al onboarding
  if (!students || students.length === 0) {
    redirect("/app/onboarding");
  }

  // Próximos eventos asignados (cualquier student de la cuenta)
  const studentIds = students.map((s) => s.id);
  const [eventAssignmentsRes, subsMap, allBookings] = await Promise.all([
    supabase
      .from("event_assignments")
      .select("event:events(id, title, kind, starts_at, is_published)")
      .in("student_id", studentIds),
    getActiveSubscriptionsForStudents(studentIds),
    getMyActiveBookings(studentIds),
  ]);
  const upcomingEventAssignments = eventAssignmentsRes.data;
  // El calendario semanal muestra los próximos 7 días completos, no solo
  // las primeras reservas — a diferencia de la lista anterior no hay que
  // truncar aquí.
  const upcomingBookings = allBookings;

  const now = new Date();
  const upcomingEvents = (upcomingEventAssignments ?? [])
    .map((a) => a.event)
    .filter(
      (e): e is NonNullable<typeof e> =>
        !!e && e.is_published && new Date(e.starts_at) >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  // dedupe por id (varios students pueden estar en el mismo evento)
  const uniqueUpcoming = Array.from(
    new Map(upcomingEvents.map((e) => [e.id, e])).values(),
  ).slice(0, 3);

  return (
    <div className="container py-12">
      <WelcomeBanner name={profile.full_name} />

      <div className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Hola
        </p>
        <h1 className="font-display text-5xl mt-2">{profile.full_name}</h1>
        <p className="text-sm text-bone-mute mt-3">
          Esta es tu cuenta. Aquí gestionas a quienes toman clases bajo tu
          responsabilidad.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Alumnos en tu cuenta · {students.length}
          </p>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar otro alumno
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-bone-border/30 bg-ink-off p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={s.photo_url} name={s.full_name} size={44} />
                  <div className="min-w-0">
                    <p className="font-display text-2xl truncate">{s.full_name}</p>
                    {s.is_self && (
                      <p className="font-mono text-[10px] uppercase tracking-wider text-lumen mt-1">
                        tú mismo
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/app/alumno/${s.id}/editar`}
                  className="inline-flex items-center gap-1 text-xs text-bone-mute hover:text-lumen transition-colors shrink-0"
                  aria-label={`Editar a ${s.full_name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!s.enrolled_at && (
                <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                  <Clock className="w-3 h-3" />
                  Inscripción pendiente
                </p>
              )}

              <dl className="space-y-2 text-sm text-bone-mute">
                <div className="flex justify-between">
                  <dt>Edad</dt>
                  <dd className="text-bone font-mono">
                    {calcAge(s.birthdate)} años
                  </dd>
                </div>
                {s.school && (
                  <div className="flex justify-between">
                    <dt>Escuela</dt>
                    <dd className="text-bone text-right max-w-[60%] truncate">
                      {s.school}
                    </dd>
                  </div>
                )}
                {s.grade && (
                  <div className="flex justify-between">
                    <dt>Grado</dt>
                    <dd className="text-bone">{s.grade}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 pt-4 border-t border-bone-border/30">
                {(() => {
                  const sub = subsMap.get(s.id);
                  if (!sub) {
                    return (
                      <p className="text-xs text-warning italic flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" />
                        Sin plan activo
                      </p>
                    );
                  }
                  return (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute">
                        {sub.plans.name}
                      </p>
                      <p className="text-sm text-bone mt-1">
                        <span className="text-lumen font-mono">
                          {sub.credits_remaining}
                        </span>{" "}
                        <span className="text-bone-mute font-mono text-xs">
                          / {sub.credits_total} créditos
                        </span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Próximos eventos */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Próximos eventos {uniqueUpcoming.length > 0 && `· ${uniqueUpcoming.length}`}
          </p>
          <Link
            href="/app/eventos"
            className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {uniqueUpcoming.length === 0 ? (
          <div className="rounded-2xl border border-bone-border/30 bg-ink-off p-8 text-center">
            <Sparkles className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              No hay ensayos, competencias ni presentaciones asignadas por ahora.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {uniqueUpcoming.map((e) => {
              const dateStr = formatDateMX(e.starts_at, {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = formatTimeMX(e.starts_at);
              return (
                <Link
                  key={e.id}
                  href="/app/eventos"
                  className="flex items-center justify-between rounded-xl border border-bone-border/30 bg-ink-off px-5 py-4 hover:border-lumen/40 transition-colors"
                >
                  <div>
                    <p className="font-display text-base text-bone">
                      {e.title}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-1 capitalize">
                      {dateStr} · {timeStr}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-bone-mute" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Próximas clases */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Próximas clases{" "}
            {upcomingBookings.length > 0 && `· ${upcomingBookings.length}`}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/app/reservas"
              className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors"
            >
              Todas
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="rounded-2xl border border-bone-border/30 bg-ink-off p-12 text-center">
            <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
            <p className="text-bone-mute mb-6">
              Aún no tienes reservas. Explora las clases disponibles.
            </p>
            <Link
              href="/app/reservar"
              className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
            >
              Reservar clase
            </Link>
          </div>
        ) : (
          <WeekCalendar bookings={upcomingBookings} />
        )}
      </section>
    </div>
  );
}

const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Ancla al mediodía UTC del día calendario de CDMX que le corresponde a
// `d` — evita usar setHours(0,0,0,0)/getDate() locales, que en el server
// (Vercel corre en UTC) leen el día calendario de UTC, no el de CDMX.
function startOfDayMX(d: Date): Date {
  return new Date(dateKeyMX(d) + "T12:00:00Z");
}

function sameDay(a: Date, b: Date): boolean {
  return dateKeyMX(a) === dateKeyMX(b);
}

/**
 * Franja de 7 días (hoy + 6) con las clases reservadas de cada día.
 * Las clases fijas se repiten semana a semana, así que esta vista de
 * calendario refleja mejor el ritmo real de la alumna que una lista.
 */
function WeekCalendar({ bookings }: { bookings: MyBooking[] }) {
  const today = startOfDayMX(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + i);
    return date;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {days.map((day) => {
        const dayBookings = bookings.filter((b) =>
          sameDay(new Date(b.class_sessions.starts_at), day),
        );
        const isToday = sameDay(day, today);

        return (
          <div
            key={day.toISOString()}
            className={`rounded-2xl border p-4 min-h-[120px] ${
              isToday
                ? "border-lumen/40 bg-lumen/5"
                : "border-bone-border/30 bg-ink-off"
            }`}
          >
            <p
              className={`font-mono text-[10px] uppercase tracking-widest mb-3 ${
                isToday ? "text-lumen" : "text-bone-mute"
              }`}
            >
              {weekDayLabels[(day.getDay() + 6) % 7]} · {day.getDate()}
            </p>

            {dayBookings.length === 0 ? (
              <p className="text-xs text-bone-mute/50">—</p>
            ) : (
              <div className="space-y-2">
                {dayBookings.map((b) => {
                  const timeStr = formatTimeMX(b.class_sessions.starts_at);
                  return (
                    <Link
                      key={b.id}
                      href="/app/reservas"
                      className="block rounded-lg border border-bone-border/30 bg-ink px-3 py-2 hover:border-lumen/40 transition-colors"
                    >
                      <p className="text-sm text-bone truncate">
                        {b.class_sessions.classes.styles.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-1">
                        {timeStr}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
