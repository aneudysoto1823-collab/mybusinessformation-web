'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
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

  async function handleSubmit(e: React.FormEvent) {
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

  const isBlocked = blockedSeconds !== null && blockedSeconds > 0
  const year = new Date().getFullYear()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .login-root {
          min-height: 100vh;
          display: flex;
        }

        /* ── Left panel ── */
        .login-left {
          display: none;
          flex: 1;
          background: #0f1c2e;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
        }
        @media (min-width: 900px) {
          .login-left { display: flex; }
        }

        /* Decorative circles */
        .deco-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.07;
          background: #2563EB;
        }
        .deco-c1 { width: 500px; height: 500px; top: -180px; right: -160px; }
        .deco-c2 { width: 320px; height: 320px; bottom: -100px; left: -80px; }
        .deco-c3 { width: 180px; height: 180px; top: 38%; left: 12%; opacity: 0.05; }

        /* Dot grid */
        .deco-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .left-content { position: relative; z-index: 1; }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 56px;
        }
        .brand-icon {
          width: 38px; height: 38px;
          background: #2563EB;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.2px;
        }
        .brand-name span { display: block; font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500; color: #64748b; letter-spacing: 0; }

        .left-headline {
          font-family: 'Fraunces', serif;
          font-size: 38px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.8px;
          margin-bottom: 18px;
        }
        .left-headline em { color: #2563EB; font-style: normal; }

        .left-sub {
          font-size: 14px;
          color: #64748b;
          line-height: 1.7;
          max-width: 320px;
        }

        .feature-list {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .feature-dot {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(37,99,235,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .feature-text { font-size: 13px; color: #94a3b8; font-weight: 500; }

        .left-footer {
          position: relative; z-index: 1;
          font-size: 12px;
          color: #334155;
        }

        /* ── Right panel ── */
        .login-right {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f8fafc;
          position: relative;
        }
        @media (min-width: 900px) {
          .login-right { width: 440px; flex-shrink: 0; }
        }

        .form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .form-header {
          margin-bottom: 32px;
        }
        .form-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
        }
        .form-header p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
        }

        .form-group { margin-bottom: 18px; }

        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 7px;
        }

        .form-group input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .form-group input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .form-group input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
        }

        .btn-login {
          width: 100%;
          padding: 12px;
          background: #1C2E44;
          color: #ffffff;
          border: none;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
          letter-spacing: -0.2px;
        }
        .btn-login:hover:not(:disabled) {
          background: #2563EB;
        }
        .btn-login:active:not(:disabled) {
          transform: scale(0.99);
        }
        .btn-login:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 9px;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 18px;
          line-height: 1.5;
        }

        .form-footer {
          position: absolute;
          bottom: 28px;
          left: 0; right: 0;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }

        /* Mobile brand bar */
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .mobile-brand .brand-icon { width: 32px; height: 32px; border-radius: 8px; font-size: 15px; }
        .mobile-brand .brand-name { font-size: 14px; }
        @media (min-width: 900px) {
          .mobile-brand { display: none; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Left — brand panel ── */}
        <div className="login-left">
          <div className="deco-dots" />
          <div className="deco-circle deco-c1" />
          <div className="deco-circle deco-c2" />
          <div className="deco-circle deco-c3" />

          <div className="left-content">
            <div className="brand-mark">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                MyBusinessFormation
                <span>Admin Portal</span>
              </div>
            </div>

            <div className="left-headline">
              Manage your<br />
              <em>business filings</em><br />
              with ease.
            </div>
            <p className="left-sub">
              Everything you need to track orders, manage clients, and keep your Florida business formation operation running smoothly.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-dot">📋</div>
                <span className="feature-text">Real-time order tracking & status updates</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot">✉️</div>
                <span className="feature-text">Automated client email notifications</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot">🔐</div>
                <span className="feature-text">Two-factor authentication protection</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot">📊</div>
                <span className="feature-text">Revenue and order analytics dashboard</span>
              </div>
            </div>
          </div>

          <div className="left-footer">
            © {year} MyBusinessFormation.com — All rights reserved
          </div>
        </div>

        {/* ── Right — form panel ── */}
        <div className="login-right">
          <div className="form-wrap">

            <div className="mobile-brand">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                MyBusinessFormation
                <span>Admin Portal</span>
              </div>
            </div>

            <div className="form-header">
              <h2>Welcome back</h2>
              <p>Sign in to access the administration panel.</p>
            </div>

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
                  id="user"
                  type="text"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={isBlocked || loading}
                  placeholder="Enter your username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isBlocked || loading}
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading || isBlocked}>
                {loading ? 'Signing in…' : isBlocked ? `Locked (${formatSeconds(blockedSeconds!)})` : 'Sign in →'}
              </button>
            </form>
          </div>

          <div className="form-footer">
            © {year} MyBusinessFormation.com
          </div>
        </div>

      </div>
    </>
  )
}
