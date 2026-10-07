'use client'

import { useEffect, useRef, useState } from 'react'

// Tipos mínimos de Web Speech API — no vienen en el lib.dom.d.ts de
// TypeScript por defecto. Mismo subset que usa el content script de la
// extensión de WhatsApp (whatsapp-assistant-extension/content.js).
interface SpeechRecognitionResultLike { isFinal: boolean; [index: number]: { transcript: string } }
interface SpeechRecognitionEvent extends Event { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionErrorEvent extends Event { error: string }
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// Asistente interno para agentes de OpaBiz Connect llenando el formulario en
// vivo frente a un cliente (intake asistida, opabiz.com/?agent=1). Distinto
// del ChatWidget público: ese le habla al cliente, este le responde
// preguntas al agente para que pueda seguir la conversación sin cortar.
//
// Detección de modo agente igual que fmDetectAgentMode() en page.tsx: solo
// se activa con ?agent=1 en la URL Y una sesión válida de OpaBiz Connect —
// nunca se renderiza nada (ni el botón) para un visitante normal.
export default function AgentAssistWidget() {
  const [agentMode, setAgentMode] = useState(false)
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [lang, setLang] = useState<'es-ES' | 'en-US'>('es-ES')
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reply, setReply] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const baseTextRef = useRef('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('agent') !== '1') return
    fetch('/api/opabiz/auth/me', { credentials: 'same-origin' })
      .then(r => { if (r.ok) setAgentMode(true) })
      .catch(() => {})
  }, [])

  const toggleMic = () => {
    type SpeechRecognitionCtor = new () => SpeechRecognition
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) { setError('Tu navegador no soporta dictado por voz.'); return }

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    baseTextRef.current = question ? question.trim() + ' ' : ''
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += transcript + ' '
        else interim += transcript
      }
      if (finalChunk) baseTextRef.current += finalChunk
      setQuestion(baseTextRef.current + interim)
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error === 'not-allowed' ? 'Dale permiso de micrófono para dictar.' : `Error de dictado: ${event.error}`)
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const ask = async () => {
    const q = question.trim()
    if (!q) { setError('Escribí o dictá tu pregunta primero.'); return }
    setError('')
    setLoading(true)
    setReply('')
    try {
      const res = await fetch('/api/opabiz/assist', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'No se pudo conectar con Claudia.'); return }
      setReply(data.reply || '')
    } catch {
      setError('No se pudo conectar con Claudia.')
    } finally {
      setLoading(false)
    }
  }

  if (!agentMode) return null

  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '28px', zIndex: 9999, fontFamily: 'var(--font-sans, system-ui)' }}>
      {open && (
        <div style={{
          width: '320px', maxHeight: '70vh', background: '#fff', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,.3)', marginBottom: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ background: '#1c2e44', color: '#fff', padding: '12px 16px', fontSize: '13px', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Mismo criterio que ClaudiaAvatar en ChatWidget: avatar chico, sin next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Claudia.jpg" alt="" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '2px solid rgba(255,255,255,.4)' }} />
              <div>
                <div>Claudia Agente</div>
                <div style={{ fontSize: '11px', fontWeight: 400, opacity: 0.75 }}>Te sugiere qué responderle al cliente</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px' }}>Tu pregunta</label>
              <select value={lang} onChange={e => setLang(e.target.value as 'es-ES' | 'en-US')} style={{ fontSize: '11px', border: '1.5px solid #e5e7eb', borderRadius: '6px', padding: '2px 6px' }}>
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                rows={3}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Pregúntale a Claudia lo que necesites mientras llenas el formulario..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 42px 8px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              />
              <button
                type="button" onClick={toggleMic} title={listening ? 'Detener dictado' : 'Dictar por voz'} aria-pressed={listening}
                style={{
                  position: 'absolute', right: '7px', bottom: '7px', width: '30px', height: '30px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  // Igual que el micrófono del chat de Claude Code: en reposo solo el
                  // ícono gris, escuchando se pone el cuadro azul con el ícono blanco.
                  background: listening ? '#2563eb' : 'transparent', color: listening ? '#fff' : '#6b7280',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3.5" /></svg>
              </button>
            </div>
            <button
              onClick={ask} disabled={loading}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Pensando...' : 'Preguntarle a Claudia'}
            </button>
            {error && <div style={{ color: '#dc2626', fontSize: '12px' }}>{error}</div>}
            {reply && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                {reply}
              </div>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="Claudia Agente"
        aria-label="Abrir Claudia Agente"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px 5px 5px', borderRadius: '30px',
          border: '1.5px solid #2563eb', background: '#fff', color: '#1c2e44', cursor: 'pointer',
          fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,.18)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Claudia.jpg" alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top' }} />
        Claudia Agente
      </button>
    </div>
  )
}
