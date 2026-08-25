"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Save } from "lucide-react";
import { adminCreateStudentAction, type AdminNewStudentState } from "./actions";

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-1";

type AccountOption = { id: string; full_name: string; email: string };

export function AdminNewStudentForm({
  accountOptions,
  preselectedAccount,
  returnTo,
}: {
  accountOptions: AccountOption[];
  preselectedAccount: AccountOption | null;
  returnTo: string;
}) {
  const [state, formAction, pending] = useActionState<
    AdminNewStudentState,
    FormData
  >(adminCreateStudentAction, null);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="return_to" value={returnTo} />

      <div>
        <label className={labelClass}>Cuenta / titular</label>
        {preselectedAccount ? (
          <div className="rounded-lg border border-bone-border/40 bg-ink-surface px-4 py-2.5 text-sm">
            <p className="text-bone">{preselectedAccount.full_name}</p>
            <p className="text-bone-mute text-xs mt-0.5">
              {preselectedAccount.email}
            </p>
            <input type="hidden" name="account_id" value={preselectedAccount.id} />
          </div>
        ) : (
          <select name="account_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Buscar cuenta por nombre...
            </option>
            {accountOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} · {a.email}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="hairline" />

      <div>
        <label htmlFor="full_name" className={labelClass}>
          Nombre completo de la alumna
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
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
          <input id="school" name="school" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="grade" className={labelClass}>
            Grado
          </label>
          <input id="grade" name="grade" type="text" className={inputClass} />
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
          placeholder="Lesiones, alergias, condiciones que el profesor debe saber"
          className={inputClass + " resize-y"}
        />
      </div>

      <div className="hairline" />

      <section>
        <p className={sectionLabelClass}>Contacto de emergencia y familia (opcional)</p>
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
                placeholder="55 1234 5678"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

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
          {pending ? "Guardando..." : "Registrar alumna"}
        </button>
        <Link
          href={returnTo}
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
