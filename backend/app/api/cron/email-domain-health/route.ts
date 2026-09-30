// GET /api/cron/email-domain-health — cada hora (vercel.json).
//
// Consulta a Resend el estado de todos los dominios de envío y avisa por
// Telegram + Sentry (lib/ops-alert.ts, canal independiente de Resend) si
// alguno dejó de estar `verified`.
//
// Por qué (incidente 2026-09-30): se borró el DKIM de opabiz.com en Namecheap,
// Resend pasó el dominio a `failed` y dejaron de salir TODOS los emails
// @opabiz.com — confirmación de orden, alerta interna y código 2FA del admin —
// sin que nada avisara. Con este cron el aviso llega en ≤1h, antes de que un
// cliente real pague y no reciba nada.
//
// Mientras el problema siga, avisa en cada corrida (1 por hora) a propósito:
// es un fallo que corta el negocio, no debe poder ignorarse.
//
// Protegido con Authorization: Bearer ${CRON_SECRET}, igual que el resto de crons.

import { NextRequest, NextResponse } from 'next/server'
import { notifyOps } from '@/lib/ops-alert'

export const dynamic = 'force-dynamic'

interface ResendDomain { name: string; status: string }

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  if ((req.headers.get('authorization') || '') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let domains: ResendDomain[]
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      // 401 = API key revocada/incorrecta: igual de grave que un dominio caído.
      await notifyOps(`Resend no responde al chequeo de dominios (HTTP ${res.status}). Los emails pueden no estar saliendo.`, 'error')
      return NextResponse.json({ ok: false, status: res.status }, { status: 502 })
    }
    domains = ((await res.json()) as { data?: ResendDomain[] }).data ?? []
  } catch (err) {
    await notifyOps(`Chequeo de dominios Resend falló: ${err instanceof Error ? err.message : String(err)}`, 'error')
    return NextResponse.json({ ok: false }, { status: 502 })
  }

  const broken = domains.filter(d => d.status !== 'verified')
  if (broken.length > 0) {
    await notifyOps(
      `Dominio(s) de email NO verificados en Resend — los emails desde ahí NO están saliendo:\n` +
      broken.map(d => `• ${d.name}: ${d.status}`).join('\n') +
      `\nRevisar DNS en Namecheap (DKIM resend._domainkey / SPF send) y tocar Verify en Resend. Ver LOGICA_DE_NEGOCIO/39_telegram_alert.md`,
      'error',
    )
  }

  return NextResponse.json({ ok: broken.length === 0, domains: domains.map(d => ({ name: d.name, status: d.status })) })
}
