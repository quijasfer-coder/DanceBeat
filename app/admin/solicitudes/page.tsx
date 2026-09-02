import Link from "next/link";
import { Inbox, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatDateMX } from "@/lib/format";
import { RequestCard } from "./request-card";

export const metadata = {
  title: "Admin · Solicitudes",
  robots: { index: false },
};

type SearchParams = Promise<{ filter?: "pending" | "approved" | "rejected" }>;

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin("/admin/solicitudes");
  const { filter = "pending" } = await searchParams;
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("account_status", filter)
    .order("created_at", { ascending: false });

  const list = profiles ?? [];
  const accountIds = list.map((p) => p.id);

  // Cargar students de todas las cuentas en una sola query
  const studentsByAccount = new Map<
    string,
    Array<{
      id: string;
      full_name: string;
      birthdate: string;
      school: string | null;
      grade: string | null;
      notes: string | null;
    }>
  >();
  if (accountIds.length > 0) {
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, full_name, birthdate, school, grade, notes, account_id")
      .in("account_id", accountIds);
    for (const s of studentsData ?? []) {
      const arr = studentsByAccount.get(s.account_id) ?? [];
      arr.push(s);
      studentsByAccount.set(s.account_id, arr);
    }
  }

  // Counts para los chips
  const { count: pendingCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_status", "pending");
  const { count: approvedCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_status", "approved");
  const { count: rejectedCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("account_status", "rejected");

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Cuentas nuevas
        </p>
        <h1 className="font-display text-5xl mt-2">Solicitudes</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Cada vez que una alumna nueva crea su cuenta aparece aquí. Revisa los
          datos que capturó y aprueba o rechaza para darle acceso.
        </p>
      </div>

      {/* Filtros */}
      <nav className="flex flex-wrap items-center gap-2 mb-6">
        <FilterChip
          href="/admin/solicitudes?filter=pending"
          active={filter === "pending"}
          label={`Pendientes · ${pendingCount ?? 0}`}
          highlight={(pendingCount ?? 0) > 0}
        />
        <FilterChip
          href="/admin/solicitudes?filter=approved"
          active={filter === "approved"}
          label={`Aprobadas · ${approvedCount ?? 0}`}
        />
        <FilterChip
          href="/admin/solicitudes?filter=rejected"
          active={filter === "rejected"}
          label={`Rechazadas · ${rejectedCount ?? 0}`}
        />
      </nav>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Inbox className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            {filter === "pending"
              ? "Sin solicitudes pendientes. Cuando una alumna se registre, aparecerá aquí."
              : filter === "approved"
                ? "Aún no hay cuentas aprobadas."
                : "Aún no hay solicitudes rechazadas."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((p) => {
            const students = studentsByAccount.get(p.id) ?? [];

            if (filter === "pending") {
              return (
                <RequestCard
                  key={p.id}
                  accountId={p.id}
                  email={p.email}
                  fullName={p.full_name}
                  phone={p.phone}
                  createdAt={p.created_at}
                  students={students}
                />
              );
            }

            // Vista compacta para aprobadas/rechazadas
            const isApproved = filter === "approved";
            const dateLabel = isApproved && p.approved_at
              ? formatDateMX(p.approved_at, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : !isApproved && p.rejected_at
                ? formatDateMX(p.rejected_at, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null;
            return (
              <Link
                key={p.id}
                href={`/admin/alumnos`}
                className="block rounded-2xl border border-bone-border/30 bg-ink-off p-5 hover:border-lumen/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                      isApproved
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger",
                    )}
                  >
                    {isApproved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg text-bone">
                      {p.full_name}
                    </p>
                    <p className="text-xs text-bone-mute mt-1">
                      {p.email} · {students.length} alumno
                      {students.length === 1 ? "" : "s"}
                      {dateLabel && (
                        <>
                          {" · "}
                          {isApproved ? "aprobada" : "rechazada"} {dateLabel}
                        </>
                      )}
                    </p>
                    {p.rejection_reason && !isApproved && (
                      <p className="text-xs text-bone-mute mt-2 italic">
                        “{p.rejection_reason}”
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

function FilterChip({
  href,
  active,
  label,
  highlight,
}: {
  href: string;
  active: boolean;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
        active
          ? "bg-bone text-ink"
          : highlight
            ? "border border-warning/40 text-warning hover:bg-warning/10"
            : "border border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
      )}
    >
      {label}
    </Link>
  );
}
