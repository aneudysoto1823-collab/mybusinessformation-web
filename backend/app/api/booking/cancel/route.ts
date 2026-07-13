import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { REPLY_TO, FROM_OPABIZ } from '@/lib/email-constants'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const emailHeader = `
  <div style="padding:22px 32px;border-bottom:1px solid #e2e8f0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:42px;padding-right:12px">
        <div style="width:42px;height:42px;background:linear-gradient(135deg,#1C2E44,#2563EB);border-radius:10px;text-align:center;line-height:42px;color:#fff;font-family:Georgia,serif;font-size:16px;font-weight:700">OB</div>
      </td>
      <td style="vertical-align:middle">
        <div style="font-family:Georgia,serif;font-size:21px;font-weight:700;line-height:1.2"><span style="color:#1C2E44">Opa</span><span style="color:#2563EB">Biz</span></div>
        <div style="font-size:11px;color:#94A3B8;letter-spacing:.3px;margin-top:2px">Florida Business Formation Center</div>
      </td>
    </tr></table>
  </div>
`

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data } = await getSupabaseAdmin()
    .from('appointments')
    .select('id, name, email, date, time, status')
    .eq('id', id)
    .single()

  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { id, lang } = await req.json()
  const isEs = lang === 'es'
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: appt } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single()

  if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (appt.status === 'cancelled') return NextResponse.json({ error: 'already_cancelled' }, { status: 400 })

  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)

  function formatDate(date: string) {
    return new Date(date + 'T12:00:00').toLocaleDateString(isEs ? 'es-US' : 'en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }
  function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const dateFormatted = formatDate(appt.date)
  const timeFormatted = formatTime(appt.time)
  const bookingUrl = `${process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'}/booking${isEs ? '?lang=es' : ''}`

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: appt.email,
    subject: isEs ? '❌ Su cita fue cancelada — OpaBiz' : '❌ Appointment Cancelled — OpaBiz',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
          ${emailHeader}
          <div style="padding:32px">
            <p style="font-size:12px;font-weight:700;color:#1C2E44;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">${isEs ? 'Cita Cancelada' : 'Appointment Cancelled'}</p>
            <h2 style="color:#1C2E44;font-size:20px;margin-top:0">${isEs ? `Su cita fue cancelada, ${appt.name}` : `Your appointment has been cancelled, ${appt.name}`}</h2>
            <p style="color:#475569;line-height:1.7">
              ${isEs
                ? `Su consulta programada para el <strong>${dateFormatted}</strong> a las <strong>${timeFormatted}</strong> fue cancelada.`
                : `Your consultation scheduled for <strong>${dateFormatted}</strong> at <strong>${timeFormatted}</strong> has been cancelled.`}
            </p>
            <p style="color:#475569;line-height:1.7">${isEs ? 'Si desea agendar una nueva cita, visite nuestra página de reservas.' : "If you'd like to schedule a new appointment, visit our booking page."}</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${bookingUrl}" style="background:linear-gradient(135deg,#2563EB,#1C2E44);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                ${isEs ? 'Agendar Nueva Cita' : 'Schedule New Appointment'}
              </a>
            </div>
            <p style="margin-top:24px;color:#94a3b8;font-size:12px;line-height:1.6">
              OpaBiz · opabiz.com<br/>
              ${isEs ? 'Este es un correo transaccional. Somos un servicio de preparación de documentos, no un despacho de abogados.' : 'This is a transactional email. We are a document preparation service, not a law firm.'}
            </p>
          </div>
        </div>
      </div>`,
  })

  await getResend().emails.send({
    from: FROM_OPABIZ,
    replyTo: REPLY_TO,
    to: 'info@opabiz.com',
    subject: `❌ Cita cancelada: ${appt.name} — ${dateFormatted} ${timeFormatted}`,
    html: `<p><strong>${appt.name}</strong> canceló su cita del <strong>${dateFormatted}</strong> a las <strong>${timeFormatted}</strong>.</p><p>Email: ${appt.email}</p>`,
  })

  return NextResponse.json({ success: true })
}
