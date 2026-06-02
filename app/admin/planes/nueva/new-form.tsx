"use client";

import { useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { createPlanAction, type AdminFormState } from "@/app/admin/actions";

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";

export function NewPlanForm() {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    createPlanAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="code" className={labelClass}>
            Código (slug único)
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            pattern="[a-z0-9_\-]+"
            placeholder="impulse"
            className={inputClass + " font-mono"}
          />
          <p className={helpClass}>
            Identificador interno. Solo minúsculas, números, guiones o guiones
            bajos. <strong className="text-bone">No se puede cambiar después</strong>{" "}
            — elígelo bien.
          </p>
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            Nombre visible
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Impulse"
            className={inputClass}
          />
          <p className={helpClass}>
            Cómo se muestra en <strong className="text-bone">/planes</strong>{" "}
            y en el preview del Home.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="tagline" className={labelClass}>
          Tagline (opcional)
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          placeholder="Ej. 1.5 clases por semana"
          className={inputClass}
        />
        <p className={helpClass}>
          Frase corta debajo del nombre. Resume para quién es el plan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="price_mxn" className={labelClass}>
            Precio (MXN)
          </label>
          <input
            id="price_mxn"
            name="price_mxn"
            type="number"
            min="0"
            step="50"
            required
            placeholder="1500"
            className={inputClass}
          />
          <p className={helpClass}>
            En pesos sin centavos. Ej. <code>1500</code> = $1,500 MXN.
          </p>
        </div>
        <div>
          <label htmlFor="cadence" className={labelClass}>
            Cadencia
          </label>
          <select
            id="cadence"
            name="cadence"
            defaultValue="/mes"
            className={inputClass}
          >
            <option value="/mes">/mes</option>
            <option value="/clase">/clase</option>
          </select>
          <p className={helpClass}>
            Aparece junto al precio. <code>/mes</code> para suscripciones,{" "}
            <code>/clase</code> solo para drop-in.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="classes_per_week" className={labelClass}>
            Clases por semana (informativo)
          </label>
          <input
            id="classes_per_week"
            name="classes_per_week"
            type="number"
            min="0"
            placeholder="2"
            className={inputClass}
          />
          <p className={helpClass}>
            Solo es referencia visual ("≈ 2/sem"). NO impone límite semanal.
            Déjalo vacío para drop-in.
          </p>
        </div>
        <div>
          <label htmlFor="credits_per_month" className={labelClass}>
            Créditos al mes (CRÍTICO)
          </label>
          <input
            id="credits_per_month"
            name="credits_per_month"
            type="number"
            min="0"
            placeholder="6"
            className={inputClass}
          />
          <p className={helpClass}>
            Cuántas reservas puede hacer el alumno cada ciclo.{" "}
            <strong className="text-bone">Cada reserva resta 1</strong>.
            Convención: clases/semana × 4. Vacío = drop-in.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="perks" className={labelClass}>
          Beneficios (uno por línea)
        </label>
        <textarea
          id="perks"
          name="perks"
          rows={6}
          placeholder={`Ej:\n6 créditos al mes\nCualquier estilo\nCancela hasta 12 horas antes`}
          className={inputClass + " resize-y font-mono text-xs"}
        />
        <p className={helpClass}>
          Cada línea es un punto con check verde en la card del plan. Mantenlos
          cortos.
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
            />
            <span className="text-sm">Plan destacado</span>
          </label>
          <p className={helpClass + " ml-7"}>
            Si lo marcas, este plan aparece resaltado como "Más popular". Solo
            uno debe estar destacado a la vez.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
            />
            <span className="text-sm">Plan activo</span>
          </label>
          <p className={helpClass + " ml-7"}>
            Si lo dejas activo, aparece en{" "}
            <strong className="text-bone">/planes</strong> de inmediato. Puedes
            crearlo desactivado y activarlo después cuando esté listo.
          </p>
        </div>
      </div>

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
          <Plus className="w-4 h-4" />
          {pending ? "Creando..." : "Crear plan"}
        </button>
        <a
          href="/admin/planes"
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
