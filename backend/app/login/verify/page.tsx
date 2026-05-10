'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const [methods, setMethods] = useState<string[]>([])
  const [method, setMethod] = useState<'totp' | 'email' | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('twofa_methods')
    if (!stored) { router.replace('/login'); return }
    const m: string[] = JSON.parse(stored)
    setMethods(m)
    if (m.length === 1) setMethod(m[0] as 'totp' | 'email')
  }, [router])

  async function sendEmailCode() {
    setSending(true)
    setError('')
    const res = await fetch('/api/auth/2fa-send-email', { method: 'POST' })
    setSending(false)
    if (res.ok) { setEmailSent(true) } else { setError('Error al enviar el código. Intenta de nuevo.') }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!method || code.length < 6) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/2fa-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), method }),
    })
    setLoading(false)
    if (res.ok) {
      sessionStorage.removeItem('twofa_methods')
      router.replace('/admin')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Código incorrecto.')
      setCode('')
    }
  }

  if (methods.length === 0) return null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
        .wrap {
          min-height: 100vh; display: flex; align-items: center;
          justify-content: center; padding: 24px;
        }
        .card {
          background: #fff; border-radius: 14px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 40px 36px; width: 100%; max-width: 400px;
        }
        .logo { font-size: 15px; font-weight: 700; color: #1C2E44; margin-bottom: 28px; }
        h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .sub { font-size: 14px; color: #6b7280; margin-bottom: 28px; line-height: 1.5; }
        .method-btns { display: flex; gap: 10px; margin-bottom: 24px; }
        .method-btn {
          flex: 1; padding: 11px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; border: 2px solid #e5e7eb;
          background: #fff; color: #374151; font-family: inherit;
          transition: all 0.15s;
        }
        .method-btn.active { border-color: #4f46e5; background: #eef2ff; color: #4f46e5; }
        .method-btn:hover:not(.active) { border-color: #d1d5db; }
        .label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
        .code-input {
          width: 100%; padding: 13px 16px; border: 2px solid #e5e7eb;
          border-radius: 9px; font-size: 24px; font-weight: 700; letter-spacing: 8px;
          text-align: center; font-family: monospace; color: #1a1a2e;
          outline: none; transition: border-color 0.15s;
        }
        .code-input:focus { border-color: #4f46e5; }
        .btn {
          width: 100%; padding: 13px; border: none; border-radius: 9px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s; margin-top: 16px;
        }
        .btn-primary { background: #4f46e5; color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #4338ca; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary {
          background: #f1f5f9; color: #374151; border: 1.5px solid #e5e7eb;
          font-size: 13px; padding: 10px; margin-top: 10px;
        }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; margin-top: 14px; }
        .info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-top: 14px; line-height: 1.5; }
        .back { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #9ca3af; text-decoration: none; }
        .back:hover { color: #4f46e5; }
      `}</style>

      <div className="wrap">
        <div className="card">
          <div className="logo">MyBusinessFormation</div>
          <h1>Verificación 2FA</h1>
          <p className="sub">
            {method === 'totp'
              ? 'Ingresa el código de 6 dígitos de tu app autenticadora.'
              : method === 'email'
              ? 'Te enviaremos un código de 6 dígitos a tu email de admin.'
              : 'Elige cómo verificar tu identidad.'}
          </p>

          {/* Selector de método si tiene los dos */}
          {methods.length > 1 && (
            <div className="method-btns">
              <button
                className={`method-btn${method === 'totp' ? ' active' : ''}`}
                onClick={() => { setMethod('totp'); setCode(''); setError(''); setEmailSent(false) }}
              >
                📱 App
              </button>
              <button
                className={`method-btn${method === 'email' ? ' active' : ''}`}
                onClick={() => { setMethod('email'); setCode(''); setError(''); setEmailSent(false) }}
              >
                ✉️ Email
              </button>
            </div>
          )}

          {/* Email: botón para enviar código */}
          {method === 'email' && !emailSent && (
            <button className="btn btn-primary" onClick={sendEmailCode} disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar código a mi email'}
            </button>
          )}

          {method === 'email' && emailSent && (
            <p className="info">✅ Código enviado. Revisa tu email y escríbelo aquí abajo.</p>
          )}

          {/* Input del código */}
          {method && (method === 'totp' || emailSent) && (
            <form onSubmit={handleVerify}>
              <div className="label" style={{ marginTop: 20 }}>Código de 6 dígitos</div>
              <input
                className="code-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                autoComplete="one-time-code"
              />
              <button className="btn btn-primary" type="submit" disabled={loading || code.length < 6}>
                {loading ? 'Verificando…' : 'Verificar y entrar →'}
              </button>
            </form>
          )}

          {method === 'email' && emailSent && (
            <button className="btn btn-secondary" onClick={sendEmailCode} disabled={sending}>
              {sending ? 'Enviando…' : 'Reenviar código'}
            </button>
          )}

          {error && <div className="error">{error}</div>}

          <a href="/login" className="back">← Volver al login</a>
        </div>
      </div>
    </>
  )
}
