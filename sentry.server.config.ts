import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  // No mandar nada si no hay DSN configurado (dev local sin cuenta de Sentry).
  enabled: !!process.env.SENTRY_DSN,
});
