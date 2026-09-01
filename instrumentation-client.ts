import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Sin session replay — no lo necesitamos para este tamaño de app y evita
  // grabar pantalla de usuarias reales (datos de menores) sin necesidad.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
