"use client";

import { useActionState } from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createEnrollmentTypeAction,
  type EnrollmentTypeFormState,
} from "./actions";

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors";

export function NewEnrollmentTypeForm() {
  const [state, formAction, pending] = useActionState<
    EnrollmentTypeFormState,
    FormData
  >(createEnrollmentTypeAction, null);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-dashed border-bone-border/40 p-5 flex flex-wrap items-end gap-4"
    >
      <div className="min-w-[10rem]">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-bone-mute mb-1.5">
          Nombre
        </label>
        <input
          name="name"
          type="text"
          placeholder="Ej. Impulse"
          className={inputClass}
          required
        />
      </div>

      <div className="w-32">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-bone-mute mb-1.5">
          Monto (MXN)
        </label>
        <input
          name="price_mxn"
          type="number"
          min="0"
          step="0.01"
          placeholder="3500"
          className={inputClass}
          required
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {pending ? "Creando…" : "Agregar tipo"}
      </button>

      {state?.error && (
        <p className="flex items-center gap-1.5 text-xs text-danger w-full">
          <AlertCircle className="w-3.5 h-3.5" />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-xs text-success w-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {state.success}
        </p>
      )}
    </form>
  );
}
