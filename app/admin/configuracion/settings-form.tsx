"use client";

import { useActionState } from "react";
import { AlertCircle, Save } from "lucide-react";
import {
  updateSettingsAction,
  type AdminFormState,
} from "@/app/admin/actions";

type Props = {
  initial: {
    enrollment_fee_mxn: number;
    late_fee_pct: number;
    late_fee_day_of_month: number;
    cancel_window_hours: number;
    cycle_length_weeks: number;
  };
};

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-2";

export function SettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    updateSettingsAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-12">
      {/* ─── COBRANZA ─────────────────────────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Cobranza</p>
        <p className="text-xs text-bone-mute mb-8">
          Reglas que aplica Stripe al cobrar.
        </p>

        <div className="space-y-7">
          <div>
            <label htmlFor="enrollment_fee_mxn" className={labelClass}>
              Inscripción única (MXN)
            </label>
            <input
              id="enrollment_fee_mxn"
              name="enrollment_fee_mxn"
              type="number"
              min="0"
              step="50"
              defaultValue={initial.enrollment_fee_mxn}
              className={inputClass}
              required
            />
            <p className={helpClass}>
              Cuota única que se cobra al alta. Aparece en la página{" "}
              <strong className="text-bone">/planes</strong> arriba de los 6
              planes y en el banner del registro de cada plan. No se vuelve a
              cobrar mientras la cuenta siga activa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="late_fee_pct" className={labelClass}>
                Recargo por mora (%)
              </label>
              <input
                id="late_fee_pct"
                name="late_fee_pct"
                type="number"
                min="0"
                max="1"
                step="0.01"
                defaultValue={initial.late_fee_pct}
                className={inputClass}
                required
              />
              <p className={helpClass}>
                Decimal (ej. <code>0.10</code> = 10%). Aplica sobre el monto
                del plan cuando se paga después del día configurado.
              </p>
            </div>
            <div>
              <label htmlFor="late_fee_day_of_month" className={labelClass}>
                Día límite del mes
              </label>
              <input
                id="late_fee_day_of_month"
                name="late_fee_day_of_month"
                type="number"
                min="1"
                max="28"
                defaultValue={initial.late_fee_day_of_month}
                className={inputClass}
                required
              />
              <p className={helpClass}>
                Día del mes a partir del cual se aplica el recargo. Pagar
                antes = sin recargo. Máximo 28 para evitar problemas con
                febrero.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="hairline" />

      {/* ─── RESERVAS ─────────────────────────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Reservas</p>
        <p className="text-xs text-bone-mute mb-8">
          Reglas operativas del sistema de reservas y créditos.
        </p>

        <div className="space-y-7">
          <div>
            <label htmlFor="cancel_window_hours" className={labelClass}>
              Ventana de cancelación (horas)
            </label>
            <input
              id="cancel_window_hours"
              name="cancel_window_hours"
              type="number"
              min="0"
              max="72"
              defaultValue={initial.cancel_window_hours}
              className={inputClass}
              required
            />
            <p className={helpClass}>
              Horas antes de la clase para cancelar y recuperar el crédito.
              Cancelar con menos tiempo libera el cupo pero el crédito se
              quema. Default: 12. Subirlo es más estricto con la alumna,
              bajarlo es más laxo.
            </p>
          </div>

          <div>
            <label htmlFor="cycle_length_weeks" className={labelClass}>
              Duración del ciclo mensual (semanas)
            </label>
            <input
              id="cycle_length_weeks"
              name="cycle_length_weeks"
              type="number"
              min="1"
              max="8"
              defaultValue={initial.cycle_length_weeks}
              className={inputClass}
              required
            />
            <p className={helpClass}>
              Cada cuántas semanas se reinician los créditos del plan. Default
              4 (≈ mes calendario). Cambiar esto afecta cómo se calculan los
              créditos al inicio de cada nueva suscripción.
            </p>
          </div>
        </div>
      </section>

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 sticky bottom-0 bg-ink py-4 -mx-10 px-10 border-t border-bone-border/30">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {pending ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
