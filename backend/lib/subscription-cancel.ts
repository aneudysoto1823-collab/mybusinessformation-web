// Cancelación de una suscripción (RA / VA / AR), compartida por el portal del
// cliente (/api/subscriptions/cancel) y el panel admin
// (/api/admin/orders/[id]/cancel-subscription). Los tipos y márgenes viven en
// lib/subscription-cancel-policy.ts.
//
// Esta función manda ella misma el email de confirmación al cliente (con el
// texto exacto de la opción elegida) y la alerta interna. Para que el webhook
// no mande además su email genérico, la entrada de Order.subscriptions se marca
// con cancelNoticeSent:true ANTES de llamar a Stripe (ver
// handleSubscriptionUpdated / handleSubscriptionDeleted en
// app/api/webhooks/stripe/route.ts). Si Stripe falla, se restaura.

import { after } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { getResend } from './resend-client'
import { notifyOps } from './ops-alert'
import { SERVICES_CATALOG } from './services-pricing'
import { upsertOrderSubscription, type OrderSubscriptionEntry } from './order-subscriptions'
import {
  INTERNAL_ALERT_EMAIL, FROM_OPABIZ_ALERTS, REPLY_TO,
  brandFrom, brandReplyTo, brandHeaderHtml, brandFooterLine, brandSubjectPrefix, brandPortalHome,
  type EmailBrand,
} from './email-constants'
import { getCancelPolicy, computeServiceEndDate, formatCancelDate, serviceEndsAtRenewal, MAIL_ES, MAIL_EN, type CancelType } from './subscription-cancel-policy'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

// Categorías válidas de Stripe para cancellation_details.feedback.
export const VALID_CANCEL_FEEDBACK = new Set([
  'customer_service', 'low_quality', 'missing_features', 'other',
  'switched_service', 'too_complex', 'too_expensive', 'unused',
])

const FEEDBACK_LABELS_ES: Record<string, string> = {
  customer_service: 'Problema de servicio al cliente',
  low_quality: 'Calidad no esperada',
  missing_features: 'Le faltan funciones',
  other: 'Otro',
  switched_service: 'Cambió a otro proveedor',
  too_complex: 'Muy complicado',
  too_expensive: 'Muy caro',
  unused: 'No lo usa',
}

export type CancelResult =
  | { ok: true; type: CancelType; endsAt: string }
  | { ok: false; status: number; error: string; detail?: string }

