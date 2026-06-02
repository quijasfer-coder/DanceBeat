import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  AlertTriangle,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/queries/settings";
import { formatMxn } from "@/lib/format";
import { SubscriptionForm } from "./subscription-form";
import { CreditControls } from "./credit-controls";
import {
  AccountStatusActions,
  MarkEnrollmentPaidActions,
} from "./account-actions";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin · Alumno",
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

export default async function AdminAlumnoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/alumnos");
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [profileRes, plansRes, subsRes, enrollmentFeeRaw] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", student.account_id)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, name, code, credits_per_month, is_active")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("subscriptions")
      .select("*, plans:plan_id (name, code)")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
    getSetting("enrollment_fee_cents", "160000"),
  ]);
  const enrollmentFee = parseInt(enrollmentFeeRaw, 10);

  const profile = profileRes.data;
  const plans = (plansRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    credits_per_month: p.credits_per_month,
  }));

  type SubRow = NonNullable<typeof subsRes.data>[number];
  const allSubs = (subsRes.data ?? []) as SubRow[];
  const activeSub = allSubs.find((s) => s.status === "active") ?? null;

  // Defaults para el form: si hay sub activa, precarga sus valores
  const defaults = activeSub
    ? {
        plan_id: activeSub.plan_id,
        credits_total: activeSub.credits_total,
        credits_remaining: activeSub.credits_remaining,
        cycle_start_at: activeSub.cycle_start_at.slice(0, 10),
        cycle_end_at: activeSub.cycle_end_at.slice(0, 10),
      }
    : (() => {
        // Plantilla nueva: ciclo del 1 al fin del mes actual
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .slice(0, 10);
        return {
          cycle_start_at: start,
          cycle_end_at: end,
        };
      })();

  const age = calcAge(student.birthdate);

  return (
    <div className="p-10 max-w-5xl">
      <Link
        href="/admin/alumnos"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver al listado
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Alumno · {age} años
        </p>
        <h1 className="font-display text-5xl mt-2">{student.full_name}</h1>
        {student.is_self && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-lumen mt-2">
            Es el titular de la cuenta
          </p>
        )}
      </div>

      {/* Estado de la cuenta del titular */}
      {profile && (
        <section className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                Estado de la cuenta
              </p>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <StatusBadge status={profile.account_status} />
                {profile.enrolled_at ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Inscripción pagada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                    <Clock className="w-3 h-3" />
                    Inscripción pendiente
                  </span>
                )}
              </div>
              {profile.account_status === "approved" && profile.approved_at && (
                <p className="text-xs text-bone-mute mt-2">
                  Aprobada el{" "}
                  {new Date(profile.approved_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              {profile.account_status === "rejected" && (
                <>
                  <p className="text-xs text-bone-mute mt-2">
                    Rechazada el{" "}
                    {profile.rejected_at &&
                      new Date(profile.rejected_at).toLocaleDateString(
                        "es-MX",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                  </p>
                  {profile.rejection_reason && (
                    <p className="text-xs text-bone-mute mt-1 italic">
                      “{profile.rejection_reason}”
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Acciones según status */}
          {profile.account_status === "pending" && (
            <div className="border-t border-bone-border/30 pt-4 mt-4">
              <p className="text-xs text-bone-mute mb-3">
                Esta cuenta espera aprobación. Tras aprobar, marca la
                inscripción como pagada cuando recibas el pago.
              </p>
              <AccountStatusActions accountId={profile.id} />
            </div>
          )}

          {profile.account_status === "approved" && !profile.enrolled_at && (
            <div className="border-t border-bone-border/30 pt-4 mt-4">
              <p className="text-xs text-bone-mute mb-3">
                Cobro de inscripción pendiente:{" "}
                <span className="text-bone font-mono">
                  {formatMxn(enrollmentFee)}
                </span>
                . El link de pago en línea estará disponible al integrar Stripe.
              </p>
              <MarkEnrollmentPaidActions accountId={profile.id} />
            </div>
          )}

          {profile.enrolled_at && (
            <div className="border-t border-bone-border/30 pt-4 mt-4 text-xs text-bone-mute">
              Inscripción registrada el{" "}
              {new Date(profile.enrolled_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {profile.enrollment_paid_method && (
                <> · método: {profile.enrollment_paid_method}</>
              )}
            </div>
          )}
        </section>
      )}

      {/* Info del titular */}
      {profile && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-2">
              Titular de la cuenta
            </p>
            <p className="font-display text-lg">{profile.full_name}</p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-lumen transition-colors"
            >
              <Mail className="w-3 h-3" />
              {profile.email}
            </a>
            {(student.phone || profile.phone) && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-bone-mute">
                <Phone className="w-3 h-3" />
                {student.phone || profile.phone}
              </p>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-2">
              Datos escolares
            </p>
            <p className="text-sm text-bone">{student.school || "—"}</p>
            <p className="text-xs text-bone-mute mt-1">{student.grade || ""}</p>
          </div>
        </div>
      )}

      {student.notes && (
        <div className="border border-warning/30 bg-warning/5 rounded-2xl p-5 mb-8">
          <p className="flex items-start gap-2 text-xs font-mono uppercase tracking-widest text-warning mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Notas médicas
          </p>
          <p className="text-bone whitespace-pre-wrap leading-relaxed">
            {student.notes}
          </p>
        </div>
      )}

      {/* Suscripción activa */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Suscripción activa
          </p>
          {activeSub && (
            <CreditControls
              studentId={student.id}
              subscriptionId={activeSub.id}
            />
          )}
        </div>

        {activeSub ? (
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-display text-2xl">{activeSub.plans.name}</p>
                <p className="text-sm text-bone-mute mt-1 font-mono uppercase tracking-wider">
                  <span className="text-lumen">
                    {activeSub.credits_remaining}/{activeSub.credits_total}
                  </span>{" "}
                  créditos · ciclo{" "}
                  {new Date(activeSub.cycle_start_at).toLocaleDateString(
                    "es-MX",
                    { day: "numeric", month: "short" },
                  )}{" "}
                  →{" "}
                  {new Date(activeSub.cycle_end_at).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 mb-6 text-center">
            <Calendar className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              Sin suscripción activa. Captura una abajo para que la alumna
              pueda reservar.
            </p>
          </div>
        )}
      </section>

      {/* Formulario de upsert sub */}
      <section className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-4">
          {activeSub ? "Reemplazar suscripción" : "Crear suscripción"}
        </p>
        <div className="glass rounded-2xl p-6">
          <SubscriptionForm
            studentId={student.id}
            plans={plans}
            defaults={defaults}
          />
        </div>
      </section>

      {/* Historial */}
      {allSubs.length > 0 && (
        <section>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-4">
            Historial · {allSubs.length}
          </p>
          <div className="space-y-2">
            {allSubs.map((s) => {
              const start = new Date(s.cycle_start_at).toLocaleDateString(
                "es-MX",
                { day: "numeric", month: "short", year: "numeric" },
              );
              const end = new Date(s.cycle_end_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-bone-border/30 bg-ink-off p-4 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="text-bone">{s.plans.name}</p>
                    <p className="text-xs text-bone-mute mt-0.5 font-mono uppercase tracking-wider">
                      {start} → {end}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs uppercase tracking-wider text-bone-mute">
                      {s.status}
                    </p>
                    <p className="text-xs text-bone-mute mt-0.5">
                      {s.credits_remaining}/{s.credits_total}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const map = {
    pending: {
      label: "Pendiente",
      icon: Clock,
      className: "bg-warning/15 text-warning",
    },
    approved: {
      label: "Aprobada",
      icon: CheckCircle2,
      className: "bg-success/15 text-success",
    },
    rejected: {
      label: "Rechazada",
      icon: XCircle,
      className: "bg-danger/15 text-danger",
    },
  } as const;
  const item = map[status];
  const Icon = item.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-full",
        item.className,
      )}
    >
      <Icon className="w-3 h-3" />
      {item.label}
    </span>
  );
}
