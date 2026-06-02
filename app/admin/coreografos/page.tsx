import { CheckCircle2, UserCog, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { CreateTeacherForm } from "./create-form";
import { LinkProfileForm } from "./link-form";
import { ToggleActive } from "./toggle-active";

export const metadata = {
  title: "Admin · Coreógrafos",
  robots: { index: false },
};

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type SearchParams = Promise<{ saved?: string }>;

export default async function AdminCoreografosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();

  const [teachersRes, profilesRes, classesRes, stylesRes] = await Promise.all([
    supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, full_name, role"),
    supabase
      .from("classes")
      .select("id, teacher_id, style_id, day_of_week, starts_at_time"),
    supabase.from("styles").select("id, name"),
  ]);

  const teachers = teachersRes.data ?? [];
  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );
  const styleMap = new Map((stylesRes.data ?? []).map((s) => [s.id, s]));
  const classesByTeacher = new Map<string, typeof classesRes.data>();
  for (const c of classesRes.data ?? []) {
    if (!c.teacher_id) continue;
    const arr = classesByTeacher.get(c.teacher_id) ?? [];
    arr.push(c);
    classesByTeacher.set(c.teacher_id, arr);
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Personas
        </p>
        <h1 className="font-display text-5xl mt-2">Coreógrafos</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-2xl">
          Quienes imparten las clases. Al darlos de alta aquí — y vincularlos
          al email con el que se registraron — pueden entrar a{" "}
          <strong className="text-bone">/profesor</strong> para ver sus clases
          asignadas y tomar lista.
        </p>
      </div>

      {saved === "1" && (
        <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm text-bone">Coreógrafo guardado.</p>
        </div>
      )}

      {/* Form de alta */}
      <div className="mb-12 rounded-2xl border border-bone-border/30 bg-ink-surface p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-4">
          Agregar coreógrafo
        </p>
        <CreateTeacherForm />
      </div>

      {/* Listado */}
      {teachers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <UserCog className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            Aún no hay coreógrafos. Da de alta al primero arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
            {teachers.length} coreógrafo{teachers.length === 1 ? "" : "s"}
          </p>

          {teachers.map((t) => {
            const profile = t.profile_id ? profileMap.get(t.profile_id) : null;
            const assigned = classesByTeacher.get(t.id) ?? [];

            return (
              <div
                key={t.id}
                className={cn(
                  "rounded-2xl border p-6 transition-colors",
                  t.is_active
                    ? "border-bone-border/30 bg-ink-off"
                    : "border-bone-border/20 bg-ink-off/40 opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-2xl text-bone">
                      {t.full_name}
                    </p>

                    {profile ? (
                      <p className="text-xs text-bone-mute mt-1.5 font-mono">
                        Vinculado a {profile.email} · rol{" "}
                        <span className="text-lumen">{profile.role}</span>
                      </p>
                    ) : (
                      <div className="mt-2 flex items-start gap-2 text-xs text-warning">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          Sin cuenta de usuario vinculada. Aún no puede iniciar
                          sesión.
                        </span>
                      </div>
                    )}

                    {t.bio_internal && (
                      <p className="text-xs text-bone-mute mt-3 leading-relaxed">
                        {t.bio_internal}
                      </p>
                    )}

                    <div className="mt-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
                        Clases asignadas ({assigned.length})
                      </p>
                      {assigned.length === 0 ? (
                        <p className="text-xs text-bone-mute/70">
                          Ninguna por ahora. Asígnale una desde{" "}
                          <strong className="text-bone-mute">/admin/clases</strong>.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {assigned.map((c) => (
                            <li
                              key={c.id}
                              className="text-xs text-bone flex items-center gap-2"
                            >
                              <span className="font-mono uppercase tracking-wider text-bone-mute">
                                {dayLabels[c.day_of_week]} ·{" "}
                                {c.starts_at_time.slice(0, 5)}
                              </span>
                              <span>{styleMap.get(c.style_id)?.name ?? "—"}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-3">
                    <ToggleActive teacherId={t.id} active={t.is_active} />
                  </div>
                </div>

                {!profile && (
                  <div className="mt-5 pt-5 border-t border-bone-border/20">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
                      Vincular a una cuenta existente
                    </p>
                    <LinkProfileForm teacherId={t.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
