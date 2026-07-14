"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Save, AlertCircle, Check } from "lucide-react";
import {
  createClassAction,
  type AdminFormState,
} from "@/app/admin/actions";
import type { Database } from "@/lib/database.types";
import { CoverUploader } from "../cover-uploader";
import { cn } from "@/lib/utils";

type DanceLevel = Database["public"]["Enums"]["dance_level"];

const dayOptions = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const levelOptions: { value: DanceLevel; label: string }[] = [
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
  { value: "abierto", label: "Abierto a todos los niveles" },
];

const inputClass =
  "w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors";
const labelClass =
  "block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2";
const helpClass = "text-xs text-bone-mute mt-2 leading-relaxed";
const sectionLabelClass =
  "font-mono text-[10px] uppercase tracking-[0.3em] text-lumen mb-2";

function DayPicker({ selected, onChange }: { selected: number[]; onChange: (days: number[]) => void }) {
  function toggle(val: number) {
    onChange(
      selected.includes(val) ? selected.filter((d) => d !== val) : [...selected, val],
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {dayOptions.map((d) => {
        const active = selected.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            className={cn(
              "relative px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
              active
                ? "bg-lumen text-ink border-lumen"
                : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
            )}
          >
            {active && <Check className="inline w-3 h-3 mr-1.5 -mt-0.5" />}
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

export function NewClassForm({
  styles,
  studios,
  teachers,
}: {
  styles: { id: string; name: string; slug: string }[];
  studios: { id: string; name: string }[];
  teachers: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState<
    AdminFormState,
    FormData
  >(createClassAction, null);
  const [mode, setMode] = useState<"existing" | "new">(
    styles.length === 0 ? "new" : "existing",
  );
  const [newName, setNewName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);

  const slugFromName = newName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <form action={formAction} className="space-y-12">
      {/* ─── ESTILO ─────────────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Estilo</p>
        <p className="text-xs text-bone-mute mb-6">
          Cada clase pertenece a un estilo (Jazz, Heels, etc.). Si la clase
          que vas a crear es un horario más de un estilo existente, elige
          esa opción. Si es un estilo completamente nuevo, créalo aquí.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={styles.length === 0}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-colors",
              mode === "existing"
                ? "bg-bone text-ink border-bone"
                : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
              styles.length === 0 && "opacity-40 cursor-not-allowed",
            )}
          >
            Usar estilo existente
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-colors",
              mode === "new"
                ? "bg-bone text-ink border-bone"
                : "border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone",
            )}
          >
            Crear estilo nuevo
          </button>
        </div>

        <input type="hidden" name="style_mode" value={mode} />

        {mode === "existing" ? (
          <div>
            <label htmlFor="style_id" className={labelClass}>
              Estilo
            </label>
            <select
              id="style_id"
              name="style_id"
              defaultValue=""
              className={inputClass}
              required
            >
              <option value="" disabled>
                Selecciona un estilo…
              </option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className={helpClass}>
              Estás creando un horario adicional para un estilo que ya
              existe (ej. "Jazz" pero el martes a las 19:00).
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            <div>
              <label htmlFor="style_new_name" className={labelClass}>
                Nombre del estilo
              </label>
              <input
                id="style_new_name"
                name="style_new_name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Jazz, Heels, Hip-Hop"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="style_new_slug" className={labelClass}>
                Slug (URL)
              </label>
              <input
                id="style_new_slug"
                name="style_new_slug"
                type="text"
                placeholder={slugFromName || "se-genera-del-nombre"}
                className={inputClass}
              />
              <p className={helpClass}>
                Aparece en la URL pública{" "}
                <code className="text-bone">/clases/{slugFromName || "slug"}</code>.
                Si lo dejas vacío se genera del nombre. Solo letras
                minúsculas, números y guiones.
              </p>
            </div>

            <div>
              <label htmlFor="style_new_tagline" className={labelClass}>
                Tagline
              </label>
              <input
                id="style_new_tagline"
                name="style_new_tagline"
                type="text"
                maxLength={120}
                placeholder="Frase corta debajo del nombre. Máx 120 caracteres."
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="style_new_description" className={labelClass}>
                Descripción larga
              </label>
              <textarea
                id="style_new_description"
                name="style_new_description"
                rows={4}
                placeholder="Para la página de detalle del estilo."
                className={inputClass + " resize-y"}
              />
            </div>

            <div>
              <label htmlFor="style_new_age_range" className={labelClass}>
                Edad recomendada (texto visible)
              </label>
              <input
                id="style_new_age_range"
                name="style_new_age_range"
                type="text"
                placeholder="Ej. 18 a 30 años · Adultos 35+"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Portada</label>
              <CoverUploader
                name="style_new_cover_url"
                fileNamePrefix={slugFromName || "estilo"}
              />
              <p className={helpClass}>
                Imagen que aparece en la card del catálogo y en el hero de
                la página de detalle. Recomendado: foto vertical o 4:3 con
                buena composición.
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="hairline" />

      {/* ─── PROGRAMACIÓN ─────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Programación</p>
        <p className="text-xs text-bone-mute mb-6">
          Cuándo, dónde y con quién se imparte esta clase.
        </p>

        <div className="space-y-7">
          <div>
            <label htmlFor="studio_id" className={labelClass}>
              Sucursal
            </label>
            <select
              id="studio_id"
              name="studio_id"
              defaultValue=""
              className={inputClass}
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="teacher_id" className={labelClass}>
              Coreógrafo
            </label>
            <select
              id="teacher_id"
              name="teacher_id"
              defaultValue="none"
              className={inputClass}
            >
              <option value="none">— Sin asignar —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelClass}>Días de la semana</label>
              <DayPicker selected={selectedDays} onChange={setSelectedDays} />
              {selectedDays.map((d) => (
                <input key={d} type="hidden" name="days_of_week" value={d} />
              ))}
              {selectedDays.length === 0 && (
                <p className="text-xs text-danger mt-2">Selecciona al menos un día.</p>
              )}
              <p className={helpClass}>
                Selecciona todos los días en que se imparte esta clase a la misma hora.
                Se creará un registro por cada día automáticamente.{" "}
                <strong className="text-bone">
                  Si la misma clase se da en días distintos con diferente horario,
                  debes crearla por separado.
                </strong>
              </p>
            </div>
            <div>
              <label htmlFor="starts_at_time" className={labelClass}>
                Hora de inicio
              </label>
              <input
                id="starts_at_time"
                name="starts_at_time"
                type="time"
                defaultValue="19:00"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="duration_min" className={labelClass}>
                Duración (min)
              </label>
              <input
                id="duration_min"
                name="duration_min"
                type="number"
                min="15"
                max="240"
                step="15"
                defaultValue={60}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="capacity" className={labelClass}>
                Cupo máximo
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                defaultValue={12}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="level" className={labelClass}>
              Nivel
            </label>
            <select
              id="level"
              name="level"
              defaultValue="abierto"
              className={inputClass}
              required
            >
              {levelOptions.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="age_min" className={labelClass}>
                Edad mínima (opcional)
              </label>
              <input
                id="age_min"
                name="age_min"
                type="number"
                min="0"
                placeholder="Ej. 18"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="age_max" className={labelClass}>
                Edad máxima (opcional)
              </label>
              <input
                id="age_max"
                name="age_max"
                type="number"
                min="0"
                placeholder="Ej. 30"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
              />
              <span className="text-sm">Activar inmediatamente</span>
            </label>
            <p className={helpClass + " ml-7"}>
              Si la dejas activa, aparece en el catálogo público al guardar.
              Si no, queda en borrador y solo se ve desde admin.
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
          {pending ? "Creando…" : "Crear clase"}
        </button>
        <Link
          href="/admin/clases"
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
