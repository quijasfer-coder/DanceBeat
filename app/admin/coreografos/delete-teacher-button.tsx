"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { deleteTeacherAction } from "@/app/admin/actions";

export function DeleteTeacherButton({
  teacherId,
  teacherName,
  assignedClassesCount,
}: {
  teacherId: string;
  teacherName: string;
  assignedClassesCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border border-bone-border/40 text-bone-mute hover:text-danger hover:border-danger/40 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <p className="text-xs text-bone-mute max-w-[220px]">
        ¿Eliminar a <strong className="text-bone">{teacherName}</strong>?
        {assignedClassesCount > 0 && (
          <>
            {" "}
            <strong className="text-warning">
              {assignedClassesCount} clase{assignedClassesCount === 1 ? "" : "s"}
            </strong>{" "}
            quedará{assignedClassesCount === 1 ? "" : "n"} sin coreógrafo
            asignado.
          </>
        )}
      </p>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await deleteTeacherAction(teacherId);
              if (res?.error) setError(res.error);
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium bg-danger text-bone hover:bg-danger/80 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {pending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="text-xs text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
