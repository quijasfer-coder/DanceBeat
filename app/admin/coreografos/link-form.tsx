"use client";

import { useActionState } from "react";
import { AlertCircle, Link2 } from "lucide-react";
import {
  linkTeacherProfileAction,
  type AdminFormState,
} from "@/app/admin/actions";

export function LinkProfileForm({ teacherId }: { teacherId: string }) {
  const action = linkTeacherProfileAction.bind(null, teacherId);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-3">
      <input
        type="email"
        name="email"
        required
        placeholder="email registrado del coreógrafo"
        className="flex-1 min-w-[260px] bg-ink border border-bone-border/40 rounded-lg px-4 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:border-lumen focus:outline-none focus:ring-2 focus:ring-lumen/20 transition-colors"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 border border-bone-border/60 hover:border-bone px-4 py-2 rounded-full text-xs transition-colors disabled:opacity-50"
      >
        <Link2 className="w-3.5 h-3.5" />
        {pending ? "Vinculando..." : "Vincular cuenta"}
      </button>

      {state?.error && (
        <div className="w-full flex items-start gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-2.5 mt-1">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}
    </form>
  );
}
