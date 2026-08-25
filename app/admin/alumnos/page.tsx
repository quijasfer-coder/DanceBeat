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
  X,
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
  edadMin?: string;
  edadMax?: string;
  plantel?: string;
  clase?: string;
  grupo?: string;
  inscripcion?: string;
  plan?: string;
}>;

const SORT_KEYS: SortKey[] = ["name", "age", "school", "enrollment", "plan"];

const GROUP_TOKENS: { key: string; label: string; match: RegExp }[] = [
  { key: "baby", label: "Baby", match: /baby/i },
  { key: "pixies", label: "Pixies (1°-2°)", match: /pixies/i },
  { key: "orbit", label: "Orbit (3°-4°)", match: /orbit/i },
  { key: "nova", label: "Nova (5°-6°)", match: /nova/i },
  { key: "icon", label: "Icon / Prepa", match: /icon/i },
  { key: "adults", label: "Adults", match: /adults?/i },
];

function deriveGroupKeys(styleNames: string[]): Set<string> {
  const keys = new Set<string>();
  for (const name of styleNames) {
    const token = GROUP_TOKENS.find((t) => t.match.test(name));
    keys.add(token ? token.key : "otro");
  }
  return keys;
}

export default async function AdminAlumnosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    q,
    ver,
    sort,
    dir,
    edadMin,
    edadMax,
    plantel,
    clase,
    grupo,
    inscripcion,
    plan,
  } = await searchParams;

  const showInactive = ver === "inactivos";
  const sortKey: SortKey | null = SORT_KEYS.includes(sort as SortKey)
    ? (sort as SortKey)
    : null;
  const sortDir: SortDir = dir === "asc" ? "asc" : "desc";
  const edadMinNum = edadMin ? parseInt(edadMin, 10) : null;
  const edadMaxNum = edadMax ? parseInt(edadMax, 10) : null;

  const supabase = await createClient();

  const [
    studentsRes,
    profilesRes,
    enrollmentTypesRes,
    subscriptionsRes,
    plansRes,
    studiosRes,
    stylesRes,
    classesRes,
    classEnrollmentsRes,
  ] = await Promise.all([
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
    supabase.from("studios").select("id, name"),
    supabase.from("styles").select("id, name"),
    supabase.from("classes").select("id, style_id, studio_id"),
    supabase.from("class_enrollments").select("student_id, class_id"),
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
  const studioNameMap = new Map(
    (studiosRes.data ?? []).map((s) => [s.id, s.name]),
  );
  const styleNameMap = new Map((stylesRes.data ?? []).map((s) => [s.id, s.name]));
  const classInfoMap = new Map(
    (classesRes.data ?? []).map((c) => [
      c.id,
      { styleId: c.style_id, studioId: c.studio_id },
    ]),
  );

  // Clases fijas por alumna, resueltas a nombre de estilo + plantel
  const enrolledClassesByStudent = new Map<
    string,
    { styleId: string; styleName: string; studioId: string; studioName: string }[]
  >();
  for (const ce of classEnrollmentsRes.data ?? []) {
    const info = classInfoMap.get(ce.class_id);
    if (!info) continue;
    const entry = {
      styleId: info.styleId,
      styleName: styleNameMap.get(info.styleId) ?? "—",
      studioId: info.studioId,
      studioName: studioNameMap.get(info.studioId) ?? "—",
    };
    const list = enrolledClassesByStudent.get(ce.student_id) ?? [];
    list.push(entry);
    enrolledClassesByStudent.set(ce.student_id, list);
  }

  // Opciones de los selects, derivadas de las clases que sí existen
  const claseOptions = Array.from(styleNameMap.entries())
    .filter(([styleId]) =>
      (classesRes.data ?? []).some((c) => c.style_id === styleId),
    )
    .sort((a, b) => a[1].localeCompare(b[1], "es"));
  const plantelOptions = Array.from(studioNameMap.entries()).sort((a, b) =>
    a[1].localeCompare(b[1], "es"),
  );

  const activeStudents = allStudents.filter((s) => s.is_active !== false);
  const inactiveStudents = allStudents.filter((s) => s.is_active === false);

  const baseList = showInactive ? inactiveStudents : activeStudents;

  const searched = q
    ? baseList.filter((s) =>
        s.full_name.toLowerCase().includes(q.toLowerCase()),
      )
    : baseList;

  // Enriquecer cada alumna con lo que necesitamos para mostrar/ordenar/filtrar
  const enriched = searched.map((s) => {
    const activeSub = activeSubMap.get(s.id);
    const planName = activeSub ? planMap.get(activeSub.plan_id) ?? null : null;
    const enrollmentTypeName = s.enrollment_type_id
      ? enrollmentTypeMap.get(s.enrollment_type_id) ?? null
      : null;
    const enrolledClasses = enrolledClassesByStudent.get(s.id) ?? [];
    const groupKeys = deriveGroupKeys(enrolledClasses.map((c) => c.styleName));
    return {
      student: s,
      profile: profileMap.get(s.account_id) ?? null,
      age: calcAge(s.birthdate),
      enrollmentTypeName,
      activeSub: activeSub ?? null,
      planName,
      enrolledClasses,
      groupKeys,
    };
  });

  // Filtros
  const filtered = enriched.filter((it) => {
    if (edadMinNum !== null && !isNaN(edadMinNum) && it.age < edadMinNum)
      return false;
    if (edadMaxNum !== null && !isNaN(edadMaxNum) && it.age > edadMaxNum)
      return false;
    if (plantel && !it.enrolledClasses.some((c) => c.studioId === plantel))
      return false;
    if (clase && !it.enrolledClasses.some((c) => c.styleId === clase))
      return false;
    if (grupo && !it.groupKeys.has(grupo)) return false;
    if (inscripcion === "pagada" && !it.student.enrolled_at) return false;
    if (inscripcion === "pendiente" && it.student.enrolled_at) return false;
    if (plan === "activo" && !it.activeSub) return false;
    if (plan === "sin_plan" && it.activeSub) return false;
    return true;
  });

  const students = sortKey
    ? [...filtered].sort(comparatorFor(sortKey))
    : filtered;
  if (sortKey && sortDir === "desc") students.reverse();

  const activeFilterCount = [
    edadMin,
    edadMax,
    plantel,
    clase,
    grupo,
    inscripcion,
    plan,
  ].filter(Boolean).length;

  const baseHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showInactive) params.set("ver", "inactivos");
    if (sortKey) params.set("sort", sortKey);
    if (sortKey) params.set("dir", sortDir);
    if (edadMin) params.set("edadMin", edadMin);
    if (edadMax) params.set("edadMax", edadMax);
    if (plantel) params.set("plantel", plantel);
    if (clase) params.set("clase", clase);
    if (grupo) params.set("grupo", grupo);
    if (inscripcion) params.set("inscripcion", inscripcion);
    if (plan) params.set("plan", plan);
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

  const clearFiltersHref = baseHref({
    edadMin: undefined,
    edadMax: undefined,
    plantel: undefined,
    clase: undefined,
    grupo: undefined,
    inscripcion: undefined,
    plan: undefined,
  });

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Personas
        </p>
        <h1 className="font-display text-5xl mt-2">Alumnos</h1>
        <p className="text-sm text-bone-mute mt-3">
          {activeStudents.length} alumno{activeStudents.length === 1 ? "" : "s"} activo{activeStudents.length === 1 ? "" : "s"}
          {inactiveStudents.length > 0 && ` · ${inactiveStudents.length} dado${inactiveStudents.length === 1 ? "" : "s"} de baja`}
          {activeFilterCount > 0 && ` · ${students.length} con los filtros actuales`}.
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

      {/* Búsqueda + filtros */}
      <form className="mb-4 space-y-3">
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

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-1.5">
              Edad
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                name="edadMin"
                defaultValue={edadMin ?? ""}
                placeholder="Mín"
                min={0}
                max={99}
                className="w-16 bg-ink-surface border border-bone-border/40 rounded-lg px-2 py-2 text-sm text-bone focus:border-lumen focus:outline-none"
              />
              <span className="text-bone-mute text-xs">–</span>
              <input
                type="number"
                name="edadMax"
                defaultValue={edadMax ?? ""}
                placeholder="Máx"
                min={0}
                max={99}
                className="w-16 bg-ink-surface border border-bone-border/40 rounded-lg px-2 py-2 text-sm text-bone focus:border-lumen focus:outline-none"
              />
            </div>
          </div>

          <FilterSelect
            name="grupo"
            label="Grupo"
            defaultValue={grupo ?? ""}
            options={GROUP_TOKENS.map((t) => ({ value: t.key, label: t.label }))}
          />

          <FilterSelect
            name="plantel"
            label="Plantel"
            defaultValue={plantel ?? ""}
            options={plantelOptions.map(([id, name]) => ({ value: id, label: name }))}
          />

          <FilterSelect
            name="clase"
            label="Clase / Estilo"
            defaultValue={clase ?? ""}
            options={claseOptions.map(([id, name]) => ({ value: id, label: name }))}
          />

          <FilterSelect
            name="inscripcion"
            label="Inscripción"
            defaultValue={inscripcion ?? ""}
            options={[
              { value: "pagada", label: "Pagada" },
              { value: "pendiente", label: "Pendiente" },
            ]}
          />

          <FilterSelect
            name="plan"
            label="Plan"
            defaultValue={plan ?? ""}
            options={[
              { value: "activo", label: "Con plan activo" },
              { value: "sin_plan", label: "Sin plan" },
            ]}
          />

          <button
            type="submit"
            className="bg-bone text-ink px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider hover:bg-lumen transition-colors"
          >
            Filtrar
          </button>

          {(activeFilterCount > 0 || q) && (
            <Link
              href={showInactive ? "/admin/alumnos?ver=inactivos" : "/admin/alumnos"}
              className="inline-flex items-center gap-1 text-xs text-bone-mute hover:text-bone transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </Link>
          )}
        </div>
      </form>

      {students.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center mt-10">
          <User className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            {q || activeFilterCount > 0
              ? "Ningún alumno coincide con la búsqueda/filtros actuales."
              : "Aún no hay alumnos registrados. Aparecerán aquí cuando completen el onboarding."}
          </p>
          {(q || activeFilterCount > 0) && (
            <Link
              href={clearFiltersHref}
              className="inline-block mt-3 text-xs text-lumen hover:underline"
            >
              Limpiar filtros
            </Link>
          )}
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
                  <Th>Clases fijas</Th>
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
                  ({
                    student: s,
                    profile,
                    age,
                    enrollmentTypeName,
                    activeSub,
                    planName,
                    enrolledClasses,
                  }) => (
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
                      <td className="px-6 py-4 text-xs max-w-[220px]">
                        {enrolledClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {enrolledClasses.map((c, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 rounded-full bg-ink-off border border-bone-border/40 text-bone-mute"
                                title={c.studioName}
                              >
                                {c.styleName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-bone-mute/50">—</span>
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

function FilterSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-1.5">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone focus:border-lumen focus:outline-none max-w-[180px]"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
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
