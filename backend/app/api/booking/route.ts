import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'info@opabiz.com'
const ADMIN_WHATSAPP = '13528377755'
const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'https://opabiz.com'

function formatDate(date: string, lang: 'en' | 'es' = 'en') {
  return new Date(date + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, meetingMethod = 'zoom', date, time, note, lang = 'en' } = body

  if (!name || !email || !phone || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Verificar que el slot sigue disponible
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
  }

  // Crear la cita
  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({ name, email, phone: phone || null, meeting_method: meetingMethod, date, time, note: note || null, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const dateFormatted = formatDate(date, lang)
  const timeFormatted = formatTime(time)
  const meetingLabel = meetingMethod === 'whatsapp'
    ? (lang === 'es' ? '💬 WhatsApp' : '💬 WhatsApp')
    : '🎥 Zoom'
  const resend = getResend()

  // Email de confirmación al cliente
  const clientSubject = lang === 'es'
    ? '✅ Tu consulta está agendada — OpaBiz'
    : '✅ Your consultation is scheduled — OpaBiz'

  const clientHtml = lang === 'es' ? `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <div style="background:#1C2E44;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h2 style="color:#1C2E44;margin-bottom:8px">¡Tu consulta está confirmada!</h2>
        <p style="color:#6b7280;margin-bottom:24px">Hola ${name}, aquí están los detalles de tu cita:</p>
        <div style="background:#f0f4f8;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px 0"><strong>📅 Fecha:</strong> ${dateFormatted}</p>
          <p style="margin:0 0 8px 0"><strong>🕐 Hora:</strong> ${timeFormatted}</p>
          <p style="margin:0 0 8px 0"><strong>📞 Medio de reunión:</strong> ${meetingLabel}</p>
          ${note ? `<p style="margin:0"><strong>📝 Nota:</strong> ${note}</p>` : ''}
        </div>
        <p style="color:#6b7280;font-size:0.9rem">Si necesitas hacer algún cambio antes de tu cita, usa los botones a continuación.</p>
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
          <a href="${BASE_URL}/booking/reschedule?id=${appt.id}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">📅 Reprogramar cita</a>
          <a href="${BASE_URL}/booking/cancel?id=${appt.id}" style="background:#fff;color:#ef4444;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem;border:1.5px solid #ef4444">❌ Cancelar cita</a>
        </div>
      </div>
    </div>` : `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <div style="background:#1C2E44;padding:24px;text-align:center;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">OpaBiz</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h2 style="color:#1C2E44;margin-bottom:8px">Your consultation is confirmed!</h2>
        <p style="color:#6b7280;margin-bottom:24px">Hi ${name}, here are your appointment details:</p>
        <div style="background:#f0f4f8;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px 0"><strong>📅 Date:</strong> ${dateFormatted}</p>
          <p style="margin:0 0 8px 0"><strong>🕐 Time:</strong> ${timeFormatted}</p>
          <p style="margin:0 0 8px 0"><strong>📞 Meeting method:</strong> ${meetingLabel}</p>
          ${note ? `<p style="margin:0"><strong>📝 Note:</strong> ${note}</p>` : ''}
        </div>
        <p style="color:#6b7280;font-size:0.9rem">If you need to make any changes before your appointment, use the buttons below.</p>
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
          <a href="${BASE_URL}/booking/reschedule?id=${appt.id}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">📅 Reschedule</a>
          <a href="${BASE_URL}/booking/cancel?id=${appt.id}" style="background:#fff;color:#ef4444;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem;border:1.5px solid #ef4444">❌ Cancel Appointment</a>
        </div>
      </div>
    </div>`

  // Email de notificación al admin
  const waText = encodeURIComponent(`Hola ${name}, te contactamos de OpaBiz sobre tu consulta agendada para el ${dateFormatted} a las ${timeFormatted}.`)
  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${waText}`
    : null

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <div style="background:#1C2E44;padding:20px;border-radius:8px 8px 0 0">
        <p style="color:#fff;font-weight:700;margin:0">📅 Nueva Cita Agendada</p>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;width:120px">Nombre</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Teléfono</td><td style="padding:8px 0">${phone || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Fecha</td><td style="padding:8px 0;font-weight:600">${dateFormatted}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Hora</td><td style="padding:8px 0;font-weight:600">${timeFormatted}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Reunión</td><td style="padding:8px 0;font-weight:600">${meetingLabel}</td></tr>
          ${note ? `<tr><td style="padding:8px 0;color:#6b7280">Nota</td><td style="padding:8px 0">${note}</td></tr>` : ''}
        </table>
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
          ${waLink ? `<a href="${waLink}" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem">💬 WhatsApp al cliente</a>` : ''}
          <a href="mailto:${email}" style="background:#2563EB;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem">✉️ Responder por email</a>
        </div>
        <p style="margin-top:16px;font-size:0.8rem;color:#9ca3af">Ver en panel admin: <a href="https://opabiz.com/admin/citas">opabiz.com/admin/citas</a></p>
      </div>
    </div>`

  await Promise.all([
    resend.emails.send({ from: 'onboarding@resend.dev', to: email, subject: clientSubject, html: clientHtml }),
    resend.emails.send({ from: 'onboarding@resend.dev', to: ADMIN_EMAIL, subject: `Nueva cita: ${name} — ${dateFormatted} ${timeFormatted}`, html: adminHtml }),
  ])

  return NextResponse.json({ success: true, id: appt.id })
}
