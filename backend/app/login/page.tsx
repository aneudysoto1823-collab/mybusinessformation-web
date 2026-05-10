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
          background: linear-gradient(160deg, #1e2d3d 0%, #243b55 100%);
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
        }
        @media (min-width: 900px) {
          .login-left { display: flex; }
        }

        /* Decorative circles — very subtle */
        .deco-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .deco-c1 { width: 460px; height: 460px; top: -160px; right: -140px; }
        .deco-c2 { width: 280px; height: 280px; bottom: -80px; left: -70px; }

        /* Dot grid */
        .deco-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        /* Thin border on right side */
        .login-left::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.06);
        }

        .left-content { position: relative; z-index: 1; }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 60px;
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1.1;
          letter-spacing: -0.2px;
        }
        .brand-name span {
          display: block;
          font-size: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .left-label {
          display: inline-block;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .left-headline {
          font-family: 'Fraunces', serif;
          font-size: 34px;
          font-weight: 900;
          color: #e2e8f0;
          line-height: 1.2;
          letter-spacing: -0.6px;
          margin-bottom: 16px;
        }
        .left-headline em { color: #93c5fd; font-style: normal; }

        .left-sub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.75;
          max-width: 300px;
        }

        .divider {
          width: 36px; height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          margin: 28px 0;
        }

        .access-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .access-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .access-check {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(147,197,253,0.12);
          border: 1px solid rgba(147,197,253,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
          color: #93c5fd;
        }
        .access-text { font-size: 13px; color: #64748b; }

        .warning-box {
          position: relative; z-index: 1;
          background: rgba(251,191,36,0.07);
          border: 1px solid rgba(251,191,36,0.15);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .warning-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .warning-text { font-size: 11px; color: #94a3b8; line-height: 1.6; }
        .warning-text strong { color: #fbbf24; font-weight: 700; display: block; margin-bottom: 2px; }

        .left-footer {
          position: relative; z-index: 1;
          font-size: 11px;
          color: #334155;
          margin-top: 16px;
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

        .form-header { margin-bottom: 28px; }
        .form-header .greeting {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
        }
        .form-header h2 {
          font-size: 23px;
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

        .form-group { margin-bottom: 16px; }

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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .form-group input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
        }

        .btn-login {
          width: 100%;
          padding: 12px;
          background: #1e2d3d;
          color: #ffffff;
          border: none;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
          letter-spacing: -0.2px;
        }
        .btn-login:hover:not(:disabled) {
          background: #243b55;
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
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .right-notice {
          margin-top: 20px;
          padding: 11px 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          font-size: 12px;
          color: #78350f;
          line-height: 1.55;
        }

        .form-footer {
          position: absolute;
          bottom: 24px;
          left: 0; right: 0;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* Mobile brand bar */
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .mobile-brand .brand-icon {
          width: 32px; height: 32px; border-radius: 8px; font-size: 15px;
          background: #1e2d3d; border: none;
        }
        .mobile-brand .brand-name { font-size: 14px; color: #0f172a; }
        .mobile-brand .brand-name span { color: #94a3b8; }
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

          <div className="left-content">
            <div className="brand-mark">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                MyBusinessFormation
                <span>Staff Portal</span>
              </div>
            </div>

            <div className="left-label">Internal Use Only</div>

            <div className="left-headline">
              Operations &<br />
              <em>Staff Portal</em>
            </div>
            <p className="left-sub">
              Restricted access system for authorized team members. Manage client orders, filings, and internal operations from a single dashboard.
            </p>

            <div className="divider" />

            <div className="access-list">
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Order management & status tracking</span>
              </div>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Client communication & email notifications</span>
              </div>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Document upload & filing records</span>
              </div>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Revenue reports & business analytics</span>
              </div>
            </div>
          </div>

          <div>
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>Authorized Personnel Only</strong>
                This system contains confidential client and business information. Unauthorized access is strictly prohibited and may be subject to legal action.
              </div>
            </div>
            <div className="left-footer">
              © {year} MyBusinessFormation LLC — All rights reserved
            </div>
          </div>
        </div>

        {/* ── Right — form panel ── */}
        <div className="login-right">
          <div className="form-wrap">

            <div className="mobile-brand">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                MyBusinessFormation
                <span>Staff Portal</span>
              </div>
            </div>

            <div className="form-header">
              <div className="greeting">Staff Access</div>
              <h2>Sign in to your account</h2>
              <p>Enter your credentials to access the internal operations panel.</p>
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

            <div className="right-notice">
              ⚠️ This portal is restricted to MyBusinessFormation staff and administrators. If you are not an authorized employee, please leave this page immediately.
            </div>
          </div>

          <div className="form-footer">
            © {year} MyBusinessFormation LLC — All rights reserved<br />
            Confidential & Proprietary — Unauthorized access is prohibited
          </div>
        </div>

      </div>
    </>
  )
}
