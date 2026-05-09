// Init del SDK de Sentry para Node runtime: API routes y Server Components.
// Se carga desde instrumentation.ts cuando NEXT_RUNTIME === 'nodejs'.

import * as Sentry from '@sentry/nextjs'
import { scrubPII } from '@/lib/sentry-pii-filter'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',

  // Sampling: 10% de transacciones de performance. Errores siempre se mandan al 100%.
  // Plan free Sentry permite 5K events/mes; este sampling deja margen pre-launch.
  tracesSampleRate: 0.1,

  // Sin debug logs ni printConsole en producción
  debug: false,

  // Filtrar PII antes de mandar el evento a Sentry
  beforeSend: scrubPII,
})
