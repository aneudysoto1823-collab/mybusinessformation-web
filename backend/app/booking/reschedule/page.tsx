'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ALL_SLOTS = [
  '09:00','09:40','10:20','11:00','11:40',
  '12:20','13:00','13:40','14:20','15:00',
  '15:40','16:20','17:00','17:40','18:20',
]

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function pad(n: number) { return n.toString().padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}` }

const MONTHS = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
}
const DAYS = {
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  es: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
}

const T = {
  en: {
    brandSub: 'Reschedule Appointment',
    notFound: 'Appointment not found. Please use the link from your confirmation email.',
    loading: 'Loading...',
    rescheduled: 'Appointment Rescheduled!',
    confirmSent: (email: string) => `A confirmation has been sent to ${email}.`,
    scheduleAnother: 'Schedule another appointment →',
    title: 'Reschedule Your Appointment',
    greeting: (name: string) => `Hi ${name}, choose a new date and time for your consultation.`,
    selectDate: 'Select a new date',
    selectTime: 'Select a new time',
    selectDateFirst: 'Select a date first.',
    noSlots: 'No available slots for this day.',
    slotTaken: 'That time slot is no longer available. Please choose another.',
    genericError: 'Something went wrong. Please try again.',
    submitting: 'Rescheduling...',
    confirmBtn: 'Confirm New Appointment',
  },
  es: {
    brandSub: 'Reprogramar Cita',
    notFound: 'Cita no encontrada. Usa el enlace de tu correo de confirmación.',
    loading: 'Cargando...',
    rescheduled: '¡Cita reprogramada!',
    confirmSent: (email: string) => `Se envió una confirmación a ${email}.`,
    scheduleAnother: 'Agendar otra cita →',
    title: 'Reprograma tu Cita',
    greeting: (name: string) => `Hola ${name}, elige una nueva fecha y hora para tu consulta.`,
    selectDate: 'Elige una nueva fecha',
    selectTime: 'Elige una nueva hora',
    selectDateFirst: 'Primero elige una fecha.',
    noSlots: 'No hay horarios disponibles para este día.',
    slotTaken: 'Ese horario ya no está disponible. Elige otro.',
    genericError: 'Algo salió mal. Intenta de nuevo.',
    submitting: 'Reprogramando...',
    confirmBtn: 'Confirmar Nueva Cita',
  },
}

function RescheduleContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [appt, setAppt] = useState<{ name: string; email: string; date: string; time: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  useEffect(() => {
    if (!id) return
    fetch(`/api/booking/reschedule?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setNotFound(true); else setAppt(d) })
  }, [id])

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedTime(null)
    fetch(`/api/booking/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  async function handleReschedule() {
    if (!selectedDate || !selectedTime || !id) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/booking/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, date: selectedDate, time: selectedTime }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error === 'slot_taken' ? t.slotTaken : t.genericError)
    else setSuccess(true)
    setSubmitting(false)
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f8; font-family: var(--font-sans); }
        .wrap { max-width: 600px; margin: 0 auto; padding: 40px 20px 80px; }
        .brand { font-size: 1rem; font-weight: 700; color: #1C2E44; margin-bottom: 28px; }
        .brand span { display: block; font-size: 0.8rem; font-weight: 400; color: #6b7280; }
        .card { background: #fff; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); padding: 28px; margin-bottom: 20px; }
        .card h2 { font-size: 1.1rem; font-weight: 800; color: #1C2E44; margin-bottom: 6px; }
        .card p { font-size: 0.85rem; color: #6b7280; margin-bottom: 20px; }
        .step-label { font-size: 0.72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
        .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .cal-nav button { background: none; border: 1.5px solid #e5e7eb; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; }
        .cal-month { font-size: 0.9rem; font-weight: 700; color: #1C2E44; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-day-name { text-align: center; font-size: 0.7rem; font-weight: 600; color: #9ca3af; padding: 4px 0; }
        .cal-day { text-align: center; padding: 8px 4px; border-radius: 8px; font-size: 0.84rem; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; }
        .cal-day:hover:not(.disabled):not(.empty):not(.sunday) { border-color: #2563EB; color: #2563EB; }
        .cal-day.selected { background: #2563EB; color: #fff; border-color: #2563EB; font-weight: 700; }
        .cal-day.disabled,.cal-day.sunday { color: #d1d5db; cursor: not-allowed; }
        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }
        .slot-btn { padding: 10px 8px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s; }
        .slot-btn:hover { border-color: #2563EB; color: #2563EB; }
        .slot-btn.selected { background: #2563EB; color: #fff; border-color: #2563EB; }
        .slot-empty { color: #9ca3af; font-size: 0.85rem; }
        .btn-confirm { background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; width: 100%; margin-top: 8px; }
        .btn-confirm:disabled { background: #93c5fd; cursor: not-allowed; }
        .error { background: #fee2e2; color: #991b1b; border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; margin-top: 8px; }
        .success-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; font-size: 0.84rem; color: #0369a1; margin-bottom: 16px; }
      `}</style>
      <div className="wrap">
        <div className="brand">OpaBiz<span>{t.brandSub}</span></div>

        {!id || notFound ? (
          <div className="card"><p>{t.notFound}</p></div>
        ) : !appt ? (
          <div className="card"><p>{t.loading}</p></div>
        ) : success ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="success-icon">✅</div>
            <h2 style={{ marginBottom: '8px' }}>{t.rescheduled}</h2>
            <p>{t.confirmSent(appt.email)}</p>
            <a href={`/booking${lang === 'es' ? '?lang=es' : ''}`} style={{ display: 'inline-block', marginTop: '20px', color: '#2563EB', fontSize: '0.85rem' }}>{t.scheduleAnother}</a>
          </div>
        ) : (
          <>
            <div className="card">
              <h2>{t.title}</h2>
              <p>{t.greeting(appt.name)}</p>

              <div className="step-label">{t.selectDate}</div>
              <div className="cal-nav">
                <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11) } else setCalMonth(m => m-1) }}>←</button>
                <span className="cal-month">{MONTHS[lang][calMonth]} {calYear}</span>
                <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0) } else setCalMonth(m => m+1) }}>→</button>
              </div>
              <div className="cal-grid">
                {DAYS[lang].map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1
                  const dateStr = toDateStr(calYear, calMonth, d)
                  const dateObj = new Date(calYear, calMonth, d)
                  const isPast = dateObj < today
                  const isSun = dateObj.getDay() === 0
                  const isSelected = dateStr === selectedDate
                  let cls = 'cal-day'
                  if (isPast || isSun) cls += isSun ? ' sunday' : ' disabled'
                  else if (isSelected) cls += ' selected'
                  return <div key={d} className={cls} onClick={() => { if (!isPast && !isSun) setSelectedDate(dateStr) }}>{d}</div>
                })}
              </div>
            </div>

            <div className="card">
              <div className="step-label">{t.selectTime}</div>
              {!selectedDate ? <p className="slot-empty">{t.selectDateFirst}</p>
                : loadingSlots ? <p className="slot-empty">{t.loading}</p>
                : slots.length === 0 ? <p className="slot-empty">{t.noSlots}</p>
                : <div className="slots-grid">
                  {slots.map(s => (
                    <button key={s} className={`slot-btn${selectedTime === s ? ' selected' : ''}`} onClick={() => setSelectedTime(s)}>
                      {formatTime(s)}
                    </button>
                  ))}
                </div>
              }
            </div>

            <div className="card">
              {selectedDate && selectedTime && (
                <div className="summary">
                  📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; 🕐 {formatTime(selectedTime)}
                </div>
              )}
              {error && <div className="error">{error}</div>}
              <button className="btn-confirm" onClick={handleReschedule} disabled={!selectedDate || !selectedTime || submitting}>
                {submitting ? t.submitting : t.confirmBtn}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function ReschedulePage() {
  return <Suspense><RescheduleContent /></Suspense>
}
