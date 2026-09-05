import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ── Security headers globales (Etapa 14) ─────────────────────────────────────
// Aplicados a TODAS las rutas. CSP con whitelist explícita para los servicios
// que el proyecto usa: Stripe, Supabase, Resend, Sentry, Google Tag Manager.
const CSP = [
  "default-src 'self'",
  // unsafe-inline + unsafe-eval son necesarios para Next.js + React + scripts inline (gtag init).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://*.ingest.sentry.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://www.googletagmanager.com",
  // connect-src: APIs que el browser llama directo. Supabase REST, Sentry tunnel, Stripe, Resend, GA4.
  "connect-src 'self' https://*.supabase.co https://*.ingest.sentry.io https://api.stripe.com https://api.resend.com https://www.google-analytics.com",
  // frame-src: Stripe Checkout y Stripe webhooks usan iframes propios.
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // No permitir que el sitio sea embebido en iframes externos (anti-clickjacking).
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: CSP,
  },
  {
    key: "Strict-Transport-Security",
    // 2 años + subdominios + preload (HSTS strong).
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    // Redundante con CSP frame-ancestors, pero algunos browsers viejos lo respetan.
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    // Previene MIME type sniffing (no permitir que browser interprete .txt como .html).
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // Denegar APIs sensibles que no usamos. interest-cohort = FLoC.
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // ssh2 (dep transitiva de ssh2-sftp-client) tiene modulos Node nativos
  // que Turbopack no puede empaquetar en chunks ESM. Marcarlos como
  // serverExternalPackages le dice a Next que los importe en runtime
  // (require Node nativo) en lugar de bundlear. Usado por el cron Sunbiz
  // /api/cron/sunbiz-daily (SFTP a sftp.floridados.gov).
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client'],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Separación de dominios (2026-08-13): mybusinessformation.com deja de ser un
  // simple redirect a opabiz.com/new-business y pasa a servir su propio sitio
  // (marca Florida Business Formation Center, sin OpaBiz) — el cliente que
  // recibe la carta física y escanea el QR ya no salta de marca a mitad de
  // camino. Ambos dominios viven en el mismo proyecto de Vercel / misma app
  // Next.js; el mapeo se hace 100% con rewrites de host (`beforeFiles`, para
  // que gane ANTES que el filesystem — si no, "/" resolvería siempre a
  // app/page.tsx antes de llegar a evaluar el rewrite).
  //
  // El payUrl que la carta imprime YA usa mybusinessformation.com/?id=... (raíz,
  // ver lib/new-business-letter.ts) — las cartas ya en el correo funcionan sin
  // reimprimir nada.
  async rewrites() {
    const hosts = ["mybusinessformation.com", "www.mybusinessformation.com"];
    const map: Record<string, string> = {
      "/": "/new-business",
      "/es": "/new-business/es",
      "/success": "/new-business/success",
      "/terms": "/new-business/terms",
      "/privacy": "/new-business/privacy",
      "/legal": "/new-business/legal",
      "/servicios": "/new-business/servicios",
    };
    return {
      beforeFiles: hosts.flatMap((host) =>
        Object.entries(map).map(([source, destination]) => ({
          source,
          has: [{ type: "host" as const, value: host }],
          destination,
        }))
      ),
    };
  },
  // opabiz.com/new-business ya no existe como ruta propia — su contenido vive
  // ahora en mybusinessformation.com (separación de dominios 2026-08-13). Este
  // 301 catch-all manda a la home de opabiz.com para consolidar la autoridad
  // SEO indexada bajo /new-business en el sitio correcto. NO se redirige al
  // otro dominio a propósito — Google Search Console y GA4 están separados por
  // propiedad, y un cliente que busca "OpaBiz" en Google no debe caer en la
  // marca FBFC. Nunca queda en 404. `/servicios` y `/servicios/checkout` de
  // opabiz.com NO se tocan — siguen siendo la tienda de servicios propia de
  // OpaBiz.
  async redirects() {
    return [
      {
        source: "/new-business/:path*",
        has: [{ type: "host", value: "opabiz.com" }],
        destination: "https://opabiz.com/",
        permanent: true,
      },
      {
        source: "/new-business/:path*",
        has: [{ type: "host", value: "www.opabiz.com" }],
        destination: "https://opabiz.com/",
        permanent: true,
      },
    ];
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
});
