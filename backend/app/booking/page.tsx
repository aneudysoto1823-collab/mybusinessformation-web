'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const T = {
  en: {
    title: 'Schedule a Free Consultation',
    sub: 'Choose a date and time that works for you. Our experts are ready to help.',
    step1: 'Select a date',
    step2: 'Select a time',
    step3: 'Your information',
    name: 'Full Name *', namePh: 'John Smith',
    email: 'Email *', emailPh: 'you@email.com',
    phone: 'Phone *', phonePh: '+1 (555) 000-0000',
    meetingLabel: 'Preferred meeting method *',
    meetingZoom: 'Zoom Video Call',
    meetingWa: 'WhatsApp Call / Chat',
    note: 'What would you like to discuss? (optional)', notePh: 'e.g. I want to form an LLC in Florida...',
    confirm: 'Confirm Appointment',
    loading: 'Scheduling...',
    noSlots: 'No available slots for this day.',
    selectDate: 'Please select a date first.',
    successTitle: 'Appointment Confirmed!',
    successSub: 'We\'ll send a confirmation to your email shortly.',
    successWa: 'WhatsApp Us',
    errorTaken: 'That time slot was just taken. Please select another.',
    errorGeneric: 'Something went wrong. Please try again.',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    prev: '←', next: '→',
    backHome: '← Back to Home',
  },
  es: {
    title: 'Agenda tu Consulta Gratuita',
    sub: 'Elige la fecha y hora que mejor te convenga. Nuestros expertos están listos para ayudarte.',
    step1: 'Selecciona una fecha',
    step2: 'Selecciona un horario',
    step3: 'Tus datos',
    name: 'Nombre Completo *', namePh: 'Juan García',
    email: 'Correo Electrónico *', emailPh: 'tu@correo.com',
    phone: 'Teléfono *', phonePh: '+1 (555) 000-0000',
    meetingLabel: 'Método preferido de reunión *',
    meetingZoom: 'Videollamada por Zoom',
    meetingWa: 'Llamada / Chat por WhatsApp',
    note: '¿Sobre qué te gustaría hablar? (opcional)', notePh: 'ej. Quiero formar una LLC en Florida...',
    confirm: 'Confirmar Cita',
    loading: 'Agendando...',
    noSlots: 'No hay horarios disponibles para este día.',
    selectDate: 'Por favor selecciona una fecha primero.',
    successTitle: '¡Cita Confirmada!',
    successSub: 'Te enviaremos una confirmación a tu correo.',
    successWa: 'Escribirnos por WhatsApp',
    errorTaken: 'Ese horario acaba de ser tomado. Por favor selecciona otro.',
    errorGeneric: 'Algo salió mal. Por favor intenta de nuevo.',
    months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    days: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
    prev: '←', next: '→',
    backHome: '← Volver al Inicio',
  },
}

