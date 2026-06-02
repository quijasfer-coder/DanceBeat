"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { GoogleButton } from "./google-button";
import { signInAction, type AuthState } from "@/app/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signInAction,
    null,
  );

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95]">
          Bienvenida
          <br />
          <span className="italic text-bone-mute">de vuelta.</span>
        </h1>
        <p className="text-sm text-bone-mute mt-4">
          Inicia sesión para reservar tu próxima clase.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="next" value={next ?? "/app"} />

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

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label
              htmlFor="password"
              className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute"
            >
              Contraseña
            </label>
            <Link
              href="/auth/recuperar"
              className="text-[11px] text-bone-mute hover:text-lumen transition-colors"
            >
              ¿Olvidaste?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-3 pr-11 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bone-mute hover:text-bone transition-colors"
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
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
          {pending ? "Iniciando..." : "Iniciar sesión"}
          {!pending && (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <span className="flex-1 h-px bg-bone-border/40" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          O continúa con
        </span>
        <span className="flex-1 h-px bg-bone-border/40" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-bone-mute mt-10">
        ¿Aún no eres alumna?{" "}
        <Link
          href="/auth/registro"
          className="text-bone hover:text-lumen underline underline-offset-4"
        >
          Crea tu cuenta
        </Link>
      </p>
    </div>
  );
}
