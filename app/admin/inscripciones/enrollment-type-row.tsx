"use client";

import { useActionState } from "react";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  updateEnrollmentTypeAction,
  type EnrollmentTypeFormState,
} from "./actions";

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors";

export function EnrollmentTypeRow({
  id,
  code,
  name,
  priceMxn,
  isActive,
}: {
  id: string;
  code: string;
  name: string;
  priceMxn: number;
  isActive: boolean;
}) {
  const action = updateEnrollmentTypeAction.bind(null, id);
  const [state, formAction, pending] = useActionState<
    EnrollmentTypeFormState,
    FormData
  >(action, null);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-bone-border/30 bg-ink-off p-5 flex flex-wrap items-end gap-4"
    >
      <div className="min-w-[10rem]">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-bone-mute mb-1.5">
          Nombre
        </label>
        <input
          name="name"
          type="text"
          defaultValue={name}
          className={inputClass}
          required
        />
        <p className="text-[10px] text-bone-mute mt-1 font-mono">{code}</p>
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
          defaultValue={priceMxn}
          className={inputClass}
          required
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer pb-2.5">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={isActive}
          className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
        />
        <span className="text-xs text-bone-mute">Activo</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        {pending ? "Guardando…" : "Guardar"}
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
