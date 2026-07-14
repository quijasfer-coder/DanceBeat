import Link from "next/link";
import { Search, User, Phone, Mail, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeactivateStudent } from "@/components/admin/deactivate-student";

export const metadata = {
  title: "Admin · Alumnos",
  robots: { index: false },
};

type SearchParams = Promise<{ q?: string; ver?: string }>;

export default async function AdminAlumnosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, ver } = await searchParams;
  const showInactive = ver === "inactivos";
  const supabase = await createClient();

  // Fetch students y profiles por separado para evitar embed type issues
  const [studentsRes, profilesRes] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, phone, full_name"),
  ]);

  const allStudents = studentsRes.data ?? [];
  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const activeStudents = allStudents.filter((s) => s.is_active !== false);
  const inactiveStudents = allStudents.filter((s) => s.is_active === false);

  const baseList = showInactive ? inactiveStudents : activeStudents;

  const students = q
    ? baseList.filter((s) =>
        s.full_name.toLowerCase().includes(q.toLowerCase()),
      )
    : baseList;

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
          href="/admin/alumnos"
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
            href="/admin/alumnos?ver=inactivos"
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
          <table className="w-full">
            <thead className="bg-ink-off">
              <tr className="text-left">
                <Th>Alumno</Th>
                <Th>Edad</Th>
                <Th>Escuela / Grado</Th>
                <Th>Titular de la cuenta</Th>
                <Th>Contacto</Th>
                <Th>Notas médicas</Th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const profile = profileMap.get(s.account_id);
                const age = calcAge(s.birthdate);
                return (
                  <tr
                    key={s.id}
                    className="border-t border-bone-border/30 hover:bg-ink-off/50 transition-colors"
                  >
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono">{age} años</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
      {children}
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
