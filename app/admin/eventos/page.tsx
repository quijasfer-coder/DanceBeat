import Link from "next/link";
import {
  Plus,
  Sparkles,
  Trophy,
  Drama,
  CircleHelp,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { formatDateMX, formatTimeMX } from "@/lib/format";
import type { Database } from "@/lib/database.types";

export const metadata = {
  title: "Admin · Eventos",
  robots: { index: false },
};

type EventKind = Database["public"]["Enums"]["event_kind"];

const kindLabels: Record<EventKind, string> = {
  rehearsal: "Ensayo",
  competition: "Competencia",
  showcase: "Presentación",
  other: "Otro",
};

const kindIcons: Record<EventKind, typeof Sparkles> = {
  rehearsal: Sparkles,
  competition: Trophy,
  showcase: Drama,
  other: CircleHelp,
};

type SearchParams = Promise<{ filter?: "upcoming" | "past" | "drafts" | "all" }>;

export default async function AdminEventosListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter = "upcoming" } = await searchParams;
  const supabase = await createClient();

  const [eventsRes, assignmentsRes] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: false }),
    supabase
      .from("event_assignments")
      .select("event_id, payment_status, status"),
  ]);

  const allEvents = eventsRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  const now = new Date();
  const filtered = allEvents.filter((e) => {
    const start = new Date(e.starts_at);
    if (filter === "drafts") return !e.is_published;
    if (filter === "upcoming") return e.is_published && start >= now;
    if (filter === "past") return e.is_published && start < now;
    return true; // all
  });

  // Métricas por evento (asignadas, confirmadas, pagadas)
  const stats = new Map<
    string,
    { total: number; confirmed: number; paid: number; pendingPay: number }
  >();
  for (const a of assignments) {
    const cur = stats.get(a.event_id) ?? {
      total: 0,
      confirmed: 0,
      paid: 0,
      pendingPay: 0,
    };
    cur.total += 1;
    if (a.status === "confirmed" || a.status === "attended") cur.confirmed += 1;
    if (a.payment_status === "paid") cur.paid += 1;
    if (a.payment_status === "pending") cur.pendingPay += 1;
    stats.set(a.event_id, cur);
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Calendario interno
          </p>
          <h1 className="font-display text-5xl mt-2">Eventos</h1>
          <p className="text-sm text-bone-mute mt-3 max-w-xl">
            Ensayos extraordinarios, competencias y presentaciones. Cada
            evento se asigna a alumnas específicas y puede tener costo extra.
          </p>
        </div>
        <Link
          href="/admin/eventos/nuevo"
          className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Link>
      </div>

      {/* Filtros */}
      <nav className="flex items-center gap-2 mb-8">
        {[
          { key: "upcoming", label: "Próximos" },
          { key: "past", label: "Pasados" },
          { key: "drafts", label: "Borradores" },
          { key: "all", label: "Todos" },
        ].map((f) => (
          <Link
            key={f.key}
            href={`/admin/eventos?filter=${f.key}`}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
              filter === f.key
                ? "bg-bone text-ink"
                : "border border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Sparkles className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            {filter === "drafts"
              ? "No hay borradores."
              : filter === "past"
              ? "Aún no hay eventos pasados."
              : filter === "upcoming"
              ? "No hay eventos próximos. Crea el primero arriba."
              : "Aún no hay eventos."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const Icon = kindIcons[e.kind];
            const stat = stats.get(e.id) ?? {
              total: 0,
              confirmed: 0,
              paid: 0,
              pendingPay: 0,
            };
            const dateStr = formatDateMX(e.starts_at, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const timeStr = formatTimeMX(e.starts_at);

            return (
              <Link
                key={e.id}
                href={`/admin/eventos/${e.id}`}
                className="block rounded-2xl border border-bone-border/30 bg-ink-off p-5 hover:border-lumen/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-lumen/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-lumen" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                        {kindLabels[e.kind]}
                      </span>
                      {!e.is_published && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                          <EyeOff className="w-2.5 h-2.5" />
                          Borrador
                        </span>
                      )}
                      {e.is_published && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded">
                          <Eye className="w-2.5 h-2.5" />
                          Publicado
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl text-bone">{e.title}</h3>
                    <p className="text-xs text-bone-mute mt-1.5 capitalize">
                      {dateStr} · {timeStr}
                      {e.location && (
                        <>
                          {" · "}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {e.location}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right text-xs">
                    <p className="text-bone">
                      <span className="font-display text-2xl">{stat.total}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-bone-mute ml-1.5">
                        asignadas
                      </span>
                    </p>
                    {(e.cost_cents ?? 0) > 0 && (
                      <p className="text-bone-mute mt-1 font-mono text-[10px] uppercase tracking-wider">
                        {stat.paid}/{stat.total} pagadas
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
