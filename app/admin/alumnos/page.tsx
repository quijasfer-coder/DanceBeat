import Link from "next/link";
import {
  Search,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeactivateStudent } from "@/components/admin/deactivate-student";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin · Alumnos",
  robots: { index: false },
};

type SortKey = "name" | "age" | "school" | "enrollment" | "plan";
type SortDir = "asc" | "desc";

type SearchParams = Promise<{
  q?: string;
  ver?: string;
  sort?: string;
  dir?: string;
}>;

const SORT_KEYS: SortKey[] = ["name", "age", "school", "enrollment", "plan"];

export default async function AdminAlumnosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, ver, sort, dir } = await searchParams;
  const showInactive = ver === "inactivos";
  const sortKey: SortKey | null = SORT_KEYS.includes(sort as SortKey)
    ? (sort as SortKey)
    : null;
  const sortDir: SortDir = dir === "asc" ? "asc" : "desc";

  const supabase = await createClient();

  const [studentsRes, profilesRes, enrollmentTypesRes, subscriptionsRes, plansRes] =
    await Promise.all([
      supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, phone, full_name"),
      supabase.from("enrollment_types").select("id, name"),
      supabase
        .from("subscriptions")
        .select("student_id, plan_id, credits_remaining, credits_total")
        .eq("status", "active"),
      supabase.from("plans").select("id, name"),
    ]);

  const allStudents = studentsRes.data ?? [];
  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const enrollmentTypeMap = new Map(
    (enrollmentTypesRes.data ?? []).map((e) => [e.id, e.name]),
  );
  const planMap = new Map((plansRes.data ?? []).map((p) => [p.id, p.name]));
  const activeSubMap = new Map(
    (subscriptionsRes.data ?? []).map((s) => [s.student_id, s]),
  );

  const activeStudents = allStudents.filter((s) => s.is_active !== false);
  const inactiveStudents = allStudents.filter((s) => s.is_active === false);

  const baseList = showInactive ? inactiveStudents : activeStudents;

  const filtered = q
    ? baseList.filter((s) =>
        s.full_name.toLowerCase().includes(q.toLowerCase()),
      )
    : baseList;

  // Enriquecer cada alumna con lo que necesitamos para mostrar/ordenar
  const enriched = filtered.map((s) => {
    const activeSub = activeSubMap.get(s.id);
    const planName = activeSub ? planMap.get(activeSub.plan_id) ?? null : null;
    const enrollmentTypeName = s.enrollment_type_id
      ? enrollmentTypeMap.get(s.enrollment_type_id) ?? null
      : null;
    return {
      student: s,
      profile: profileMap.get(s.account_id) ?? null,
      age: calcAge(s.birthdate),
      enrollmentTypeName,
      activeSub: activeSub ?? null,
      planName,
    };
  });

  const students = sortKey ? [...enriched].sort(comparatorFor(sortKey)) : enriched;
  if (sortKey && sortDir === "desc") students.reverse();

  const baseHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showInactive) params.set("ver", "inactivos");
    if (sortKey) params.set("sort", sortKey);
    if (sortKey) params.set("dir", sortDir);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/alumnos?${qs}` : "/admin/alumnos";
  };

  const sortHref = (key: SortKey) => {
    const nextDir: SortDir =
      sortKey === key && sortDir === "asc" ? "desc" : "asc";
    return baseHref({ sort: key, dir: nextDir });
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Personas
        </p>
        <h1 className="font-display text-5xl mt-2">Alumnos</h1>
        <p className="text-sm text-bone-mute mt-3">
          {activeStudents.length} alumno{activeStudents.length === 1 ? "" : "s"} activo{activeStudents.length === 1 ? "" : "s"}
          {inactiveStudents.length > 0 && ` · ${inactiveStudents.length} dado${inactiveStudents.length === 1 ? "" : "s"} de baja`}.
        </p>
      </div>

      {/* Tabs activos / inactivos */}
      <div className="flex items-center gap-1 mb-6">
        <Link
          href={baseHref({ ver: undefined })}
          className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
            !showInactive
              ? "bg-bone text-ink"
              : "text-bone-mute hover:text-bone"
          }`}
        >
          Activos ({activeStudents.length})
        </Link>
        {inactiveStudents.length > 0 && (
          <Link
            href={baseHref({ ver: "inactivos" })}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
              showInactive
                ? "bg-bone text-ink"
                : "text-bone-mute hover:text-bone"
            }`}
          >
            Inactivos ({inactiveStudents.length})
          </Link>
        )}
      </div>

      {/* Search */}
      <form className="mb-6">
        {showInactive && <input type="hidden" name="ver" value="inactivos" />}
        {sortKey && <input type="hidden" name="sort" value={sortKey} />}
        {sortKey && <input type="hidden" name="dir" value={sortDir} />}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-mute" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre..."
            className="w-full bg-ink-surface border border-bone-border/40 rounded-full pl-10 pr-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
          />
        </div>
      </form>

      {students.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center mt-10">
          <User className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            {q
              ? `No hay alumnos que coincidan con "${q}".`
              : "Aún no hay alumnos registrados. Aparecerán aquí cuando completen el onboarding."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bone-border/30">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-off">
                <tr className="text-left">
                  <SortTh sortKey="name" current={sortKey} dir={sortDir} href={sortHref("name")}>
                    Alumno
                  </SortTh>
                  <SortTh sortKey="age" current={sortKey} dir={sortDir} href={sortHref("age")}>
                    Edad
                  </SortTh>
                  <SortTh
                    sortKey="enrollment"
                    current={sortKey}
                    dir={sortDir}
                    href={sortHref("enrollment")}
                  >
                    Inscripción
                  </SortTh>
                  <SortTh sortKey="plan" current={sortKey} dir={sortDir} href={sortHref("plan")}>
                    Plan
                  </SortTh>
                  <SortTh
                    sortKey="school"
                    current={sortKey}
                    dir={sortDir}
                    href={sortHref("school")}
                  >
                    Escuela / Grado
                  </SortTh>
                  <Th>Titular de la cuenta</Th>
                  <Th>Contacto</Th>
                  <Th>Notas médicas</Th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {students.map(
                  ({ student: s, profile, age, enrollmentTypeName, activeSub, planName }) => (
                    <tr
                      key={s.id}
                      className="border-t border-bone-border/30 hover:bg-ink-off/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={s.photo_url} name={s.full_name} size={36} />
                          <div>
                            <Link
                              href={`/admin/alumnos/${s.id}`}
                              className="font-display text-base text-bone hover:text-lumen transition-colors"
                            >
                              {s.full_name}
                            </Link>
                            {s.is_self && (
                              <p className="font-mono text-[10px] uppercase tracking-wider text-lumen mt-1">
                                es el titular
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-mono">{age} años</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {s.enrolled_at ? (
                          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success">
                            <CheckCircle2 className="w-3 h-3" />
                            {enrollmentTypeName ?? "Pagada"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {activeSub ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success">
                              <CheckCircle2 className="w-3 h-3" />
                              {planName ?? "Activo"}
                            </span>
                            <p className="text-bone-mute mt-1.5">
                              {activeSub.credits_remaining}/{activeSub.credits_total} créditos
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                            <Clock className="w-3 h-3" />
                            Sin plan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-bone-mute">
                        {s.school || s.grade ? (
                          <>
                            {s.school && <p>{s.school}</p>}
                            {s.grade && (
                              <p className="text-xs mt-0.5">{s.grade}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-bone-mute/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {profile ? (
                          <p className="text-bone">{profile.full_name}</p>
                        ) : (
                          <span className="text-bone-mute/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {profile?.email && (
                          <p className="flex items-center gap-1.5 text-bone-mute">
                            <Mail className="w-3 h-3" />
                            {profile.email}
                          </p>
                        )}
                        {(s.phone || profile?.phone) && (
                          <p className="flex items-center gap-1.5 text-bone-mute mt-1">
                            <Phone className="w-3 h-3" />
                            {s.phone || profile?.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs">
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
                      <td className="px-6 py-4 text-right">
                        <DeactivateStudent
                          studentId={s.id}
                          studentName={s.full_name}
                          isActive={s.is_active !== false}
                        />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute whitespace-nowrap">
      {children}
    </th>
  );
}

function SortTh({
  children,
  sortKey,
  current,
  dir,
  href,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  current: SortKey | null;
  dir: SortDir;
  href: string;
}) {
  const isActive = current === sortKey;
  return (
    <th className="px-6 py-4 whitespace-nowrap">
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
          isActive ? "text-lumen" : "text-bone-mute hover:text-bone",
        )}
      >
        {children}
        {isActive ? (
          dir === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </Link>
    </th>
  );
}

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

type EnrichedStudent = {
  student: { full_name: string; school: string | null; enrolled_at: string | null };
  age: number;
  enrollmentTypeName: string | null;
  activeSub: { credits_remaining: number; credits_total: number } | null;
  planName: string | null;
};

function comparatorFor(key: SortKey) {
  return (a: EnrichedStudent, b: EnrichedStudent): number => {
    switch (key) {
      case "name":
        return a.student.full_name.localeCompare(b.student.full_name, "es");
      case "age":
        return a.age - b.age;
      case "school":
        return (a.student.school ?? "").localeCompare(
          b.student.school ?? "",
          "es",
        );
      case "enrollment": {
        const aVal = a.student.enrolled_at
          ? `1_${a.enrollmentTypeName ?? ""}`
          : "0";
        const bVal = b.student.enrolled_at
          ? `1_${b.enrollmentTypeName ?? ""}`
          : "0";
        return aVal.localeCompare(bVal, "es");
      }
      case "plan": {
        const aVal = a.activeSub ? `1_${a.planName ?? ""}` : "0";
        const bVal = b.activeSub ? `1_${b.planName ?? ""}` : "0";
        return aVal.localeCompare(bVal, "es");
      }
    }
  };
}
