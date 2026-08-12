"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Save } from "lucide-react";
import {
  updateStudentAction,
  type UpdateStudentState,
} from "@/app/app/actions";
import { CurpUploader } from "@/app/app/onboarding/curp-uploader";
import { StudentPhotoUploader } from "@/app/app/onboarding/student-photo-uploader";
import type { Database } from "@/lib/database.types";

type Student = Database["public"]["Tables"]["students"]["Row"];

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-1";

export function EditStudentForm({
  accountId,
  student,
  curpViewUrl,
}: {
  accountId: string;
  student: Student;
  /** Signed URL del PDF de CURP ya subido, si existe. */
  curpViewUrl: string | null;
}) {
  const action = updateStudentAction.bind(null, student.id);
  const [state, formAction, pending] = useActionState<
    UpdateStudentState,
    FormData
  >(action, null);

  const [photoUrl, setPhotoUrl] = useState(student.photo_url ?? "");
  const [curpPath, setCurpPath] = useState(student.curp_pdf_path ?? "");
  const [consent, setConsent] = useState(student.photo_video_consent);

  return (
    <form action={formAction} className="space-y-10">
      <div>
        <label className={labelClass}>Foto de perfil</label>
        <StudentPhotoUploader
          fileNamePrefix={student.full_name}
          initialUrl={student.photo_url}
          onChange={(u) => setPhotoUrl(u ?? "")}
        />
        <input type="hidden" name="photo_url" value={photoUrl} />
      </div>

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
            Teléfono propio (opcional)
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
          Notas médicas (opcional)
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

      <div>
        <label className={labelClass}>CURP (PDF, opcional)</label>
        <CurpUploader
          accountId={accountId}
          fileNamePrefix={student.full_name}
          initialViewUrl={curpViewUrl}
          onChange={(p) => setCurpPath(p ?? "")}
        />
        <input type="hidden" name="curp_pdf_path" value={curpPath} />
      </div>

      <div className="hairline" />

      <section>
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
      </section>

      <div className="hairline" />

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="photo_video_consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer shrink-0"
        />
        <span className="text-sm text-bone-mute leading-relaxed">
          Estoy de acuerdo con que la academia de baile &ldquo;Dance
          Beat&rdquo; realice fotografías y grabaciones de video en las
          diversas actividades relacionadas con la academia de baile, al
          igual que la publicación de las mismas en las distintas redes
          sociales y pagina web de la academia de baile &ldquo;Dance
          Beat&rdquo;, entendiendo que son accesibles a cualquier persona
          conectada a internet.
        </span>
      </label>

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        <Link
          href="/app"
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
