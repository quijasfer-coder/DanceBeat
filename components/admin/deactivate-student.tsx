"use client";

import { useState } from "react";
import { UserX, UserCheck, AlertCircle } from "lucide-react";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    setPending(true);
    setError(null);
    try {
      await deactivateStudentAction(studentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPending(false);
    }
    setConfirming(false);
    setPending(false);
  }

  async function handleReactivate() {
    setPending(true);
    setError(null);
    try {
      await reactivateStudentAction(studentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPending(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-danger">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{error}</span>
        <button onClick={() => setError(null)} className="underline ml-1">reintentar</button>
      </div>
    );
  }

  if (!isActive) {
    return (
      <button
        onClick={handleReactivate}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-success transition-colors disabled:opacity-40"
      >
        {pending ? (
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
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <span className="text-xs text-bone-mute">¿Dar de baja a {studentName.split(" ")[0]}?</span>
        <button
          onClick={handleDeactivate}
          disabled={pending}
          className="text-xs text-danger hover:text-danger/70 font-medium transition-colors disabled:opacity-40"
        >
          {pending ? "…" : "Sí, dar de baja"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
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
    >
      <UserX className="w-3.5 h-3.5" />
      Dar de baja
    </button>
  );
}
