// Alertas operativas por un canal INDEPENDIENTE de Resend.
//
// Por qué existe (incidente 2026-09-30): se borró el DKIM de opabiz.com en
// Namecheap, Resend marcó el dominio como `failed` y dejó de salir TODO email
// @opabiz.com — confirmación al cliente, alerta interna de orden pagada y el
// código 2FA del admin. Como la única vía de aviso también era email, nadie se
// enteró: una orden pagada solo se veía entrando al panel admin.
//
// Regla: una alerta que avisa que el email falló NUNCA puede viajar por email.
// Canal: Telegram Bot API (una llamada HTTP, sin SDK) + Sentry como respaldo
// (Sentry notifica por su propia infraestructura).
//
// Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID. Si faltan, degrada a
// console.warn + Sentry — nunca rompe el flujo que la llama.

import * as Sentry from '@sentry/nextjs'

type Level = 'info' | 'warning' | 'error'

const ICON: Record<Level, string> = { info: '🟢', warning: '🟠', error: '🔴' }

// Nunca lanza. Pensada para llamarse dentro de after() o de un catch.
export async function notifyOps(text: string, level: Level = 'info'): Promise<void> {
  if (level !== 'info') {
    try { Sentry.captureMessage(text, level) } catch { /* Sentry no disponible */ }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) {
    console.warn('[ops-alert] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID no configurados:', text)
    return
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Texto plano (sin parse_mode) para no tener que escapar nombres de
      // empresas con caracteres especiales de Markdown/HTML.
      body: JSON.stringify({ chat_id: chatId, text: `${ICON[level]} ${text}`, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('[ops-alert] Telegram respondió', res.status, await res.text())
  } catch (err) {
    console.error('[ops-alert] Telegram error:', err)
  }
}
