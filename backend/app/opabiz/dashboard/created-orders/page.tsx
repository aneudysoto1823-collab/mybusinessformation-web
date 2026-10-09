'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, useConnectMe, CONNECT_BASE_CSS, useConnectLang, locale, parseUtc, type Lang } from '../../_components/ConnectShell'

type OrdenCreada = {
  id: string
  createdAt: string
  updatedAt: string
  isDraft: boolean
  paymentStatus: string
  status: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string
  entityType: string | null
}

function fbfc(id: string) {
  return `FBFC-${id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
}

const T = {
  es: {
    esperando: 'Esperando al cliente', pagada: 'Pagada', inicioPago: 'El cliente ya inició el pago',
    volver: 'Volver al panel', titulo: 'Mis solicitudes enviadas', cargando: 'Cargando…',
    vacio: 'Todavía no has enviado ninguna solicitud de asistencia.', sinNombre: 'Sin nombre', creada: 'Creada:',
    editar: 'Editar', reenviar: 'Reenviar link', reenviado: 'Reenviado', error: 'Algo salió mal, intenta de nuevo.',
  },
  en: {
    esperando: 'Waiting for client', pagada: 'Paid', inicioPago: 'Client started payment',
    volver: 'Back to dashboard', titulo: 'My submitted requests', cargando: 'Loading…',
    vacio: 'You have not created any assisted intakes yet.', sinNombre: 'No name', creada: 'Created:',
    editar: 'Edit', reenviar: 'Resend link', reenviado: 'Resent', error: 'Something went wrong, please try again.',
  },
}

function estadoMeta(o: OrdenCreada, lang: Lang): { label: string; color: string; bg: string } {
  const t = T[lang]
  if (o.isDraft) return { label: t.esperando, color: '#1d4ed8', bg: '#EFF6FF' }
  if (o.paymentStatus === 'paid') return { label: t.pagada, color: '#059669', bg: '#ECFDF5' }
  return { label: t.inicioPago, color: '#64748b', bg: '#F1F5F9' }
}

export default function OpabizCreatedOrdersPage() {
  const router = useRouter()
  const headerMe = useConnectMe()
  const [lang] = useConnectLang()
  const t = T[lang]
  const [ordenes, setOrdenes] = useState<OrdenCreada[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resentId, setResentId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const res = await fetch('/api/opabiz/me/created-orders')
    if (res.status === 401) { router.push('/opabiz/login'); return }
    if (res.ok) setOrdenes((await res.json()).ordenes ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { cargar() }, [cargar])

  async function editar(id: string) {
    setBusyId(id)
    setErrorId(null)
    try {
      const res = await fetch(`/api/opabiz/me/created-orders/${id}/resume`, { method: 'POST' })
      if (!res.ok) throw new Error()
      window.open('/?resume=1', '_blank', 'noopener,noreferrer')
    } catch {
      setErrorId(id)
    } finally {
      setBusyId(null)
    }
  }

  async function reenviar(id: string) {
    setBusyId(id)
    setErrorId(null)
    try {
      const res = await fetch(`/api/opabiz/me/created-orders/${id}/resend`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setResentId(id)
      setTimeout(() => setResentId(prev => (prev === id ? null : prev)), 4000)
    } catch {
      setErrorId(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <style>{CONNECT_BASE_CSS + `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .op-header{background:#1C2E44;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
        .op-brand{color:#fff;font-weight:800;font-size:1.05rem}
        .op-brand span{color:#60A5FA}
        .op-back{color:#fff;text-decoration:none;font-size:.78rem;opacity:.85}
        .op-wrap{max-width:640px;margin:0 auto;padding:16px}
        .op-title{font-size:.95rem;font-weight:700;color:#1C2E44;margin-bottom:12px}
        .op-card{background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;border:1px solid #E2E8F0}
        .op-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
        .op-empresa{font-weight:700;color:#1C2E44;font-size:.9rem}
        .op-badge{padding:3px 9px;border-radius:20px;font-size:.68rem;font-weight:700;white-space:nowrap}
        .op-cliente{color:#374151;font-size:.82rem}
        .op-fbfc{color:#94A3B8;font-size:.74rem;margin-top:4px;font-weight:600}
        .op-fecha{color:#94A3B8;font-size:.74rem;margin-top:2px}
        .op-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
        .op-btn{border-radius:8px;padding:8px 14px;font-size:.78rem;font-weight:700;cursor:pointer;min-height:38px;font-family:inherit;background:#fff}
        .op-btn:disabled{opacity:.6;cursor:not-allowed}
        .op-btn-edit{color:#2563EB;border:1.5px solid #2563EB}
        .op-btn-resend{color:#475569;border:1.5px solid #E2E8F0}
        .op-ok{color:#059669;font-size:.78rem;font-weight:700;align-self:center}
        .op-err{color:#dc2626;font-size:.75rem;margin-top:6px}
        .op-empty{text-align:center;color:#94A3B8;font-size:.85rem;padding:40px 20px}
      `}</style>

      <ConnectHeader me={headerMe} />

      <div className="op-wrap">
        <Link href="/opabiz/dashboard" className="oc-back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> {t.volver}</Link>
        <div className="op-title">{t.titulo} ({ordenes.length})</div>
        {loading ? (
          <p className="op-empty">{t.cargando}</p>
        ) : ordenes.length === 0 ? (
          <p className="op-empty">{t.vacio}</p>
        ) : (
          ordenes.map(o => {
            const meta = estadoMeta(o, lang)
            const nombre = [o.firstName, o.lastName].filter(Boolean).join(' ')
            return (
              <div key={o.id} className="op-card">
                <div className="op-card-top">
                  <span className="op-empresa">{o.companyName || t.sinNombre}</span>
                  <span className="op-badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                </div>
                {nombre && <div className="op-cliente">{nombre} · {o.email}</div>}
                <div className="op-fbfc">{fbfc(o.id)}</div>
                <div className="op-fecha">{t.creada} {parseUtc(o.createdAt)!.toLocaleString(locale(lang))}</div>
                {o.isDraft && (
                  <div className="op-actions">
                    <button className="op-btn op-btn-edit" disabled={busyId === o.id} onClick={() => editar(o.id)}>{t.editar}</button>
                    <button className="op-btn op-btn-resend" disabled={busyId === o.id} onClick={() => reenviar(o.id)}>{t.reenviar}</button>
                    {resentId === o.id && <span className="op-ok">{t.reenviado}</span>}
                  </div>
                )}
                {errorId === o.id && <div className="op-err">{t.error}</div>}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
