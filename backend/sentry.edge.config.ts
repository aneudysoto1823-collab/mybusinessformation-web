// Init del SDK de Sentry para edge runtime: middleware.ts y rutas con runtime: 'edge'.
// Se carga desde instrumentation.ts cuando NEXT_RUNTIME === 'edge'.

import * as Sentry from '@sentry/nextjs'
import { scrubPII } from '@/lib/sentry-pii-filter'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',

  tracesSampleRate: 0.1,
  debug: false,

  beforeSend: scrubPII,
})
