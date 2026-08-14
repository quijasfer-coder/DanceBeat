"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Save } from "lucide-react";
import {
  updateClassAction,
  type AdminFormState,
} from "@/app/admin/actions";
import type { Database } from "@/lib/database.types";
import { CoverUploader } from "../../cover-uploader";
import { DayPicker, dayOptions } from "../../day-picker";

type DanceLevel = Database["public"]["Enums"]["dance_level"];

type Props = {
  classId: string;
  styleId: string;
  styleSlug: string;
  initial: {
    // Style fields
    style_name: string;
    style_tagline: string | null;
    style_description: string | null;
    style_age_range: string | null;
    style_cover_url: string | null;
    // Class fields
    studio_id: string;
    teacher_id: string | null;
    day_of_week: number;
    starts_at_time: string;
    duration_min: number;
    level: DanceLevel;
    capacity: number;
    age_min: number | null;
    age_max: number | null;
    is_active: boolean;
    is_public: boolean;
  };
  studios: { id: string; name: string }[];
  teachers: { id: string; full_name: string }[];
};

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

export function EditClassForm({
  classId,
  styleId,
  styleSlug,
  initial,
  studios,
  teachers,
}: Props) {
  const action = updateClassAction.bind(null, classId, styleId, initial.day_of_week);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    null,
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([initial.day_of_week]);

  return (
    <form action={formAction} className="space-y-12">
      {/* ─── CONTENIDO PÚBLICO (styles) ─────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Contenido público</p>
        <p className="text-xs text-bone-mute mb-8">
          Lo que ven los visitantes en{" "}
          <strong className="text-bone">/clases</strong> y{" "}
          <strong className="text-bone">/clases/[estilo]</strong>. Cambios aquí
          impactan al sitio público inmediatamente.
        </p>

        <div className="space-y-7">
          <div>
            <label htmlFor="style_name" className={labelClass}>
              Nombre visible
            </label>
            <input
              id="style_name"
              name="style_name"
              type="text"
              defaultValue={initial.style_name}
              className={inputClass}
              required
            />
            <p className={helpClass}>
              Título de la clase en todo el sitio: en las cards del Home, en
              el catálogo <strong className="text-bone">/clases</strong>, en
              el hero de la página de detalle y en el calendario de{" "}
              <strong className="text-bone">/horarios</strong>.{" "}
              <span className="text-warning">
                ⚠ No cambia la URL (sigue siendo /clases/heels). Para cambiar
                la URL hay que migrar el slug — pídelo al desarrollador.
              </span>
            </p>
          </div>

          <div>
            <label htmlFor="style_tagline" className={labelClass}>
              Tagline (frase corta)
            </label>
            <input
              id="style_tagline"
              name="style_tagline"
              type="text"
              maxLength={120}
              placeholder="Ej. Disciplina, fuerza y feminidad sobre tacones."
              defaultValue={initial.style_tagline ?? ""}
              className={inputClass}
            />
            <p className={helpClass}>
              Frase corta que aparece debajo del nombre en el catálogo y en
              el hero de la página de detalle. Define el tono de la clase en
              una línea. Máximo 120 caracteres.
            </p>
          </div>

          <div>
            <label htmlFor="style_description" className={labelClass}>
              Descripción larga
            </label>
            <textarea
              id="style_description"
              name="style_description"
              rows={5}
              placeholder="Texto que aparece en la página de detalle de la clase."
              defaultValue={initial.style_description ?? ""}
              className={inputClass + " resize-y"}
            />
            <p className={helpClass}>
              Aparece solo en la página de detalle (
              <strong className="text-bone">/clases/[estilo]</strong>) bajo
              el título "Sobre la clase". Es el espacio para explicar la
              clase a quien quiere conocerla a fondo: qué se aprende, para
              quién es, qué hace especial el método.
            </p>
          </div>

          <div>
            <label htmlFor="style_age_range" className={labelClass}>
              Edad recomendada (texto visible)
            </label>
            <input
              id="style_age_range"
              name="style_age_range"
              type="text"
              placeholder="Ej. 18 a 30 años · Adultos 35+ · Abierto a todas"
              defaultValue={initial.style_age_range ?? ""}
              className={inputClass}
            />
            <p className={helpClass}>
              Texto que se muestra en la ficha técnica de la página de
              detalle (sidebar derecho con el icono de personas). Es{" "}
              <strong className="text-bone">descriptivo</strong>, no un
              filtro técnico — para reglas reales de edad usa los campos
              "Edad mínima/máxima" abajo.
            </p>
          </div>

          <div>
            <label className={labelClass}>Portada</label>
            <CoverUploader
              name="style_cover_url"
              value={initial.style_cover_url}
              fileNamePrefix={styleSlug}
            />
            <p className={helpClass}>
              Imagen visible en el catálogo y en el hero de la página de
              detalle. Cambia la imagen aquí mismo y guarda; queda hosteada
              en Supabase Storage.
            </p>
          </div>
        </div>
      </section>

      <div className="hairline" />

      {/* ─── PROGRAMACIÓN (classes) ─────────────────────────── */}
      <section>
        <p className={sectionLabelClass}>Programación operativa</p>
        <p className="text-xs text-bone-mute mb-8">
          Horario, sucursal y cupo. Lo usa el sistema para mostrar el
          calendario en <strong className="text-bone">/horarios</strong> y
          generar las sesiones reservables semana a semana.
        </p>

        <div className="space-y-7">
          <div>
            <label htmlFor="studio_id" className={labelClass}>
              Sucursal
            </label>
            <select
              id="studio_id"
              name="studio_id"
              defaultValue={initial.studio_id}
              className={inputClass}
              required
            >
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className={helpClass}>
              Dónde se imparte la clase. Solo aparecen sucursales activas.
              Cumbres International School es interna del colegio y no se
              muestra al cliente externo.
            </p>
          </div>

          <div>
            <label htmlFor="teacher_id" className={labelClass}>
              Coreógrafo asignado
            </label>
            <select
              id="teacher_id"
              name="teacher_id"
              defaultValue={initial.teacher_id ?? "none"}
              className={inputClass}
            >
              <option value="none">— Sin asignar —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
            <p className={helpClass}>
              Quién imparte esta clase. El coreógrafo asignado podrá ver la
              clase en su panel <strong className="text-bone">/profesor</strong>{" "}
              y tomar lista de cada sesión. Solo aparecen los activos —
              gestiónalos en{" "}
              <strong className="text-bone">/admin/coreografos</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelClass}>Días de la semana</label>
              <DayPicker selected={selectedDays} onChange={setSelectedDays} />
              {selectedDays.map((d) => (
                <input key={d} type="hidden" name="days_of_week" value={d} />
              ))}
              {selectedDays.length === 0 && (
                <p className="text-xs text-danger mt-2">
                  Selecciona al menos un día.
                </p>
              )}
              <p className={helpClass}>
                Días en que se imparte esta clase, a la misma hora, sucursal,
                coreógrafo y cupo de abajo. Si agregas un día que esta clase
                no tenía (ej. Heels también los jueves), se crea una clase
                nueva para ese día — después puedes editarla aparte si
                necesita otro cupo u otro coreógrafo. Si quitas el día{" "}
                {dayOptions.find((d) => d.value === initial.day_of_week)?.label},
                esta clase se mueve al siguiente día que dejes marcado.
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
                defaultValue={initial.starts_at_time}
                className={inputClass}
                required
              />
              <p className={helpClass}>
                Hora local de CDMX. La hora de fin se calcula automáticamente
                con la duración.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="duration_min" className={labelClass}>
                Duración (minutos)
              </label>
              <input
                id="duration_min"
                name="duration_min"
                type="number"
                min="15"
                max="240"
                step="15"
                defaultValue={initial.duration_min}
                className={inputClass}
                required
              />
              <p className={helpClass}>
                Cuánto dura la clase. Default 60 min. Se muestra en la card
                del calendario y en la ficha técnica.
              </p>
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
                defaultValue={initial.capacity}
                className={inputClass}
                required
              />
              <p className={helpClass}>
                Cuántas alumnas pueden reservar por sesión. Cuando se llena,
                las siguientes entran a lista de espera. Es un límite{" "}
                <strong className="text-bone">duro</strong> — el sistema
                rechaza reservas extra.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="level" className={labelClass}>
              Nivel
            </label>
            <select
              id="level"
              name="level"
              defaultValue={initial.level}
              className={inputClass}
              required
            >
              {levelOptions.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className={helpClass}>
              Quiénes pueden tomar la clase.{" "}
              <strong className="text-bone">"Abierto"</strong> = principiante
              + intermedio (lo más común). Solo es informativo hoy: el
              sistema NO bloquea aún por nivel — eso quedaría para fase 3
              cuando agreguemos perfil de alumno con su nivel autodeclarado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="age_min" className={labelClass}>
                Edad mínima — filtro técnico (opcional)
              </label>
              <input
                id="age_min"
                name="age_min"
                type="number"
                min="0"
                placeholder="Ej. 18"
                defaultValue={initial.age_min ?? ""}
                className={inputClass}
              />
              <p className={helpClass}>
                Edad mínima permitida. Si la pones, el sistema podrá impedir
                que un alumno fuera del rango reserve. Distinto del texto
                visible "Edad recomendada" de arriba — éste es la regla
                operativa.
              </p>
            </div>
            <div>
              <label htmlFor="age_max" className={labelClass}>
                Edad máxima — filtro técnico (opcional)
              </label>
              <input
                id="age_max"
                name="age_max"
                type="number"
                min="0"
                placeholder="Ej. 30"
                defaultValue={initial.age_max ?? ""}
                className={inputClass}
              />
              <p className={helpClass}>
                Edad máxima permitida. Déjalo vacío para "sin límite
                superior" (ej. Mix Styles 35+ tiene min 35, max vacío).
              </p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initial.is_active}
                className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
              />
              <span className="text-sm">Clase activa</span>
            </label>
            <p className={helpClass + " ml-7"}>
              Si la desactivas, la clase deja de funcionar en el sistema —
              ya no se pueden generar nuevas reservas. Las reservas
              existentes se mantienen. Útil para pausar una clase
              temporalmente sin borrarla.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_public"
                defaultChecked={initial.is_public}
                className="w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
              />
              <span className="text-sm">Visible en el sitio público</span>
            </label>
            <p className={helpClass + " ml-7"}>
              Si la quitas, la clase sigue funcionando normal en el
              sistema (se puede reservar, genera sesiones) pero deja de
              aparecer en <strong className="text-bone">/clases</strong> y{" "}
              <strong className="text-bone">/horarios</strong> del sitio
              público — nadie sin sesión iniciada la puede ver.
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
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        <a
          href="/admin/clases"
          className="text-sm text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
