"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  markAttendanceAction,
  markAttendanceForEnrollmentAction,
} from "@/app/profesor/actions";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import type { Database } from "@/lib/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PlanStatus = "ok" | "sin_plan" | "sin_cupo";

type Item = {
  bookingId: string | null;
  studentId: string;
  status: BookingStatus | null;
  planStatus: PlanStatus;
  studentName: string;
  photoUrl: string | null;
  birthdate: string;
  school: string | null;
  grade: string | null;
  notes: string | null;
};

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function AttendanceList({
  sessionId,
  items,
}: {
  sessionId: string;
  items: Item[];
}) {
  // Optimistic local state — la acción llama revalidatePath para
  // sincronizar con BD al final, pero queremos feedback inmediato.
  const [localStatus, setLocalStatus] = useState<
    Record<string, BookingStatus | null>
  >(Object.fromEntries(items.map((it) => [it.studentId, it.status])));
  const [bookingIds, setBookingIds] = useState<Record<string, string | null>>(
    Object.fromEntries(items.map((it) => [it.studentId, it.bookingId])),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const update = (studentId: string, attended: boolean) => {
    setError(null);
    setPendingId(studentId);
    const previous = localStatus[studentId];
    const next: BookingStatus = attended ? "attended" : "no_show";
    setLocalStatus((s) => ({ ...s, [studentId]: next }));

    startTransition(async () => {
      const existingBookingId = bookingIds[studentId];
      const res: { error?: string; bookingId?: string } = existingBookingId
        ? await markAttendanceAction(existingBookingId, attended, sessionId)
        : await markAttendanceForEnrollmentAction(
            studentId,
            sessionId,
            attended,
          );

      if (res.error) {
        setError(res.error);
        setLocalStatus((s) => ({ ...s, [studentId]: previous }));
      } else if (!existingBookingId && res.bookingId) {
        setBookingIds((s) => ({ ...s, [studentId]: res.bookingId! }));
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {items.map((it) => {
        const status = localStatus[it.studentId];
        const isPending = pendingId === it.studentId;
        const age = calcAge(it.birthdate);

        return (
          <div
            key={it.studentId}
            className={cn(
              "rounded-xl border p-4 flex items-center gap-4 transition-colors",
              status === "attended"
                ? "border-success/40 bg-success/5"
                : status === "no_show"
                ? "border-danger/30 bg-danger/5"
                : "border-bone-border/30 bg-ink-off",
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar src={it.photoUrl} name={it.studentName} size={44} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display text-lg text-bone truncate">
                    {it.studentName}
                  </p>
                  {it.planStatus !== "ok" && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/15 text-warning shrink-0"
                      title={
                        it.planStatus === "sin_plan"
                          ? "Asignada a la clase pero sin plan/crédito activo — no se cobró"
                          : "Tiene plan activo pero la clase estaba llena cuando se generó — reservar manualmente si hay lugar"
                      }
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {it.planStatus === "sin_plan" ? "Sin plan activo" : "Sin cupo asignado"}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-bone-mute mt-1">
                  {age} años
                  {it.school ? ` · ${it.school}` : ""}
                  {it.grade ? ` · ${it.grade}` : ""}
                </p>
                {it.notes && (
                  <p className="text-xs text-warning mt-1.5 leading-relaxed">
                    ⚠ {it.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isPending}
                onClick={() => update(it.studentId, true)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors disabled:opacity-50",
                  status === "attended"
                    ? "bg-success text-ink border-success"
                    : "border-bone-border/60 text-bone hover:border-success hover:text-success",
                )}
                aria-label="Marcar asistencia"
              >
                {isPending && status === "attended" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Asistió
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => update(it.studentId, false)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors disabled:opacity-50",
                  status === "no_show"
                    ? "bg-danger text-bone border-danger"
                    : "border-bone-border/60 text-bone hover:border-danger hover:text-danger",
                )}
                aria-label="Marcar como ausente"
              >
                {isPending && status === "no_show" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                No vino
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
