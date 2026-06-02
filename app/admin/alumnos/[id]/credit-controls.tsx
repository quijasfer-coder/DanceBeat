"use client";

import { useTransition, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import {
  adjustCreditsAction,
  cancelStudentSubscriptionAction,
} from "./actions";

export function CreditControls({
  studentId,
  subscriptionId,
}: {
  studentId: string;
  subscriptionId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const adjust = (delta: number) =>
    startTransition(async () => {
      setError(null);
      const res = await adjustCreditsAction(studentId, subscriptionId, delta);
      if (res.error) setError(res.error);
    });

  const cancel = () => {
    if (!confirm("¿Cancelar suscripción activa? La alumna no podrá reservar."))
      return;
    startTransition(async () => {
      setError(null);
      const res = await cancelStudentSubscriptionAction(
        studentId,
        subscriptionId,
      );
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => adjust(-1)}
        disabled={pending}
        className="inline-flex items-center gap-1 border border-bone-border/40 hover:border-bone px-3 py-1.5 rounded-full text-xs text-bone-mute hover:text-bone disabled:opacity-50 transition-colors"
        aria-label="Restar un crédito"
      >
        <Minus className="w-3 h-3" />
        crédito
      </button>
      <button
        type="button"
        onClick={() => adjust(1)}
        disabled={pending}
        className="inline-flex items-center gap-1 border border-bone-border/40 hover:border-bone px-3 py-1.5 rounded-full text-xs text-bone-mute hover:text-bone disabled:opacity-50 transition-colors"
        aria-label="Sumar un crédito"
      >
        <Plus className="w-3 h-3" />
        crédito
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="inline-flex items-center gap-1 border border-danger/30 text-danger hover:bg-danger/10 px-3 py-1.5 rounded-full text-xs disabled:opacity-50 transition-colors"
      >
        <X className="w-3 h-3" />
        Cancelar sub
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
