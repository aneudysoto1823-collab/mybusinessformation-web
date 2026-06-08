import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data } = await getSupabaseAdmin()
    .from('appointments')
    .select('id, name, email, date, time, status')
    .eq('id', id)
    .single()

  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (data.status === 'cancelled') return NextResponse.json({ error: 'cancelled' }, { status: 400 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { id, date, time } = await req.json()
  if (!id || !date || !time) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Verificar que la cita existe
  const { data: appt } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single()

  if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (appt.status === 'cancelled') return NextResponse.json({ error: 'cancelled' }, { status: 400 })

  // Verificar que el nuevo slot está disponible
  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')
    .neq('id', id)
    .single()

  if (existing) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })

  // Actualizar la cita
  await supabase
    .from('appointments')
    .update({ date, time, status: 'pending' })
    .eq('id', id)

  const dateFormatted = formatDate(date)
  const timeFormatted = formatTime(time)

  // Email al cliente
  await getResend().emails.send({
    from: 'onboarding@resend.dev',
    to: appt.email,
    subject: '📅 Your appointment has been rescheduled — MyBusinessFormation',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <div style="background:#1C2E44;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">MyBusinessFormation</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="color:#1C2E44;margin-bottom:8px">Appointment Rescheduled</h2>
          <p style="color:#6b7280;margin-bottom:24px">Hi ${appt.name}, your consultation has been moved to:</p>
          <div style="background:#f0f4f8;border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px 0"><strong>📅 New Date:</strong> ${dateFormatted}</p>
            <p style="margin:0"><strong>🕐 New Time:</strong> ${timeFormatted}</p>
          </div>
          <p style="color:#6b7280;font-size:0.9rem">If you need to make any further changes, you can reply to this email.</p>
        </div>
      </div>`,
  })

  // Notificación al admin
  await getResend().emails.send({
    from: 'onboarding@resend.dev',
    to: 'info@opabiz.com',
    subject: `📅 Cita reprogramada: ${appt.name} → ${dateFormatted} ${timeFormatted}`,
    html: `<p><strong>${appt.name}</strong> reprogramó su cita para el <strong>${dateFormatted}</strong> a las <strong>${timeFormatted}</strong>.</p><p>Email: ${appt.email}</p>`,
  })

  return NextResponse.json({ success: true })
}
