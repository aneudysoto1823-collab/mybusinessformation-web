// Helper compartido para filtrar PII de eventos antes de enviarlos a Sentry.
// Se usa en sentry.server.config.ts, sentry.edge.config.ts e instrumentation-client.ts.
// Cero PII llega a Sentry: ni email, ni nombre, ni teléfono, ni SSN/ITIN, ni tarjetas, ni passwords.

import type { Event } from '@sentry/nextjs'

const PII_KEYS = [
  'email',
  'firstname', 'first_name', 'lastname', 'last_name', 'fullname', 'full_name', 'name',
  'phone', 'telephone', 'mobile',
  'ssn', 'itin', 'taxid', 'tax_id',
  'password', 'pwd', 'pass',
  'card', 'cardnumber', 'card_number', 'cvv', 'cvc', 'expiry',
  'address', 'street', 'city', 'zip', 'postal',
  'token', 'secret', 'apikey', 'api_key', 'authorization',
  'dni', 'ci', 'passport',
]

const EMAIL_RX = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g
const SSN_RX = /\b\d{3}-?\d{2}-?\d{4}\b/g
const PHONE_RX = /\+?\d[\d\s().-]{8,}\d/g

function scrubString(s: string): string {
  return s
    .replace(EMAIL_RX, '[email]')
    .replace(SSN_RX, '[ssn]')
    .replace(PHONE_RX, '[phone]')
}

function scrubObject(obj: unknown, depth = 0): unknown {
  if (depth > 8 || obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return scrubString(obj)
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(v => scrubObject(v, depth + 1))
  }

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (PII_KEYS.some(p => lowerKey.includes(p))) {
      out[key] = '[Filtered]'
    } else {
      out[key] = scrubObject(value, depth + 1)
    }
  }
  return out
}

export function scrubPII<T extends Event>(event: T): T {
  // Request data (body/query/cookies)
  if (event.request) {
    if (event.request.data) event.request.data = scrubObject(event.request.data) as typeof event.request.data
    if (event.request.cookies) event.request.cookies = scrubObject(event.request.cookies) as typeof event.request.cookies
    if (event.request.query_string) event.request.query_string = typeof event.request.query_string === 'string' ? scrubString(event.request.query_string) : event.request.query_string
    if (event.request.headers) {
      const sensitive = ['authorization', 'cookie', 'x-api-key', 'x-stripe-signature']
      for (const k of Object.keys(event.request.headers)) {
        if (sensitive.includes(k.toLowerCase())) {
          event.request.headers[k] = '[Filtered]'
        }
      }
    }
  }

  // User: mantener solo id, descartar email/username/ip
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : {}
  }

  // Extra y contexts
  if (event.extra) event.extra = scrubObject(event.extra) as typeof event.extra
  if (event.contexts) event.contexts = scrubObject(event.contexts) as typeof event.contexts

  // Breadcrumbs (mensajes y data)
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(b => ({
      ...b,
      message: typeof b.message === 'string' ? scrubString(b.message) : b.message,
      data: b.data ? (scrubObject(b.data) as typeof b.data) : b.data,
    }))
  }

  // Mensaje top-level (raro pero por si acaso)
  if (typeof event.message === 'string') {
    event.message = scrubString(event.message)
  }

  return event
}
