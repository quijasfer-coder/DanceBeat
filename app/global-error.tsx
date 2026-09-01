"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

const styles = {
  body: {
    background: "#000000",
    color: "#FFFFFF",
    minHeight: "100svh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif",
    margin: 0,
  },
  wrap: { textAlign: "center" as const, padding: "2rem" },
  title: { fontSize: "1.5rem", marginBottom: "0.75rem" },
  subtitle: { fontSize: "0.875rem", opacity: 0.65, marginBottom: "1.5rem" },
  button: {
    background: "#FFFFFF",
    color: "#000000",
    padding: "0.65rem 1.5rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    border: "none",
    cursor: "pointer",
  },
};

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={styles.body}>
        <div style={styles.wrap}>
          <p style={styles.title}>Algo salió mal</p>
          <p style={styles.subtitle}>
            Ya nos llegó el aviso. Intenta recargar la página.
          </p>
          <button style={styles.button} onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
