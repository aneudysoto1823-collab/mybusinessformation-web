'use client'

import { useState } from 'react'

export default function SendPosterForm({ brand, lang }: { brand: 'opabiz' | 'fbfc'; lang: 'en' | 'es' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const send = async () => {
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/labor-law-poster/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), brand, lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setStatus('sent')
      setEmail('')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') send() }}
        placeholder="email@ejemplo.com"
        style={{ flex: '1 1 200px', minWidth: 180, padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'inherit', color: '#1e293b' }}
      />
      <button
        className="btn btn-primary btn-sm"
        onClick={send}
        disabled={status === 'sending' || !email.trim()}
      >
        {status === 'sending' ? 'Enviando...' : status === 'sent' ? 'Enviado ✓' : 'Enviar'}
      </button>
      {status === 'error' && (
        <span style={{ fontSize: '.75rem', color: '#dc2626', width: '100%' }}>Error: {errorMsg}</span>
      )}
    </div>
  )
}
