"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import {
  createEventAction,
  updateEventAction,
  type EventFormState,
} from "./actions";
import type { Database } from "@/lib/database.types";

type EventKind = Database["public"]["Enums"]["event_kind"];

type Initial = {
  kind: EventKind;
  title: string;
  description: string | null;
  requirements: string | null;
  starts_at: string; // ISO
  ends_at: string | null;
  location: string | null;
  studio_id: string | null;
  cost_cents: number | null;
  is_published: boolean;
};

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";

const kindOptions: { value: EventKind; label: string; hint: string }[] = [
  {
    value: "rehearsal",
    label: "Ensayo extraordinario",
    hint: "Ensayo fuera del horario regular: prep para presentación o competencia.",
  },
  {
    value: "competition",
    label: "Competencia",
    hint: "Concurso o copa donde participa la academia.",
  },
  {
    value: "showcase",
    label: "Presentación",
    hint: "Show abierto al público (ej. Luminaria).",
  },
  {
    value: "other",
    label: "Otro",
    hint: "Comodín para cualquier evento que no encaje en las categorías anteriores.",
  },
];

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  // datetime-local necesita YYYY-MM-DDTHH:mm en hora local del navegador.
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  mode,
  eventId,
  initial,
  studios,
}: {
  mode: "create" | "edit";
  eventId?: string;
  initial?: Initial;
  studios: { id: string; name: string }[];
}) {
  const action =
    mode === "create"
      ? createEventAction
      : updateEventAction.bind(null, eventId!);

  const [state, formAction, pending] = useActionState<EventFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="kind" className={labelClass}>
            Tipo
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={initial?.kind ?? "rehearsal"}
            required
            className={inputClass}
          >
            {kindOptions.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <p className={helpClass}>
            Define el icono y agrupación. Define cuál usar más por categoría
            que por solemnidad.
          </p>
        </div>

        <div>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={initial?.title}
            placeholder="Ej. Ensayo Luminaria · acto 3"
            className={inputClass}
          />
          <p className={helpClass}>
            Breve y específico. Lo van a leer en su dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="starts_at" className={labelClass}>
            Inicia
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={toLocalInput(initial?.starts_at)}
            className={inputClass}
          />
          <p className={helpClass}>Hora local CDMX.</p>
        </div>

        <div>
          <label htmlFor="ends_at" className={labelClass}>
            Termina (opcional)
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.ends_at)}
            className={inputClass}
          />
          <p className={helpClass}>
            Útil para eventos largos (ensayos de varias horas, competencias de
            día completo).
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          Lugar
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={initial?.location ?? ""}
          placeholder="Ej. Teatro Esperanza Iris, Donceles 36, Centro"
          className={inputClass}
        />
        <p className={helpClass}>
          Texto libre. Si es en sede propia también selecciona la sucursal
          abajo.
        </p>
      </div>

      <div>
        <label htmlFor="studio_id" className={labelClass}>
          Sucursal (si aplica)
        </label>
        <select
          id="studio_id"
          name="studio_id"
          defaultValue={initial?.studio_id ?? "none"}
          className={inputClass}
        >
          <option value="none">— No aplica / Externo —</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción / Comunicación
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial?.description ?? ""}
          placeholder="Aquí va la información completa del evento. Qué se va a hacer, agenda del día, links a videos de referencia, contactos."
          className={inputClass + " resize-y"}
        />
        <p className={helpClass}>
          Las alumnas leen esto en su dashboard. Es el espacio para
          comunicación interna.
        </p>
      </div>

      <div>
        <label htmlFor="requirements" className={labelClass}>
          Requerimientos especiales
        </label>
        <textarea
          id="requirements"
          name="requirements"
          rows={3}
          defaultValue={initial?.requirements ?? ""}
          placeholder="Ej. Vestido negro, pelo recogido, zapatos de jazz, agua y snack."
          className={inputClass + " resize-y"}
        />
        <p className={helpClass}>
          Qué deben llevar / vestir / preparar. Se muestra resaltado en la
          vista de la alumna porque suele ser lo que olvidan.
        </p>
      </div>

      <div>
        <label htmlFor="cost_mxn" className={labelClass}>
          Costo extra (MXN)
        </label>
        <input
          id="cost_mxn"
          name="cost_mxn"
          type="number"
          min="0"
          step="50"
          defaultValue={
            initial?.cost_cents ? (initial.cost_cents / 100).toString() : ""
          }
          placeholder="Vacío o 0 = gratis"
          className={inputClass}
        />
        <p className={helpClass}>
          Si el evento tiene costo extra (vestuario, inscripción a competencia,
          etc.), captúralo aquí. Aplica parejo a todas las asignadas. Vacío o
          0 = sin costo. El cobro lo marcas a mano por alumna en el detalle.
        </p>
      </div>

      <div className="pt-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial?.is_published ?? false}
            className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
          />
          <span className="text-sm">Publicar (visible para alumnas asignadas)</span>
        </label>
        <p className={helpClass + " ml-7"}>
          Déjalo desmarcado mientras armas el evento. Cuando esté listo y
          tengas asignadas a las alumnas, márcalo para que aparezca en su{" "}
          <strong className="text-bone">/app/eventos</strong>.
        </p>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="flex items-start gap-2 text-xs text-success bg-success/10 border border-success/30 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          {state.success}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 sticky bottom-0 bg-ink py-4 -mx-10 px-10 border-t border-bone-border/30">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {pending
            ? "Guardando..."
            : mode === "create"
            ? "Crear evento"
            : "Guardar cambios"}
        </button>
        <a
          href="/admin/eventos"
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
