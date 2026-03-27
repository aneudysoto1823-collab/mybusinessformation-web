'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Usuario o contraseña incorrectos.')
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

        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
        }

        .login-logo {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo h1 {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a2e;
          letter-spacing: -0.3px;
        }

        .login-logo p {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }

        .form-group {
          margin-bottom: 20px;
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

        .btn-login {
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

        .btn-login:hover {
          background: #4338ca;
        }

        .btn-login:disabled {
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
      `}</style>

      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo">
            <h1>MyBusinessFormation</h1>
            <p>Panel de Administración</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label htmlFor="user">Usuario</label>
              <input
                id="user"
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
