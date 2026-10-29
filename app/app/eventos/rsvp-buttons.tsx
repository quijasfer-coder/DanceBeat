"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { rsvpEventAction } from "./actions";
import { cn } from "@/lib/utils";

export function RsvpButtons({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: "invited" | "confirmed" | "declined";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const respond = (next: "confirmed" | "declined") => {
    setError(null);
    startTransition(async () => {
      const res = await rsvpEventAction(assignmentId, next);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="mt-5 space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "confirmed" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("confirmed")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
              "bg-bone text-ink hover:bg-lumen disabled:opacity-50 disabled:cursor-wait",
            )}
          >
            <Check className="w-3.5 h-3.5" />
            {pending ? "Guardando…" : "Confirmar asistencia"}
          </button>
        )}
        {status !== "declined" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("declined")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
              "border border-bone-border/40 text-bone-mute hover:text-bone hover:border-bone disabled:opacity-50 disabled:cursor-wait",
            )}
          >
            <X className="w-3.5 h-3.5" />
            No podré asistir
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-start gap-1.5 text-[11px] text-danger leading-snug">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}
