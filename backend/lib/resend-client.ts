// Cliente Resend compartido que NUNCA falla en silencio.
//
// El SDK de Resend no lanza excepción cuando el envío es rechazado (dominio
// no verificado, remitente inválido, rate limit, etc.): devuelve `{ error }`.
// Ninguno de los envíos del sitio revisaba ese campo, así que un fallo total
// (incidente 2026-09-30, DKIM borrado) no dejaba ni un log.
//
// Este wrapper conserva exactamente la misma firma y el mismo valor de retorno
// de `emails.send` — los call sites no cambian — y además, si hay error, lo
// loguea y lo reporta por notifyOps (Telegram + Sentry, canal independiente).

import { Resend } from 'resend'
import { notifyOps } from './ops-alert'

// "juan@gmail.com" → "ju***@gmail.com" (el aviso no necesita el email completo).
function maskEmail(addr: string): string {
  const [user, domain] = addr.split('@')
  if (!domain) return '***'
  return `${user.slice(0, 2)}***@${domain}`
}

function recipients(to: unknown): string {
  const list = Array.isArray(to) ? to : [to]
  return list.filter((x): x is string => typeof x === 'string').map(maskEmail).join(', ') || '?'
}

async function reportFailure(payload: { to?: unknown; subject?: unknown; from?: unknown }, err: unknown) {
  const msg = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err)
  console.error('[resend] envío fallido:', { subject: payload.subject, from: payload.from, error: err })
  await notifyOps(
    `Email NO enviado\nAsunto: ${String(payload.subject ?? '?')}\nPara: ${recipients(payload.to)}\nDesde: ${String(payload.from ?? '?')}\nError: ${msg}`,
    'error',
  )
}

export function getResend(): Resend {
  const client = new Resend(process.env.RESEND_API_KEY)
  const originalSend = client.emails.send.bind(client.emails)

  client.emails.send = (async (payload, options) => {
    try {
      const result = await originalSend(payload, options)
      if (result.error) await reportFailure(payload, result.error)
      return result
    } catch (err) {
      await reportFailure(payload, err)
      throw err
    }
  }) as typeof client.emails.send

  return client
}
