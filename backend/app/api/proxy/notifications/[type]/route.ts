import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  sendOrderConfirmation,
  sendAllNamesTaken,
  sendSuggestNames,
  sendOrderProcessed,
} from '@/lib/notifications'
import { logAdminAction } from '@/lib/audit-log'

// Resuelve el admin token de la cookie.
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Lee la orden desde Supabase REST.
async function getOrder(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, firstName, lastName, email, companyName, companyName2, companyName3, entityType, package, speed, addons, unsubscribed, orderProcessedEmailSentAt')
    .eq('id', orderId)
    .single()
  if (error || !data) return null
  return data
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await params
  const body = await request.json()

  try {
    // ── order-confirmation ──────────────────────────────────────────────────
    // Body esperado: { orderId }
    // Reenvía el email de confirmación de orden al cliente. Sirve para casos
    // donde el send original desde /api/orders se perdió (fire-and-forget en
    // Vercel serverless puede matar el Promise antes de que Resend lo reciba).
    if (type === 'order-confirmation') {
      const { orderId } = body
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta orderId' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      await sendOrderConfirmation({
        id: order.id,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        companyName: order.companyName,
        package: order.package,
        entityType: order.entityType,
        speed: order.speed,
        addons: order.addons as Record<string, boolean> | null,
      })
      await logAdminAction({ action: 'email.order-confirmation-resent', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Confirmación reenviada a ${order.email}` })
    }

    // ── names-taken ─────────────────────────────────────────────────────────
    // Body esperado: { orderId }
    // Construye el array de nombres desde la orden (1, 2 o 3) y dispara email
    // cliente + alerta admin. companyName2 y companyName3 son opcionales en el
    // form, por eso aceptamos cualquier cantidad >= 1.
    if (type === 'names-taken') {
      const { orderId, lang } = body
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta orderId' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      const names = [order.companyName, order.companyName2, order.companyName3].filter(Boolean) as string[]
      if (names.length < 1) {
        return NextResponse.json({ success: false, message: 'La orden no tiene nombres registrados' }, { status: 400 })
      }
      await sendAllNamesTaken({
        id: order.id,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        names,
        unsubscribed: order.unsubscribed ?? false,
        lang: lang === 'es' ? 'es' : 'en',
      })
      await logAdminAction({ action: 'email.names-taken', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Aviso enviado a ${order.email} y alerta a admin` })
    }

    // ── suggest-names ───────────────────────────────────────────────────────
    // Body esperado: { orderId, availableNames: string[] }
    if (type === 'suggest-names') {
      const { orderId, availableNames, lang } = body
      if (!orderId || !Array.isArray(availableNames) || availableNames.length === 0) {
        return NextResponse.json({ success: false, message: 'Faltan campos: orderId, availableNames (array no vacío)' }, { status: 400 })
      }
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      await sendSuggestNames(
        { id: order.id, firstName: order.firstName, lastName: order.lastName, email: order.email, companyName: order.companyName, lang: lang === 'es' ? 'es' : 'en' },
        availableNames as string[]
      )
      await logAdminAction({
        action: 'email.suggest-names',
        entity: 'Order',
        entityId: order.id,
        after: { availableNames },
        request,
      })
      return NextResponse.json({ success: true, message: `Sugerencias enviadas a ${order.email}` })
    }

    // ── order-processed (status: filed) ─────────────────────────────────────
    // Body esperado: { id } (formato que envía el admin frontend)
    if (type === 'order-processed') {
      const orderId = body.id || body.orderId
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta id' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      // Anti-duplicado: si el cron de Priority (cron/priority-filing-notice) ya
      // mandó este email solo, el botón "Filed" del admin no debe reenviarlo —
      // solo avanza el estado. Ver campo Order.orderProcessedEmailSentAt.
      if (order.orderProcessedEmailSentAt) {
        return NextResponse.json({ success: true, alreadySent: true, message: `El email ya se había enviado automáticamente (${new Date(order.orderProcessedEmailSentAt as string).toLocaleString()}).` })
      }
      await sendOrderProcessed({
        id: order.id,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        companyName: order.companyName,
        entityType: order.entityType ?? undefined,
        package: order.package,
        speed: order.speed ?? undefined,
        addons: (order.addons ?? null) as Record<string, boolean> | null,
        unsubscribed: order.unsubscribed ?? false,
        lang: body.lang === 'es' ? 'es' : 'en',
      })
      await getSupabaseAdmin().from('Order').update({ orderProcessedEmailSentAt: new Date().toISOString() }).eq('id', order.id)
      await logAdminAction({ action: 'email.order-processed', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Notificación "procesada" enviada a ${order.email}` })
    }

    // "order-approved" y "certificate" se eliminaron (2026-07-09): el botón
    // "Approved" del admin ahora es puramente interno (solo cambia status, sin
    // email), y el envío al cliente se unificó en POST /api/admin/send-approval-update
    // (checklist de ítems + archivos adjuntos, ver lib/notifications.ts sendOrderApprovalUpdate).

    return NextResponse.json({ success: false, message: `Tipo de notificación desconocido: ${type}` }, { status: 400 })
  } catch (err: unknown) {
    const error = err as { message?: string; stack?: string }
    console.error(`[POST /api/proxy/notifications/${type}] error:`, {
      orderId: body?.orderId || body?.id,
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal error' }, { status: 500 })
  }
}
