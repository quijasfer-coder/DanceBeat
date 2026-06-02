"use client";

import { useActionState } from "react";
import { AlertCircle, Save } from "lucide-react";
import { updatePlanAction, type AdminFormState } from "@/app/admin/actions";

type Props = {
  planId: string;
  initial: {
    name: string;
    tagline: string;
    price_mxn: number;
    cadence: string;
    classes_per_week: number | null;
    credits_per_month: number | null;
    perks: string[];
    featured: boolean;
    is_active: boolean;
  };
};

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";

export function EditPlanForm({ planId, initial }: Props) {
  const action = updatePlanAction.bind(null, planId);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre del plan
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initial.name}
          className={inputClass}
          required
        />
        <p className={helpClass}>
          Es el título grande del plan en <strong className="text-bone">/planes</strong>{" "}
          y en el preview del Home. También aparece en el botón "Elegir [nombre]"
          y en el banner de "plan seleccionado" durante el registro.
        </p>
      </div>

      <div>
        <label htmlFor="tagline" className={labelClass}>
          Tagline
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          defaultValue={initial.tagline}
          placeholder="Ej. 3 clases por semana"
          className={inputClass}
        />
        <p className={helpClass}>
          Frase corta arriba del nombre del plan. Resume en una línea para
          quién es este plan. Si lo dejas vacío, no se muestra nada.
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
            defaultValue={initial.price_mxn}
            className={inputClass}
            required
          />
          <p className={helpClass}>
            Precio en pesos mexicanos sin centavos. Ejemplo: <code>2800</code>{" "}
            = $2,800 MXN. Es lo que se cobra cada periodo (mes o clase) y lo
            que Stripe procesará cuando se conecte el pago.
          </p>
        </div>
        <div>
          <label htmlFor="cadence" className={labelClass}>
            Cadencia
          </label>
          <select
            id="cadence"
            name="cadence"
            defaultValue={initial.cadence}
            className={inputClass}
          >
            <option value="/mes">/mes</option>
            <option value="/clase">/clase</option>
          </select>
          <p className={helpClass}>
            Aparece junto al precio (ej. "$2,800 <strong className="text-bone">/mes</strong>").
            Usa <code>/mes</code> para suscripciones mensuales y{" "}
            <code>/clase</code> solo para drop-in (Single Beat).
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
            defaultValue={initial.classes_per_week ?? ""}
            placeholder="Ej. 3"
            className={inputClass}
          />
          <p className={helpClass}>
            Solo es información de referencia (se muestra en el dashboard del
            alumno como "≈ 3/sem"). NO impone un límite semanal — el alumno
            puede distribuir sus créditos como quiera. Déjalo vacío para
            drop-in.
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
            defaultValue={initial.credits_per_month ?? ""}
            placeholder="Ej. 12"
            className={inputClass}
          />
          <p className={helpClass}>
            Cuántas reservas puede hacer el alumno cada ciclo mensual.{" "}
            <strong className="text-bone">Cada reserva resta 1 crédito</strong>.
            Si cancela ≥12h antes, el crédito se devuelve. Al cierre del ciclo
            se reinician al total. Convención: clases/semana × 4. Déjalo vacío
            para drop-in.
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
          defaultValue={initial.perks.join("\n")}
          placeholder={`Ej:\n12 créditos al mes\nCualquier estilo\nLista de espera prioritaria`}
          className={inputClass + " resize-y font-mono text-xs"}
        />
        <p className={helpClass}>
          Cada línea se vuelve un punto con check verde en la card del plan
          (visible en <strong className="text-bone">/planes</strong> y en el
          preview del Home). El primer beneficio idealmente menciona los
          créditos. Mantenlos cortos — máximo una línea cada uno.
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial.featured}
              className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
            />
            <span className="text-sm">Plan destacado</span>
          </label>
          <p className={helpClass + " ml-7"}>
            Marca este plan visualmente como "Más popular". Se muestra con
            fondo Lumen y un poco más grande que los demás. Solo debería haber
            uno destacado a la vez (si activas dos, ambos se ven destacados
            sin orden definido).
          </p>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial.is_active}
              className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
            />
            <span className="text-sm">Plan activo</span>
          </label>
          <p className={helpClass + " ml-7"}>
            Si lo desactivas, desaparece de <strong className="text-bone">/planes</strong>
            {" "}y del preview del Home, pero los alumnos que ya estaban
            suscritos lo conservan hasta el fin de su ciclo. Útil para
            descontinuar un plan sin afectar a quienes ya lo pagaron.
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
          <Save className="w-4 h-4" />
          {pending ? "Guardando..." : "Guardar cambios"}
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
