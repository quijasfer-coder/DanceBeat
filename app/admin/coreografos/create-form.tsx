"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import {
  createTeacherAction,
  type AdminFormState,
} from "@/app/admin/actions";

const inputClass =
  "w-full bg-ink border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";
const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";
const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";

export function CreateTeacherForm() {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    createTeacherAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className={inputClass}
            placeholder="Ej. Andrea López"
          />
          <p className={helpClass}>
            Se mostrará en la página de cada clase y en su panel de profesor.
          </p>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="andrea@dancebeat.studio"
          />
          <p className={helpClass}>
            Le llega un correo de <strong className="text-bone">"Ahora eres profesor/a en Dance Beat"</strong>{" "}
            con el link para crear su contraseña (o entrar directo si ya
            tenía cuenta) y capturar su contacto de emergencia. Se promueve a
            rol <span className="text-lumen">teacher</span> automáticamente.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="bio_internal" className={labelClass}>
          Notas internas (opcional)
        </label>
        <textarea
          id="bio_internal"
          name="bio_internal"
          rows={2}
          className={inputClass + " resize-y"}
          placeholder="Apuntes que solo ve el equipo administrativo."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="photo_url" className={labelClass}>
            Foto (URL, opcional)
          </label>
          <input
            id="photo_url"
            name="photo_url"
            type="url"
            className={inputClass}
            placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="hire_date" className={labelClass}>
            Fecha de alta (opcional)
          </label>
          <input
            id="hire_date"
            name="hire_date"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {pending ? "Guardando..." : "Agregar coreógrafo"}
      </button>
    </form>
  );
}
