"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import {
  updateAuditionNotesAction,
  type AuditionAdminFormState,
} from "../actions";

export function NotesForm({
  applicationId,
  initialNotes,
}: {
  applicationId: string;
  initialNotes: string;
}) {
  const boundAction = updateAuditionNotesAction.bind(null, applicationId);
  const [state, action, pending] = useActionState<
    AuditionAdminFormState,
    FormData
  >(boundAction, null);

  return (
    <form action={action} className="space-y-3">
      <textarea
        name="notes"
        defaultValue={initialNotes}
        rows={5}
        placeholder="Notas internas (no visibles para la aplicante): comentarios del jurado, observaciones, fechas de seguimiento…"
        className="w-full bg-ink-off border border-bone-border/40 rounded-lg px-4 py-3 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors resize-y"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
        >
          <Save className="w-3 h-3" />
          {pending ? "Guardando…" : "Guardar notas"}
        </button>
        {state?.success && (
          <span className="text-xs text-success">{state.success}</span>
        )}
        {state?.error && (
          <span className="text-xs text-danger">{state.error}</span>
        )}
      </div>
    </form>
  );
}
