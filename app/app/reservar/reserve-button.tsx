"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle, Calendar } from "lucide-react";
import { bookClassAction } from "./actions";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  full_name: string;
  hasActivePlan: boolean;
  creditsRemaining: number;
  alreadyBooked: boolean;
};

export function ReserveButton({
  sessionId,
  students,
  full,
}: {
  sessionId: string;
  students: StudentOption[];
  full: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBook = (studentId: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await bookClassAction(sessionId, studentId);
      if (res.ok) {
        setSuccess("Reservada");
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  if (full) {
    return (
      <button
        type="button"
        disabled
        className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider bg-bone-mute/10 text-bone-mute cursor-not-allowed"
      >
        Sin cupo
      </button>
    );
  }

  if (success) {
    return (
      <div className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider bg-success/15 text-success">
        <Check className="w-3.5 h-3.5" />
        {success}
      </div>
    );
  }

  // Si solo hay un student, reservar directo. Si hay más, mostrar el menú.
  const singleStudent = students.length === 1 ? students[0] : null;

  if (!open) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => {
            if (singleStudent) {
              handleBook(singleStudent.id);
            } else {
              setOpen(true);
            }
          }}
          disabled={pending}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
            "bg-bone text-ink hover:bg-lumen disabled:opacity-50 disabled:cursor-wait",
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          {pending ? "Reservando…" : "Reservar"}
        </button>
        {error && (
          <p className="flex items-start gap-1.5 text-[10px] text-danger leading-snug">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-ink-surface p-3 border border-bone-border/30">
      <p className="text-[10px] font-mono uppercase tracking-widest text-bone-mute">
        ¿Para quién es?
      </p>
      <div className="space-y-1">
        {students.map((s) => {
          const blocked =
            !s.hasActivePlan || s.creditsRemaining <= 0 || s.alreadyBooked;
          return (
            <button
              key={s.id}
              type="button"
              disabled={pending || blocked}
              onClick={() => handleBook(s.id)}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2 text-xs transition-colors",
                blocked
                  ? "bg-ink-off text-bone-mute cursor-not-allowed"
                  : "bg-ink-off text-bone hover:bg-bone hover:text-ink",
              )}
            >
              <p className="font-medium">{s.full_name}</p>
              <p className="text-[10px] mt-0.5 font-mono uppercase tracking-wider opacity-70">
                {s.alreadyBooked
                  ? "Ya reservada"
                  : !s.hasActivePlan
                    ? "Sin plan activo"
                    : s.creditsRemaining <= 0
                      ? "Sin créditos"
                      : `${s.creditsRemaining} créditos`}
              </p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full text-[10px] font-mono uppercase tracking-widest text-bone-mute hover:text-bone py-1"
      >
        Cancelar
      </button>
      {error && (
        <p className="flex items-start gap-1.5 text-[10px] text-danger leading-snug">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}
