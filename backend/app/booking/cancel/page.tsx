'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function formatDate(date: string, locale: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

const T = {
  en: {
    brandSub: 'Cancel Appointment',
    notFoundTitle: 'Appointment not found',
    notFoundText: 'Please use the link from your confirmation email.',
    scheduleNewLink: 'Schedule a new appointment →',
    loading: 'Loading...',
    cancelledTitle: 'Appointment Cancelled',
    cancelledText: (email: string) => `Your consultation has been cancelled. A confirmation has been sent to ${email}.`,
    scheduleNewBtn: 'Schedule New Appointment',
    alreadyTitle: 'Already Cancelled',
    alreadyText: 'This appointment has already been cancelled.',
    confirmTitle: 'Cancel Appointment',
    confirmText: 'Are you sure you want to cancel the following consultation?',
    name: 'Name:',
    date: 'Date:',
    time: 'Time:',
    alreadyError: 'This appointment is already cancelled.',
    genericError: 'Something went wrong. Please try again.',
    cancelling: 'Cancelling...',
    confirmBtn: 'Yes, Cancel Appointment',
    rescheduleInstead: 'Reschedule instead →',
  },
  es: {
    brandSub: 'Cancelar Cita',
    notFoundTitle: 'Cita no encontrada',
    notFoundText: 'Usa el enlace de tu correo de confirmación.',
    scheduleNewLink: 'Agendar una nueva cita →',
    loading: 'Cargando...',
    cancelledTitle: 'Cita Cancelada',
    cancelledText: (email: string) => `Tu consulta ha sido cancelada. Se envió una confirmación a ${email}.`,
    scheduleNewBtn: 'Agendar Nueva Cita',
    alreadyTitle: 'Ya Cancelada',
    alreadyText: 'Esta cita ya fue cancelada.',
    confirmTitle: 'Cancelar Cita',
    confirmText: '¿Seguro que quieres cancelar la siguiente consulta?',
    name: 'Nombre:',
    date: 'Fecha:',
    time: 'Hora:',
    alreadyError: 'Esta cita ya está cancelada.',
    genericError: 'Algo salió mal. Intenta de nuevo.',
    cancelling: 'Cancelando...',
    confirmBtn: 'Sí, Cancelar Cita',
    rescheduleInstead: 'Mejor reprogramar →',
  },
}

function CancelContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [appt, setAppt] = useState<{ name: string; email: string; date: string; time: string; status: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlLang = searchParams.get('lang')
    if (urlLang === 'es' || urlLang === 'en') { setLang(urlLang); return }
    try {
      const saved = localStorage.getItem('flbc_lang') || localStorage.getItem('portal_lang')
      if (saved === 'es' || saved === 'en') setLang(saved)
    } catch {}
  }, [searchParams])

  const t = T[lang]
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  const bookingHref = `/booking${lang === 'es' ? '?lang=es' : ''}`
  const rescheduleHref = `/booking/reschedule?id=${id}${lang === 'es' ? '&lang=es' : ''}`

  useEffect(() => {
    if (!id) return
    fetch(`/api/booking/cancel?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setNotFound(true); else setAppt(d) })
  }, [id])

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    setError('')
    const res = await fetch('/api/booking/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error === 'already_cancelled' ? t.alreadyError : t.genericError)
    else setCancelled(true)
    setCancelling(false)
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f8; font-family: 'Plus Jakarta Sans', sans-serif; }
        .wrap { max-width: 520px; margin: 0 auto; padding: 60px 20px 80px; }
        .brand { font-size: 1rem; font-weight: 700; color: #1C2E44; margin-bottom: 32px; text-align: center; }
        .brand span { display: block; font-size: 0.8rem; font-weight: 400; color: #6b7280; margin-top: 2px; }
        .card { background: #fff; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); padding: 36px 32px; text-align: center; }
        .card h2 { font-size: 1.2rem; font-weight: 800; color: #1C2E44; margin-bottom: 8px; }
        .card p { font-size: 0.88rem; color: #6b7280; line-height: 1.6; }
        .appt-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: left; }
        .appt-box div { font-size: 0.85rem; color: #374151; margin-bottom: 6px; }
        .appt-box div:last-child { margin-bottom: 0; }
        .appt-box strong { color: #1C2E44; }
        .btn-cancel { background: #ef4444; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; width: 100%; margin-top: 8px; transition: background 0.2s; }
        .btn-cancel:hover { background: #dc2626; }
        .btn-cancel:disabled { background: #fca5a5; cursor: not-allowed; }
        .btn-back { display: inline-block; margin-top: 14px; color: #6b7280; font-size: 0.83rem; text-decoration: none; }
        .btn-back:hover { color: #2563EB; }
        .error { background: #fee2e2; color: #991b1b; border-radius: 8px; padding: 12px 16px; font-size: 0.84rem; margin-top: 12px; }
        .icon { font-size: 2.8rem; margin-bottom: 14px; }
        .already { background: #fef3c7; color: #92400e; border-radius: 8px; padding: 12px 16px; font-size: 0.84rem; margin-top: 12px; }
      `}</style>

      <div className="wrap">
        <div className="brand">OpaBiz<span>{t.brandSub}</span></div>

        {!id || notFound ? (
          <div className="card">
            <div className="icon">❌</div>
            <h2>{t.notFoundTitle}</h2>
            <p>{t.notFoundText}</p>
            <a href={bookingHref} className="btn-back">{t.scheduleNewLink}</a>
          </div>
        ) : !appt ? (
          <div className="card"><p>{t.loading}</p></div>
        ) : cancelled ? (
          <div className="card">
            <div className="icon">✅</div>
            <h2>{t.cancelledTitle}</h2>
            <p>{t.cancelledText(appt.email)}</p>
            <a href={bookingHref} style={{ display: 'inline-block', marginTop: '20px', background: '#2563EB', color: '#fff', padding: '11px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
              {t.scheduleNewBtn}
            </a>
          </div>
        ) : appt.status === 'cancelled' ? (
          <div className="card">
            <div className="icon">ℹ️</div>
            <h2>{t.alreadyTitle}</h2>
            <p>{t.alreadyText}</p>
            <a href={bookingHref} className="btn-back">{t.scheduleNewLink}</a>
          </div>
        ) : (
          <div className="card">
            <div className="icon">⚠️</div>
            <h2>{t.confirmTitle}</h2>
            <p>{t.confirmText}</p>
            <div className="appt-box">
              <div><strong>{t.name}</strong> {appt.name}</div>
              <div><strong>{t.date}</strong> {formatDate(appt.date, locale)}</div>
              <div><strong>{t.time}</strong> {formatTime(appt.time)}</div>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="btn-cancel" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? t.cancelling : t.confirmBtn}
            </button>
            <br />
            <a href={rescheduleHref} className="btn-back">{t.rescheduleInstead}</a>
          </div>
        )}
      </div>
    </>
  )
}

export default function CancelPage() {
  return <Suspense><CancelContent /></Suspense>
}
