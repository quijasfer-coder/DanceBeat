"use client";

import { useActionState, useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import { renewSubscriptionAction, type SubFormState } from "./actions";

type PlanOption = {
  id: string;
  name: string;
  code: string;
  credits_per_month: number | null;
  price_cents: number;
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
  suggestedAmountCents,
  lateFeeApplies,
}: {
  studentId: string;
  plans: PlanOption[];
  defaults?: SubscriptionFormDefaults;
  /** Monto sugerido para el plan por default (ya con recargo si aplica). */
  suggestedAmountCents: number | null;
  /** Si hoy ya pasó el día de corte y no hay pago de este ciclo. */
  lateFeeApplies: boolean;
}) {
  const action = renewSubscriptionAction.bind(null, studentId);
  const [state, formAction, pending] = useActionState<SubFormState, FormData>(
    action,
    null,
  );

  const plansById = new Map(plans.map((p) => [p.id, p]));
  const [planId, setPlanId] = useState(defaults.plan_id ?? "");
  const [amountMxn, setAmountMxn] = useState(() =>
    suggestedAmountCents !== null ? (suggestedAmountCents / 100).toFixed(2) : "",
  );

  const applyPlanDefaults = (id: string) => {
    setPlanId(id);
    const plan = plansById.get(id);
    if (!plan) return;
    const base = plan.price_cents;
    const withLateFee = lateFeeApplies ? Math.round(base * 1.1) : base;
    setAmountMxn((withLateFee / 100).toFixed(2));
  };

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
          value={planId}
          onChange={(e) => applyPlanDefaults(e.target.value)}
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

      <div className="hairline" />

      <div>
        <label htmlFor="payment_method" className={labelClass}>
          Método de pago
        </label>
        <select
          id="payment_method"
          name="payment_method"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="tpv">TPV (terminal)</option>
        </select>
      </div>

      <div>
        <label htmlFor="amount_mxn" className={labelClass}>
          Monto cobrado (MXN)
          {lateFeeApplies && (
            <span className="text-warning normal-case tracking-normal">
              {" "}
              — incluye 10% de recargo por pago después del día de corte
            </span>
          )}
        </label>
        <input
          id="amount_mxn"
          name="amount_mxn"
          type="number"
          min="0"
          step="0.01"
          required
          value={amountMxn}
          onChange={(e) => setAmountMxn(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-bone-mute mt-2">
          Precargado con el precio del plan{lateFeeApplies ? " + recargo" : ""}. Ajústalo si negociaste otro monto.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        {pending ? "Guardando…" : "Renovar y registrar pago"}
      </button>
    </form>
  );
}
