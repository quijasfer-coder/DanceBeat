import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  AlertTriangle,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Avatar } from "@/components/avatar";

export const metadata = {
  title: "Admin · Detalle de coreógrafo",
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

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCoreografoDetailPage({ params }: PageProps) {
  await requireAdmin("/admin/coreografos");
  const { id } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!teacher) notFound();

  const [profileRes, classesRes, stylesRes, studiosRes] = await Promise.all([
    teacher.profile_id
      ? supabase
          .from("profiles")
          .select("email, phone, full_name")
          .eq("id", teacher.profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", id)
      .order("day_of_week", { ascending: true })
      .order("starts_at_time", { ascending: true }),
    supabase.from("styles").select("id, name"),
    supabase.from("studios").select("id, name"),
  ]);

  const profile = profileRes.data;
  const classes = classesRes.data ?? [];
  const styleMap = new Map((stylesRes.data ?? []).map((s) => [s.id, s.name]));
  const studioMap = new Map((studiosRes.data ?? []).map((s) => [s.id, s.name]));
  const classIds = classes.map((c) => c.id);

  const { data: enrollments } = classIds.length
    ? await supabase
        .from("class_enrollments")
        .select("student_id, class_id")
        .in("class_id", classIds)
    : { data: [] };

  const studentIdsByClass = new Map<string, string[]>();
  const allStudentIds = new Set<string>();
  for (const e of enrollments ?? []) {
    const arr = studentIdsByClass.get(e.class_id) ?? [];
    arr.push(e.student_id);
    studentIdsByClass.set(e.class_id, arr);
    allStudentIds.add(e.student_id);
  }

  const studentIdList = Array.from(allStudentIds);

  const [studentsRes, subsRes, plansRes, studentProfilesRes] = await Promise.all([
    studentIdList.length
      ? supabase.from("students").select("*").in("id", studentIdList)
      : Promise.resolve({ data: [] }),
    studentIdList.length
      ? supabase
          .from("subscriptions")
          .select("student_id, plan_id")
          .eq("status", "active")
          .in("student_id", studentIdList)
      : Promise.resolve({ data: [] }),
    supabase.from("plans").select("id, name"),
    studentIdList.length
      ? supabase.from("profiles").select("id, email, phone")
      : Promise.resolve({ data: [] }),
  ]);

  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.id, s]));
  const planMap = new Map((plansRes.data ?? []).map((p) => [p.id, p.name]));
  const activeSubMap = new Map(
    (subsRes.data ?? []).map((s) => [s.student_id, planMap.get(s.plan_id) ?? "Activo"]),
  );
  const studentProfileMap = new Map(
    (studentProfilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const totalAlumnas = allStudentIds.size;
  const sinPlanCount = studentIdList.filter((sid) => !activeSubMap.has(sid)).length;
  const activeClassesCount = classes.filter((c) => c.is_active).length;

  return (
    <div className="p-10 max-w-6xl">
      <Link
        href="/admin/coreografos"
        className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Coreógrafos
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start gap-5">
        <Avatar src={teacher.photo_url} name={teacher.full_name} size={64} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Coreógrafo
          </p>
          <h1 className="font-display text-5xl mt-1">{teacher.full_name}</h1>

          {profile ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-bone-mute">
              {profile.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {profile.phone}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-xs text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              Sin cuenta de usuario vinculada.
            </p>
          )}

          {teacher.bio_internal && (
            <p className="text-sm text-bone-mute mt-4 max-w-2xl leading-relaxed">
              {teacher.bio_internal}
            </p>
          )}

          {!teacher.is_active && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-warning mt-3">
              Coreógrafo inactivo
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10 max-w-xl">
        <Stat label="Clases activas" value={activeClassesCount} />
        <Stat label="Alumnas" value={totalAlumnas} />
        <Stat label="Sin plan activo" value={sinPlanCount} accent={sinPlanCount > 0 ? "warning" : undefined} />
      </div>

      {/* Clases + roster */}
      {classes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            Este coreógrafo no tiene clases asignadas todavía. Asígnale una
            desde <strong className="text-bone-mute">/admin/clases</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {classes.map((c) => {
            const roster = (studentIdsByClass.get(c.id) ?? [])
              .map((sid) => studentMap.get(sid))
              .filter((s): s is NonNullable<typeof s> => !!s)
              .sort((a, b) => a.full_name.localeCompare(b.full_name, "es"));

            return (
              <section
                key={c.id}
                className="rounded-2xl border border-bone-border/30 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 bg-ink-off px-6 py-4">
                  <div>
                    <p className="font-display text-xl text-bone">
                      {styleMap.get(c.style_id) ?? "—"}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-1">
                      {dayLabels[c.day_of_week]} · {c.starts_at_time.slice(0, 5)} ·{" "}
                      {studioMap.get(c.studio_id) ?? "—"} · {roster.length}/{c.capacity}
                      {!c.is_active && " · pausada"}
                    </p>
                  </div>
                  <Link
                    href={`/profesor/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-lumen hover:underline shrink-0"
                  >
                    Sesiones y pase de lista
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {roster.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-6 h-6 text-bone-mute mx-auto mb-3" />
                    <p className="text-sm text-bone-mute">
                      Ninguna alumna tiene esta clase como fija todavía.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-t border-bone-border/20">
                          <Th>Alumna</Th>
                          <Th>Edad</Th>
                          <Th>Plan</Th>
                          <Th>Contacto</Th>
                          <Th>Escuela / Grado</Th>
                          <Th>Notas médicas</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((s) => {
                          const sProfile = studentProfileMap.get(s.account_id);
                          const planName = activeSubMap.get(s.id);
                          return (
                            <tr
                              key={s.id}
                              className="border-t border-bone-border/20 hover:bg-ink-off/50 transition-colors"
                            >
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar src={s.photo_url} name={s.full_name} size={32} />
                                  <Link
                                    href={`/admin/alumnos/${s.id}`}
                                    className="text-sm text-bone hover:text-lumen transition-colors"
                                  >
                                    {s.full_name}
                                  </Link>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-sm font-mono">
                                {calcAge(s.birthdate)} años
                              </td>
                              <td className="px-6 py-3.5 text-xs">
                                {planName ? (
                                  <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {planName}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                                    <Clock className="w-3 h-3" />
                                    Sin plan
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-bone-mute">
                                {sProfile?.email && <p>{sProfile.email}</p>}
                                {(s.phone || sProfile?.phone) && (
                                  <p className="mt-0.5">{s.phone || sProfile?.phone}</p>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-sm text-bone-mute">
                                {s.school || s.grade ? (
                                  <>
                                    {s.school && <p>{s.school}</p>}
                                    {s.grade && <p className="text-xs mt-0.5">{s.grade}</p>}
                                  </>
                                ) : (
                                  <span className="text-bone-mute/50">—</span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs max-w-xs">
                                {s.notes ? (
                                  <div className="flex items-start gap-1.5 text-warning">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                    <p className="leading-relaxed text-bone whitespace-pre-wrap">
                                      {s.notes}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-bone-mute/50">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-bone-mute whitespace-nowrap">
      {children}
    </th>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "warning";
}) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <p
        className={`font-display text-4xl ${accent === "warning" ? "text-warning" : "text-bone"}`}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mt-2">
        {label}
      </p>
    </div>
  );
}
