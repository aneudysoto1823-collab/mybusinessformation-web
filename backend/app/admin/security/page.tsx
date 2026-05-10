'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Config {
  totp_enabled: boolean
  email_enabled: boolean
}

export default function SecurityPage() {
  const [config, setConfig] = useState<Config>({ totp_enabled: false, email_enabled: false })
  const [loading, setLoading] = useState(true)

  // TOTP setup
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [totpMsg, setTotpMsg] = useState('')

  // Toggle messages
  const [toggleMsg, setToggleMsg] = useState('')

  useEffect(() => {
    fetch('/api/auth/2fa-config')
      .then(r => r.json())
      .then(d => setConfig(d))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(field: 'totp_enabled' | 'email_enabled', value: boolean) {
    setToggleMsg('')
    const res = await fetch('/api/auth/2fa-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      setConfig(prev => ({ ...prev, [field]: value }))
      setToggleMsg(value ? '✅ Activado.' : '⭕ Desactivado.')
    } else {
      setToggleMsg('Error al guardar.')
    }
    setTimeout(() => setToggleMsg(''), 3000)
  }

  async function generateTotp() {
    setTotpLoading(true)
    setTotpMsg('')
    setQrDataUrl('')
    setSecret('')
    const res = await fetch('/api/auth/2fa-setup', { method: 'POST' })
    setTotpLoading(false)
    if (res.ok) {
      const data = await res.json()
      setQrDataUrl(data.qrDataUrl)
      setSecret(data.secret)
      setTotpMsg('')
    } else {
      setTotpMsg('Error al generar el QR.')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6b7280' }}>
      Cargando…
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
        .wrap { max-width: 680px; margin: 0 auto; padding: 32px 24px; }
        .back { font-size: 13px; color: #6b7280; text-decoration: none; display: inline-block; margin-bottom: 20px; }
        .back:hover { color: #4f46e5; }
        h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 28px; }
        .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); margin-bottom: 20px; overflow: hidden; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .card-title { font-size: 15px; font-weight: 700; color: #1a1a2e; }
        .card-body { padding: 20px 24px; }
        .card-desc { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 16px; }

        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .toggle-label { font-size: 14px; font-weight: 600; color: #374151; }
        .toggle-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; inset: 0; background: #d1d5db;
          border-radius: 24px; cursor: pointer; transition: background 0.2s;
        }
        .slider:before {
          content: ''; position: absolute; width: 18px; height: 18px;
          left: 3px; bottom: 3px; background: #fff; border-radius: 50%;
          transition: transform 0.2s;
        }
        input:checked + .slider { background: #4f46e5; }
        input:checked + .slider:before { transform: translateX(20px); }

        .btn {
          padding: 9px 18px; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: opacity 0.15s;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: #4f46e5; color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #4338ca; }
        .btn-danger { background: #fee2e2; color: #b91c1c; }
        .btn-danger:hover:not(:disabled) { background: #fecaca; }

        .qr-box { text-align: center; margin: 20px 0 16px; }
        .qr-box img { width: 200px; height: 200px; border: 3px solid #e5e7eb; border-radius: 12px; }
        .secret-box {
          background: #f8fafc; border: 1.5px solid #e5e7eb; border-radius: 8px;
          padding: 12px 16px; font-family: monospace; font-size: 15px;
          font-weight: 700; letter-spacing: 3px; color: #1a1a2e; word-break: break-all;
          text-align: center; margin-bottom: 12px;
        }
        .secret-note { font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5; }
        .warn { background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; line-height: 1.5; margin-bottom: 16px; }
        .msg { font-size: 13px; font-weight: 600; color: #16a34a; margin-top: 8px; }

        .status-pill {
          display: inline-block; padding: 3px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 700;
        }
        .status-on { background: #dcfce7; color: #16a34a; }
        .status-off { background: #f3f4f6; color: #6b7280; }
      `}</style>

      <div className="wrap">
        <Link href="/admin" className="back">← Volver al panel</Link>
        <h1>Seguridad — Autenticación en 2 pasos</h1>
        <p className="subtitle">Activa uno o ambos métodos. Al hacer login se pedirá el segundo factor.</p>

        {toggleMsg && <p className="msg" style={{ marginBottom: 16 }}>{toggleMsg}</p>}

        {/* ── Email 2FA ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">✉️ Código por Email</div>
            </div>
            <span className={`status-pill ${config.email_enabled ? 'status-on' : 'status-off'}`}>
              {config.email_enabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Al hacer login, el sistema envía un código de 6 dígitos a tu email de admin.
              Debes ingresarlo para completar el acceso. El código expira en 10 minutos.
            </p>
            <div className="toggle-row">
              <div>
                <div className="toggle-label">{config.email_enabled ? 'Desactivar' : 'Activar'} Email 2FA</div>
                <div className="toggle-sub">Requiere que <strong>ADMIN_EMAIL</strong> esté configurado en Vercel.</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config.email_enabled}
                  onChange={e => toggle('email_enabled', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </div>

        {/* ── TOTP App ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">📱 App Autenticadora (TOTP)</div>
            </div>
            <span className={`status-pill ${config.totp_enabled ? 'status-on' : 'status-off'}`}>
              {config.totp_enabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Genera códigos de 6 dígitos cada 30 segundos con Google Authenticator, Authy o cualquier app TOTP.
              Sin internet, sin email — funciona siempre.
            </p>

            <div className="toggle-row" style={{ marginBottom: 20 }}>
              <div>
                <div className="toggle-label">{config.totp_enabled ? 'Desactivar' : 'Activar'} App Autenticadora</div>
                <div className="toggle-sub">Debes escanear el QR antes de activar.</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={config.totp_enabled}
                  onChange={e => toggle('totp_enabled', e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="warn">
              ⚠️ Cada vez que generes un QR nuevo, el anterior queda inválido. Escanea el nuevo QR en tu app <strong>antes</strong> de activar.
            </div>

            <button className="btn btn-primary" onClick={generateTotp} disabled={totpLoading}>
              {totpLoading ? 'Generando…' : qrDataUrl ? '🔄 Regenerar QR' : '⚙️ Configurar App Autenticadora'}
            </button>
            {totpMsg && <p className="msg" style={{ color: '#b91c1c' }}>{totpMsg}</p>}

            {qrDataUrl && (
              <div style={{ marginTop: 24 }}>
                <div className="qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code TOTP" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textAlign: 'center', marginBottom: 10 }}>
                  ¿No puedes escanear el QR? Ingresa esta clave manualmente en tu app:
                </p>
                <div className="secret-box">{secret}</div>
                <p className="secret-note">
                  Esta clave solo se muestra una vez. Guárdala en un lugar seguro como respaldo.<br />
                  La clave está encriptada en la base de datos — ni nosotros podemos verla directamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