export async function cancelOrderSubscription(opts: {
  orderId: string
  stripeSubscriptionId: string
  type: CancelType
  actor: 'admin' | 'client'
  reason?: string
  comment?: string
  notifyClient: boolean
}): Promise<CancelResult> {
  const supabase = getSupabaseAdmin()
  const { data: order } = await supabase
    .from('Order')
    .select('id, email, firstName, lastName, companyName, sourceBrand, addons, notes, subscriptions')
    .eq('id', opts.orderId)
    .maybeSingle()
  if (!order) return { ok: false, status: 404, error: 'Orden no encontrada' }

  const subscriptions: OrderSubscriptionEntry[] = Array.isArray(order.subscriptions) ? order.subscriptions : []
  const entry = subscriptions.find(s => s.stripeSubscriptionId === opts.stripeSubscriptionId)
  if (!entry) return { ok: false, status: 404, error: 'Suscripción no encontrada en esta orden' }
  if (entry.status === 'canceled') return { ok: false, status: 409, error: 'Esta suscripción ya está cancelada' }

  const policy = getCancelPolicy(entry.service)
  if (!policy.options.includes(opts.type)) {
    return { ok: false, status: 400, error: 'Este tipo de cancelación no aplica a este servicio' }
  }
  if (entry.cancelType === 'service') {
    return { ok: false, status: 409, error: 'El servicio ya tiene una baja en curso' }
  }
  if (entry.cancelNoticeSent && opts.type === 'renewal') {
    return { ok: false, status: 409, error: 'La renovación ya está cancelada' }
  }

  const now = new Date()
  const endsAt = opts.type === 'renewal'
    ? (entry.currentPeriodEnd ? new Date(entry.currentPeriodEnd) : now)
    : computeServiceEndDate(entry.service, entry.currentPeriodEnd, now)
  const endsNow = opts.type === 'service' && endsAt.getTime() <= now.getTime() + 60_000
  const endsAtPeriodEnd = !!entry.currentPeriodEnd && endsAt.getTime() >= new Date(entry.currentPeriodEnd).getTime()

  const markedEntry: OrderSubscriptionEntry = {
    ...entry,
    cancelNoticeSent: true,
    cancelType: opts.type,
    serviceEndsAt: endsAt.toISOString(),
  }
  await upsertOrderSubscription(order.id, markedEntry)

  const tag = opts.actor === 'admin' ? '[Admin]' : '[Cliente]'
  const cancellation_details = {
    feedback: (opts.reason && VALID_CANCEL_FEEDBACK.has(opts.reason) ? opts.reason : undefined) as Stripe.SubscriptionUpdateParams.CancellationDetails['feedback'],
    comment: `${tag} ${opts.type === 'renewal' ? 'Cancela la renovación' : 'Cancela el servicio'}${opts.comment ? `. ${opts.comment}` : ''}`.slice(0, 500),
  }

  const voidedInvoices: string[] = []
  try {
    const stripe = getStripe()
    if (endsNow) {
      await stripe.subscriptions.cancel(opts.stripeSubscriptionId, { cancellation_details })
    } else if (opts.type === 'renewal' || endsAtPeriodEnd) {
      await stripe.subscriptions.update(opts.stripeSubscriptionId, { cancel_at_period_end: true, cancellation_details })
    } else {
      await stripe.subscriptions.update(opts.stripeSubscriptionId, {
        cancel_at: Math.floor(endsAt.getTime() / 1000),
        proration_behavior: 'none',
        cancellation_details,
      })
    }
    // Al cancelar el servicio, cualquier renovación que haya quedado impaga se
    // anula: Stripe deja de reintentar el cobro (y de mandar alertas).
    if (opts.type === 'service') {
      try {
        const open = await stripe.invoices.list({ subscription: opts.stripeSubscriptionId, status: 'open', limit: 20 })
        for (const inv of open.data) {
          if (!inv.id) continue
          await stripe.invoices.voidInvoice(inv.id)
          voidedInvoices.push(inv.id)
        }
      } catch (e) {
        console.error('[subscription-cancel] void open invoices (non-fatal):', e)
      }
    }
  } catch (err) {
    await upsertOrderSubscription(order.id, entry).catch(() => {})
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[subscription-cancel]', msg)
    return { ok: false, status: 500, error: 'No se pudo cancelar la suscripción', detail: msg }
  }

  // ── Constancia en las notas de la orden ─────────────────────────────────
  const stamp = now.toLocaleString('es-ES', { timeZone: 'America/New_York' })
  const typeEs = opts.type === 'renewal' ? 'cancela la renovación' : 'cancela el servicio'
  const line = `[${stamp}] ${opts.actor === 'admin' ? 'Admin' : 'Cliente'} ${typeEs} de ${entry.service}. Termina: ${formatCancelDate(endsAt, 'es')}.${opts.reason ? ` Motivo: ${FEEDBACK_LABELS_ES[opts.reason] ?? opts.reason}.` : ''}${opts.comment ? ` Comentario: ${opts.comment}.` : ''} Cliente ${opts.notifyClient ? 'avisado' : 'NO avisado'} por email.`
  await supabase.from('Order').update({ notes: order.notes ? `${order.notes}\n${line}` : line }).eq('id', order.id)

  // ── Emails ──────────────────────────────────────────────────────────────
  const brand = order.sourceBrand as EmailBrand
  const addons = (order.addons && typeof order.addons === 'object' && !Array.isArray(order.addons)) ? order.addons as { lang?: string } : {}
  const isEs = addons.lang === 'es'
  const catalog = SERVICES_CATALOG[entry.service]
  const serviceName = catalog ? (isEs ? catalog.name_es : catalog.name_en) : entry.service
  const serviceNameEs = catalog ? catalog.name_es : entry.service
  const customerName = [order.firstName, order.lastName].filter(Boolean).join(' ').trim()
  const company = order.companyName && order.companyName !== 'Pending' ? order.companyName : null
  const orderNumber = `FBFC-${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

  if (opts.notifyClient) {
    after(async () => {
      try {
        await getResend().emails.send({
          from: brandFrom(brand),
          replyTo: brandReplyTo(brand),
          to: order.email,
          subject: isEs
            ? `${brandSubjectPrefix(brand)}Confirmación de cancelación de ${serviceName}`
            : `${brandSubjectPrefix(brand)}Your ${serviceName} cancellation is confirmed`,
          html: buildClientEmailHtml({ brand, isEs, service: entry.service, serviceName, customerName, company, orderNumber, type: opts.type, endsAt, endsNow }),
        })
      } catch (e) { console.error('[subscription-cancel] client email error (non-fatal):', e) }
    })
  }

  const providerAction = policy.provider
    ? `ACCIÓN REQUERIDA: avisar a ${policy.provider} que ${company ?? 'la empresa del cliente'} ${opts.type === 'renewal' ? 'NO renueva' : 'se da de baja'}. El servicio termina el ${formatCancelDate(endsAt, 'es')}.`
    : null

  after(async () => {
    try {
      await getResend().emails.send({
        from: FROM_OPABIZ_ALERTS,
        replyTo: REPLY_TO,
        to: INTERNAL_ALERT_EMAIL,
        subject: `OpaBiz Alerts: Cancelación solicitada (${opts.type === 'renewal' ? 'renovación' : 'servicio'}): ${serviceNameEs}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
            ${providerAction ? `<div style="background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-weight:700">${providerAction}</div>` : ''}
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#64748b;width:38%">Orden</td><td style="padding:6px 0;font-weight:600">${orderNumber}</td></tr>
              ${customerName ? `<tr><td style="padding:6px 0;color:#64748b">Cliente</td><td style="padding:6px 0;font-weight:600">${customerName}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${order.email}" style="color:#2563eb">${order.email}</a></td></tr>
              ${company ? `<tr><td style="padding:6px 0;color:#64748b">Empresa</td><td style="padding:6px 0;font-weight:600">${company}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#64748b">Servicio</td><td style="padding:6px 0;font-weight:600">${serviceNameEs}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Tipo</td><td style="padding:6px 0;font-weight:600">${opts.type === 'renewal' ? 'Cancelar la renovación automática' : 'Dar de baja el servicio'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Termina</td><td style="padding:6px 0;font-weight:600">${endsNow ? 'Hoy' : formatCancelDate(endsAt, 'es')}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Pedido por</td><td style="padding:6px 0">${opts.actor === 'admin' ? 'Admin (panel)' : 'Cliente (portal)'}</td></tr>
              ${opts.reason ? `<tr><td style="padding:6px 0;color:#64748b">Motivo</td><td style="padding:6px 0">${FEEDBACK_LABELS_ES[opts.reason] ?? opts.reason}</td></tr>` : ''}
              ${opts.comment ? `<tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Comentario</td><td style="padding:6px 0">${escapeHtml(opts.comment)}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#64748b">Email al cliente</td><td style="padding:6px 0">${opts.notifyClient ? 'Enviado' : 'No enviado'}</td></tr>
              ${voidedInvoices.length ? `<tr><td style="padding:6px 0;color:#64748b">Facturas anuladas</td><td style="padding:6px 0">${voidedInvoices.join(', ')}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#64748b">Suscripción</td><td style="padding:6px 0;font-family:monospace;font-size:12px">${opts.stripeSubscriptionId}</td></tr>
            </table>
            <div style="margin-top:16px"><a href="https://opabiz.com/admin/orders/${order.id}" style="display:inline-block;border:1px solid #2563eb;color:#2563eb;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:700">Abrir en el panel admin</a></div>
          </div>
        `,
      })
    } catch (e) { console.error('[subscription-cancel] internal alert error (non-fatal):', e) }
  })

  if (providerAction) {
    after(() => notifyOps(`${providerAction}\nOrden: ${orderNumber}\nCliente: ${customerName || order.email}\nhttps://opabiz.com/admin/orders/${order.id}`, 'warning'))
  }

  return { ok: true, type: opts.type, endsAt: endsAt.toISOString() }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildClientEmailHtml(p: {
  brand: EmailBrand
  isEs: boolean
  service: string
  serviceName: string
  customerName: string
  company: string | null
  orderNumber: string
  type: CancelType
  endsAt: Date
  endsNow: boolean
}): string {
  const { isEs } = p
  const date = formatCancelDate(p.endsAt, isEs ? 'es' : 'en')
  const isRa = p.service === 'registered-agent'
  const isAr = p.service === 'annual-report'
  const { noticeDays } = getCancelPolicy(p.service)
  const forCompany = p.company ? (isEs ? ` de ${p.company}` : ` for ${p.company}`) : ''

  const paras: string[] = []
  if (p.type === 'renewal') {
    paras.push(isEs
      ? `Confirmamos que canceló la renovación automática de su servicio de <strong>${p.serviceName}</strong>${forCompany}.`
      : `This confirms that you canceled the automatic renewal of your <strong>${p.serviceName}</strong> service${forCompany}.`)
    paras.push(isEs
      ? `Su servicio sigue activo hasta el <strong>${date}</strong>.${isRa ? ` Hasta ese día, ${MAIL_ES}.` : ''} Después de esa fecha el servicio termina y no se renueva.`
      : `Your service stays active through <strong>${date}</strong>.${isRa ? ` Until that day, ${MAIL_EN}.` : ''} After that date the service ends and does not renew.`)
    if (isAr) {
      paras.push(isEs
        ? 'No presentaremos su próxima Declaración Anual. Recuerde que el Estado de Florida la exige cada año, entre el 1 de enero y el 1 de mayo.'
        : "We won't file your next Annual Report. Remember that the State of Florida requires it every year, between January 1 and May 1.")
    }
    if (isRa) {
      paras.push(isEs
        ? 'Antes de esa fecha, su empresa debe designar un nuevo Agente Registrado ante el Estado de Florida. Toda empresa de Florida está obligada a tener uno.'
        : 'Before that date, your company must appoint a new Registered Agent with the State of Florida. Every Florida company is required to have one.')
    }
    paras.push(isEs
      ? 'Si cambia de opinión antes de esa fecha, puede reactivar la renovación desde su cuenta.'
      : 'If you change your mind before that date, you can reactivate the renewal from your account.')
  } else if (p.endsNow) {
    paras.push(isEs
      ? `Confirmamos que canceló su servicio de <strong>${p.serviceName}</strong>${forCompany}. El servicio terminó hoy.`
      : `This confirms that you canceled your <strong>${p.serviceName}</strong> service${forCompany}. The service ended today.`)
  } else {
    paras.push(isEs
      ? `Confirmamos que dio de baja su servicio de <strong>${p.serviceName}</strong>${forCompany}.`
      : `This confirms that you canceled your <strong>${p.serviceName}</strong> service${forCompany}.`)
    paras.push(serviceEndsAtRenewal(p.service, p.endsAt)
      ? (isEs
        ? `Su servicio termina el <strong>${date}</strong>, el último día de su período ya pagado. Hasta esa fecha, ${MAIL_ES}. A partir de esa fecha, ya no recibiremos correspondencia a nombre de su empresa.`
        : `Your service ends on <strong>${date}</strong>, the last day of your paid period. Until that date, ${MAIL_EN}. After that date, we will no longer receive mail on behalf of your company.`)
      : (isEs
        ? `Su servicio termina el <strong>${date}</strong>. Mantenemos un margen de ${noticeDays} días porque puede haber correspondencia oficial en camino para su empresa. Hasta esa fecha, ${MAIL_ES}. A partir de esa fecha, ya no recibiremos correspondencia a nombre de su empresa.`
        : `Your service ends on <strong>${date}</strong>. We keep a ${noticeDays}-day window because official mail for your company may already be on its way. Until that date, ${MAIL_EN}. After that date, we will no longer receive mail on behalf of your company.`))
    if (isRa) {
      paras.push(isEs
        ? 'Su empresa debe designar un nuevo Agente Registrado ante el Estado de Florida antes de esa fecha. Toda empresa de Florida está obligada a tener uno.'
        : 'Your company must appoint a new Registered Agent with the State of Florida before that date. Every Florida company is required to have one.')
    }
  }
  paras.push(isEs
    ? 'Si tiene alguna pregunta, o si usted no pidió esta cancelación, responda este correo.'
    : "If you have any questions, or if you didn't request this cancellation, just reply to this email.")

  const greeting = p.customerName ? (isEs ? `Hola ${p.customerName},` : `Hello ${p.customerName},`) : (isEs ? 'Hola,' : 'Hello,')

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
      <table style="width:100%;border-collapse:collapse;padding:20px 28px;background:#fff;border-radius:10px 10px 0 0"><tr>${brandHeaderHtml(p.brand)}</tr></table>
      <div style="background:#fff;padding:8px 28px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;font-size:14px;line-height:1.6">
        <p>${greeting}</p>
        <p style="color:#64748b;font-size:13px">${isEs ? 'Número de orden' : 'Order Number'}: <strong style="color:#1e293b">${p.orderNumber}</strong></p>
        ${paras.map(t => `<p>${t}</p>`).join('\n        ')}
        <div style="text-align:center;margin:20px 0">
          <a href="${brandPortalHome(p.brand)}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:700">${isEs ? 'Ver Mi Cuenta' : 'View My Account'}</a>
        </div>
        <p style="color:#64748b;font-size:12.5px">${brandFooterLine(p.brand)}</p>
      </div>
    </div>
  `
}
