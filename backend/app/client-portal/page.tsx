'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [confirmationNumber, setConfirmationNumber] = useState(searchParams.get('order') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/client-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmationNumber }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/client-portal/dashboard')
    } else {
      setError("We couldn't find an order matching that email and confirmation number.")
    }
  }

  const year = new Date().getFullYear()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .root {
          min-height: 100vh;
          display: flex;
        }

        /* ── Left panel ── */
        .left {
          display: none;
          flex: 1;
          background: #1a1208;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
        }
        @media (min-width: 900px) {
          .left { display: flex; }
        }

        .left-photo {
          position: absolute;
          inset: 0;
          background: url('/client-portal-bg.jpg') center center / cover no-repeat;
          z-index: 0;
        }

        .left-overlay {
          position: absolute;
          inset: 0;
          background: transparent;
          z-index: 1;
        }

        .left::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.07);
          z-index: 2;
        }

        /* ── Top brand ── */
        .left-top { position: relative; z-index: 2; }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: rgba(26,35,50,0.07);
          border: 1px solid rgba(26,35,50,0.12);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: 'Fraunces', serif;
          font-size: 14px;
          font-weight: 700;
          color: #1a2332;
          line-height: 1.1;
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

        /* ── Center hero ── */
        .left-hero {
          position: relative; z-index: 2;
          text-align: center;
          padding: 0 8px;
        }
        .hero-eyebrow {
          display: inline-block;
          background: rgba(26,35,50,0.07);
          border: 1px solid rgba(26,35,50,0.15);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .hero-title {
          font-family: 'Fraunces', serif;
          font-size: 42px;
          font-weight: 900;
          color: #1a2332;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 18px;
        }
        .hero-title span {
          display: block;
          color: #2563eb;
        }
        .hero-rule {
          width: 44px; height: 2px;
          background: rgba(37,99,235,0.3);
          border-radius: 2px;
          margin: 0 auto 18px;
        }
        .hero-sub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.65;
        }

        /* ── Bottom ── */
        .left-bottom { position: relative; z-index: 2; }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .step-dot {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #2563eb;
          flex-shrink: 0;
        }
        .step-text { font-size: 12px; color: #64748b; }

        .left-footer {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 14px;
        }

        /* ── Right panel ── */
        .right {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #fafaf8;
          position: relative;
        }
        @media (min-width: 900px) {
          .right { width: 520px; flex-shrink: 0; }
        }

        .form-wrap {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile brand */
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .mobile-brand .brand-icon {
          width: 32px; height: 32px; border-radius: 8px; font-size: 15px;
          background: #1a1208; border: none;
        }
        .mobile-brand .brand-name { font-size: 14px; color: #0f172a; }
        .mobile-brand .brand-name span { color: #94a3b8; }
        @media (min-width: 900px) {
          .mobile-brand { display: none; }
        }

        .form-header { margin-bottom: 28px; }
        .form-eyebrow {
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
          line-height: 1.55;
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
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217,119,6,0.1);
        }

        .input-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 5px;
        }

        .btn-access {
          width: 100%;
          padding: 12px;
          background: #1a1208;
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
        .btn-access:hover:not(:disabled) {
          background: #2d2010;
        }
        .btn-access:active:not(:disabled) {
          transform: scale(0.99);
        }
        .btn-access:disabled {
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

        .contact-note {
          margin-top: 18px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
        }
        .contact-note a {
          color: #d97706;
          text-decoration: none;
          font-weight: 600;
        }
        .contact-note a:hover { text-decoration: underline; }

        .form-footer {
          position: absolute;
          bottom: 24px;
          left: 0; right: 0;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.6;
        }
      `}</style>

      <div className="root">

        {/* ── Left — photo panel ── */}
        <div className="left">
          <div className="left-photo" />
          <div className="left-overlay" />

          <div className="left-top">
            <div className="brand-mark">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                Florida Business Formation Center
                <span>Client Portal</span>
              </div>
            </div>
          </div>

          <div className="left-hero">
            <div className="hero-eyebrow">Your Business Journey</div>
            <div className="hero-title">
              Track Your
              <span>Business Filing</span>
            </div>
            <div className="hero-rule" />
            <p className="hero-sub">
              Real-time status updates on your<br />
              Florida business formation process.
            </p>
          </div>

          <div className="left-bottom">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-dot">✓</div>
                <span className="step-text">Order status & filing progress</span>
              </div>
              <div className="step-item">
                <div className="step-dot">✓</div>
                <span className="step-text">Download your official documents</span>
              </div>
              <div className="step-item">
                <div className="step-dot">✓</div>
                <span className="step-text">Business formation history</span>
              </div>
            </div>
            <div className="left-footer">
              © {year} Florida Business Formation Center — mybusinessformation.com
            </div>
          </div>
        </div>

        {/* ── Right — form panel ── */}
        <div className="right">
          <div className="form-wrap">

            <div className="mobile-brand">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                Florida Business Formation Center
                <span>Client Portal</span>
              </div>
            </div>

            <div className="form-header">
              <div className="form-eyebrow">Client Access</div>
              <h2>Track your order</h2>
              <p>Enter your email and the confirmation number from your order receipt to access your filing status.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-msg">{error}</div>}

              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmationNumber">Confirmation number</label>
                <input
                  id="confirmationNumber"
                  type="text"
                  value={confirmationNumber}
                  onChange={e => setConfirmationNumber(e.target.value.toUpperCase())}
                  placeholder="FBFC-00000000 or FBNB-00000000"
                  required
                />
                <p className="input-hint">Found in your order confirmation email</p>
              </div>

              <button type="submit" className="btn-access" disabled={loading}>
                {loading ? 'Accessing…' : 'Access My Order →'}
              </button>
            </form>

            <p className="contact-note">
              Don&apos;t have your confirmation number?{' '}
              <a href="mailto:support@mybusinessformation.com">Contact us</a>
            </p>
          </div>

          <div className="form-footer">
            © {year} Florida Business Formation Center — mybusinessformation.com
          </div>
        </div>

      </div>
    </>
  )
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
