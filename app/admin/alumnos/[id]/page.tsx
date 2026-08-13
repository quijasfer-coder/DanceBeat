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
  FileText,
  ShieldCheck,
  ShieldOff,
  Users,
  Receipt,
} from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { formatMxn } from "@/lib/format";
import { SubscriptionForm } from "./subscription-form";
import { CreditControls } from "./credit-controls";
import { EnrollmentTypeSelect } from "./enrollment-type-select";
import { EnrollmentMethodEdit } from "./enrollment-method-edit";
import { FixedClassesSection } from "./fixed-classes-section";
import {
  AccountStatusActions,
  MarkEnrollmentPaidActions,
} from "./account-actions";
import { cn } from "@/lib/utils";

const PAYMENT_KIND_LABEL: Record<string, string> = {
  enrollment: "Inscripción",
  monthly: "Mensualidad",
  drop_in: "Clase suelta",
  late_fee: "Recargo",
  refund: "Reembolso",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  tpv: "TPV",
  stripe: "Stripe",
};

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

  // El PDF de la CURP vive en un bucket privado — hay que generar un
  // signed URL para poder mostrarlo (getPublicUrl no serviría, el bucket
  // no es público).
  let curpSignedUrl: string | null = null;
  if (student.curp_pdf_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("student-documents")
      .createSignedUrl(student.curp_pdf_path, 60 * 10);
    curpSignedUrl = signed?.signedUrl ?? null;
  }

  const [
    profileRes,
    plansRes,
    subsRes,
    enrollmentTypesRes,
    paymentsRes,
    settings,
    classesRes,
    stylesRes,
    studiosRes,
    fixedEnrollmentsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", student.account_id)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, name, code, credits_per_month, price_cents, is_active")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("subscriptions")
      .select("*, plans:plan_id (name, code, price_cents)")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollment_types")
      .select("id, name, price_cents, description")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("payments")
      .select("*")
      .eq("student_id", student.id)
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    getSettings(["late_fee_pct", "late_fee_day_of_month"] as const),
    supabase
      .from("classes")
      .select("id, style_id, studio_id, day_of_week, starts_at_time")
      .eq("is_active", true)
      .order("day_of_week"),
    supabase.from("styles").select("id, name"),
    supabase.from("studios").select("id, name"),
    supabase
      .from("class_enrollments")
      .select("id, class_id")
      .eq("student_id", student.id),
  ]);

  const dayLabelsShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const styleNameById = new Map(
    (stylesRes.data ?? []).map((s) => [s.id, s.name]),
  );
  const studioNameById = new Map(
    (studiosRes.data ?? []).map((s) => [s.id, s.name]),
  );
  const allClasses = (classesRes.data ?? []).map((c) => ({
    id: c.id,
    label: `${styleNameById.get(c.style_id) ?? "—"} · ${
      dayLabelsShort[c.day_of_week]
    } ${c.starts_at_time.slice(0, 5)} · ${studioNameById.get(c.studio_id) ?? "—"}`,
  }));
  const fixedClassIds = new Set(
    (fixedEnrollmentsRes.data ?? []).map((e) => e.class_id),
  );
  const fixedClasses = allClasses.filter((c) => fixedClassIds.has(c.id));
  const availableClassesToAssign = allClasses.filter(
    (c) => !fixedClassIds.has(c.id),
  );

  const profile = profileRes.data;
  const plans = (plansRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    credits_per_month: p.credits_per_month,
    price_cents: p.price_cents,
  }));
  const enrollmentTypes = enrollmentTypesRes.data ?? [];
  const enrollmentType =
    enrollmentTypes.find((t) => t.id === student.enrollment_type_id) ?? null;
  const payments = paymentsRes.data ?? [];

  const lateFeePct = parseFloat(settings.late_fee_pct ?? "0.10");
  const lateFeeDayOfMonth = parseInt(settings.late_fee_day_of_month ?? "10", 10);

  type SubRow = NonNullable<typeof subsRes.data>[number];
  const allSubs = (subsRes.data ?? []) as SubRow[];
  const activeSub = allSubs.find((s) => s.status === "active") ?? null;

  // ¿Ya se registró el pago de este ciclo? (ligado a la sub activa)
  const hasCurrentCyclePayment = activeSub
    ? payments.some(
        (p) =>
          p.subscription_id === activeSub.id &&
          p.kind === "monthly" &&
          p.status === "succeeded",
      )
    : false;
  const today = new Date();
  const isPastCutoff = today.getDate() > lateFeeDayOfMonth;
  const lateFeeApplies = isPastCutoff && !hasCurrentCyclePayment;
  const suggestedAmountCents = activeSub
    ? Math.round(activeSub.plans.price_cents * (lateFeeApplies ? 1 + lateFeePct : 1))
    : null;

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

      <div className="mb-10 flex items-center gap-5">
        <Avatar src={student.photo_url} name={student.full_name} size={72} />
        <div>
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
      </div>

      {/* Estado de la cuenta del titular (aprobación) */}
      {profile && (
        <section className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                Estado de la cuenta
              </p>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <StatusBadge status={profile.account_status} />
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

          {profile.account_status === "pending" && (
            <div className="border-t border-bone-border/30 pt-4 mt-4">
              <p className="text-xs text-bone-mute mb-3">
                Esta cuenta espera aprobación. Tras aprobar, ve abajo para
                asignarle un tipo de inscripción a la alumna y marcarla pagada.
              </p>
              <AccountStatusActions accountId={profile.id} />
            </div>
          )}
        </section>
      )}

      {/* Inscripción — por alumna */}
      <section className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
              Inscripción de {student.full_name}
            </p>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {student.enrolled_at ? (
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
          </div>
        </div>

        <div className="border-t border-bone-border/30 pt-4 mt-4 space-y-4">
          <div>
            <p className="text-xs text-bone-mute mb-2">Tipo de inscripción</p>
            <EnrollmentTypeSelect
              studentId={student.id}
              enrollmentTypes={enrollmentTypes}
              currentId={student.enrollment_type_id}
            />
            {enrollmentType?.description && (
              <p className="text-xs text-bone-mute mt-2 italic">
                {enrollmentType.description}
              </p>
            )}
          </div>

          {!student.enrolled_at && (
            <div>
              <p className="text-xs text-bone-mute mb-3">
                {enrollmentType ? (
                  <>
                    Cobro de inscripción pendiente:{" "}
                    <span className="text-bone font-mono">
                      {formatMxn(enrollmentType.price_cents)}
                    </span>
                    . El link de pago en línea estará disponible al integrar
                    Stripe.
                  </>
                ) : (
                  "Asigna un tipo de inscripción arriba antes de poder marcarla como pagada."
                )}
              </p>
              {enrollmentType && (
                <MarkEnrollmentPaidActions studentId={student.id} />
              )}
            </div>
          )}

          {student.enrolled_at && (
            <p className="text-xs text-bone-mute">
              Inscripción registrada el{" "}
              {new Date(student.enrolled_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · método: "}
              <EnrollmentMethodEdit
                studentId={student.id}
                currentMethod={student.enrollment_paid_method}
              />
              {enrollmentType && <> · {enrollmentType.name}</>}
            </p>
          )}
        </div>
      </section>

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

      {/* Familia, contacto de emergencia, CURP y consentimiento de fotos */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <p className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute mb-3">
            <Users className="w-3.5 h-3.5" />
            Familia y contacto de emergencia
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-bone-mute">Emergencia</span>
              <span className="text-bone text-right">
                {student.emergency_contact_name || "—"}
                {student.emergency_contact_phone && (
                  <span className="text-bone-mute">
                    {" "}
                    · {student.emergency_contact_phone}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-bone-mute">Mamá</span>
              <span className="text-bone text-right">
                {student.mother_name || "—"}
                {student.mother_phone && (
                  <span className="text-bone-mute"> · {student.mother_phone}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-bone-mute">Papá</span>
              <span className="text-bone text-right">
                {student.father_name || "—"}
                {student.father_phone && (
                  <span className="text-bone-mute"> · {student.father_phone}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-3">
            CURP y consentimiento
          </p>
          <div className="space-y-3 text-sm">
            {curpSignedUrl ? (
              <a
                href={curpSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-bone hover:text-lumen transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Ver PDF de la CURP
              </a>
            ) : (
              <p className="flex items-center gap-1.5 text-bone-mute">
                <FileText className="w-3.5 h-3.5" />
                Sin CURP subida
              </p>
            )}
            {student.photo_video_consent ? (
              <p className="flex items-center gap-1.5 text-success">
                <ShieldCheck className="w-3.5 h-3.5" />
                Autorizó fotos/video
                {student.photo_video_consent_at && (
                  <span className="text-bone-mute">
                    {" "}
                    ·{" "}
                    {new Date(student.photo_video_consent_at).toLocaleDateString(
                      "es-MX",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </span>
                )}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-bone-mute">
                <ShieldOff className="w-3.5 h-3.5" />
                No autorizó fotos/video
              </p>
            )}
          </div>
        </div>
      </div>

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
          <div className="glass rounded-2xl p-6 mb-4">
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
                <p className="text-xs mt-2">
                  {hasCurrentCyclePayment ? (
                    <span className="text-success">Pago de este ciclo registrado.</span>
                  ) : (
                    <span className="text-warning">Pago de este ciclo aún no registrado.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 mb-4 text-center">
            <Calendar className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              Sin suscripción activa. Renueva abajo para que la alumna pueda
              reservar.
            </p>
          </div>
        )}

        {lateFeeApplies && (
          <div className="border border-warning/30 bg-warning/5 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-bone">
              Ya pasó el día {lateFeeDayOfMonth} y no hay pago registrado de
              este ciclo — aplica un recargo del {Math.round(lateFeePct * 100)}%.
              {activeSub && (
                <>
                  {" "}
                  Monto sugerido con recargo:{" "}
                  <span className="font-mono text-warning">
                    {formatMxn(suggestedAmountCents ?? 0)}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        )}
      </section>

      {/* Clases fijas */}
      <section className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
          Clases fijas
        </p>
        <p className="text-xs text-bone-mute mb-4">
          Se reservan solas cada semana y consumen crédito — no se pueden
          cancelar desde el portal.
        </p>
        <div className="glass rounded-2xl p-6">
          <FixedClassesSection
            studentId={student.id}
            fixedClasses={fixedClasses}
            availableClasses={availableClassesToAssign}
          />
        </div>
      </section>

      {/* Formulario de renovar + cobrar */}
      <section className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-4">
          {activeSub ? "Renovar suscripción" : "Crear suscripción"}
        </p>
        <div className="glass rounded-2xl p-6">
          <SubscriptionForm
            studentId={student.id}
            plans={plans}
            defaults={defaults}
            suggestedAmountCents={suggestedAmountCents}
            lateFeeApplies={lateFeeApplies}
          />
        </div>
      </section>

      {/* Historial de pagos */}
      <section className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-4">
          Historial de pagos · {payments.length}
        </p>
        {payments.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Receipt className="w-6 h-6 text-bone-mute mx-auto mb-3" />
            <p className="text-sm text-bone-mute">
              Sin pagos registrados todavía.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-bone-border/30 bg-ink-off p-4 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <p className="text-bone">
                    {PAYMENT_KIND_LABEL[p.kind] ?? p.kind}
                  </p>
                  <p className="text-xs text-bone-mute mt-0.5 font-mono uppercase tracking-wider">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Sin fecha de pago"}
                    {p.method && (
                      <> · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-bone">
                    {formatMxn(p.amount_cents)}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider mt-0.5",
                      p.status === "succeeded"
                        ? "text-success"
                        : p.status === "failed"
                          ? "text-danger"
                          : "text-bone-mute",
                    )}
                  >
                    {p.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
