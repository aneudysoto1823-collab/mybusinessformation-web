import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getEmployeeSession } from '@/lib/opabiz-session'
import { getResend } from '@/lib/resend-client'
import { FROM_OPABIZ_INTERNAL, INTERNAL_ALERT_EMAIL } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// POST /api/opabiz/me/orders/[id]/reject — { motivo }. El empleado rechaza una
// orden que todavía no aceptó. No se reasigna sola a otro empleado: la
// asignación sigue siendo manual a propósito (el founder quiere evaluar a
// cada agente antes de automatizar). La orden pasa a 'pendiente' (sale del
// panel del empleado y del radar del cron de timeout), el motivo queda en la
// nota interna que ve el admin y le llega una alerta para reasignarla.
// ordenes_opabiz.empleado_id es NOT NULL: se deja el último empleado, igual
// que hace el cron cuando no encuentra candidato.
// No suma inactividad: avisar que no puede es mejor que dejarla vencer.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployeeSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { motivo } = await req.json().catch(() => ({}))
  const motivoLimpio = typeof motivo === 'string' ? motivo.trim().slice(0, 500) : ''
  if (motivoLimpio.length < 3) {
    return NextResponse.json({ error: 'Contanos brevemente por qué rechazás la orden' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: orden } = await supabase
    .from('ordenes_opabiz')
    .select('id, empleado_id, estado, tipo_servicio, notas, usuarios(nombre)')
    .eq('id', id)
    .maybeSingle()

  if (!orden || orden.empleado_id !== session.empleadosId) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (orden.estado !== 'asignada') {
    return NextResponse.json({ error: 'Solo se puede rechazar una orden que todavía no aceptaste' }, { status: 409 })
  }

  const { data: empleado } = await supabase
    .from('usuarios').select('nombre').eq('id', session.usuarioId).maybeSingle()
  const nombreEmpleado = empleado?.nombre ?? 'El empleado'

  const fecha = new Date().toLocaleDateString('es-US', { day: 'numeric', month: 'short', timeZone: 'America/New_York' })
  const lineaNota = `Rechazada por ${nombreEmpleado} (${fecha}): ${motivoLimpio}`
  const notas = orden.notas ? `${orden.notas}\n${lineaNota}` : lineaNota

  const { error } = await supabase
    .from('ordenes_opabiz')
    .update({ estado: 'pendiente', notas })
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'No se pudo rechazar la orden' }, { status: 500 })

  await supabase.from('historial_actividad').insert({
    usuario_id: session.usuarioId,
    order_id: id,
    tipo_evento: 'orden_rechazada',
    detalle: motivoLimpio,
  })

  const cliente = Array.isArray(orden.usuarios) ? orden.usuarios[0] : orden.usuarios
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'
  try {
    await getResend().emails.send({
      from: FROM_OPABIZ_INTERNAL,
      to: INTERNAL_ALERT_EMAIL,
      subject: `OpaBiz Connect: ${nombreEmpleado} rechazó una orden`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#1C2E44;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz Connect</p>
          </div>
          <div style="background:#f8fafc;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
            <p style="color:#1e293b;font-size:1rem;font-weight:700;margin:0 0 12px">Una orden quedó sin asignar</p>
            <p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Empleado:</strong> ${escapeHtml(nombreEmpleado)}</p>
            <p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Servicio:</strong> ${escapeHtml(orden.tipo_servicio ?? '')}</p>
            ${cliente?.nombre ? `<p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Cliente:</strong> ${escapeHtml(cliente.nombre)}</p>` : ''}
            <p style="color:#374151;font-size:.9rem;margin:0 0 16px"><strong>Motivo:</strong> ${escapeHtml(motivoLimpio)}</p>
            <div style="text-align:center;margin:20px 0">
              <a href="${baseUrl}/admin/opabiz" style="background:#fff;color:#2563EB;border:1.5px solid #2563EB;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem">Reasignar en el panel</a>
            </div>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[opabiz] reject alert email error:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ ok: true })
}
