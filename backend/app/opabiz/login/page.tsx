'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OpabizLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo iniciar sesión.')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0f1c2e}
        .op-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:var(--font-sans)}
        .op-brand{color:#fff;font-size:1.3rem;font-weight:800;letter-spacing:.5px;margin-bottom:24px}
        .op-brand span{color:#2563EB}
        .op-card{background:#fff;border-radius:14px;padding:28px 24px;width:100%;max-width:360px;box-shadow:0 10px 40px rgba(0,0,0,.3)}
        .op-title{font-size:1.05rem;font-weight:700;color:#1C2E44;margin-bottom:18px}
        .op-field{margin-bottom:14px}
        .op-field label{display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:5px}
        .op-field input{width:100%;padding:11px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:16px;font-family:inherit;color:#1E293B;outline:none}
        .op-field input:focus{border-color:#2563EB}
        .op-btn{width:100%;padding:12px;border-radius:8px;background:#2563EB;color:#fff;font-weight:700;font-size:.9rem;border:none;cursor:pointer;margin-top:6px}
        .op-btn:disabled{opacity:.6;cursor:not-allowed}
        .op-error{color:#ef4444;font-size:.8rem;margin-top:10px;text-align:center}
      `}</style>
      <div className="op-wrap">
        <div className="op-brand">OpaBiz <span>Connect</span></div>
        <div className="op-card">
          <div className="op-title">Acceso de empleados</div>
          <form onSubmit={handleSubmit}>
            <div className="op-field">
              <label>Email</label>
              <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="op-field">
              <label>Contraseña</label>
              <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="op-btn" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
            {error && <p className="op-error">{error}</p>}
          </form>
        </div>
      </div>
    </>
  )
}
