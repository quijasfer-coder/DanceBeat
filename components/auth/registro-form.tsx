"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { GoogleButton } from "./google-button";
import type { Plan } from "@/lib/queries/plans";
import { cn } from "@/lib/utils";
import { signUpAction, type AuthState } from "@/app/auth/actions";

type Props = {
  selectedPlan?: Plan;
};

export function RegistroForm({ selectedPlan }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUpAction,
    null,
  );

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl leading-[0.95]">
          Crea tu
          <br />
          <span className="italic text-lumen">cuenta.</span>
        </h1>
        <p className="text-sm text-bone-mute mt-4">
          Empieza a reservar clases en menos de un minuto.
        </p>
      </div>

      {/* Banner del plan seleccionado */}
      {selectedPlan && (
        <div
          className={cn(
            "rounded-xl p-5 mb-8 border",
            selectedPlan.featured
              ? "bg-lumen/10 border-lumen/40"
              : "bg-ink-surface border-bone-border/40",
          )}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-lumen mb-2">
            Plan seleccionado
          </p>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-display text-2xl">{selectedPlan.name}</p>
          </div>
          <p className="text-xs text-bone-mute mt-3">
            Crea tu cuenta para ver el precio y el costo de inscripción.{" "}
            <Link
              href="/planes"
              className="underline hover:text-bone transition-colors"
            >
              Cambiar plan
            </Link>
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
          >
            Nombre completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="María García"
            className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-3 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <label
              htmlFor="phone"
              className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
            >
              WhatsApp
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="55 1234 5678"
              className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-3 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2"
          >
            Contraseña
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
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 text-xs text-bone-mute cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-0.5 w-4 h-4 rounded border-bone-border/60 bg-ink-surface text-lumen focus:ring-lumen/30 cursor-pointer"
          />
          <span>
            Acepto los{" "}
            <Link
              href="/legal/terminos"
              className="text-bone underline underline-offset-2 hover:text-lumen"
            >
              términos
            </Link>{" "}
            y la{" "}
            <Link
              href="/legal/privacidad"
              className="text-bone underline underline-offset-2 hover:text-lumen"
            >
              política de privacidad
            </Link>
            .
          </span>
        </label>

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
          {pending
            ? "Creando cuenta..."
            : selectedPlan
              ? `Continuar al pago`
              : "Crear cuenta"}
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

      <GoogleButton label="Registrarme con Google" />

      <p className="text-center text-sm text-bone-mute mt-10">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          className="text-bone hover:text-lumen underline underline-offset-4"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
