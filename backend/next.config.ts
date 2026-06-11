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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // mybusinessformation.com es el dominio legacy del rebrand a opabiz.com. Se reutiliza
  // como entrada de las cartas físicas de marketing: TODO su tráfico (apex + www, en
  // cualquier path) hace 301 a la landing de new-business en opabiz.com. Esto:
  //  - evita contenido duplicado (opabiz.com/new-business es el único canonical indexado)
  //  - consolida la autoridad SEO del dominio viejo en opabiz
  //  - conserva el ?id= del QR automáticamente (Next pasa el query string al destino)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "mybusinessformation.com" }],
        destination: "https://opabiz.com/new-business",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mybusinessformation.com" }],
        destination: "https://opabiz.com/new-business",
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
