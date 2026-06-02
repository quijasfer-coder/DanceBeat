"use client";

import { useActionState, useState } from "react";
import { Save, ChevronDown } from "lucide-react";
import {
  updateAuditionsClosedMessageAction,
  type AuditionAdminFormState,
} from "./actions";
import { cn } from "@/lib/utils";

export function ClosedMessageForm({ initialMessage }: { initialMessage: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<
    AuditionAdminFormState,
    FormData
  >(updateAuditionsClosedMessageAction, null);

  return (
    <div className="glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div>
          <p className="font-display text-base">
            Mensaje cuando está cerrado
          </p>
          <p className="text-xs text-bone-mute mt-1">
            Lo ven las visitantes en /impulse y /impulse/audiciones cuando la
            convocatoria está cerrada.
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-bone-mute transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <form action={action} className="p-5 pt-0 space-y-4">
          <textarea
            name="message"
            defaultValue={initialMessage}
            rows={4}
            required
            className="w-full bg-ink-off border border-bone-border/40 rounded-lg px-4 py-3 text-sm text-bone focus:outline-none focus:border-lumen transition-colors resize-y"
          />
          {state?.error && (
            <p className="text-xs text-danger">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-xs text-success">{state.success}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
          >
            <Save className="w-3 h-3" />
            {pending ? "Guardando…" : "Guardar mensaje"}
          </button>
        </form>
      )}
    </div>
  );
}
