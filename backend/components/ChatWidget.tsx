'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

function ClaudiaAvatar({ size = 42, uid = 'a' }: { size?: number; uid?: string }) {
  const gid = `cg-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C2E44" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="24" cy="24" r="24" fill={`url(#${gid})`} />

      {/* ── Headset rendered BEHIND face so band hides under face naturally ── */}
      {/* Band arc over head */}
      <path d="M9 23 C9 6 39 6 39 23" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Left ear cup */}
      <rect x="6" y="20" width="7" height="11" rx="3.5" fill="white" />
      {/* Right ear cup */}
      <rect x="35" y="20" width="7" height="11" rx="3.5" fill="white" />

      {/* ── Face (sits on top of headset band, covers it naturally) ── */}
      <circle cx="24" cy="25" r="13" fill="white" fillOpacity="0.97" />

      {/* Hair — rounded dark cap on top of face */}
      <path d="M12 22 C12 12 36 12 36 22 C36 17 12 17 12 22 Z" fill="rgba(28,46,68,0.22)" />

      {/* Eyes */}
      <circle cx="19.5" cy="24" r="2" fill="rgba(28,46,68,0.7)" />
      <circle cx="28.5" cy="24" r="2" fill="rgba(28,46,68,0.7)" />
      {/* Eye shine */}
      <circle cx="20.3" cy="23.2" r="0.7" fill="white" />
      <circle cx="29.3" cy="23.2" r="0.7" fill="white" />

      {/* Smile */}
      <path d="M18.5 29.5 Q24 34 29.5 29.5" stroke="rgba(28,46,68,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* ── Mic arm + capsule (in front of everything) ── */}
      <path d="M9 27 Q6.5 32 8 36" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="8.2" cy="37" r="2.5" fill="white" />
    </svg>
  )
}

function readFormContext(): { lang: string; firstName: string; businessName: string; email: string; step: string } {
  const lang = localStorage.getItem('flbc_lang') || 'en'

  // Member first name — first text input inside #member-1
  const memberBlock = document.getElementById('member-1')
  const nameInputs = memberBlock?.querySelectorAll('input[type="text"]')
  const firstName = ((nameInputs?.[0] as HTMLInputElement)?.value || '').trim()
  const lastName = ((nameInputs?.[1] as HTMLInputElement)?.value || '').trim()
  const fullFirstName = firstName ? (lastName ? `${firstName} ${lastName}` : firstName) : ''

  // Business name — first text input inside #step3
  const step3 = document.getElementById('step3')
  const businessName = ((step3?.querySelector('input[type="text"]') as HTMLInputElement)?.value || '').trim()

  // Email — email input in the form
  const emailInput = document.querySelector('#formOverlay input[type="email"]') as HTMLInputElement
  const email = (emailInput?.value || '').trim()

  // Current step
  const activeStep = document.querySelector('.form-step.active') as HTMLElement
  const step = activeStep?.id?.replace('step', '') || ''

  return { lang, firstName: fullFirstName, businessName, email, step }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionId = useRef<string>(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )
  const formContextRef = useRef<string>('')

  useEffect(() => {
    if (open && messages.length === 0) {
      const ctx = readFormContext()

      // Build form context string for the API
      const parts: string[] = []
      if (ctx.lang === 'es') parts.push('El cliente está usando el sitio en español.')
      if (ctx.firstName) parts.push(`Nombre del cliente: ${ctx.firstName}.`)
      if (ctx.businessName) parts.push(`Nombre de negocio ingresado: "${ctx.businessName}".`)
      if (ctx.email) parts.push(`Email del cliente: ${ctx.email}.`)
      if (ctx.step && ctx.step !== '' && !isNaN(Number(ctx.step))) parts.push(`El cliente está en el paso ${ctx.step} del formulario.`)
      formContextRef.current = parts.join(' ')

      // Personalized greeting
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
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setError('')
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, session_id: sessionId.current, form_context: formContextRef.current }),
      })
      if (!res.ok) throw new Error('Error de servidor')
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch {
      setError('No se pudo obtener respuesta. Inténtalo de nuevo.')
    } finally {
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
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open chat assistant"
          style={{
            position: 'relative',
            width: '58px',
            height: '58px',
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
            <ClaudiaAvatar size={58} uid="btn" />
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
            zIndex: 900,
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

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '14px 14px 14px 4px',
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(28,46,68,0.08)',
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#94A3B8',
                        display: 'inline-block',
                        animation: `chatdot 1.2s ease-in-out ${n * 0.2}s infinite`,
                      }}
                    />
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
              disabled={loading}
              style={{
                flex: 1,
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '0.83rem',
                fontFamily: 'inherit',
                color: '#1E293B',
                outline: 'none',
                background: loading ? '#F8FAFC' : '#fff',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: loading || !input.trim() ? '#E2E8F0' : 'linear-gradient(135deg,#2563EB,#1C2E44)',
                border: 'none',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={loading || !input.trim() ? '#94A3B8' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
