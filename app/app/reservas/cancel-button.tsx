"use client";

import { useState, useTransition } from "react";
import { X, AlertCircle } from "lucide-react";
import { cancelBookingAction } from "../reservar/actions";
import { cn } from "@/lib/utils";

export function CancelButton({
  bookingId,
  isLate,
}: {
  bookingId: string;
  isLate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    const msg = isLate
      ? "Estás dentro de las 12h previas a la clase. Si cancelas se libera el cupo pero NO se devuelve tu crédito. ¿Continuar?"
      : "¿Cancelar esta reserva? Se libera el cupo y tu crédito vuelve disponible.";
    if (!confirm(msg)) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
          isLate
            ? "border border-warning/40 text-warning hover:bg-warning/10"
            : "border border-bone-border/40 text-bone-mute hover:bg-danger/10 hover:text-danger hover:border-danger/40",
          pending && "opacity-50 cursor-wait",
        )}
      >
        <X className="w-3 h-3" />
        {pending ? "Cancelando…" : isLate ? "Cancelar (sin crédito)" : "Cancelar"}
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
