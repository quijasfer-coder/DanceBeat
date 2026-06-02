"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import {
  ensureSessionsAction,
  type ProfesorActionState,
} from "@/app/profesor/actions";

export function GenerateSessionsForm({ classId }: { classId: string }) {
  const action = ensureSessionsAction.bind(null, classId);
  const [state, formAction, pending] = useActionState<
    ProfesorActionState,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs text-bone-mute">
        Próximas
        <select
          name="weeks"
          defaultValue="4"
          className="bg-ink border border-bone-border/40 rounded-lg px-3 py-1.5 text-sm text-bone focus:border-lumen focus:outline-none"
        >
          <option value="1">1 semana</option>
          <option value="2">2 semanas</option>
          <option value="4">4 semanas</option>
          <option value="8">8 semanas</option>
          <option value="12">12 semanas</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Generando..." : "Generar"}
      </button>

      {state?.success && (
        <div className="flex items-start gap-2 text-xs text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.success}
        </div>
      )}

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
    </form>
  );
}
