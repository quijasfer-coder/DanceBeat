"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  recoverPasswordAction,
  type AuthState,
} from "@/app/auth/actions";

const linkErrorMessages: Record<string, string> = {
  otp_expired:
    "Tu enlace de recuperación expiró o ya fue usado. Solicita uno nuevo abajo.",
};

export function RecuperarForm({ linkError }: { linkError?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    recoverPasswordAction,
    null,
  );

  // Si no hay error después de submit y no está pending, fue éxito
  const success = state !== null && !state?.error && !pending;

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95]">
          Recupera tu
          <br />
          <span className="italic text-bone-mute">acceso.</span>
        </h1>
        <p className="text-sm text-bone-mute mt-4 max-w-xs mx-auto text-pretty">
          Te enviamos instrucciones por email para volver a entrar.
        </p>
      </div>

      {linkError && !success && (
        <div className="flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3 mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {linkErrorMessages[linkError] ??
            "Tu enlace de recuperación ya no es válido. Solicita uno nuevo abajo."}
        </div>
      )}

      {success ? (
        <div className="flex items-start gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-bone font-medium">
              Revisa tu email
            </p>
            <p className="text-xs text-bone-mute mt-1">
              Si tu cuenta existe, te enviamos un enlace para reestablecer la
              contraseña.
            </p>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-3 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
            />
          </div>

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
            {pending ? "Enviando..." : "Enviar instrucciones"}
            {!pending && (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
        </form>
      )}

      <Link
        href="/auth/login"
        className="mt-8 inline-flex items-center gap-2 text-sm text-bone-mute hover:text-bone transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
