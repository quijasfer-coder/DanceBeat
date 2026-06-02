"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDot,
  CircleX,
  DollarSign,
  Loader2,
  Trash2,
  UserPlus,
  Users2,
  X,
} from "lucide-react";
import {
  assignByClassAction,
  assignManualAction,
  removeAssignmentAction,
  setAssignmentStatusAction,
  setPaymentStatusAction,
  type AssignFormState,
} from "../actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type AssignmentStatus = Database["public"]["Enums"]["event_assignment_status"];
type PaymentStatus = Database["public"]["Enums"]["event_payment_status"];

type AssignmentRow = {
  id: string;
  student_id: string;
  student_name: string;
  tutor_name: string | null;
  tutor_email: string | null;
  status: AssignmentStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  paid_at: string | null;
  attended_at: string | null;
};

const inputClass =
  "w-full bg-ink border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const statusLabels: Record<AssignmentStatus, string> = {
  invited: "Invitada",
  confirmed: "Confirmada",
  declined: "No va",
  attended: "Asistió",
  no_show: "No vino",
};

const paymentLabels: Record<PaymentStatus, string> = {
  not_required: "—",
  pending: "Pendiente",
  paid: "Pagado",
};

export function AssignmentsPanel({
  eventId,
  hasCost,
  classOptions,
  allStudents,
  assignments,
}: {
  eventId: string;
  hasCost: boolean;
  classOptions: { id: string; label: string }[];
  allStudents: { id: string; label: string }[];
  assignments: AssignmentRow[];
}) {
  return (
    <div className="space-y-8">
      {/* Modos de asignación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AssignByClassCard eventId={eventId} classOptions={classOptions} />
        <AssignManualCard eventId={eventId} allStudents={allStudents} />
      </div>

      {/* Lista de asignadas */}
      {assignments.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Users2 className="w-7 h-7 text-bone-mute mx-auto mb-3" />
          <p className="text-sm text-bone-mute">
            Aún no hay alumnas asignadas. Empieza por arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <AssignmentRowCard
              key={a.id}
              row={a}
              eventId={eventId}
              hasCost={hasCost}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Asignar por clase
// ─────────────────────────────────────────────────────────────────────

function AssignByClassCard({
  eventId,
  classOptions,
}: {
  eventId: string;
  classOptions: { id: string; label: string }[];
}) {
  const action = assignByClassAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState<AssignFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="rounded-2xl border border-bone-border/30 bg-ink-off p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
        Por clase
      </p>
      <p className="text-xs text-bone-mute mb-4">
        Asigna a todas las alumnas con reservas activas o recientes (últimas 8
        semanas) en la clase seleccionada.
      </p>

      <select name="class_id" required className={inputClass + " mb-3"}>
        <option value="">Selecciona una clase…</option>
        {classOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        <Users2 className="w-3.5 h-3.5" />
        {pending ? "Asignando..." : "Asignar clase"}
      </button>

      {state?.success && (
        <div className="mt-3 flex items-start gap-2 text-xs text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Asignar manualmente
// ─────────────────────────────────────────────────────────────────────

function AssignManualCard({
  eventId,
  allStudents,
}: {
  eventId: string;
  allStudents: { id: string; label: string }[];
}) {
  const action = assignManualAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState<AssignFormState, FormData>(
    action,
    null,
  );

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ id: string; label: string }[]>([]);

  const filtered = query
    ? allStudents
        .filter(
          (s) =>
            s.label.toLowerCase().includes(query.toLowerCase()) &&
            !picked.some((p) => p.id === s.id),
        )
        .slice(0, 6)
    : [];

  return (
    <form action={formAction} className="rounded-2xl border border-bone-border/30 bg-ink-off p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
        Manual
      </p>
      <p className="text-xs text-bone-mute mb-4">
        Busca por nombre y agrega alumnas una por una.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar alumna…"
        className={inputClass + " mb-2"}
      />

      {filtered.length > 0 && (
        <ul className="mb-3 rounded-lg border border-bone-border/40 max-h-48 overflow-auto">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setPicked((p) => [...p, s]);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 text-sm text-bone hover:bg-lumen/10 transition-colors"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {picked.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 bg-lumen/10 border border-lumen/30 rounded-full px-2.5 py-1 text-xs text-bone"
            >
              <input type="hidden" name="student_ids" value={p.id} />
              {p.label}
              <button
                type="button"
                onClick={() => setPicked((arr) => arr.filter((x) => x.id !== p.id))}
                className="text-bone-mute hover:text-danger"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || picked.length === 0}
        className="inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        <UserPlus className="w-3.5 h-3.5" />
        {pending
          ? "Agregando..."
          : `Agregar ${picked.length || ""} alumna${picked.length === 1 ? "" : "s"}`}
      </button>

      {state?.success && (
        <div className="mt-3 flex items-start gap-2 text-xs text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Fila de asignación
// ─────────────────────────────────────────────────────────────────────

function AssignmentRowCard({
  row,
  eventId,
  hasCost,
}: {
  row: AssignmentRow;
  eventId: string;
  hasCost: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(row.status);
  const [payStatus, setPayStatus] = useState(row.payment_status);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = (next: AssignmentStatus) => {
    setError(null);
    setStatus(next);
    startTransition(async () => {
      const res = await setAssignmentStatusAction(row.id, eventId, next);
      if (res.error) {
        setError(res.error);
        setStatus(row.status);
      }
    });
  };

  const updatePayment = (next: PaymentStatus, method: string | null = null) => {
    setError(null);
    setPayStatus(next);
    startTransition(async () => {
      const res = await setPaymentStatusAction(row.id, eventId, next, method);
      if (res.error) {
        setError(res.error);
        setPayStatus(row.payment_status);
      }
    });
  };

  const remove = () => {
    if (!confirm(`¿Quitar a ${row.student_name} del evento?`)) return;
    startTransition(async () => {
      await removeAssignmentAction(row.id, eventId);
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        status === "attended" && "border-success/40 bg-success/5",
        status === "no_show" && "border-danger/30 bg-danger/5",
        status === "declined" && "border-bone-border/30 bg-ink-off opacity-60",
        status === "invited" && "border-bone-border/30 bg-ink-off",
        status === "confirmed" && "border-lumen/30 bg-lumen/5",
      )}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <p className="font-display text-lg text-bone">{row.student_name}</p>
          {row.tutor_name && (
            <p className="text-xs text-bone-mute mt-0.5">
              Titular: {row.tutor_name}
              {row.tutor_email && ` · ${row.tutor_email}`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-bone-mute hover:text-danger transition-colors disabled:opacity-50"
          title="Quitar del evento"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        {/* Status */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-bone-mute mb-1.5">
            Estado
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              ["invited", "confirmed", "declined", "attended", "no_show"] as AssignmentStatus[]
            ).map((s) => {
              const Icon =
                s === "attended"
                  ? Check
                  : s === "no_show"
                  ? X
                  : s === "declined"
                  ? CircleX
                  : s === "confirmed"
                  ? CheckCircle2
                  : CircleDot;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={pending}
                  onClick={() => updateStatus(s)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors disabled:opacity-50",
                    status === s
                      ? "bg-bone text-ink border-bone"
                      : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {statusLabels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pago — solo si el evento tiene costo */}
        {hasCost && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-bone-mute mb-1.5">
              Pago
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => updatePayment("pending")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors disabled:opacity-50",
                  payStatus === "pending"
                    ? "bg-warning/20 text-warning border-warning/40"
                    : "border-bone-border/40 text-bone-mute hover:border-warning hover:text-warning",
                )}
              >
                Pendiente
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => updatePayment("paid", "cash")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors disabled:opacity-50",
                  payStatus === "paid" && row.payment_method === "cash"
                    ? "bg-success text-ink border-success"
                    : "border-bone-border/40 text-bone-mute hover:border-success hover:text-success",
                )}
              >
                <DollarSign className="w-3 h-3" />
                Efectivo
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => updatePayment("paid", "transfer")}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-colors disabled:opacity-50",
                  payStatus === "paid" && row.payment_method === "transfer"
                    ? "bg-success text-ink border-success"
                    : "border-bone-border/40 text-bone-mute hover:border-success hover:text-success",
                )}
              >
                Transferencia
              </button>
              {payStatus === "paid" && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-success">
                  ✓ {paymentLabels[payStatus]}
                  {row.payment_method ? ` (${row.payment_method})` : ""}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {pending && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-bone-mute">
          <Loader2 className="w-3 h-3 animate-spin" />
          Guardando...
        </p>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
