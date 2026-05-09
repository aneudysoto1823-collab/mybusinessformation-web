import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Slugs de Sentry desde env vars (también pueden ir hardcoded si se prefiere)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suprime los logs del plugin de Sentry durante el build (CI más limpio)
  silent: !process.env.CI,

  // Sin upload de sourcemaps por ahora (requiere SENTRY_AUTH_TOKEN; lo agregamos
  // como tarea futura — sourcemaps mejoran stack traces pero no es bloqueante).
  sourcemaps: { disable: true },

  // Túnel para evitar ad-blockers (envía eventos por /monitoring en lugar de
  // *.ingest.sentry.io). Reduce eventos perdidos por uBlock Origin / Brave Shields.
  tunnelRoute: "/monitoring",

  // No tratar warnings como errores en el build
  disableLogger: true,
});