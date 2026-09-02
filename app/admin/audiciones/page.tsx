import Link from "next/link";
import { UserCheck, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/queries/settings";
import { cn } from "@/lib/utils";
import { formatDateMX } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import { AuditionsToggle } from "./auditions-toggle";
import { ClosedMessageForm } from "./closed-message-form";

export const metadata = {
  title: "Admin · Audiciones IMPULSE",
  robots: { index: false },
};

type AuditionStatus = Database["public"]["Enums"]["audition_status"];

const statusLabels: Record<AuditionStatus, string> = {
  received: "Recibida",
  reviewing: "En revisión",
  shortlist: "Preseleccionada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  withdrawn: "Retirada",
};

const statusStyles: Record<AuditionStatus, string> = {
  received: "bg-bone-mute/10 text-bone-mute",
  reviewing: "bg-warning/10 text-warning",
  shortlist: "bg-lumen/15 text-lumen",
  accepted: "bg-success/15 text-success",
  rejected: "bg-danger/10 text-danger",
  withdrawn: "bg-bone-mute/10 text-bone-mute",
};

const ALL_STATUSES: AuditionStatus[] = [
  "received",
  "reviewing",
  "shortlist",
  "accepted",
  "rejected",
  "withdrawn",
];

type SearchParams = Promise<{ filter?: AuditionStatus | "all" }>;

export default async function AdminAudicionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin("/admin/audiciones");
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();

  const [appsRes, settings] = await Promise.all([
    supabase
      .from("audition_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    getSettings(["impulse_auditions_open", "impulse_auditions_message"]),
  ]);

  const all = appsRes.data ?? [];
  const filtered =
    filter === "all" ? all : all.filter((a) => a.status === filter);

  // Conteos por status para los chips
  const counts: Record<AuditionStatus | "all", number> = {
    all: all.length,
    received: 0,
    reviewing: 0,
    shortlist: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  };
  for (const a of all) counts[a.status] += 1;

  const isOpen = settings.impulse_auditions_open === "true";
  const closedMessage =
    settings.impulse_auditions_message ??
    "Las audiciones están cerradas por ahora.";

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          IMPULSE
        </p>
        <h1 className="font-display text-5xl mt-2">Audiciones</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Aplicaciones a la compañía representativa. Cambia el status conforme
          revisas, agrega notas internas y abre o cierra la convocatoria.
        </p>
      </div>

      {/* Toggle convocatoria + mensaje cerrado */}
      <div className="grid lg:grid-cols-2 gap-4 mb-10">
        <AuditionsToggle initialOpen={isOpen} />
        <ClosedMessageForm initialMessage={closedMessage} />
      </div>

      {/* Filtros */}
      <nav className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href="/admin/audiciones"
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
            filter === "all"
              ? "bg-bone text-ink"
              : "border border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
          )}
        >
          Todas · {counts.all}
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/audiciones?filter=${s}`}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
              filter === s
                ? "bg-bone text-ink"
                : "border border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
            )}
          >
            {statusLabels[s]} · {counts[s]}
          </Link>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <UserCheck className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            {filter === "all"
              ? "Aún no hay aplicaciones."
              : `No hay aplicaciones en estado "${statusLabels[filter as AuditionStatus]}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const date = formatDateMX(a.created_at, {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <Link
                key={a.id}
                href={`/admin/audiciones/${a.id}`}
                className="block rounded-2xl border border-bone-border/30 bg-ink-off p-5 hover:border-lumen/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-lumen/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-lumen" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded",
                          statusStyles[a.status],
                        )}
                      >
                        {statusLabels[a.status]}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                        {date}
                      </span>
                      {a.age && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
                          {a.age} años
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl text-bone">
                      {a.full_name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-bone-mute">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {a.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {a.phone}
                      </span>
                      {a.styles && (
                        <span className="truncate">· {a.styles}</span>
                      )}
                    </div>
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
