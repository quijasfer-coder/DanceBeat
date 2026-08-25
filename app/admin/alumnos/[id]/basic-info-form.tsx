"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Pencil, Save, X } from "lucide-react";
import {
  adminUpdateStudentAction,
  type AdminUpdateStudentState,
} from "./actions";
import type { Database } from "@/lib/database.types";

type Student = Database["public"]["Tables"]["students"]["Row"];

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-1";

export function BasicInfoForm({ student }: { student: Student }) {
  const [editing, setEditing] = useState(false);
  const action = adminUpdateStudentAction.bind(null, student.id);
  const [state, formAction, pending] = useActionState<
    AdminUpdateStudentState,
    FormData
  >(action, null);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  if (!editing) {
    const hasGaps =
      !student.school &&
      !student.grade &&
      !student.emergency_contact_name &&
      !student.mother_name &&
      !student.father_name;

    return (
      <section className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Datos básicos
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs text-lumen hover:underline"
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        </div>
        {state?.success && (
          <p className="flex items-center gap-1.5 text-xs text-success mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {state.success}
          </p>
        )}
        {hasGaps && (
          <p className="text-xs text-warning italic">
            Faltan datos (escuela, contacto de emergencia o familia) — común
            cuando el padre no completó el registro solo.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Editar datos básicos
        </p>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cerrar
        </button>
      </div>

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={student.full_name}
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="birthdate" className={labelClass}>
              Fecha de nacimiento
            </label>
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={student.birthdate}
              className={inputClass}
              required
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Teléfono propio
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={student.phone ?? ""}
              placeholder="55 1234 5678"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="school" className={labelClass}>
              Escuela
            </label>
            <input
              id="school"
              name="school"
              type="text"
              defaultValue={student.school ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="grade" className={labelClass}>
              Grado
            </label>
            <input
              id="grade"
              name="grade"
              type="text"
              defaultValue={student.grade ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notas médicas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={student.notes ?? ""}
            placeholder="Lesiones, alergias, condiciones que el profesor debe saber"
            className={inputClass + " resize-y"}
          />
        </div>

        <div className="hairline" />

        <div>
          <p className={sectionLabelClass}>Contacto de emergencia y familia</p>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="emergency_contact_name" className={labelClass}>
                  Contacto de emergencia — nombre
                </label>
                <input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  type="text"
                  defaultValue={student.emergency_contact_name ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="emergency_contact_phone" className={labelClass}>
                  Contacto de emergencia — teléfono
                </label>
                <input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  type="tel"
                  defaultValue={student.emergency_contact_phone ?? ""}
                  placeholder="55 1234 5678"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="mother_name" className={labelClass}>
                  Nombre de mamá
                </label>
                <input
                  id="mother_name"
                  name="mother_name"
                  type="text"
                  defaultValue={student.mother_name ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="mother_phone" className={labelClass}>
                  Teléfono de mamá
                </label>
                <input
                  id="mother_phone"
                  name="mother_phone"
                  type="tel"
                  defaultValue={student.mother_phone ?? ""}
                  placeholder="55 1234 5678"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="father_name" className={labelClass}>
                  Nombre de papá
                </label>
                <input
                  id="father_name"
                  name="father_name"
                  type="text"
                  defaultValue={student.father_name ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="father_phone" className={labelClass}>
                  Teléfono de papá
                </label>
                <input
                  id="father_phone"
                  name="father_phone"
                  type="tel"
                  defaultValue={student.father_phone ?? ""}
                  placeholder="55 1234 5678"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {state.error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </section>
  );
}
