"use client";

import { useState, useTransition } from "react";
import { Mail, Loader2, Check, AlertCircle } from "lucide-react";
import { sendPaymentReceiptAction } from "./actions";

export function SendReceiptButton({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    setError(null);
    startTransition(async () => {
      const res = await sendPaymentReceiptAction(paymentId);
      if (res.error) setError(res.error);
      else setSent(true);
    });
  };

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="w-3.5 h-3.5" />
        Enviado
      </span>
    );
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-lumen transition-colors disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Mail className="w-3.5 h-3.5" />
        )}
        {pending ? "Enviando…" : "Enviar recibo"}
      </button>
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-danger mt-1 justify-end">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
