"use client";

import { useState, useTransition } from "react";
import {
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  approveAccountAction,
  rejectAccountAction,
} from "./actions";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  full_name: string;
  birthdate: string;
  school: string | null;
  grade: string | null;
  notes: string | null;
};

export function RequestCard({
  accountId,
  email,
  fullName,
  phone,
  createdAt,
  students,
}: {
  accountId: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  students: Student[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const created = new Date(createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveAccountAction(accountId);
      if (!res.ok) setError(res.error);
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectAccountAction(accountId, reason.trim() || null);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <article className="rounded-2xl border border-bone-border/30 bg-ink-off p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Recibida {created}
          </p>
          <h2 className="font-display text-2xl text-bone mt-1">{fullName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-mute">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 hover:text-lumen transition-colors"
            >
              <Mail className="w-3 h-3" />
              {email}
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 hover:text-lumen transition-colors"
              >
                <Phone className="w-3 h-3" />
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="rounded-xl bg-ink-surface/50 p-4 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-3 flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          {students.length} alumno{students.length === 1 ? "" : "s"} registrado
          {students.length === 1 ? "" : "s"}
        </p>
        {students.length === 0 ? (
          <p className="text-xs text-warning italic">
            Aún no agrega a quién toma clases. Puedes aprobar igualmente — la
            alumna terminará el onboarding después.
          </p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => {
              const age = calcAge(s.birthdate);
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-bone-border/30 bg-ink-off px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-bone font-medium">
                        {s.full_name}
                        <span className="text-bone-mute font-mono ml-2">
                          · {age} años
                        </span>
                      </p>
                      {(s.school || s.grade) && (
                        <p className="text-bone-mute mt-0.5">
                          {[s.school, s.grade].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.notes && (
                    <div className="mt-2 flex items-start gap-1.5 text-warning">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <p className="leading-relaxed text-bone whitespace-pre-wrap">
                        {s.notes}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-danger mb-3">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Acciones */}
      {showReject ? (
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-widest text-bone-mute">
            Motivo del rechazo (opcional, lo verá la alumna)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ej. No cumple con el rango de edad."
            className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors resize-y"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                "bg-danger text-bone hover:bg-danger/80 disabled:opacity-50",
              )}
            >
              <X className="w-3.5 h-3.5" />
              {pending ? "Rechazando…" : "Confirmar rechazo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
              disabled={pending}
              className="text-xs text-bone-mute hover:text-bone transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-colors",
              "bg-success text-bone hover:bg-success/80 disabled:opacity-50",
            )}
          >
            <Check className="w-4 h-4" />
            {pending ? "Aprobando…" : "Aprobar cuenta"}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider border border-bone-border/40 text-bone-mute hover:border-danger hover:text-danger transition-colors"
          >
            Rechazar
          </button>
        </div>
      )}
    </article>
  );
}

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
