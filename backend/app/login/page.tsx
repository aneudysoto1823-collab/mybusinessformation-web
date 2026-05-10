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
          background: #1e2d3d;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
        }
        @media (min-width: 900px) {
          .login-left { display: flex; }
        }

        /* Background photo */
        .left-photo {
          position: absolute;
          inset: 0;
          background: url('/miami-bg.jpg') center center / cover no-repeat;
          z-index: 0;
        }

        /* Dark overlay so text stays readable */
        .left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(10, 18, 30, 0.55) 0%,
            rgba(10, 18, 30, 0.35) 45%,
            rgba(10, 18, 30, 0.60) 100%
          );
          z-index: 1;
        }

        /* Thin border on right side */
        .login-left::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.08);
          z-index: 2;
        }

        .left-content { position: relative; z-index: 2; }

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

        /* ── Center hero title ── */
        .left-hero {
          position: relative; z-index: 2;
          text-align: center;
          padding: 0 12px;
        }
        .left-hero-eyebrow {
          display: inline-block;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 10px;
          font-weight: 700;
          color: #93c5fd;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .left-hero-title {
          font-family: 'Fraunces', serif;
          font-size: 44px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -1px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
          margin-bottom: 18px;
        }
        .left-hero-title span {
          display: block;
          color: #93c5fd;
        }
        .left-hero-rule {
          width: 48px; height: 2px;
          background: rgba(147,197,253,0.4);
          border-radius: 2px;
          margin: 0 auto 18px;
        }
        .left-hero-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.3px;
          line-height: 1.6;
        }

        .access-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
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
        .access-text { font-size: 12px; color: rgba(255,255,255,0.4); }

        .warning-box {
          position: relative; z-index: 2;
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
          position: relative; z-index: 2;
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
          .login-right { width: 520px; flex-shrink: 0; }
        }

        .form-wrap {
          width: 100%;
          max-width: 400px;
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
          <div className="left-photo" />
          <div className="left-overlay" />

          {/* Top: brand mark */}
          <div className="left-content">
            <div className="brand-mark">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                Florida Business Formation Center
                <span>Staff Portal</span>
              </div>
            </div>
          </div>

          {/* Center: big hero title */}
          <div className="left-hero">
            <div className="left-hero-eyebrow">Internal Use Only</div>
            <div className="left-hero-title">
              Florida Business
              <span>Formation Center</span>
            </div>
            <div className="left-hero-rule" />
            <p className="left-hero-sub">
              Authorized staff operations portal<br />
              Orders · Filings · Client Management
            </p>
          </div>

          {/* Bottom: access list + warning */}
          <div>
            <div className="access-list" style={{ marginBottom: 16 }}>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Order management & status tracking</span>
              </div>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Client communication & notifications</span>
              </div>
              <div className="access-item">
                <div className="access-check">✓</div>
                <span className="access-text">Document upload & filing records</span>
              </div>
            </div>
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>Authorized Personnel Only</strong>
                This system contains confidential client and business information. Unauthorized access is strictly prohibited and may be subject to legal action.
              </div>
            </div>
            <div className="left-footer">
              © {year} Florida Business Formation Center — mybusinessformation.com
            </div>
          </div>
        </div>

        {/* ── Right — form panel ── */}
        <div className="login-right">
          <div className="form-wrap">

            <div className="mobile-brand">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                Florida Business Formation Center
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
            © {year} Florida Business Formation Center — mybusinessformation.com<br />
            Confidential & Proprietary — Unauthorized access is prohibited
          </div>
        </div>

      </div>
    </>
  )
}
