import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const getResend = () => new Resend(process.env.RESEND_API_KEY)

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
  const { id } = await req.json()
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

  const dateFormatted = formatDate(appt.date)
  const timeFormatted = formatTime(appt.time)

  await getResend().emails.send({
    from: 'onboarding@resend.dev',
    to: appt.email,
    subject: '❌ Appointment Cancelled — MyBusinessFormation',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <div style="background:#1C2E44;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <p style="color:#fff;font-size:1.1rem;font-weight:700;margin:0">MyBusinessFormation</p>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="color:#1C2E44;margin-bottom:8px">Appointment Cancelled</h2>
          <p style="color:#6b7280;margin-bottom:24px">Hi ${appt.name}, your consultation scheduled for <strong>${dateFormatted}</strong> at <strong>${timeFormatted}</strong> has been cancelled.</p>
          <p style="color:#6b7280;font-size:0.9rem">If you'd like to schedule a new appointment, visit our booking page.</p>
          <a href="${process.env.NEXT_PUBLIC_URL ?? 'https://mybusinessformation.com'}/booking" style="display:inline-block;margin-top:16px;background:#2563EB;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Schedule New Appointment</a>
        </div>
      </div>`,
  })

  await getResend().emails.send({
    from: 'onboarding@resend.dev',
    to: 'info@mybusinessformation.com',
    subject: `❌ Cita cancelada: ${appt.name} — ${dateFormatted} ${timeFormatted}`,
    html: `<p><strong>${appt.name}</strong> canceló su cita del <strong>${dateFormatted}</strong> a las <strong>${timeFormatted}</strong>.</p><p>Email: ${appt.email}</p>`,
  })

  return NextResponse.json({ success: true })
}
