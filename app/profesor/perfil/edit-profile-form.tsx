"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import {
  updateOwnTeacherProfileAction,
  type ProfesorActionState,
} from "@/app/profesor/actions";
import { TeacherPhotoUploader } from "./teacher-photo-uploader";

const inputClass =
  "w-full bg-ink border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";
const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";
const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-2";

export function EditProfileForm({
  teacher,
}: {
  teacher: {
    full_name: string;
    photo_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState<
    ProfesorActionState,
    FormData
  >(updateOwnTeacherProfileAction, null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(teacher.photo_url);

  return (
    <form action={formAction} className="space-y-10">
      <section>
        <p className={sectionLabelClass}>Foto</p>
        <TeacherPhotoUploader
          fileNamePrefix={teacher.full_name}
          initialUrl={teacher.photo_url}
          onChange={setPhotoUrl}
        />
        <input type="hidden" name="photo_url" value={photoUrl ?? ""} />
      </section>

      <div className="hairline" />

      <section>
        <p className={sectionLabelClass}>Datos personales</p>
        <div className="mt-4">
          <label htmlFor="full_name" className={labelClass}>
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={teacher.full_name}
            className={inputClass}
          />
        </div>
      </section>

      <div className="hairline" />

      <section>
        <p className={sectionLabelClass}>Contacto de emergencia</p>
        <p className="text-xs text-bone-mute mb-4 max-w-md">
          A quién contactar si pasa algo durante una clase. Solo lo ve el
          equipo administrativo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="emergency_contact_name" className={labelClass}>
              Nombre
            </label>
            <input
              id="emergency_contact_name"
              name="emergency_contact_name"
              type="text"
              defaultValue={teacher.emergency_contact_name ?? ""}
              placeholder="Ej. Ana Pérez (mamá)"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emergency_contact_phone" className={labelClass}>
              Teléfono
            </label>
            <input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              type="tel"
              defaultValue={teacher.emergency_contact_phone ?? ""}
              placeholder="55 1234 5678"
              className={inputClass}
            />
          </div>
        </div>
      </section>

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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
