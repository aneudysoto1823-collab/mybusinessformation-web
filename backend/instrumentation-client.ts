// Init del SDK de Sentry para el cliente (browser).
// Captura errores en Client Components ('use client'), unhandled rejections,
// errores en event handlers, y errores de hydration.

import * as Sentry from '@sentry/nextjs'
import { scrubPII } from '@/lib/sentry-pii-filter'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',

  tracesSampleRate: 0.1,
  debug: false,

  // Sentry Replay: solo en errores, NO sesiones completas (privacidad + plan free)
  replaysOnErrorSampleRate: 0.1,
  replaysSessionSampleRate: 0,

  beforeSend: scrubPII,
})

// Export requerido por @sentry/nextjs para capturar navegaciones (router transitions)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
