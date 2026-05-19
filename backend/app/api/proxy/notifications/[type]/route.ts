import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  sendAllNamesTaken,
  sendCertificateDelivery,
  sendSuggestNames,
  sendOrderProcessed,
  sendOrderApproved,
} from '@/lib/notifications'
import { logAdminAction } from '@/lib/audit-log'

// Resuelve el admin token de la cookie.
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get('admin_session')
  if (!session?.value) return false
  return verifyAdminToken(session.value)
}

// Lee la orden desde Supabase REST (no Prisma — Railway desplazado).
async function getOrder(orderId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, firstName, lastName, email, companyName, companyName2, companyName3, package, speed, unsubscribed')
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
    // ── names-taken ─────────────────────────────────────────────────────────
    // Body esperado: { orderId }
    // Construye el array de 3 nombres desde la orden y dispara email cliente + alerta admin.
    if (type === 'names-taken') {
      const { orderId } = body
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta orderId' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      const names = [order.companyName, order.companyName2, order.companyName3].filter(Boolean) as string[]
      if (names.length !== 3) {
        return NextResponse.json({ success: false, message: 'La orden no tiene 3 nombres registrados' }, { status: 400 })
      }
      await sendAllNamesTaken({
        id: order.id,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        names: names as [string, string, string],
        unsubscribed: order.unsubscribed ?? false,
      })
      await logAdminAction({ action: 'email.names-taken', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Aviso enviado a ${order.email} y alerta a admin` })
    }

    // ── certificate ─────────────────────────────────────────────────────────
    if (type === 'certificate') {
      const { orderId } = body
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta orderId' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      await sendCertificateDelivery({
        id: order.id,
        firstName: order.firstName,
        email: order.email,
        companyName: order.companyName,
        unsubscribed: order.unsubscribed ?? false,
      })
      await logAdminAction({ action: 'email.certificate', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Certificate enviado a ${order.email}` })
    }

    // ── suggest-names ───────────────────────────────────────────────────────
    // Body esperado: { orderId, availableNames: string[] }
    if (type === 'suggest-names') {
      const { orderId, availableNames } = body
      if (!orderId || !Array.isArray(availableNames) || availableNames.length === 0) {
        return NextResponse.json({ success: false, message: 'Faltan campos: orderId, availableNames (array no vacío)' }, { status: 400 })
      }
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      await sendSuggestNames(
        { id: order.id, firstName: order.firstName, email: order.email, companyName: order.companyName },
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
      await sendOrderProcessed({
        id: order.id,
        firstName: order.firstName,
        email: order.email,
        companyName: order.companyName,
        speed: order.speed ?? undefined,
        unsubscribed: order.unsubscribed ?? false,
      })
      await logAdminAction({ action: 'email.order-processed', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Notificación "procesada" enviada a ${order.email}` })
    }

    // ── order-approved (status: approved) ───────────────────────────────────
    if (type === 'order-approved') {
      const orderId = body.id || body.orderId
      if (!orderId) return NextResponse.json({ success: false, message: 'Falta id' }, { status: 400 })
      const order = await getOrder(orderId)
      if (!order) return NextResponse.json({ success: false, message: 'Orden no encontrada' }, { status: 404 })
      await sendOrderApproved({
        id: order.id,
        firstName: order.firstName,
        email: order.email,
        companyName: order.companyName,
        unsubscribed: order.unsubscribed ?? false,
      })
      await logAdminAction({ action: 'email.order-approved', entity: 'Order', entityId: order.id, request })
      return NextResponse.json({ success: true, message: `Notificación "aprobada" enviada a ${order.email}` })
    }

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
