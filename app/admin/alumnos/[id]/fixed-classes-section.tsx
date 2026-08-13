"use client";

import { useState, useTransition } from "react";
import { X, Plus, AlertCircle, Loader2 } from "lucide-react";
import {
  assignFixedClassAction,
  unassignFixedClassAction,
} from "./actions";

type ClassOption = { id: string; label: string };

export function FixedClassesSection({
  studentId,
  fixedClasses,
  availableClasses,
}: {
  studentId: string;
  fixedClasses: ClassOption[];
  availableClasses: ClassOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState("");

  const assign = () => {
    if (!selected) return;
    setError(null);
    setPendingId(selected);
    startTransition(async () => {
      const res = await assignFixedClassAction(studentId, selected);
      if (res.error) setError(res.error);
      else setSelected("");
      setPendingId(null);
    });
  };

  const unassign = (classId: string) => {
    if (
      !confirm(
        "¿Quitar esta clase fija? Se cancelan sus reservas futuras de esa clase y se devuelven los créditos.",
      )
    )
      return;
    setError(null);
    setPendingId(classId);
    startTransition(async () => {
      const res = await unassignFixedClassAction(studentId, classId);
      if (res.error) setError(res.error);
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-3">
      {fixedClasses.length === 0 ? (
        <p className="text-xs text-bone-mute">Sin clases fijas asignadas.</p>
      ) : (
        <div className="space-y-2">
          {fixedClasses.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-bone-border/30 bg-ink-off px-3 py-2 text-sm"
            >
              <span className="text-bone">{c.label}</span>
              <button
                type="button"
                onClick={() => unassign(c.id)}
                disabled={pending && pendingId === c.id}
                className="inline-flex items-center gap-1 text-xs text-bone-mute hover:text-danger transition-colors disabled:opacity-50"
              >
                {pending && pendingId === c.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {availableClasses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={pending}
            className="flex-1 min-w-[14rem] bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone focus:outline-none focus:border-lumen disabled:opacity-50"
          >
            <option value="">Agregar clase fija…</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={assign}
            disabled={pending || !selected}
            className="inline-flex items-center gap-1.5 bg-bone text-ink px-4 py-2 rounded-full text-xs font-medium hover:bg-lumen disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Asignar
          </button>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
