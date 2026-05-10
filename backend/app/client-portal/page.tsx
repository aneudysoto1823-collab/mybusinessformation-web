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

        .root { min-height: 100vh; display: flex; }

        /* ── LEFT — form panel ── */
        .left {
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
          .left { width: 480px; flex-shrink: 0; }
        }

        .form-wrap {
          width: 100%;
          max-width: 380px;
        }

        /* Mobile brand */
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .mobile-brand .m-icon {
          width: 32px; height: 32px; border-radius: 8px; font-size: 15px;
          background: #1a2332;
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-brand .m-name { font-size: 14px; font-weight: 700; color: #0f172a; font-family: 'Fraunces', serif; }
        .mobile-brand .m-sub { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
        @media (min-width: 900px) { .mobile-brand { display: none; } }

        .form-eyebrow {
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
        }
        .form-header { margin-bottom: 28px; }
        .form-header h2 {
          font-size: 24px; font-weight: 700; color: #0f172a;
          letter-spacing: -0.4px; margin-bottom: 6px;
        }
        .form-header p { font-size: 13px; color: #64748b; line-height: 1.55; }

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
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .input-hint { font-size: 11px; color: #9ca3af; margin-top: 5px; }

        .btn-access {
          width: 100%; padding: 12px;
          background: #1a2332; color: #ffffff;
          border: none; border-radius: 9px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          margin-top: 8px; font-family: inherit;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: -0.2px;
        }
        .btn-access:hover:not(:disabled) { background: #2563eb; }
        .btn-access:active:not(:disabled) { transform: scale(0.99); }
        .btn-access:disabled { background: #94a3b8; cursor: not-allowed; }

        .error-msg {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #b91c1c; border-radius: 9px;
          padding: 11px 14px; font-size: 13px; font-weight: 600;
          margin-bottom: 16px; line-height: 1.5;
        }

        .contact-note {
          margin-top: 18px; text-align: center;
          font-size: 13px; color: #94a3b8;
        }
        .contact-note a { color: #2563eb; text-decoration: none; font-weight: 600; }
        .contact-note a:hover { text-decoration: underline; }

        .form-footer {
          position: absolute; bottom: 24px; left: 0; right: 0;
          text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;
        }

        /* ── RIGHT — brand + photo panel ── */
        .right {
          display: none;
          flex: 1;
          background: #eceae6;
          position: relative;
          overflow: hidden;
          flex-direction: column;
        }
        @media (min-width: 900px) { .right { display: flex; } }

        /* Thin separator */
        .right::before {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 1px;
          background: rgba(0,0,0,0.06);
          z-index: 2;
        }

        /* Brand + title block */
        .right-top {
          position: relative; z-index: 2;
          padding: 44px 52px 0;
        }

        .brand-mark {
          display: flex; align-items: center; gap: 10px; margin-bottom: 36px;
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: #1a2332;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; flex-shrink: 0;
        }
        .brand-name {
          font-family: 'Fraunces', serif; font-size: 14px;
          font-weight: 700; color: #1a2332; line-height: 1.1;
        }
        .brand-name span {
          display: block; font-size: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600; color: #94a3b8;
          letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2px;
        }

        .hero-eyebrow {
          display: inline-block;
          background: rgba(26,35,50,0.07);
          border: 1px solid rgba(26,35,50,0.12);
          border-radius: 20px; padding: 5px 14px;
          font-size: 10px; font-weight: 700; color: #64748b;
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px;
        }
        .hero-title {
          font-family: 'Fraunces', serif; font-size: 48px;
          font-weight: 900; color: #1a2332;
          line-height: 1.05; letter-spacing: -1.5px; margin-bottom: 12px;
        }
        .hero-title span { display: block; color: #2563eb; }
        .hero-rule {
          width: 44px; height: 2px;
          background: rgba(37,99,235,0.35);
          border-radius: 2px; margin-bottom: 12px;
        }
        .hero-sub { font-size: 13px; color: #64748b; line-height: 1.65; max-width: 300px; }

        /* Photo — natural proportions, bottom-right anchored */
        .right-photo {
          position: absolute;
          bottom: 0; right: 0;
          height: 80%;
          width: auto;
          object-fit: contain;
          object-position: bottom right;
          z-index: 1;
        }

        /* Steps + footer */
        .right-bottom {
          position: absolute; bottom: 24px; left: 52px;
          z-index: 3;
        }
        .steps-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .step-item { display: flex; align-items: center; gap: 9px; }
        .step-dot {
          width: 17px; height: 17px; border-radius: 50%;
          background: rgba(37,99,235,0.1);
          border: 1px solid rgba(37,99,235,0.22);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #2563eb; flex-shrink: 0;
        }
        .step-text { font-size: 12px; color: #64748b; }
        .right-footer { font-size: 11px; color: #94a3b8; }
      `}</style>

      <div className="root">

        {/* ── LEFT — form ── */}
        <div className="left">
          <div className="form-wrap">

            <div className="mobile-brand">
              <div className="m-icon">🏛️</div>
              <div>
                <div className="m-name">Florida Business Formation Center</div>
                <div className="m-sub">Client Portal</div>
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

        {/* ── RIGHT — brand + photo ── */}
        <div className="right">

          <div className="right-top">
            <div className="brand-mark">
              <div className="brand-icon">🏛️</div>
              <div className="brand-name">
                Florida Business Formation Center
                <span>Client Portal</span>
              </div>
            </div>

            <div className="hero-eyebrow">Your Business Journey</div>
            <div className="hero-title">
              Track Your
              <span>Business Filing</span>
            </div>
            <div className="hero-rule" />
            <p className="hero-sub">
              Real-time status updates on your Florida business formation process.
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/client-portal-bg.jpg" alt="" className="right-photo" />

          <div className="right-bottom">
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
            <div className="right-footer">
              © {year} Florida Business Formation Center — mybusinessformation.com
            </div>
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
