'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OpabizLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [blockedSeconds, setBlockedSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (blockedSeconds === null || blockedSeconds <= 0) return
    const interval = setInterval(() => {
      setBlockedSeconds(prev => {
        if (prev === null || prev <= 1) return null
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [blockedSeconds])

  function formatSeconds(s: number): string {
    const mm = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  }

  const isBlocked = blockedSeconds !== null && blockedSeconds > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isBlocked) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/opabiz/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/opabiz/dashboard')
        return
      }
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0', 10) || 60
        setBlockedSeconds(retryAfter)
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo iniciar sesión.')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const year = new Date().getFullYear()

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font-sans);
          background: #0f1c2e;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }

        .op-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: 100%;
          max-width: 920px;
        }

        /* ── Header above card ── */
        .op-header { text-align: center; }
        .op-header-brand {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 10px;
        }
        .op-header-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg,#1C2E44,#2563EB);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-weight: 700; color: #fff;
          font-size: 19px; letter-spacing: -0.5px; flex-shrink: 0;
        }
        .op-header-name {
          font-family: var(--font-serif);
          font-size: 22px; font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.4px; line-height: 1.1; text-align: left;
        }
        .op-header-name span.op-accent { color: #2563EB; }
        .op-header-name .op-caption {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1.2px; text-transform: uppercase;
          margin-top: 4px;
        }
        .op-header-rule {
          width: 48px; height: 1.5px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px; margin: 0 auto 12px;
        }
        .op-header-tagline {
          font-size: 13px; color: rgba(255,255,255,0.3);
          letter-spacing: 0.3px; line-height: 1.5;
        }

        /* ── Card ── */
        .op-card {
          display: flex; align-items: stretch;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.1);
          width: 100%;
        }

        .op-card-photo { display: none; flex-shrink: 0; position: relative; overflow: hidden; }
        @media (min-width: 760px) { .op-card-photo { display: block; } }
        .op-card-photo img { display: block; height: 100%; width: auto; max-width: 480px; object-fit: cover; }
        .op-card-photo::after {
          content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 60px;
          background: linear-gradient(to right, transparent, rgba(248,250,252,0.4));
          pointer-events: none;
        }

        .op-card-form {
          flex: 1; background: #f8fafc;
          display: flex; flex-direction: column;
          padding: 40px 44px 28px; position: relative; min-height: 520px;
        }

        .op-brand-mark { display: flex; align-items: center; gap: 9px; margin-bottom: 36px; }
        .op-brand-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg,#1C2E44,#2563EB);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-weight: 700; color: #fff;
          font-size: 13px; letter-spacing: -0.4px; flex-shrink: 0;
        }
        .op-brand-name { font-family: var(--font-serif); font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.15; }
        .op-brand-name span.op-accent { color: #2563EB; }
        .op-brand-name .op-caption {
          display: block; font-size: 10px; font-family: var(--font-sans);
          font-weight: 600; color: #94a3b8; letter-spacing: 0.7px;
          text-transform: uppercase; margin-top: 1px;
        }

        .op-form-body { flex: 1; }
        .op-form-eyebrow { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 7px; }
        .op-form-title { font-size: 23px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 6px; }
        .op-form-sub { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 28px; }

        .op-field { margin-bottom: 16px; }
        .op-field label { display: block; font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; }
        .op-field input {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 14px; color: #0f172a; background: #ffffff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .op-field input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .op-field input:disabled { background: #f1f5f9; color: #94a3b8; }

        .op-btn-login {
          width: 100%; padding: 12px;
          background: #1e2d3d; color: #ffffff; border: none;
          border-radius: 9px; font-size: 15px; font-weight: 700;
          cursor: pointer; margin-top: 8px; font-family: inherit;
          transition: background 0.15s, transform 0.1s; letter-spacing: -0.2px;
        }
        .op-btn-login:hover:not(:disabled) { background: #2563eb; }
        .op-btn-login:active:not(:disabled) { transform: scale(0.99); }
        .op-btn-login:disabled { background: #94a3b8; cursor: not-allowed; }

        .op-error-msg {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          border-radius: 9px; padding: 11px 14px; font-size: 13px;
          font-weight: 600; margin-bottom: 16px; line-height: 1.5;
        }

        .op-right-notice {
          margin-top: 20px; padding: 11px 14px;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; font-size: 12px; color: #78350f; line-height: 1.55;
        }

        .op-form-footer {
          margin-top: auto; padding-top: 24px;
          text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;
        }

        @media (max-width: 480px) {
          body { padding: 20px 12px; }
          .op-wrapper { gap: 18px; }
          .op-header-name { font-size: 18px; }
          .op-card-form { padding: 24px 20px 20px; min-height: unset; }
          .op-form-title { font-size: 20px; }
          .op-btn-login { padding: 13px; font-size: 15px; min-height: 48px; }
        }
      `}</style>

      <div className="op-wrapper">

        {/* ── Header above card ── */}
        <div className="op-header">
          <Link href="/" className="op-header-brand" style={{ textDecoration: 'none' }}>
            <div className="op-header-icon">OB</div>
            <div className="op-header-name">
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.5rem' }}>Opa</span>
              <span className="op-accent" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.5rem' }}>Biz</span>
              <span className="op-caption">Connect</span>
            </div>
          </Link>
          <div className="op-header-rule" />
          <p className="op-header-tagline">Panel interno de campo — solo para empleados autorizados</p>
        </div>

        {/* ── Card ── */}
        <div className="op-card">

          <div className="op-card-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/admin-bg.jpg" alt="" />
          </div>

          <div className="op-card-form">

            <div className="op-brand-mark">
              <div className="op-brand-icon">OB</div>
              <div className="op-brand-name">
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.5rem' }}>Opa</span>
                <span className="op-accent" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.5rem' }}>Biz</span>
                <span className="op-caption">Connect</span>
              </div>
            </div>

            <div className="op-form-body">
              <div className="op-form-eyebrow">Acceso de empleados</div>
              <div className="op-form-title">Iniciar sesión</div>
              <p className="op-form-sub">Ingresá tus credenciales para acceder a tus órdenes asignadas.</p>

              <form onSubmit={handleSubmit}>
                {isBlocked ? (
                  <div className="op-error-msg">
                    Demasiados intentos. Esperá {formatSeconds(blockedSeconds!)} antes de volver a intentar.
                  </div>
                ) : error ? (
                  <div className="op-error-msg">{error}</div>
                ) : null}

                <div className="op-field">
                  <label htmlFor="op-email">Email</label>
                  <input
                    id="op-email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required autoComplete="username"
                    disabled={isBlocked || loading}
                    placeholder="tu@email.com"
                  />
                </div>

                <div className="op-field">
                  <label htmlFor="op-password">Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="op-password" type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required autoComplete="current-password"
                      disabled={isBlocked || loading}
                      placeholder="Ingresá tu contraseña"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="op-btn-login" disabled={loading || isBlocked}>
                  {loading ? 'Ingresando…' : isBlocked ? `Bloqueado (${formatSeconds(blockedSeconds!)})` : 'Ingresar →'}
                </button>
              </form>

              <div className="op-right-notice">
                ⚠️ Este portal es solo para personal de campo de Florida Business Formation Center. El acceso no autorizado está prohibido.
              </div>
            </div>

            <div className="op-form-footer">
              © {year} Florida Business Formation Center — opabiz.com<br />
              Confidencial y de uso interno
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
