"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, Send } from "lucide-react";
import {
  createAuditionApplicationAction,
  type AuditionFormState,
} from "./actions";

const labelClass =
  "block text-xs font-mono uppercase tracking-widest text-bone-mute mb-2";
const inputClass =
  "w-full bg-ink-off border border-bone-border/40 rounded-lg px-4 py-3 text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors";
const textareaClass = `${inputClass} resize-y min-h-[100px]`;

export function AuditionForm() {
  const [state, action, pending] = useActionState<AuditionFormState, FormData>(
    createAuditionApplicationAction,
    null,
  );

  if (state?.success) {
    return (
      <div className="glass rounded-2xl p-10 md:p-14 text-center max-w-2xl mx-auto">
        <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-6" />
        <p className="eyebrow text-lumen mb-4">Aplicación recibida</p>
        <h2 className="font-display text-3xl md:text-4xl text-bone leading-[0.95] mb-6 text-balance">
          Gracias por aplicar a IMPULSE.
        </h2>
        <p className="text-bone-mute leading-relaxed text-pretty">
          {state.success}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/impulse"
            className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-6 py-3 rounded-full text-sm text-bone hover:bg-bone/5 transition-all"
          >
            Volver a IMPULSE
          </Link>
          <Link
            href="/clases"
            className="group inline-flex items-center justify-center gap-2 bg-bone text-ink px-6 py-3 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            Conoce las clases
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8 max-w-2xl mx-auto">
      {state?.error && (
        <div className="flex items-start gap-3 border border-danger/40 bg-danger/10 rounded-lg p-4 text-sm text-bone">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p>{state.error}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className={labelClass}>
            Nombre completo <span className="text-danger">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Tal como aparece en tu identificación"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-danger">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Teléfono <span className="text-danger">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            placeholder="55 1234 5678"
          />
        </div>

        <div>
          <label htmlFor="age" className={labelClass}>
            Edad
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={5}
            max={90}
            className={inputClass}
            placeholder="18"
          />
        </div>

        <div>
          <label htmlFor="styles" className={labelClass}>
            Estilos que dominas
          </label>
          <input
            id="styles"
            name="styles"
            type="text"
            className={inputClass}
            placeholder="Ej. Jazz, Hip-Hop, Contemporáneo"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="experience" className={labelClass}>
            Experiencia previa
          </label>
          <textarea
            id="experience"
            name="experience"
            className={textareaClass}
            placeholder="Cuéntanos cuántos años llevas bailando, en qué academias o compañías has estado, presentaciones, etc."
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="video_url" className={labelClass}>
            Link de video
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            className={inputClass}
            placeholder="https://youtube.com/... o https://drive.google.com/..."
          />
          <p className="mt-2 text-xs text-bone-mute">
            Sube tu video a YouTube (no listado) o Drive y comparte el link.
            Asegúrate que el acceso sea público o con link.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="why_impulse" className={labelClass}>
            ¿Por qué quieres entrar a IMPULSE?
          </label>
          <textarea
            id="why_impulse"
            name="why_impulse"
            className={textareaClass}
            placeholder="Cuéntanos qué te motiva, qué buscas y qué estás dispuesto a dejar en el escenario."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center justify-center gap-2 bg-lumen text-ink px-8 py-4 rounded-full text-base font-medium hover:bg-bone disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            "Enviando…"
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar aplicación
            </>
          )}
        </button>
        <Link
          href="/impulse"
          className="inline-flex items-center justify-center gap-2 border border-bone-border/60 hover:border-bone px-6 py-3 rounded-full text-sm text-bone hover:bg-bone/5 transition-all"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
