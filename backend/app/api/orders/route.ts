import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { checkOrdersRateLimit, getClientIp } from '@/lib/rate-limit'
import { OrderInputSchema, parseOr400 } from '@/lib/schemas'
import { checkNameAvailability, nameCheckHtmlLine, NameCheckResult } from '@/lib/sunbiz-namecheck'
import { sendOrderConfirmation } from '@/lib/notifications'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
// Mismo patrón que lib/notifications.ts: FROM/Reply-To centralizados en env
// vars. Sin esto, Resend rechaza el envío porque onboarding@resend.dev solo
// permite enviar al dueño de la cuenta de Resend (modo sandbox).
const FROM_EMAIL = process.env.RESEND_FROM_TRANSACTIONAL || 'onboarding@resend.dev'
const REPLY_TO   = process.env.RESEND_REPLY_TO || 'info@opabiz.com'
const INTERNAL_ALERT = process.env.INTERNAL_ALERT_EMAIL || 'alert@opabiz.com'
// Display Name para la alerta interna al admin (el email al cliente lo maneja
// sendOrderConfirmation() en lib/notifications.ts, que ya trae el suyo).
const FROM_OPABIZ_ALERTS = `OpaBiz Alerts <${FROM_EMAIL}>`

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 órdenes / hora / IP. Fail-open si Upstash cae.
    const ip = getClientIp(request)
    const rl = await checkOrdersRateLimit(ip)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const raw = await request.json()
    // Flujo Embedded Checkout: la orden se crea pending y los emails los envía
    // el webhook al confirmarse el pago. Así evitamos confirmar/alertar órdenes
    // que el cliente podría abandonar antes de pagar.
    const deferEmails = raw?.deferEmails === true
    const parsed = parseOr400(OrderInputSchema, raw)
    if (!parsed.ok) {
      console.error('[/api/orders] validation error:', parsed.details)
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
    }
    const body = parsed.data

    const orderFields = {
      updatedAt:       new Date().toISOString(),
      // Contacto
      firstName:       String(body.firstName),
      lastName:        String(body.lastName),
      email:           String(body.email),
      phone:           body.phone           || null,
      country:         body.country         || 'US',

      // Empresa
      companyName:     String(body.companyName),
      companyName2:    body.companyName2    || null,
      companyName3:    body.companyName3    || null,
      entityType:      body.entityType      || 'llc',
      businessAddress: body.businessAddress || null,

      // Configuración del trámite
      speed:           body.speed           || 'standard',
      package:         body.package         || 'basic',
      amount:          Number(body.amount)  || 0,
      currency:        'USD',

      // Datos adicionales (Json)
      members:         body.members         ?? null,
      registeredAgent: body.registeredAgent || 'us',
      addons:          body.addons          ?? null,
      orgSignature:    body.orgSignature     || null,

      // Estado inicial
      paymentStatus: 'pending',
      status:        'pending',
    }

    // ── Si viene de un borrador (ver /api/orders/draft) o de una orden pending
    //    ya creada por un prefetch anterior en esta misma sesión (ver
    //    _fmDraftOrderId en page.tsx), actualizarla en vez de insertar una fila
    //    duplicada. El filtro paymentStatus:'pending' es el blindaje: cubre
    //    ambos casos (draft real o prefetch) y nunca pisa una orden ya pagada.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any = null
    let error: { message: string } | null = null

    if (body.draftOrderId) {
      const updateRes = await getSupabaseAdmin()
        .from('Order')
        .update({ ...orderFields, isDraft: false, draftSnapshot: null })
        .eq('id', body.draftOrderId)
        .eq('paymentStatus', 'pending')
        .select()
        .maybeSingle()
      order = updateRes.data
      error = updateRes.error
    }

    // ── Insertar orden en Supabase (HTTP, sin conexión directa a PostgreSQL) ──
    // Camino normal, y fallback si el borrador ya no existía / no se pudo actualizar.
    if (!order) {
      const insertRes = await getSupabaseAdmin()
        .from('Order')
        .insert({
          id:        crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          isDraft:   false,
          ...orderFields,
        })
        .select()
        .single()
      order = insertRes.data
      error = insertRes.error
    }

    if (error || !order) {
      console.error('[/api/orders] Supabase insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Error saving order', detail: error?.message },
        { status: 500 }
      )
    }

    // ── Chequeo de disponibilidad de nombre (server-side, guardado en
    //    Order.nameCheck para que el admin lo vea en email + panel).
    //    El cliente NO ve el resultado (decisión negocio 2026-06-25).
    //    Si el chequeo falla, nameCheck queda null y la orden continúa normal —
    //    NUNCA bloquea la creación de la orden.
    let nameCheck: NameCheckResult | null = null
    try {
      nameCheck = await checkNameAvailability(order.companyName)
      // Guardar en la columna nameCheck (JSONB). Non-blocking: si UPDATE falla,
      // solo logueamos y seguimos.
      const { error: nameCheckErr } = await getSupabaseAdmin()
        .from('Order')
        .update({ nameCheck })
        .eq('id', order.id)
      if (nameCheckErr) console.error('[/api/orders] nameCheck update error (non-fatal):', nameCheckErr)
    } catch (e) {
      console.error('[/api/orders] name check error (non-fatal):', e)
      nameCheck = null
    }

    // ── Pre-computar la linea HTML del name-check en una variable protegida.
    //    Si nameCheckHtmlLine throws por cualquier motivo, el email sale igual
    //    (con la linea vacia) y NO afecta la creacion ni el envio.
    let nameCheckHtml = ''
    try { nameCheckHtml = nameCheckHtmlLine(nameCheck) }
    catch (e) { console.error('[/api/orders] nameCheckHtmlLine error (non-fatal):', e) }

    // ── Emails — se omiten en el flujo Embedded Checkout (los manda el webhook
    //    al confirmarse el pago, ver deferEmails arriba) ────────────────────────
    if (!deferEmails) {
    // ── Email de confirmación — non-blocking. Usa sendOrderConfirmation() de
    //    lib/notifications.ts (antes duplicaba el HTML acá adentro, con riesgo
    //    de que este template y el del botón "Reenviar" en el admin divergieran).
    sendOrderConfirmation({
      id: order.id,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      companyName: order.companyName,
      package: order.package,
      entityType: order.entityType,
      speed: order.speed,
      addons: order.addons,
    }).catch(err => console.error('Email confirmation error (non-fatal):', err))

    // ── Alerta interna "🆕 NUEVA ORDEN CREADA" → alert@opabiz.com ──────────────
    // Aviso al equipo para que sepan que entró una orden nueva. Mismo patrón
    // non-blocking que la confirmación al cliente (no bloquea la response).
    const fbfcNumber = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
    getResend().emails.send({
      from: FROM_OPABIZ_ALERTS,
      replyTo: REPLY_TO,
      to: INTERNAL_ALERT,
      subject: `OpaBiz Alerts: 🆕 NUEVA ORDEN CREADA — ${order.companyName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
          <div style="background:#059669;padding:20px 32px;border-radius:10px 10px 0 0">
            <h1 style="color:#fff;font-size:20px;margin:0">🆕 NUEVA ORDEN CREADA</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p style="color:#1e293b;font-size:15px;margin:0 0 20px">
              Acaba de entrar una orden nueva en opabiz.com.
              <strong>Revisar en el panel admin para iniciar el flujo.</strong>
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:40%">Confirmation Number</td>
                <td style="padding:8px 0;font-weight:700;color:#1e40af">${fbfcNumber}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 4px;color:#64748b">Cliente</td>
                <td style="padding:8px 4px;font-weight:600">${order.firstName} ${order.lastName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Email</td>
                <td style="padding:8px 0">
                  <a href="mailto:${order.email}" style="color:#059669">${order.email}</a>
                </td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 4px;color:#64748b">Empresa</td>
                <td style="padding:8px 4px;font-weight:600">${order.companyName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Entity Type</td>
                <td style="padding:8px 0">${(order.entityType ?? 'llc').toUpperCase()}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 4px;color:#64748b">Paquete</td>
                <td style="padding:8px 4px">${order.package}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b">Filing Speed</td>
                <td style="padding:8px 0">${order.speed}</td>
              </tr>
            </table>
            <div style="text-align:center;margin:24px 0 8px">
              <a href="https://opabiz.com/admin/orders/${order.id}"
                 style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">
                Abrir en el panel admin →
              </a>
            </div>
            ${nameCheckHtml}
            <div style="margin-top:12px;padding:12px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1e40af">
              El cliente ya recibió email de confirmación automático.
            </div>
          </div>
        </div>
      `
    }).catch(err => console.error('Internal alert email error (non-fatal):', err))
    } // fin if (!deferEmails)

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 })

  } catch (error) {
    console.error('[/api/orders POST] Error inesperado:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: 'Error processing order', detail: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  if (!session?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { verifyAdminToken } = await import('@/lib/session')
  if (!(await verifyAdminToken(session.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: orders, error } = await getSupabaseAdmin()
      .from('Order')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 })
  }
}
