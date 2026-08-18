"use client";

import { useState, useTransition } from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { resendTeacherInviteAction } from "@/app/admin/actions";

export function ResendInviteButton({ teacherId }: { teacherId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<"ok" | "error" | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            setError(null);
            const res = await resendTeacherInviteAction(teacherId);
            if (res?.error) {
              setError(res.error);
              setResult("error");
            } else {
              setResult("ok");
            }
          })
        }
        className="inline-flex items-center gap-1.5 text-xs text-lumen hover:text-bone transition-colors disabled:opacity-50"
      >
        <Send className="w-3 h-3" />
        {pending ? "Enviando..." : "Reenviar invitación"}
      </button>
      {result === "ok" && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="w-3 h-3" />
          Enviado
        </span>
      )}
      {result === "error" && (
        <span className="inline-flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="w-3 h-3" />
          {error}
        </span>
      )}
    </div>
  );
}
