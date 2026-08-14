import Link from "next/link";
import { CheckCircle2, Edit3, Plus, List, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ToggleClassActive } from "@/components/admin/toggle-class-active";
import { ToggleClassPublic } from "@/components/admin/toggle-class-public";

export const metadata = {
  title: "Admin · Clases",
  robots: { index: false },
};

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dayLabelsFull = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
// Semana empieza en lunes, domingo al final.
const weekOrder = [1, 2, 3, 4, 5, 6, 0];
const formatTime = (t: string) => t.slice(0, 5);

type SearchParams = Promise<{
  saved?: string;
  deleted?: string;
  vista?: string;
}>;

export default async function AdminClasesListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { saved, deleted, vista } = await searchParams;
  const view = vista === "semana" ? "semana" : "tabla";
  const supabase = await createClient();

  // Queries separadas para evitar problemas de inferencia con embeds
  const [classesRes, stylesRes, studiosRes] = await Promise.all([
    supabase
      .from("classes")
      .select("*")
      .order("day_of_week", { ascending: true })
      .order("starts_at_time", { ascending: true }),
    supabase.from("styles").select("id, name, slug"),
    supabase.from("studios").select("id, name"),
  ]);

  const classes = classesRes.data ?? [];
  const styleMap = new Map((stylesRes.data ?? []).map((s) => [s.id, s]));
  const studioMap = new Map((studiosRes.data ?? []).map((s) => [s.id, s]));

  const classesByDay = new Map<number, typeof classes>();
  for (const c of classes) {
    const arr = classesByDay.get(c.day_of_week) ?? [];
    arr.push(c);
    classesByDay.set(c.day_of_week, arr);
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-12 gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Catálogo
          </p>
          <h1 className="font-display text-5xl mt-2">Clases</h1>
          <p className="text-sm text-bone-mute mt-3">
            {classes.length} clase{classes.length === 1 ? "" : "s"} en total.
            Haz click en cualquier clase para editarla.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de vista, estilo Finder */}
          <div className="inline-flex items-center rounded-full border border-bone-border/40 p-1">
            <Link
              href="/admin/clases"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                view === "tabla"
                  ? "bg-bone text-ink"
                  : "text-bone-mute hover:text-bone",
              )}
              aria-label="Vista de tabla"
            >
              <List className="w-3.5 h-3.5" />
              Tabla
            </Link>
            <Link
              href="/admin/clases?vista=semana"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                view === "semana"
                  ? "bg-bone text-ink"
                  : "text-bone-mute hover:text-bone",
              )}
              aria-label="Vista de semana"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Semana
            </Link>
          </div>

          <Link
            href="/admin/clases/nueva"
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva clase
          </Link>
        </div>
      </div>

      {saved === "1" && (
        <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm text-bone">Clase actualizada correctamente.</p>
        </div>
      )}

      {deleted === "1" && (
        <div className="mb-6 flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-sm text-bone">
            Clase eliminada. Sus sesiones y reservas también se borraron.
          </p>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-bone-mute">
            Aún no hay clases. Crea la primera para empezar.
          </p>
        </div>
      ) : view === "semana" ? (
        <div className="space-y-10">
          {weekOrder.map((day) => {
            const dayClasses = classesByDay.get(day) ?? [];
            if (dayClasses.length === 0) return null;
            return (
              <section key={day}>
                <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-bone-border/30">
                  <h2 className="font-display text-3xl tracking-wide">
                    {dayLabelsFull[day]}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                    {dayClasses.length} clase{dayClasses.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayClasses.map((c) => {
                    const styleName = styleMap.get(c.style_id)?.name ?? "—";
                    const studioName = studioMap.get(c.studio_id)?.name ?? "—";
                    return (
                      <article
                        key={c.id}
                        className="rounded-2xl border border-bone-border/30 bg-ink-off p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-display text-lg text-bone tracking-wider truncate">
                              {styleName}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-1">
                              {c.level}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded",
                              c.is_active
                                ? "bg-success/10 text-success"
                                : "bg-bone-border/20 text-bone-mute",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                c.is_active ? "bg-success" : "bg-bone-mute",
                              )}
                            />
                            {c.is_active ? "Activa" : "Inactiva"}
                          </span>
                        </div>

                        <dl className="space-y-1.5 text-xs text-bone-mute mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatTime(c.starts_at_time)} · {c.duration_min} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{studioName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            <span>{c.capacity} lugares</span>
                          </div>
                        </dl>

                        <div className="flex items-center justify-between pt-3 border-t border-bone-border/30">
                          <Link
                            href={`/admin/clases/${c.id}/editar`}
                            className="inline-flex items-center gap-1.5 text-xs text-bone hover:text-lumen transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </Link>
                          <ToggleClassActive classId={c.id} isActive={c.is_active} />
                          <ToggleClassPublic classId={c.id} isPublic={c.is_public} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bone-border/30">
          <table className="w-full">
            <thead className="bg-ink-off">
              <tr className="text-left">
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                  Clase
                </th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                  Horario
                </th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                  Sucursal
                </th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                  Cupo
                </th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                  Estado
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const styleName = styleMap.get(c.style_id)?.name ?? "—";
                const studioName = studioMap.get(c.studio_id)?.name ?? "—";
                return (
                  <tr
                    key={c.id}
                    className="border-t border-bone-border/30 hover:bg-ink-off/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-display text-lg text-bone tracking-wider">
                        {styleName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-1">
                        {c.level}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono uppercase tracking-wider">
                        {dayLabels[c.day_of_week]} ·{" "}
                        {formatTime(c.starts_at_time)}
                      </span>
                      <p className="text-xs text-bone-mute mt-1">
                        {c.duration_min} min
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-bone-mute">
                      {studioName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono">{c.capacity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded",
                          c.is_active
                            ? "bg-success/10 text-success"
                            : "bg-bone-border/20 text-bone-mute",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            c.is_active ? "bg-success" : "bg-bone-mute",
                          )}
                        />
                        {c.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end">
                        <Link
                          href={`/admin/clases/${c.id}/editar`}
                          className="inline-flex items-center gap-1.5 text-xs text-bone hover:text-lumen transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                        <ToggleClassActive classId={c.id} isActive={c.is_active} />
                        <ToggleClassPublic classId={c.id} isPublic={c.is_public} />
                      </div>
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
