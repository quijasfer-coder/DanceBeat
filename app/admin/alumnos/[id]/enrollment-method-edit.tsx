"use client";

import { useTransition, useState } from "react";
import { Pencil, Loader2, Check } from "lucide-react";
import { correctEnrollmentPaymentMethodAction } from "./actions";

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  tpv: "TPV",
};

export function EnrollmentMethodEdit({
  studentId,
  currentMethod,
}: {
  studentId: string;
  currentMethod: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState(currentMethod ?? "cash");

  const save = (value: "cash" | "transfer" | "tpv") => {
    setMethod(value);
    setError(null);
    startTransition(async () => {
      const res = await correctEnrollmentPaymentMethodAction(studentId, value);
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-bone-mute hover:text-lumen transition-colors"
      >
        {currentMethod ? METHOD_LABEL[currentMethod] ?? currentMethod : "—"}
        <Pencil className="w-2.5 h-2.5" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={method}
        onChange={(e) => save(e.target.value as "cash" | "transfer" | "tpv")}
        disabled={pending}
        className="bg-ink-surface border border-bone-border/40 rounded px-1.5 py-0.5 text-xs text-bone focus:outline-none focus:border-lumen disabled:opacity-50"
      >
        <option value="cash">Efectivo</option>
        <option value="transfer">Transferencia</option>
        <option value="tpv">TPV</option>
      </select>
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin text-bone-mute" />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-bone-mute hover:text-bone"
          aria-label="Listo"
        >
          <Check className="w-3 h-3" />
        </button>
      )}
      {error && <span className="text-danger">{error}</span>}
    </span>
  );
}
