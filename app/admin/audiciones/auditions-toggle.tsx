"use client";

import { useState, useTransition } from "react";
import { Power } from "lucide-react";
import { toggleAuditionsOpenAction } from "./actions";
import { cn } from "@/lib/utils";

export function AuditionsToggle({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    setError(null);
    startTransition(async () => {
      const res = await toggleAuditionsOpenAction(next);
      if (res?.error) {
        setOpen(!next);
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-6 glass rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            open
              ? "bg-success/15 text-success"
              : "bg-bone-mute/10 text-bone-mute",
          )}
        >
          <Power className="w-4 h-4" />
        </div>
        <div>
          <p className="font-display text-base">
            Convocatoria{" "}
            <span className={open ? "text-success" : "text-bone-mute"}>
              {open ? "abierta" : "cerrada"}
            </span>
          </p>
          <p className="text-xs text-bone-mute mt-1">
            Controla si /impulse muestra el botón "Aplicar a audiciones".
          </p>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
          open ? "bg-success" : "bg-bone-mute/30",
          pending && "opacity-60 cursor-wait",
        )}
        aria-pressed={open}
        aria-label={open ? "Cerrar audiciones" : "Abrir audiciones"}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-bone shadow transition-transform mt-1",
            open ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
