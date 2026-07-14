"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction, type AuthState } from "@/app/auth/actions";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    null,
  );

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95]">
          Nueva
          <br />
          <span className="italic text-lumen">contraseña.</span>
        </h1>
        <p className="text-sm text-bone-mute mt-4">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-3 pr-11 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-mute hover:text-bone transition-colors"
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            placeholder="Repite tu contraseña"
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
          className="group w-full inline-flex items-center justify-center gap-2 bg-bone text-ink px-6 py-3.5 rounded-full font-medium hover:bg-lumen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Guardando..." : "Guardar nueva contraseña"}
          {!pending && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
