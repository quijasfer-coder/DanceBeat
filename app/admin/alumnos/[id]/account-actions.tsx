"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertCircle, CreditCard } from "lucide-react";
import {
  approveAccountAction,
  rejectAccountAction,
  markEnrollmentPaidAction,
} from "@/app/admin/solicitudes/actions";
import { cn } from "@/lib/utils";

export function AccountStatusActions({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  const approve = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveAccountAction(accountId);
      if (!res.ok) setError(res.error);
    });
  };

  const reject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectAccountAction(accountId, reason.trim() || null);
      if (!res.ok) setError(res.error);
    });
  };

  if (showReject) {
    return (
      <div className="space-y-3">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Motivo del rechazo (opcional)"
          className="w-full bg-ink-surface border border-bone-border/40 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone-mute/50 focus:outline-none focus:border-lumen transition-colors resize-y"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reject}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium bg-danger text-bone hover:bg-danger/80 disabled:opacity-50 transition-colors"
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
        {error && <ErrorMsg msg={error} />}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors",
          "bg-success text-bone hover:bg-success/80 disabled:opacity-50",
        )}
      >
        <Check className="w-3.5 h-3.5" />
        {pending ? "Aprobando…" : "Aprobar"}
      </button>
      <button
        type="button"
        onClick={() => setShowReject(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider border border-bone-border/40 text-bone-mute hover:border-danger hover:text-danger transition-colors"
      >
        Rechazar
      </button>
      {error && <ErrorMsg msg={error} />}
    </div>
  );
}

export function MarkEnrollmentPaidActions({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const mark = (method: "cash" | "transfer" | "tpv") => {
    setError(null);
    startTransition(async () => {
      const res = await markEnrollmentPaidAction(studentId, method);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-bone-mute">
        Selecciona el método con el que la alumna pagó la inscripción:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => mark("cash")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium bg-bone text-ink hover:bg-lumen disabled:opacity-50 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Efectivo
        </button>
        <button
          type="button"
          onClick={() => mark("transfer")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium border border-bone-border/40 text-bone hover:bg-bone hover:text-ink disabled:opacity-50 transition-colors"
        >
          Transferencia
        </button>
        <button
          type="button"
          onClick={() => mark("tpv")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider border border-bone-border/40 text-bone-mute hover:border-bone hover:text-bone disabled:opacity-50 transition-colors"
        >
          TPV
        </button>
      </div>
      {error && <ErrorMsg msg={error} />}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-danger">
      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
      {msg}
    </p>
  );
}
