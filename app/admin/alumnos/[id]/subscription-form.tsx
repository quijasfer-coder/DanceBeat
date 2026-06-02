"use client";

import { useActionState } from "react";
import { Save, AlertCircle } from "lucide-react";
import {
  upsertStudentSubscriptionAction,
  type SubFormState,
} from "./actions";

type PlanOption = {
  id: string;
  name: string;
  code: string;
  credits_per_month: number | null;
};

export type SubscriptionFormDefaults = {
  plan_id?: string;
  credits_total?: number;
  credits_remaining?: number;
  cycle_start_at?: string; // ISO date YYYY-MM-DD
  cycle_end_at?: string;
};

const labelClass =
  "block text-xs font-mono uppercase tracking-widest text-bone-mute mb-2";
const inputClass =
  "w-full bg-ink-off border border-bone-border/40 rounded-lg px-4 py-3 text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors";

export function SubscriptionForm({
  studentId,
  plans,
  defaults = {},
}: {
  studentId: string;
  plans: PlanOption[];
  defaults?: SubscriptionFormDefaults;
}) {
  const action = upsertStudentSubscriptionAction.bind(null, studentId);
  const [state, formAction, pending] = useActionState<SubFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-start gap-3 border border-danger/40 bg-danger/10 rounded-lg p-3 text-sm text-bone">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="border border-success/40 bg-success/10 rounded-lg p-3 text-sm text-success">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="plan_id" className={labelClass}>
          Plan
        </label>
        <select
          id="plan_id"
          name="plan_id"
          required
          defaultValue={defaults.plan_id ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Selecciona un plan…
          </option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.credits_per_month !== null
                ? ` · ${p.credits_per_month} créditos/mes`
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="credits_total" className={labelClass}>
            Créditos del ciclo
          </label>
          <input
            id="credits_total"
            name="credits_total"
            type="number"
            min={0}
            required
            defaultValue={defaults.credits_total ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="credits_remaining" className={labelClass}>
            Créditos disponibles
          </label>
          <input
            id="credits_remaining"
            name="credits_remaining"
            type="number"
            min={0}
            defaultValue={defaults.credits_remaining ?? ""}
            placeholder="Igual a totales si lo dejas vacío"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cycle_start_at" className={labelClass}>
            Inicio del ciclo
          </label>
          <input
            id="cycle_start_at"
            name="cycle_start_at"
            type="date"
            required
            defaultValue={defaults.cycle_start_at ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cycle_end_at" className={labelClass}>
            Fin del ciclo
          </label>
          <input
            id="cycle_end_at"
            name="cycle_end_at"
            type="date"
            required
            defaultValue={defaults.cycle_end_at ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        {pending ? "Guardando…" : "Guardar suscripción"}
      </button>
    </form>
  );
}
