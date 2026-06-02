"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Plus, Trash2, User } from "lucide-react";
import {
  createStudentsAction,
  type OnboardingState,
  type StudentInput,
} from "@/app/app/actions";
import { cn } from "@/lib/utils";

type Props = {
  accountHolderName: string;
  accountHolderPhone: string;
};

type EnrollmentType = "self" | "kids" | "both";

type StudentDraft = {
  id: string; // local-only id
  full_name: string;
  birthdate: string;
  phone: string;
  school: string;
  grade: string;
  notes: string;
};

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";

const newDraft = (): StudentDraft => ({
  id: crypto.randomUUID(),
  full_name: "",
  birthdate: "",
  phone: "",
  school: "",
  grade: "",
  notes: "",
});

export function OnboardingForm({
  accountHolderName,
  accountHolderPhone,
}: Props) {
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType>("kids");
  const [selfBirthdate, setSelfBirthdate] = useState("");
  const [selfNotes, setSelfNotes] = useState("");
  const [kids, setKids] = useState<StudentDraft[]>([newDraft()]);

  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createStudentsAction,
    null,
  );

  const wantsSelf = enrollmentType === "self" || enrollmentType === "both";
  const wantsKids = enrollmentType === "kids" || enrollmentType === "both";

  const updateKid = (id: string, field: keyof StudentDraft, value: string) => {
    setKids((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k)),
    );
  };

  const addKid = () => setKids((prev) => [...prev, newDraft()]);
  const removeKid = (id: string) =>
    setKids((prev) => prev.filter((k) => k.id !== id));

  // Construye el JSON que la action recibe
  const buildStudentsPayload = (): StudentInput[] => {
    const payload: StudentInput[] = [];

    if (wantsSelf) {
      payload.push({
        full_name: accountHolderName,
        birthdate: selfBirthdate,
        phone: accountHolderPhone,
        notes: selfNotes,
        is_self: true,
      });
    }

    if (wantsKids) {
      for (const k of kids) {
        if (!k.full_name.trim()) continue;
        payload.push({
          full_name: k.full_name,
          birthdate: k.birthdate,
          phone: k.phone,
          school: k.school,
          grade: k.grade,
          notes: k.notes,
          is_self: false,
        });
      }
    }

    return payload;
  };

  return (
    <form action={formAction} className="space-y-10">
      {/* ─── Paso 1: tipo de inscripción ──────────── */}
      <fieldset>
        <legend className={labelClass}>¿Quién va a tomar las clases?</legend>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { v: "self", label: "Yo", desc: "Soy adulto y voy a bailar yo." },
              {
                v: "kids",
                label: "Mis hijos",
                desc: "Voy a inscribir a mis hijos.",
              },
              {
                v: "both",
                label: "Yo y mis hijos",
                desc: "Bailamos en familia.",
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.v}
              className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all",
                enrollmentType === opt.v
                  ? "border-lumen bg-lumen/10"
                  : "border-bone-border/40 hover:border-bone-border",
              )}
            >
              <input
                type="radio"
                name="enrollment_type"
                value={opt.v}
                checked={enrollmentType === opt.v}
                onChange={() => setEnrollmentType(opt.v)}
                className="sr-only"
              />
              <p className="font-display text-lg">{opt.label}</p>
              <p className="text-xs text-bone-mute mt-1">{opt.desc}</p>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ─── Sección "Yo" ────────────────────────── */}
      {wantsSelf && (
        <section className="rounded-2xl border border-bone-border/40 p-6 bg-ink-off">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-lumen" />
            <p className="font-display text-xl">Tú — {accountHolderName}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="self_birthdate" className={labelClass}>
                Fecha de nacimiento
              </label>
              <input
                id="self_birthdate"
                type="date"
                value={selfBirthdate}
                onChange={(e) => setSelfBirthdate(e.target.value)}
                className={inputClass}
                required={wantsSelf}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label htmlFor="self_phone" className={labelClass}>
                WhatsApp (de tu cuenta)
              </label>
              <input
                id="self_phone"
                type="tel"
                value={accountHolderPhone}
                disabled
                className={inputClass + " opacity-60"}
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="self_notes" className={labelClass}>
              Notas médicas (opcional)
            </label>
            <textarea
              id="self_notes"
              rows={2}
              value={selfNotes}
              onChange={(e) => setSelfNotes(e.target.value)}
              placeholder="Lesiones, alergias, condiciones que el profesor debe saber"
              className={inputClass + " resize-y"}
            />
          </div>
        </section>
      )}

      {/* ─── Sección "Hijos" ──────────────────────── */}
      {wantsKids && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-lumen">
              Hijos · {kids.length}
            </p>
            <button
              type="button"
              onClick={addKid}
              className="inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar otro hijo
            </button>
          </div>

          <div className="space-y-6">
            {kids.map((k, idx) => (
              <div
                key={k.id}
                className="rounded-2xl border border-bone-border/40 p-6 bg-ink-off space-y-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl">Hijo #{idx + 1}</p>
                  {kids.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKid(k.id)}
                      className="text-bone-mute hover:text-danger transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Nombre completo</label>
                  <input
                    type="text"
                    value={k.full_name}
                    onChange={(e) =>
                      updateKid(k.id, "full_name", e.target.value)
                    }
                    className={inputClass}
                    placeholder="María García López"
                    required={wantsKids}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={k.birthdate}
                      onChange={(e) =>
                        updateKid(k.id, "birthdate", e.target.value)
                      }
                      className={inputClass}
                      required={wantsKids}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Teléfono propio (opcional)
                    </label>
                    <input
                      type="tel"
                      value={k.phone}
                      onChange={(e) => updateKid(k.id, "phone", e.target.value)}
                      className={inputClass}
                      placeholder="55 1234 5678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Escuela</label>
                    <input
                      type="text"
                      value={k.school}
                      onChange={(e) =>
                        updateKid(k.id, "school", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Cumbres International School"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Grado</label>
                    <input
                      type="text"
                      value={k.grade}
                      onChange={(e) => updateKid(k.id, "grade", e.target.value)}
                      className={inputClass}
                      placeholder="3° de primaria"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Notas médicas (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={k.notes}
                    onChange={(e) => updateKid(k.id, "notes", e.target.value)}
                    placeholder="Lesiones, alergias, condiciones que el profesor debe saber"
                    className={inputClass + " resize-y"}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Tutor info — solo lectura ──────────── */}
      {wantsKids && (
        <section className="rounded-2xl border border-bone-border/30 bg-lumen/5 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-3">
            Datos del tutor (tu cuenta)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-bone-mute text-xs">Nombre</p>
              <p className="text-bone">{accountHolderName}</p>
            </div>
            <div>
              <p className="text-bone-mute text-xs">WhatsApp</p>
              <p className="text-bone">{accountHolderPhone || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-bone-mute mt-4">
            Las notificaciones de tus hijos llegan a este número y al email de
            tu cuenta. Para editar estos datos ve a tu perfil.
          </p>
        </section>
      )}

      {/* Hidden input con payload JSON */}
      <input
        type="hidden"
        name="students_json"
        value={JSON.stringify(buildStudentsPayload())}
      />

      {state?.error && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group w-full inline-flex items-center justify-center gap-2 bg-bone text-ink px-6 py-3.5 rounded-full font-medium hover:bg-lumen transition-colors disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Continuar"}
        {!pending && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        )}
      </button>
    </form>
  );
}
