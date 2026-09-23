import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkOrdersDraftRateLimit, getClientIp } from '@/lib/rate-limit'
import { OrderDraftInputSchema, parseOr400 } from '@/lib/schemas'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { findOrCreateClienteUsuario } from '@/lib/opabiz-clientes'
import { registrarPuntaje } from '@/lib/opabiz-empleados'
import { encryptEinTaxId } from '@/lib/ein-tax-id'
import { sendContinueApplicationEmail } from '@/lib/notifications'

const PUNTOS_INTAKE_ASISTIDA = 10

// Intake asistida (OpaBiz Connect): un empleado logueado puede usar este
// mismo formulario público para armarle la solicitud a un cliente por
// teléfono (ver LOGICA_DE_NEGOCIO/17 — decisión 2026-07-14 de reusar el form
// real en vez de mantener uno propio aparte). Se atribuye SOLO cuando el
// guardado llega desde el paso final (Review, snapshot.step===8) — un
// guardado a mitad de la llamada no cuenta como "completado" — y solo una
// vez por orden (chequea que Order.assistedByEmpleadosId no esté seteado
// todavía, por si el agente guarda dos veces desde ese paso).
//
// La detección de "modo agente" en page.tsx (cliente) es puramente cosmética
// (mostrar/ocultar el área de pago) — ESTA función, que revalida la cookie
// opabiz_session server-side, es la única fuente de verdad para puntaje y
// trazabilidad.
async function trackAgentAssistedIntake(
  request: NextRequest,
  orderId: string,
  body: { snapshot?: unknown; firstName: string; lastName: string; email: string; companyName: string },
) {
  const step = (body.snapshot as { step?: number } | null)?.step
  if (step !== 8) return

  const session = await getEmployeeSession(request)
  if (!session) return

  try {
    const supabase = getSupabaseAdmin()

    const { data: order } = await supabase
      .from('Order')
      .select('assistedByEmpleadosId')
      .eq('id', orderId)
      .maybeSingle()
    if (!order || order.assistedByEmpleadosId) return

    const clienteId = await findOrCreateClienteUsuario(supabase, {
      email: body.email, nombre: `${body.firstName} ${body.lastName}`,
    })

    const now = new Date().toISOString()
    await supabase.from('ordenes_opabiz').insert({
      cliente_id: clienteId,
      empleado_id: session.empleadosId,
      tipo_servicio: 'Intake asistida',
      notas: body.companyName,
      estado: 'completada',
      es_urgente: false,
      fecha_asignacion: now,
      fecha_inicio: now,
      fecha_completada: now,
    })

    await supabase.from('Order').update({ assistedByEmpleadosId: session.empleadosId }).eq('id', orderId)

    await registrarPuntaje(supabase, session.empleadosId, PUNTOS_INTAKE_ASISTIDA, 'intake_asistida')
  } catch (err) {
    console.error('[/api/orders/draft] agent intake tracking error (non-fatal):', err)
  }
}

// Guarda el progreso del formulario de formación como una orden real
// (isDraft:true) para que sea recuperable desde cualquier dispositivo con el
// número FBFC, no solo desde el navegador donde se empezó. Nunca envía la
// confirmación de orden (A1) ni alerta al equipo — eso sigue pasando solo
// cuando la orden se promueve a real (ver draftOrderId en POST /api/orders)
// y se confirma el pago. El único email de este endpoint es
// sendContinueApplicationEmail (lib/notifications.ts), y solo se dispara la
// primera vez (camino insert), nunca en los updates — un agente de OpaBiz
// Connect puede reenviarlo manualmente después desde
// /api/opabiz/me/created-orders/[id]/resend si el cliente lo necesita de nuevo.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = await checkOrdersDraftRateLimit(ip)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intentá de nuevo en unos minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      )
    }

    const raw = await request.json()
    const parsed = parseOr400(OrderDraftInputSchema, raw)
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
    }
    const body = parsed.data
    const now = new Date().toISOString()

    const fields = {
      updatedAt:       now,
      firstName:       String(body.firstName),
      lastName:        String(body.lastName),
      email:           String(body.email),
      phone:           body.phone           || null,
      country:         body.country         || 'US',
      companyName:     String(body.companyName),
      companyName2:    body.companyName2    || null,
      companyName3:    body.companyName3    || null,
      entityType:      body.entityType      || 'llc',
      businessAddress: body.businessAddress || null,
      speed:           body.speed           || 'standard',
      package:         body.package         || 'basic',
      amount:          Number(body.amount)  || 0,
      currency:        'USD',
      members:         body.members         ?? null,
      registeredAgent: body.registeredAgent || 'us',
      addons:          body.addons          ?? null,
      orgSignature:    body.orgSignature     || null,
      einIdType:       body.einIdType        || null,
      einTaxIdEnc:     encryptEinTaxId(body.einIdType, body.einTaxId),
      einActivity:     body.einActivity      || null,
      einActivityDesc: body.einActivityDesc  || null,
      isDraft:         true,
      draftSnapshot:   body.snapshot         ?? null,
    }

    // Si ya existe un borrador (mismo navegador o sesión restaurada), actualizarlo
    // en vez de crear otro. El filtro .eq('isDraft', true) es el blindaje: este
    // endpoint jamás puede pisar una orden ya promovida a real.
    if (body.orderId) {
      const { data: updated, error: updateErr } = await getSupabaseAdmin()
        .from('Order')
        .update(fields)
        .eq('id', body.orderId)
        .eq('isDraft', true)
        .select('id')
        .maybeSingle()

      if (!updateErr && updated) {
        await trackAgentAssistedIntake(request, updated.id, body)
        return NextResponse.json({ success: true, orderId: updated.id }, { status: 200 })
      }
      // Si no se pudo actualizar (id viejo, ya promovido, etc.) cae al insert de abajo.
    }

    const { data: created, error: insertErr } = await getSupabaseAdmin()
      .from('Order')
      .insert({
        id:            crypto.randomUUID(),
        createdAt:     now,
        paymentStatus: 'pending',
        status:        'pending',
        ...fields,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[/api/orders/draft] Supabase insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Error saving draft' }, { status: 500 })
    }

    sendContinueApplicationEmail({ id: created.id, email: fields.email, firstName: fields.firstName, lastName: fields.lastName, companyName: fields.companyName })
    await trackAgentAssistedIntake(request, created.id, body)

    return NextResponse.json({ success: true, orderId: created.id }, { status: 201 })
  } catch (error) {
    console.error('[/api/orders/draft POST] Error inesperado:', error)
    return NextResponse.json({ success: false, error: 'Error processing draft' }, { status: 500 })
  }
}

// Recupera el snapshot de un borrador para restaurar el formulario tras el
// login. Autenticado por la cookie client_session — nunca por un id en la URL,
// así nadie puede leer el progreso de otra persona adivinando un id.
export async function GET(request: NextRequest) {
  const sessionOrderId = request.cookies.get('client_session')?.value
  if (!sessionOrderId) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  const { data: order, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, isDraft, draftSnapshot')
    .eq('id', sessionOrderId)
    .maybeSingle()

  if (error || !order || order.isDraft !== true) {
    return NextResponse.json({ isDraft: false }, { status: 200 })
  }

  return NextResponse.json({ isDraft: true, orderId: order.id, snapshot: order.draftSnapshot ?? null })
}
