import { Resend } from 'resend'
import { getSupabaseAdmin } from './supabase'
import { FROM_OPABIZ_INTERNAL } from './email-constants'
import { sendPushToEmpleado } from './opabiz-push'

type Supabase = ReturnType<typeof getSupabaseAdmin>

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#1C2E44;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz Connect</p>
      </div>
      <div style="background:#f8fafc;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
        <p style="color:#1e293b;font-size:1rem;font-weight:700;margin:0 0 12px">${title}</p>
        ${bodyHtml}
      </div>
    </div>
  `
}

// Se llama cada vez que ordenes_opabiz.empleado_id cambia (asignación manual,
// automática, o reasignación tras timeout) — manda push + email al empleado
// que RECIBE la orden. Nunca debe tirar la request que la llama (asignar la
// orden ya pasó, avisar es secundario) — todo el cuerpo va en try/catch.
export async function notifyEmployeeAssignment(supabase: Supabase, empleadosId: string, ordenId: string): Promise<void> {
  try {
    const { data: emp } = await supabase
      .from('EMPLEADOS')
      .select('usuarios(nombre, email)')
      .eq('id', empleadosId)
      .maybeSingle()

    const usuario = unwrap<{ nombre: string; email: string }>(emp?.usuarios)
    if (!usuario?.email) return

    const { data: orden } = await supabase
      .from('ordenes_opabiz')
      .select('tipo_servicio, es_urgente, fecha_hora_cita, usuarios(nombre)')
      .eq('id', ordenId)
      .maybeSingle()

    const cliente = unwrap<{ nombre: string }>(orden?.usuarios)
    const tipoServicio = orden?.tipo_servicio ?? 'Nueva orden'
    const urgente = !!orden?.es_urgente

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'
    const link = `${baseUrl}/opabiz/dashboard/${ordenId}`
    const tituloPush = urgente ? '⚡ Nueva orden urgente asignada' : 'Nueva orden asignada'
    const detalle = tipoServicio + (cliente?.nombre ? ` — ${cliente.nombre}` : '')

    await Promise.all([
      sendPushToEmpleado(supabase, empleadosId, { title: tituloPush, body: detalle, url: link }),
      getResend().emails.send({
        from: FROM_OPABIZ_INTERNAL,
        to: usuario.email,
        subject: urgente ? 'OpaBiz Connect: ⚡ Nueva orden urgente asignada' : 'OpaBiz Connect: Nueva orden asignada',
        html: emailShell(
          `Hola ${usuario.nombre}, te asignaron una orden${urgente ? ' urgente ⚡' : ''}.`,
          `
            <p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Servicio:</strong> ${tipoServicio}</p>
            ${cliente?.nombre ? `<p style="color:#374151;font-size:.9rem;margin:0 0 16px"><strong>Cliente:</strong> ${cliente.nombre}</p>` : ''}
            <div style="text-align:center;margin:20px 0">
              <a href="${link}" style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem">
                Ver orden →
              </a>
            </div>
          `,
        ),
      }),
    ])
  } catch (err) {
    console.error('[opabiz-notify] notifyEmployeeAssignment error:', err instanceof Error ? err.message : err)
  }
}

// Recordatorio 1h antes de fecha_hora_cita — llamado desde el cron
// /api/opabiz/cron/appointment-reminders.
export async function notifyAppointmentReminder(supabase: Supabase, empleadosId: string, ordenId: string): Promise<void> {
  try {
    const { data: emp } = await supabase
      .from('EMPLEADOS')
      .select('usuarios(nombre, email)')
      .eq('id', empleadosId)
      .maybeSingle()

    const usuario = unwrap<{ nombre: string; email: string }>(emp?.usuarios)
    if (!usuario?.email) return

    const { data: orden } = await supabase
      .from('ordenes_opabiz')
      .select('tipo_servicio, fecha_hora_cita, usuarios(nombre, telefono)')
      .eq('id', ordenId)
      .maybeSingle()

    const cliente = unwrap<{ nombre: string; telefono: string }>(orden?.usuarios)
    const hora = orden?.fecha_hora_cita ? new Date(orden.fecha_hora_cita).toLocaleString() : ''
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://opabiz.com'
    const link = `${baseUrl}/opabiz/dashboard/${ordenId}`

    await Promise.all([
      sendPushToEmpleado(supabase, empleadosId, {
        title: '⏰ Cita en menos de 1 hora',
        body: (orden?.tipo_servicio ?? 'Cita') + (cliente?.nombre ? ` — ${cliente.nombre}` : ''),
        url: link,
      }),
      getResend().emails.send({
        from: FROM_OPABIZ_INTERNAL,
        to: usuario.email,
        subject: 'OpaBiz Connect: ⏰ Recordatorio de cita en menos de 1 hora',
        html: emailShell(
          `Hola ${usuario.nombre}, tenés una cita pronto.`,
          `
            <p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Servicio:</strong> ${orden?.tipo_servicio ?? '—'}</p>
            ${cliente?.nombre ? `<p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Cliente:</strong> ${cliente.nombre}</p>` : ''}
            ${cliente?.telefono ? `<p style="color:#374151;font-size:.9rem;margin:0 0 4px"><strong>Teléfono:</strong> ${cliente.telefono}</p>` : ''}
            <p style="color:#374151;font-size:.9rem;margin:0 0 16px"><strong>Hora:</strong> ${hora}</p>
            <div style="text-align:center;margin:20px 0">
              <a href="${link}" style="background:#2563EB;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.95rem">
                Ver orden →
              </a>
            </div>
          `,
        ),
      }),
    ])
  } catch (err) {
    console.error('[opabiz-notify] notifyAppointmentReminder error:', err instanceof Error ? err.message : err)
  }
}
