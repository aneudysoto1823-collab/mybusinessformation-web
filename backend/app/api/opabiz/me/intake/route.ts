import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { OrderDraftInputSchema, parseOr400 } from '@/lib/schemas'
import { findOrCreateClienteUsuario } from '@/lib/opabiz-clientes'
import { registrarPuntaje } from '@/lib/opabiz-empleados'
import { FROM_TRANSACTIONAL, REPLY_TO } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'

// Puntos por completar una intake asistida — mismo flat award que completar
// cualquier orden de campo (ver lib/opabiz-empleados.ts). Una bonificación
// proporcional a lo vendido queda para más adelante.
const PUNTOS_INTAKE_ASISTIDA = 10

function sendConfirmEmail(order: { id: string; email: string; firstName: string; lastName: string; companyName: string }) {
  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
  const confirmUrl = `${SITE_URL}/confirm/${fbfc}`
  return getResend().emails.send({
    from: `OpaBiz <${FROM_TRANSACTIONAL}>`,
    replyTo: REPLY_TO,
    to: order.email,
    subject: `OpaBiz: Tu solicitud está lista para revisar — ${fbfc}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#1C2E44;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;font-size:22px;margin:0">Florida Business Formation Center</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
          <h2 style="color:#1C2E44;font-size:20px">Hola ${order.firstName} ${order.lastName}, tu solicitud está lista</h2>
          <p style="color:#475569;line-height:1.7">
            Uno de nuestros agentes preparó la solicitud de formación de <strong>${order.companyName}</strong> con vos.
            Revisá los detalles y confirmá tu pago cuando quieras — no hace falta volver a llenar nada.
          </p>
          <div style="text-align:center;margin:26px 0">
            <a href="${confirmUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:700">
              Revisar y pagar →
            </a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Número de orden</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#1e40af;letter-spacing:1px">${fbfc}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6">Si algo no es correcto, respondé este email y te ayudamos.</p>
        </div>
      </div>
    `,
  })
}

// POST /api/opabiz/me/intake — el agente arma la solicitud de un cliente por
// teléfono/en persona y la envía. El agente NUNCA toca el pago (riesgo PCI):
// esto crea el Order (isDraft:true) directamente (sin pasar por
// /api/orders/draft, para no depender de su email/flujo de resume, pensado
// para que el CLIENTE mismo continúe llenando el form — acá no aplica) y
// manda un email propio con link a /confirm/[fbfc], una página liviana de
// solo revisar + pagar. Ver LOGICA_DE_NEGOCIO/17 para el razonamiento
// completo de por qué no se reusa el flujo ?continue= del home.
export async function POST(req: NextRequest) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = await req.json().catch(() => ({}))
  const parsed = parseOr400(OrderDraftInputSchema, raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const body = parsed.data
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: order, error: orderErr } = await supabase
    .from('Order')
    .insert({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      paymentStatus: 'pending',
      status: 'pending',
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      email: String(body.email),
      phone: body.phone || null,
      country: body.country || 'US',
      companyName: String(body.companyName),
      companyName2: body.companyName2 || null,
      companyName3: body.companyName3 || null,
      entityType: body.entityType || 'llc',
      businessAddress: body.businessAddress || null,
      speed: body.speed || 'standard',
      package: body.package || 'basic',
      amount: 0,
      currency: 'USD',
      members: body.members ?? null,
      registeredAgent: body.registeredAgent || 'us',
      addons: body.addons ?? null,
      isDraft: true,
      assistedByEmpleadosId: session.empleadosId,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? 'No se pudo crear la solicitud' }, { status: 500 })
  }

  let clienteId: string
  try {
    clienteId = await findOrCreateClienteUsuario(supabase, {
      email: String(body.email),
      nombre: `${body.firstName} ${body.lastName}`,
      telefono: body.phone,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const { data: ordenOpabiz, error: ordenOpabizErr } = await supabase
    .from('ordenes_opabiz')
    .insert({
      cliente_id: clienteId,
      empleado_id: session.empleadosId,
      tipo_servicio: 'Intake asistida',
      notas: String(body.companyName),
      estado: 'completada',
      es_urgente: false,
      fecha_asignacion: now,
      fecha_inicio: now,
      fecha_completada: now,
    })
    .select('id')
    .single()

  if (ordenOpabizErr || !ordenOpabiz) {
    return NextResponse.json({ error: ordenOpabizErr?.message ?? 'No se pudo registrar la orden en OpaBiz Connect' }, { status: 500 })
  }

  await registrarPuntaje(supabase, session.empleadosId, PUNTOS_INTAKE_ASISTIDA, 'intake_asistida')

  // historial_actividad.order_id es FK a ordenes_opabiz.id (uuid) — NUNCA el
  // id del Order público (cuid, tipo distinto). Usar el id recién creado arriba.
  await supabase.from('historial_actividad').insert({
    usuario_id: session.usuarioId,
    order_id: ordenOpabiz.id,
    tipo_evento: 'intake_asistida',
    detalle: `Solicitud armada por un agente para ${body.companyName}.`,
  })

  const fbfc = `FBFC-${order.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

  try {
    await sendConfirmEmail({
      id: order.id, email: String(body.email),
      firstName: String(body.firstName), lastName: String(body.lastName),
      companyName: String(body.companyName),
    })
  } catch (err) {
    console.error('[opabiz/me/intake] email error:', err)
  }

  return NextResponse.json({ orderId: order.id, fbfc }, { status: 201 })
}
