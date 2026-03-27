'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientPortalPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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
      setError('We couldn\'t find an order matching that email and confirmation number.')
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f4f6f9;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .portal-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .portal-logo {
          text-align: center;
          margin-bottom: 32px;
        }

        .portal-logo h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.3px;
        }

        .portal-logo p {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .portal-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          padding: 40px 40px 36px;
          width: 100%;
          max-width: 420px;
        }

        .portal-card h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 6px;
        }

        .portal-card .subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 18px;
        }

        label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
        }

        input:focus {
          border-color: #4f46e5;
        }

        .input-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .btn-access {
          width: 100%;
          padding: 11px;
          background: #4f46e5;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.15s;
        }

        .btn-access:hover {
          background: #4338ca;
        }

        .btn-access:disabled {
          background: #a5b4fc;
          cursor: not-allowed;
        }

        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .contact-link {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #6b7280;
        }

        .contact-link a {
          color: #4f46e5;
          text-decoration: none;
        }

        .contact-link a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="portal-wrapper">
        <div className="portal-logo">
          <h1>MyBusinessFormation</h1>
          <p>Client Portal</p>
        </div>

        <div className="portal-card">
          <h2>Track Your Order</h2>
          <p className="subtitle">
            Enter your email and the confirmation number from your order receipt.
          </p>

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
                placeholder="FBFC-00000000"
                required
              />
              <p className="input-hint">Found in your order confirmation email</p>
            </div>

            <button type="submit" className="btn-access" disabled={loading}>
              {loading ? 'Accessing...' : 'Access My Order'}
            </button>
          </form>

          <p className="contact-link">
            Don&apos;t have your confirmation number?{' '}
            <a href="mailto:support@mybusinessformation.com">Contact us</a>
          </p>
        </div>
      </div>
    </>
  )
}
