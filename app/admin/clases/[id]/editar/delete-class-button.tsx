"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { deleteClassAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function DeleteClassButton({
  classId,
  className,
  futureSessionsCount,
  activeBookingsCount,
}: {
  classId: string;
  className: string;
  futureSessionsCount: number;
  activeBookingsCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteClassAction(classId);
      // Si redirige no veremos esta línea; si hay error se queda aquí.
      if (res?.error) setError(res.error);
    });
  };

  const matches = confirmText.trim().toLowerCase() === className.toLowerCase();

  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/5 p-6 mt-12">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-lg text-bone">Eliminar clase</p>
          <p className="text-xs text-bone-mute mt-1 leading-relaxed">
            Si solo quieres pausar la clase, mejor desmarca "Clase activa"
            arriba. Eliminarla es permanente y no se puede deshacer.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium border border-danger/40 text-danger hover:bg-danger hover:text-bone transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Quiero eliminar esta clase
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-ink-off/60 border border-bone-border/30 p-4 space-y-2 text-xs text-bone-mute">
            <p className="text-bone font-medium">Lo que se va a eliminar:</p>
            <ul className="list-disc list-inside space-y-1 text-bone-mute">
              <li>La clase y su programación.</li>
              <li>
                <strong className="text-bone">{futureSessionsCount}</strong>{" "}
                sesión{futureSessionsCount === 1 ? "" : "es"} futura
                {futureSessionsCount === 1 ? "" : "s"} programada
                {futureSessionsCount === 1 ? "" : "s"}.
              </li>
              <li>
                <strong className="text-bone">{activeBookingsCount}</strong>{" "}
                reserva{activeBookingsCount === 1 ? "" : "s"} activa
                {activeBookingsCount === 1 ? "" : "s"} de alumnas (sin devolución
                automática de créditos — házla a mano si aplica).
              </li>
              <li>El historial de asistencia de sesiones pasadas.</li>
            </ul>
            <p className="pt-1 text-bone-mute">
              El estilo "<span className="text-bone">{className}</span>" se
              queda — puede tener otras clases asociadas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-bone-mute mb-2">
              Para confirmar, escribe el nombre del estilo:{" "}
              <span className="text-bone">"{className}"</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={className}
              className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-4 py-2.5 text-sm text-bone focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20 transition-colors"
            />
          </div>

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-danger">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!matches || pending}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-colors",
                "bg-danger text-bone hover:bg-danger/80 disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {pending ? "Eliminando…" : "Confirmar eliminación"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={pending}
              className="text-xs text-bone-mute hover:text-bone transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
