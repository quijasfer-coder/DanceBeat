import Link from "next/link";
import {
  Sparkles,
  Trophy,
  Drama,
  CircleHelp,
  MapPin,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";
import { formatMxn, formatDateMX, formatTimeMX } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

export const metadata = {
  title: "Mis eventos · Dance Beat",
  robots: { index: false },
};

type EventKind = Database["public"]["Enums"]["event_kind"];
type AssignmentStatus = Database["public"]["Enums"]["event_assignment_status"];
type PaymentStatus = Database["public"]["Enums"]["event_payment_status"];

const kindLabels: Record<EventKind, string> = {
  rehearsal: "Ensayo",
  competition: "Competencia",
  showcase: "Presentación",
  other: "Evento",
};

const kindIcons: Record<EventKind, typeof Sparkles> = {
  rehearsal: Sparkles,
  competition: Trophy,
  showcase: Drama,
  other: CircleHelp,
};

const statusBadge: Record<AssignmentStatus, { label: string; className: string }> = {
  invited: {
    label: "Por confirmar",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-lumen/15 text-lumen border-lumen/30",
  },
  declined: {
    label: "Declinado",
    className: "bg-bone-border/15 text-bone-mute border-bone-border/40",
  },
  attended: {
    label: "Asistió",
    className: "bg-success/15 text-success border-success/30",
  },
  no_show: {
    label: "No asistió",
    className: "bg-danger/15 text-danger border-danger/30",
  },
};

const paymentBadge: Record<PaymentStatus, { label: string; className: string } | null> = {
  not_required: null,
  pending: {
    label: "Pago pendiente",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  paid: {
    label: "Pagado",
    className: "bg-success/15 text-success border-success/30",
  },
};

export default async function MisEventosPage() {
  const profile = await requireApprovedAccount("/app/eventos");
  const supabase = await createClient();

  // Mis students
  const { data: myStudents } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("account_id", profile.id);

  if (!myStudents || myStudents.length === 0) {
    return (
      <div className="container py-16 max-w-2xl">
        <div className="rounded-2xl border border-bone-border/30 bg-ink-off p-8 text-center">
          <p className="text-bone-mute">
            Aún no tienes alumnas registradas. Completa el onboarding antes
            de ver eventos.
          </p>
          <Link
            href="/app/onboarding"
            className="inline-block mt-4 text-sm text-lumen hover:text-bone transition-colors"
          >
            Ir al onboarding →
          </Link>
        </div>
      </div>
    );
  }

  const studentIds = myStudents.map((s) => s.id);
  const studentNameMap = new Map(myStudents.map((s) => [s.id, s.full_name]));

  // Asignaciones de mis students a eventos publicados
  const { data: assignments } = await supabase
    .from("event_assignments")
    .select("*, event:events(*)")
    .in("student_id", studentIds);

  const visible = (assignments ?? []).filter(
    // El RLS ya filtra eventos no publicados, pero la relación puede traer null
    (a) => a.event && a.event.is_published,
  );

  const now = new Date();
  const upcoming = visible
    .filter((a) => new Date(a.event!.starts_at) >= now)
    .sort(
      (a, b) =>
        new Date(a.event!.starts_at).getTime() -
        new Date(b.event!.starts_at).getTime(),
    );
  const past = visible
    .filter((a) => new Date(a.event!.starts_at) < now)
    .sort(
      (a, b) =>
        new Date(b.event!.starts_at).getTime() -
        new Date(a.event!.starts_at).getTime(),
    );

  return (
    <div className="container py-12 max-w-4xl">
      <Link
        href="/app"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Mi cuenta
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Calendario
        </p>
        <h1 className="font-display text-5xl mt-2">Mis eventos</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Ensayos extraordinarios, competencias y presentaciones a las que
          {myStudents.length === 1 ? " estás invitada" : " están invitadas tus alumnas"}.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            No hay eventos asignados por ahora. Te avisaremos cuando haya
            uno nuevo.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone mb-4">
                Próximos · {upcoming.length}
              </p>
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <EventCard
                    key={a.id}
                    studentName={studentNameMap.get(a.student_id) ?? "—"}
                    event={a.event!}
                    status={a.status}
                    paymentStatus={a.payment_status}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-mute mb-4">
                Pasados · {past.length}
              </p>
              <div className="space-y-3">
                {past.map((a) => (
                  <EventCard
                    key={a.id}
                    studentName={studentNameMap.get(a.student_id) ?? "—"}
                    event={a.event!}
                    status={a.status}
                    paymentStatus={a.payment_status}
                    muted
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({
  event,
  studentName,
  status,
  paymentStatus,
  muted,
}: {
  event: Database["public"]["Tables"]["events"]["Row"];
  studentName: string;
  status: AssignmentStatus;
  paymentStatus: PaymentStatus;
  muted?: boolean;
}) {
  const Icon = kindIcons[event.kind];
  const dateStr = formatDateMX(event.starts_at, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = formatTimeMX(event.starts_at);

  const sBadge = statusBadge[status];
  const pBadge = paymentBadge[paymentStatus];

  return (
    <article
      className={cn(
        "rounded-2xl border border-bone-border/30 bg-ink-off p-5",
        muted && "opacity-70",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-lumen/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-lumen" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
              {kindLabels[event.kind]}
            </span>
            <span
              className={cn(
                "inline-flex items-center font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                sBadge.className,
              )}
            >
              {sBadge.label}
            </span>
            {pBadge && (
              <span
                className={cn(
                  "inline-flex items-center font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border",
                  pBadge.className,
                )}
              >
                {pBadge.label}
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl text-bone">{event.title}</h2>

          <p className="text-xs text-bone-mute mt-2 capitalize">
            {dateStr} · {timeStr}
          </p>

          {event.location && (
            <p className="text-xs text-bone-mute mt-1 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </p>
          )}

          <p className="text-[11px] font-mono uppercase tracking-wider text-bone-mute mt-3">
            Para: <span className="text-bone">{studentName}</span>
          </p>

          {event.description && (
            <p className="text-sm text-bone-mute mt-4 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}

          {event.requirements && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning mb-1.5">
                Lleva / prepara
              </p>
              <p className="text-sm text-bone whitespace-pre-wrap leading-relaxed">
                {event.requirements}
              </p>
            </div>
          )}

          {(event.cost_cents ?? 0) > 0 && (
            <p className="text-xs text-bone-mute mt-4">
              Costo:{" "}
              <span className="text-bone font-mono">
                {formatMxn(event.cost_cents!)}
              </span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
