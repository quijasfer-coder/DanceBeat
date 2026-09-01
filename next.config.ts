import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Sin SENTRY_AUTH_TOKEN el plugin solo se salta la subida de source maps
  // (avisa por consola), no rompe el build — así que es seguro dejarlo
  // así mientras no exista la cuenta/llave.
  silent: true,
  widenClientFileUpload: true,
});
