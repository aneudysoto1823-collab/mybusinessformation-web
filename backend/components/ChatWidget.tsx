'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

function ClaudiaAvatar({ size = 42 }: { size?: number; uid?: string }) {
  return (
    <img
      src="/Claudia.jpg"
      alt="Claudia"
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
    />
  )
}

function readFormContext(): { lang: string; firstName: string; businessName: string; email: string; step: string; hour: number; selectedPackage: string } {
  const lang = localStorage.getItem('flbc_lang') || 'en'

  // First/last name — step 2 of new 7-step form
  const firstName = ((document.getElementById('inp-fname') as HTMLInputElement)?.value || '').trim()
  const lastName = ((document.getElementById('inp-lname') as HTMLInputElement)?.value || '').trim()
  const fullFirstName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : ''

  // Business name — step 1 of new 7-step form
  const businessName = ((document.getElementById('inp-bizname') as HTMLInputElement)?.value || '').trim()

  // Email — step 2
  const email = ((document.getElementById('inp-email') as HTMLInputElement)?.value || '').trim()

  // Current step — read from progress indicator
  const pct = (document.getElementById('fp-pct') as HTMLElement)?.textContent || ''
  const stepMatch = pct.match(/(\d+)/)
  const step = stepMatch ? stepMatch[1] : ''

  // Selected package — read from JS global set by the form (only when form is active)
  let selectedPackage = ''
  if (step) {
    const win = window as unknown as { fmData?: { package?: string }; formData?: { package?: string } }
    const pkg = win.fmData?.package || win.formData?.package || ''
    if (pkg) selectedPackage = pkg.charAt(0).toUpperCase() + pkg.slice(1)
  }

  const hour = new Date().getHours()

  return { lang, firstName: fullFirstName, businessName, email, step, hour, selectedPackage }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [segmentLoading, setSegmentLoading] = useState(false)
  const pendingSegmentsRef = useRef<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMsgRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevMsgCount = useRef(0)
  const sessionId = useRef<string>(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )
  const formContextRef = useRef<string>('')

  function processNextSegment() {
    if (pendingSegmentsRef.current.length === 0) {
      setSegmentLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }
    const segment = pendingSegmentsRef.current.shift()!
    // Show typing dots for the time a human would take to write this message
    // ~40ms per character, capped between 800ms and 5000ms
    const delay = Math.min(5000, Math.max(800, segment.length * 40))
    setSegmentLoading(true)
    setTimeout(() => {
      setSegmentLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', content: segment }])
      if (pendingSegmentsRef.current.length > 0) {
        setTimeout(processNextSegment, 400)
      } else {
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }, delay)
  }

  useEffect(() => {
    if (open) {
      const ctx = readFormContext()

      // Always update form context so Claudia knows the current step
      const parts: string[] = []
      if (ctx.lang === 'es') parts.push('El cliente está usando el sitio en español.')
      if (ctx.firstName) parts.push(`Nombre del cliente: ${ctx.firstName}.`)
      if (ctx.businessName) parts.push(`Nombre de negocio ingresado: "${ctx.businessName}".`)
      if (ctx.email) parts.push(`Email del cliente: ${ctx.email}.`)
      if (ctx.step && ctx.step !== '' && !isNaN(Number(ctx.step))) parts.push(`El cliente está en el paso ${ctx.step} del formulario.`)
      if (ctx.selectedPackage) parts.push(`Paquete seleccionado en el formulario: ${ctx.selectedPackage}.`)
      parts.push(`Hora local del cliente: ${ctx.hour}.`)
      formContextRef.current = parts.join(' ')

      if (messages.length === 0) {
        // Personalized greeting only on first open
        const es = ctx.lang === 'es'
        let greeting: string
        if (ctx.firstName && es) {
          greeting = `¡Hola ${ctx.firstName}! Soy Claudia, tu asistente virtual de MyBusinessFormation. ¿En qué puedo ayudarte?`
        } else if (ctx.firstName) {
          greeting = `Hi ${ctx.firstName}! I'm Claudia, your MyBusinessFormation virtual assistant. How can I help you?`
        } else if (es) {
          greeting = `¡Hola! Soy Claudia, tu asistente virtual de MyBusinessFormation. ¿En qué puedo ayudarte hoy?`
        } else {
          greeting = `Hi! I'm Claudia, your MyBusinessFormation virtual assistant. How can I help you today?`
        }
        setMessages([{ role: 'assistant', content: greeting }])
      } else {
        // Scroll to bottom so user sees latest messages, not old ones
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      }

      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    const newCount = messages.length
    const isNewMessage = newCount > prevMsgCount.current
    prevMsgCount.current = newCount

    if (loading || segmentLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (isNewMessage && messages[messages.length - 1]?.role === 'assistant') {
      lastMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => inputRef.current?.focus(), 50)
    } else if (isNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, segmentLoading])

  async function send() {
    const text = input.trim()
    if (!text || loading || segmentLoading) return
    setError('')
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    // Refresh form context on every send so Claudia always has the latest step and package
    const ctx = readFormContext()
    const parts: string[] = []
    if (ctx.lang === 'es') parts.push('El cliente está usando el sitio en español.')
    if (ctx.firstName) parts.push(`Nombre del cliente: ${ctx.firstName}.`)
    if (ctx.businessName) parts.push(`Nombre de negocio ingresado: "${ctx.businessName}".`)
    if (ctx.email) parts.push(`Email del cliente: ${ctx.email}.`)
    if (ctx.step && ctx.step !== '' && !isNaN(Number(ctx.step))) parts.push(`El cliente está en el paso ${ctx.step} del formulario.`)
    if (ctx.selectedPackage) parts.push(`Paquete seleccionado en el formulario: ${ctx.selectedPackage}.`)
    parts.push(`Hora local del cliente: ${ctx.hour}.`)
    formContextRef.current = parts.join(' ')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, session_id: sessionId.current, form_context: formContextRef.current }),
      })
      if (!res.ok) throw new Error('Error de servidor')
      const data = await res.json()
      setLoading(false)
      pendingSegmentsRef.current = data.segments ?? [data.reply]
      processNextSegment()
    } catch {
      setError('No se pudo obtener respuesta. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating button */}
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open chat assistant"
          style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#1C2E44,#2563EB)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(37,99,235,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s,box-shadow 0.2s',
            padding: 0,
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 32px rgba(37,99,235,0.55)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(37,99,235,0.45)'
          }}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <ClaudiaAvatar size={72} uid="btn" />
          )}
          {/* Green online dot */}
          {!open && (
            <span style={{
              position: 'absolute', bottom: '3px', right: '3px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#4ade80', border: '2px solid #fff',
            }} />
          )}
        </button>
        {!open && (
          <div style={{
            background: 'linear-gradient(135deg,#1C2E44,#2563EB)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.4px',
            padding: '3px 10px',
            borderRadius: '20px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0, display: 'inline-block' }} />
            Asistencia online
          </div>
        )}
      </div>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '28px',
            zIndex: 9999,
            width: '380px',
            maxWidth: 'calc(100vw - 40px)',
            height: '520px',
            maxHeight: 'calc(100vh - 130px)',
            background: '#fff',
            borderRadius: '18px',
            boxShadow: '0 20px 60px rgba(28,46,68,0.22)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg,#1C2E44,#2563EB)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div style={{ flexShrink: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', lineHeight: 0 }}>
              <ClaudiaAvatar size={42} uid="hdr" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>Claudia</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                MyBusinessFormation · Virtual Assistant
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#F8FAFC',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                ref={i === messages.length - 1 ? lastMsgRef : undefined}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg,#2563EB,#1C2E44)' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#1E293B',
                    fontSize: '0.84rem',
                    lineHeight: 1.55,
                    boxShadow: m.role === 'user' ? '0 2px 8px rgba(37,99,235,0.25)' : '0 2px 8px rgba(28,46,68,0.08)',
                    border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {(loading || segmentLoading) && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 16px', borderRadius: '14px 14px 14px 4px', background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(28,46,68,0.08)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map((n) => (
                    <span key={n} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block', animation: `chatdot 1.2s ease-in-out ${n * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu mensaje… / Type your message…"
              disabled={loading || segmentLoading}
              style={{
                flex: 1,
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '0.83rem',
                fontFamily: 'inherit',
                color: '#1E293B',
                outline: 'none',
                background: (loading || segmentLoading) ? '#F8FAFC' : '#fff',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            />
            <button
              onClick={send}
              disabled={loading || segmentLoading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: loading || segmentLoading || !input.trim() ? '#E2E8F0' : 'linear-gradient(135deg,#2563EB,#1C2E44)',
                border: 'none',
                cursor: loading || segmentLoading || !input.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={loading || segmentLoading || !input.trim() ? '#94A3B8' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatdot {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
