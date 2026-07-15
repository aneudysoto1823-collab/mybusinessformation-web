'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [blockedSeconds, setBlockedSeconds] = useState<number | null>(null)
  const [showRecover, setShowRecover] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverSent, setRecoverSent] = useState(false)
  const [recoverLoading, setRecoverLoading] = useState(false)
  const [recoverError, setRecoverError] = useState('')

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (blockedSeconds !== null) return
    setError('')
    setLoading(true)

    let res: Response
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      })
    } catch {
      setLoading(false)
      setError('Connection error. Please try again.')
      return
    }

    setLoading(false)

    if (res.status === 200) {
      const data = await res.json()
      if (data.requiresTwoFactor) {
        sessionStorage.setItem('twofa_methods', JSON.stringify(data.methods))
        router.push('/login/verify')
      } else {
        router.push('/admin')
      }
      return
    }

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0', 10) || 60
      setBlockedSeconds(retryAfter)
      return
    }

    if (res.status === 401) {
      setError('Incorrect username or password.')
      return
    }

    setError('Unexpected error. Please try again.')
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault()
    setRecoverError('')
    if (!recoverEmail.trim()) return
    setRecoverLoading(true)
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoverEmail.trim().toLowerCase() }),
    })
    const data = await res.json()
    setRecoverLoading(false)
    if (data.notFound) {
      setRecoverError('No account found with that email address.')
    } else {
      setRecoverSent(true)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'expired') setError('Recovery link expired or already used. Request a new one.')
  }, [])

  const isBlocked = blockedSeconds !== null && blockedSeconds > 0
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

        /* ── Page wrapper ── */
        .login-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: 100%;
          max-width: 920px;
        }

        /* ── Header above card ── */
        .login-header {
          text-align: center;
        }
        .login-header-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .login-header-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg,#1C2E44,#2563EB);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-weight: 700; color: #fff;
          font-size: 19px; letter-spacing: -0.5px; flex-shrink: 0;
        }
        .login-header-name {
          font-family: var(--font-serif);
          font-size: 22px; font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.4px;
          line-height: 1.1;
          text-align: left;
        }
        .login-header-name .login-header-caption {
          display: block;
          font-family: var(--font-sans);
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.35);
          letter-spacing: 1.2px; text-transform: uppercase;
          margin-top: 4px;
        }
        .login-header-rule {
          width: 48px; height: 1.5px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin: 0 auto 12px;
        }
        .login-header-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.3px;
          line-height: 1.5;
        }

        /* ── Card ── */
        .login-card {
          display: flex;
          align-items: stretch;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.1);
          width: 100%;
        }

        /* ── Photo side ── */
        .card-photo {
          display: none;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 760px) { .card-photo { display: block; } }

        .card-photo img {
          display: block;
          height: 100%;
          width: auto;
          max-width: 480px;
          object-fit: cover;
        }

        /* vignette on right edge */
        .card-photo::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 60px;
          background: linear-gradient(to right, transparent, rgba(248,250,252,0.4));
          pointer-events: none;
        }

        /* ── Form side ── */
        .card-form {
          flex: 1;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          padding: 40px 44px 28px;
          position: relative;
          min-height: 580px;
        }

        /* Brand mark */
        .brand-mark {
          display: flex; align-items: center; gap: 9px; margin-bottom: 36px;
        }
        .brand-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg,#1C2E44,#2563EB);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-weight: 700; color: #fff;
          font-size: 13px; letter-spacing: -0.4px; flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-serif); font-size: 13px;
          font-weight: 700; color: #0f172a; line-height: 1.15;
        }
        .brand-name .brand-caption {
          display: block; font-size: 10px;
          font-family: var(--font-sans);
          font-weight: 600; color: #94a3b8;
          letter-spacing: 0.7px; text-transform: uppercase; margin-top: 1px;
        }

        .form-body { flex: 1; }

        .form-eyebrow {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 7px;
        }
        .form-title {
          font-size: 23px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.4px; margin-bottom: 6px;
        }
        .form-sub {
          font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 28px;
        }

        .form-group { margin-bottom: 16px; }
        .form-group label {
          display: block; font-size: 12px; font-weight: 700;
          color: #374151; text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 7px;
        }
        .form-group input {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 9px;
          font-size: 14px; color: #0f172a; background: #ffffff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .form-group input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .form-group input:disabled { background: #f1f5f9; color: #94a3b8; }

        .btn-login {
          width: 100%; padding: 12px;
          background: #1e2d3d; color: #ffffff; border: none;
          border-radius: 9px; font-size: 15px; font-weight: 700;
          cursor: pointer; margin-top: 8px; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: -0.2px;
        }
        .btn-login:hover:not(:disabled) { background: #2563eb; }
        .btn-login:active:not(:disabled) { transform: scale(0.99); }
        .btn-login:disabled { background: #94a3b8; cursor: not-allowed; }

        .error-msg {
          background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
          border-radius: 9px; padding: 11px 14px; font-size: 13px;
          font-weight: 600; margin-bottom: 16px; line-height: 1.5;
        }

        .right-notice {
          margin-top: 20px; padding: 11px 14px;
          background: #fffbeb; border: 1px solid #fde68a;
          border-radius: 8px; font-size: 12px; color: #78350f; line-height: 1.55;
        }

        .form-footer {
          margin-top: auto; padding-top: 24px;
          text-align: center; font-size: 11px;
          color: #94a3b8; line-height: 1.6;
        }

        @media (max-width: 480px) {
          body { padding: 20px 12px; }
          .login-wrapper { gap: 18px; }
          .login-header-name { font-size: 18px; }
          .card-form { padding: 24px 20px 20px; min-height: unset; }
          .form-title { font-size: 20px; }
          .btn-login { padding: 13px; font-size: 15px; min-height: 48px; }
        }
      `}</style>

      <div className="login-wrapper">

        {/* ── Header above card ── */}
        <div className="login-header">
          <div className="login-header-brand">
            <div className="login-header-icon">OB</div>
            <div className="login-header-name">
              <span style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1.5rem'}}>Opa</span><span style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1.5rem',color:'#2563EB'}}>Biz</span>
              <span className="login-header-caption">Admin Panel</span>
            </div>
          </div>
          <div className="login-header-rule" />
          <p className="login-header-tagline">Internal operations panel — authorized staff only</p>
        </div>

        {/* ── Card ── */}
        <div className="login-card">

          {/* ── Photo ── */}
          <div className="card-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/admin-bg.jpg" alt="" />
          </div>

          {/* ── Form ── */}
          <div className="card-form">

            <div className="brand-mark">
              <div className="brand-icon">OB</div>
              <div className="brand-name">
                <span style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1.5rem'}}>Opa</span><span style={{fontFamily:'var(--font-serif)',fontWeight:700,fontSize:'1.5rem',color:'#2563EB'}}>Biz</span>
                <span className="brand-caption">Admin Panel</span>
              </div>
            </div>

            <div className="form-body">
              <div className="form-eyebrow">Staff Access</div>
              <div className="form-title">Sign in to your account</div>
              <p className="form-sub">Enter your credentials to access the internal operations panel.</p>

              <form onSubmit={handleSubmit}>
                {isBlocked ? (
                  <div className="error-msg">
                    Too many attempts. Wait {formatSeconds(blockedSeconds!)} before trying again.
                  </div>
                ) : error ? (
                  <div className="error-msg">{error}</div>
                ) : null}

                <div className="form-group">
                  <label htmlFor="user">Username</label>
                  <input
                    id="user" type="text" value={user}
                    onChange={e => setUser(e.target.value)}
                    required autoComplete="username"
                    disabled={isBlocked || loading}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password" type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required autoComplete="current-password"
                      disabled={isBlocked || loading}
                      placeholder="Enter your password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                      {showPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={() => { setShowRecover(v => !v); setRecoverSent(false); setRecoverError(''); setRecoverEmail('') }}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                  >
                    Forgot password or username?
                  </button>
                </div>

                {showRecover && !recoverSent && (
                  <form onSubmit={handleRecover} style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: '.8rem', color: '#475569', margin: 0 }}>Enter the email address linked to your admin account and we&apos;ll send you an access link.</p>
                    <input
                      type="email"
                      value={recoverEmail}
                      onChange={e => setRecoverEmail(e.target.value)}
                      placeholder="admin@email.com"
                      required
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem', fontFamily: 'inherit', outline: 'none' }}
                    />
                    {recoverError && <p style={{ fontSize: '.78rem', color: '#dc2626', margin: 0 }}>{recoverError}</p>}
                    <button
                      type="submit"
                      disabled={recoverLoading}
                      style={{ background: '#1C2E44', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {recoverLoading ? 'Sending…' : 'Send recovery link'}
                    </button>
                  </form>
                )}

                {recoverSent && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem', color: '#166534' }}>
                    Recovery link sent. Check your inbox — it expires in 15 minutes.
                  </div>
                )}

                <button type="submit" className="btn-login" disabled={loading || isBlocked}>
                  {loading ? 'Signing in…' : isBlocked ? `Locked (${formatSeconds(blockedSeconds!)})` : 'Sign in →'}
                </button>
              </form>

              <div className="right-notice">
                ⚠️ This portal is restricted to Florida Business Formation Center staff and administrators. Unauthorized access is prohibited.
              </div>
            </div>

            <div className="form-footer">
              © {year} Florida Business Formation Center — opabiz.com<br />
              Confidential & Proprietary
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
