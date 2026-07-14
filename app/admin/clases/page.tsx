import Link from "next/link";
import { CheckCircle2, Edit3, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ToggleClassActive } from "@/components/admin/toggle-class-active";

export const metadata = {
  title: "Admin · Clases",
  robots: { index: false },
};

const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const formatTime = (t: string) => t.slice(0, 5);

type SearchParams = Promise<{ saved?: string; deleted?: string }>;

export default async function AdminClasesListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { saved, deleted } = await searchParams;
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

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-12">
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
        <Link
          href="/admin/clases/nueva"
          className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva clase
        </Link>
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
                      <p className="font-display text-lg text-bone">
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
