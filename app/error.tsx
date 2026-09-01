"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60svh] flex items-center justify-center p-10">
      <div className="text-center max-w-md">
        <p className="font-display text-4xl text-bone mb-3">Algo salió mal</p>
        <p className="text-sm text-bone-mute mb-6">
          Ya nos llegó el aviso del error. Intenta de nuevo — si sigue
          pasando, contáctanos.
        </p>
        <button
          onClick={() => reset()}
          className="bg-bone text-ink px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider hover:bg-lumen transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
