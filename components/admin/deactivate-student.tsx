"use client";

import { useState, useTransition } from "react";
import { UserX, UserCheck, AlertTriangle } from "lucide-react";
import { deactivateStudentAction, reactivateStudentAction } from "@/app/admin/actions";

export function DeactivateStudent({
  studentId,
  studentName,
  isActive,
}: {
  studentId: string;
  studentName: string;
  isActive: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDeactivate() {
    startTransition(() => {
      deactivateStudentAction(studentId);
    });
    setConfirming(false);
  }

  function handleReactivate() {
    startTransition(() => {
      reactivateStudentAction(studentId);
    });
  }

  if (!isActive) {
    return (
      <button
        onClick={handleReactivate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-success transition-colors disabled:opacity-40"
        title="Reactivar alumno"
      >
        {isPending ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-bone-mute border-t-transparent animate-spin" />
        ) : (
          <UserCheck className="w-3.5 h-3.5" />
        )}
        Reactivar
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-bone-mute">¿Dar de baja a {studentName.split(" ")[0]}?</span>
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="text-xs text-danger hover:text-danger/70 font-medium transition-colors disabled:opacity-40"
        >
          {isPending ? "…" : "Sí, dar de baja"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-bone-mute hover:text-bone transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-danger transition-colors"
      title="Dar de baja al alumno"
    >
      <UserX className="w-3.5 h-3.5" />
      Dar de baja
    </button>
  );
}