function pad(n: number) { return n.toString().padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}` }

function BookingContent() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [meetingMethod, setMeetingMethod] = useState<'zoom' | 'whatsapp'>('zoom')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const urlLang = searchParams.get('lang')
    const stored = localStorage.getItem('portal_lang') || localStorage.getItem('flbc_lang')
    const detected = urlLang || stored
    if (detected === 'es') setLang('es')
  }, [searchParams])

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedTime(null)
    fetch(`/api/booking/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  const t = T[lang]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Construir días del calendario
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedTime) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, meetingMethod, date: selectedDate, time: selectedTime, note, lang }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'slot_taken' ? t.errorTaken : t.errorGeneric)
        if (data.error === 'slot_taken') {
          setSelectedTime(null)
          fetch(`/api/booking/slots?date=${selectedDate}`).then(r => r.json()).then(d => setSlots(d.slots ?? []))
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f8; font-family: 'Plus Jakarta Sans', sans-serif; }
        .bk-wrap { max-width: 780px; margin: 0 auto; padding: 40px 20px 80px; }
        .bk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .bk-brand { font-size: 1rem; font-weight: 700; color: #1C2E44; }
        .bk-brand span { display: block; font-size: 0.8rem; font-weight: 400; color: #6b7280; }
        .lang-toggle { display: flex; background: #e5e7eb; border-radius: 20px; padding: 3px; gap: 2px; }
        .lang-btn { background: none; border: none; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer; }
        .lang-btn.active { background: #1C2E44; color: #fff; }
        .bk-hero { text-align: center; margin-bottom: 36px; }
        .bk-hero h1 { font-size: 1.6rem; font-weight: 800; color: #1C2E44; margin-bottom: 8px; }
        .bk-hero p { color: #6b7280; font-size: 0.9rem; }
        .bk-card { background: #fff; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); padding: 28px; margin-bottom: 20px; }
        .bk-step-label { font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        /* Calendar */
        .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .cal-nav button { background: none; border: 1.5px solid #e5e7eb; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
        .cal-nav button:hover { border-color: #2563EB; color: #2563EB; }
        .cal-month { font-size: 0.95rem; font-weight: 700; color: #1C2E44; }
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-day-name { text-align: center; font-size: 0.72rem; font-weight: 600; color: #9ca3af; padding: 4px 0; }
        .cal-day { text-align: center; padding: 8px 4px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; border: 1.5px solid transparent; transition: all 0.15s; font-weight: 500; }
        .cal-day:hover:not(.disabled):not(.empty) { border-color: #2563EB; color: #2563EB; }
        .cal-day.selected { background: #2563EB; color: #fff; border-color: #2563EB; font-weight: 700; }
        .cal-day.today { border-color: #e5e7eb; color: #1C2E44; }
        .cal-day.disabled { color: #d1d5db; cursor: not-allowed; }
        .cal-day.empty { cursor: default; }
        .cal-day.sunday { color: #d1d5db; cursor: not-allowed; }
        /* Slots */
        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }
        .slot-btn { padding: 10px 8px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s; color: #374151; }
        .slot-btn:hover { border-color: #2563EB; color: #2563EB; }
        .slot-btn.selected { background: #2563EB; color: #fff; border-color: #2563EB; }
        .slot-empty { color: #9ca3af; font-size: 0.85rem; padding: 12px 0; }
        /* Form */
        .bk-form { display: flex; flex-direction: column; gap: 16px; }
        .bk-label { font-size: 0.82rem; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
        .bk-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.15s; }
        .bk-input:focus { border-color: #2563EB; }
        .bk-textarea { resize: vertical; min-height: 80px; }
        .bk-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .bk-submit { background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 14px 28px; font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.2s; width: 100%; margin-top: 4px; }
        .bk-submit:hover { background: #1d4ed8; }
        .bk-submit:disabled { background: #93c5fd; cursor: not-allowed; }
        .bk-error { background: #fee2e2; color: #991b1b; border-radius: 8px; padding: 12px 16px; font-size: 0.85rem; margin-top: 8px; }
        /* Success */
        .bk-success { text-align: center; padding: 40px 20px; }
        .bk-success-icon { font-size: 3rem; margin-bottom: 16px; }
        .bk-success h2 { font-size: 1.4rem; font-weight: 800; color: #1C2E44; margin-bottom: 8px; }
        .bk-success p { color: #6b7280; font-size: 0.9rem; max-width: 400px; margin: 0 auto 24px; }
        .btn-wa { display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.9rem; }
        .bk-back { display: inline-block; margin-bottom: 20px; color: #6b7280; font-size: 0.85rem; text-decoration: none; }
        .bk-back:hover { color: #2563EB; }
        .summary-bar { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 14px 18px; font-size: 0.85rem; color: #0369a1; margin-bottom: 4px; }
        .meeting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .meeting-btn { padding: 14px 12px; border: 2px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s; color: #374151; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .meeting-btn .meeting-icon { font-size: 1.4rem; }
        .meeting-btn:hover { border-color: #2563EB; }
        .meeting-btn.selected { border-color: #2563EB; background: #eff6ff; color: #2563EB; }
        @media(max-width: 600px) {
          .bk-row { grid-template-columns: 1fr; }
          .bk-hero h1 { font-size: 1.3rem; }
          .slots-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="bk-wrap">
        <div className="bk-header">
          <div className="bk-brand">
            MyBusinessFormation
            <span>{lang === 'es' ? 'Consulta Gratuita' : 'Free Consultation'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="lang-toggle">
              <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
              <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => setLang('es')}>ES</button>
            </div>
          </div>
        </div>

        <a href={lang === 'es' ? '/?lang=es' : '/'} className="bk-back">{t.backHome}</a>

        {success ? (
          <div className="bk-card">
            <div className="bk-success">
              <div className="bk-success-icon">✅</div>
              <h2>{t.successTitle}</h2>
              <p>{t.successSub}</p>
              <a href="https://wa.me/13528377755" target="_blank" rel="noopener noreferrer" className="btn-wa">
                💬 {t.successWa}
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="bk-hero">
              <h1>{t.title}</h1>
              <p>{t.sub}</p>
            </div>

            {/* Calendario */}
            <div className="bk-card">
              <div className="bk-step-label">1 — {t.step1}</div>
              <div className="cal-nav">
                <button onClick={prevMonth}>{t.prev}</button>
                <span className="cal-month">{t.months[calMonth]} {calYear}</span>
                <button onClick={nextMonth}>{t.next}</button>
              </div>
              <div className="cal-grid">
                {t.days.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1
                  const dateStr = toDateStr(calYear, calMonth, d)
                  const dateObj = new Date(calYear, calMonth, d)
                  const isPast = dateObj < today
                  const isSun = dateObj.getDay() === 0
                  const isSelected = dateStr === selectedDate
                  const isToday = dateStr === toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
                  let cls = 'cal-day'
                  if (isPast || isSun) cls += isSun ? ' sunday' : ' disabled'
                  else if (isSelected) cls += ' selected'
                  else if (isToday) cls += ' today'
                  return (
                    <div key={d} className={cls} onClick={() => {
                      if (!isPast && !isSun) setSelectedDate(dateStr)
                    }}>{d}</div>
                  )
                })}
              </div>
            </div>

            {/* Slots */}
            <div className="bk-card">
              <div className="bk-step-label">2 — {t.step2}</div>
              {!selectedDate ? (
                <p className="slot-empty">{t.selectDate}</p>
              ) : loadingSlots ? (
                <p className="slot-empty">...</p>
              ) : slots.length === 0 ? (
                <p className="slot-empty">{t.noSlots}</p>
              ) : (
                <div className="slots-grid">
                  {slots.map(s => (
                    <button key={s} className={`slot-btn${selectedTime === s ? ' selected' : ''}`} onClick={() => setSelectedTime(s)}>
                      {formatTime(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario */}
            <div className="bk-card">
              <div className="bk-step-label">3 — {t.step3}</div>
              {selectedDate && selectedTime && (
                <div className="summary-bar" style={{ marginBottom: '20px' }}>
                  📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &nbsp;·&nbsp; 🕐 {formatTime(selectedTime)}
                </div>
              )}
              <form className="bk-form" onSubmit={handleSubmit}>
                <div className="bk-row">
                  <div>
                    <label className="bk-label">{t.name}</label>
                    <input className="bk-input" placeholder={t.namePh} value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="bk-label">{t.email}</label>
                    <input className="bk-input" type="email" placeholder={t.emailPh} value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="bk-label">{t.phone}</label>
                  <input className="bk-input" placeholder={t.phonePh} value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
                <div>
                  <label className="bk-label">{t.meetingLabel}</label>
                  <div className="meeting-grid">
                    <button type="button" className={`meeting-btn${meetingMethod === 'zoom' ? ' selected' : ''}`} onClick={() => setMeetingMethod('zoom')}>
                      <span className="meeting-icon">🎥</span>
                      {t.meetingZoom}
                    </button>
                    <button type="button" className={`meeting-btn${meetingMethod === 'whatsapp' ? ' selected' : ''}`} onClick={() => setMeetingMethod('whatsapp')}>
                      <span className="meeting-icon">💬</span>
                      {t.meetingWa}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="bk-label">{t.note}</label>
                  <textarea className="bk-input bk-textarea" placeholder={t.notePh} value={note} onChange={e => setNote(e.target.value)} />
                </div>
                {error && <div className="bk-error">{error}</div>}
                <button className="bk-submit" type="submit" disabled={submitting || !selectedDate || !selectedTime || !phone}>
                  {submitting ? t.loading : t.confirm}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function BookingPage() {
  return <Suspense><BookingContent /></Suspense>
}
