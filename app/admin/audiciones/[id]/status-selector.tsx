"use client";

import { useState, useTransition } from "react";
import { setAuditionStatusAction } from "../actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type AuditionStatus = Database["public"]["Enums"]["audition_status"];

const STATUSES: { value: AuditionStatus; label: string; color: string }[] = [
  { value: "received", label: "Recibida", color: "bg-bone-mute/20 text-bone" },
  {
    value: "reviewing",
    label: "En revisión",
    color: "bg-warning/15 text-warning",
  },
  {
    value: "shortlist",
    label: "Preseleccionada",
    color: "bg-lumen/20 text-lumen",
  },
  { value: "accepted", label: "Aceptada", color: "bg-success/20 text-success" },
  { value: "rejected", label: "Rechazada", color: "bg-danger/15 text-danger" },
  {
    value: "withdrawn",
    label: "Retirada",
    color: "bg-bone-mute/15 text-bone-mute",
  },
];

export function StatusSelector({
  applicationId,
  initialStatus,
}: {
  applicationId: string;
  initialStatus: AuditionStatus;
}) {
  const [status, setStatus] = useState<AuditionStatus>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = (next: AuditionStatus) => {
    if (next === status || pending) return;
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const res = await setAuditionStatusAction(applicationId, next);
      if (res?.error) {
        setStatus(prev);
        setError(res.error);
      }
    });
  };

  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-bone-mute mb-3">
        Status
      </p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => handleClick(s.value)}
              disabled={pending}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border",
                active
                  ? `${s.color} border-transparent`
                  : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
                pending && "opacity-60 cursor-wait",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  );
}
