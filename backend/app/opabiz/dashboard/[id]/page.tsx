'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ConnectHeader, useConnectMe, CONNECT_BASE_CSS, useConnectLang, locale, parseUtc, notaVisible } from '../../_components/ConnectShell'

type Orden = {
  id: string
  tipo_servicio: string
  estado: string
  es_urgente: boolean
  notas: string | null
  fecha_hora_cita: string | null
  fecha_creacion: string
  fecha_asignacion: string | null
  fecha_inicio: string | null
  fecha_completada: string | null
  usuarios: { nombre: string; email: string; telefono: string } | { nombre: string; email: string; telefono: string }[] | null
}

type Documento = {
  id: string
  tipo_documento: string
  url_archivo: string
  fecha_subida: string
}

const T = {
  es: {
    estado: { asignada: 'Por aceptar', en_progreso: 'En progreso', completada: 'Completada', pendiente: 'Sin asignar' } as Record<string, string>,
    errCargar: 'No se pudo cargar la orden.', errAceptar: 'No se pudo aceptar la orden.', errRechazar: 'No se pudo rechazar la orden.',
    errCompletar: 'No se pudo completar la orden.', errSubir: 'No se pudo subir el archivo.',
    volver: 'Volver al panel', cargando: 'Cargando…', noEncontrada: 'Orden no encontrada.', urgente: 'URGENTE',
    notaCliente: 'Nota del cliente', lEstado: 'Estado', lCliente: 'Cliente', lTelefono: 'Teléfono', lEmail: 'Email', lCita: 'Cita', lAsignada: 'Asignada',
    aceptando: 'Aceptando…', aceptar: 'Aceptar orden', rechazar: 'Rechazar orden', motivoLabel: '¿Por qué rechazás esta orden?',
    motivoPh: 'Ej.: no tengo disponibilidad ese día, queda fuera de mi zona…', rechazando: 'Rechazando…', confirmarRechazo: 'Confirmar rechazo',
    cancelar: 'Cancelar', gone: 'Esta orden ya no está asignada a vos. El equipo la va a reasignar.',
    documentos: 'Documentos', sinDocs: 'Sin documentos subidos todavía.', ver: 'Ver', subiendo: 'Subiendo…', subir: 'Subir documento(s)',
    completando: 'Completando…', completar: 'Marcar como completada',
  },
  en: {
    estado: { asignada: 'To accept', en_progreso: 'In progress', completada: 'Completed', pendiente: 'Unassigned' } as Record<string, string>,
    errCargar: 'Could not load the order.', errAceptar: 'Could not accept the order.', errRechazar: 'Could not decline the order.',
    errCompletar: 'Could not complete the order.', errSubir: 'Could not upload the file.',
    volver: 'Back to dashboard', cargando: 'Loading…', noEncontrada: 'Order not found.', urgente: 'URGENT',
    notaCliente: 'Client note', lEstado: 'Status', lCliente: 'Client', lTelefono: 'Phone', lEmail: 'Email', lCita: 'Appointment', lAsignada: 'Assigned',
    aceptando: 'Accepting…', aceptar: 'Accept order', rechazar: 'Decline order', motivoLabel: 'Why are you declining this order?',
    motivoPh: 'E.g.: I am not available that day, it is outside my area…', rechazando: 'Declining…', confirmarRechazo: 'Confirm decline',
    cancelar: 'Cancel', gone: 'This order is no longer assigned to you. The team will reassign it.',
    documentos: 'Documents', sinDocs: 'No documents uploaded yet.', ver: 'View', subiendo: 'Uploading…', subir: 'Upload document(s)',
    completando: 'Completing…', completar: 'Mark as completed',
  },
}

function clienteDe(o: Orden) {
  if (!o.usuarios) return null
  return Array.isArray(o.usuarios) ? o.usuarios[0] ?? null : o.usuarios
}

export default function OpabizOrderDetailPage() {
  const router = useRouter()
  const headerMe = useConnectMe()
  const [lang] = useConnectLang()
  const t = T[lang]
  const params = useParams<{ id: string }>()
  const id = params.id

  const [orden, setOrden] = useState<Orden | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [motivo, setMotivo] = useState('')

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/opabiz/me/orders/${id}`)
    if (res.status === 401) {
      router.push('/opabiz/login')
      return
    }
    if (res.ok) {
      const data = await res.json()
      setOrden(data.orden)
      setDocumentos(data.documentos ?? [])
    } else {
      setError(T[lang].errCargar)
    }
    setLoading(false)
  }, [id, router, lang])

  useEffect(() => { cargar() }, [cargar])

  async function aceptar() {
    setActing(true)
    setError('')
    const res = await fetch(`/api/opabiz/me/orders/${id}/accept`, { method: 'POST' })
    setActing(false)
    if (res.ok) {
      cargar()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? t.errAceptar)
    }
  }

  async function rechazar() {
    setActing(true)
    setError('')
    const res = await fetch(`/api/opabiz/me/orders/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    })
    setActing(false)
    if (res.ok) {
      setShowReject(false)
      setMotivo('')
      cargar()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? t.errRechazar)
    }
  }

  async function completar() {
    setActing(true)
    setError('')
    const res = await fetch(`/api/opabiz/me/orders/${id}/complete`, { method: 'POST' })
    setActing(false)
    if (res.ok) {
      cargar()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? t.errCompletar)
    }
  }

  async function subirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))
    formData.append('tipoDocumento', 'general')
    const res = await fetch(`/api/opabiz/me/orders/${id}/documents`, { method: 'POST', body: formData })
    setUploading(false)
    e.target.value = ''
    if (res.ok) {
      cargar()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? t.errSubir)
    }
  }

  const cliente = orden ? clienteDe(orden) : null

  return (
    <>
      <style>{CONNECT_BASE_CSS + `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .op-header{background:#1C2E44;padding:16px 18px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:10}
        .op-back{color:#fff;text-decoration:none;font-size:.85rem}
        .op-wrap{max-width:640px;margin:0 auto;padding:16px}
        .op-card{background:#fff;border-radius:12px;padding:18px;border:1px solid #E2E8F0;margin-bottom:16px}
        .op-servicio{font-weight:800;color:#1C2E44;font-size:1.1rem;margin-bottom:4px}
        .op-urgente{color:#dc2626;font-size:.78rem;font-weight:700;margin-bottom:8px}
        .op-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9;font-size:.85rem}
        .op-row:last-child{border-bottom:none}
        .op-row-label{color:#94A3B8}
        .op-row-value{color:#1E293B;font-weight:600;text-align:right}
        .op-btn{padding:9px 18px;border-radius:8px;border:none;font-weight:700;font-size:.82rem;cursor:pointer;min-height:40px;font-family:inherit;background:#fff}
        .op-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .op-btn-accept{background:#fff;color:#2563EB;border:1.5px solid #2563EB}
        .op-btn-complete{background:#fff;color:#047857;border:1.5px solid #059669}
        .op-btn-reject{background:#fff;color:#B91C1C;border:1.5px solid #FCA5A5}
        .op-reject-box{background:#fff;border:1px solid #FECACA;border-radius:12px;padding:16px;margin-bottom:16px}
        .op-reject-box label{display:block;font-size:.8rem;font-weight:700;color:#374151;margin-bottom:6px}
        .op-reject-box textarea{width:100%;min-height:80px;padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:16px;font-family:inherit;color:#1E293B;outline:none;resize:vertical;margin-bottom:10px}
        .op-reject-box textarea:focus{border-color:#2563EB}
        .op-reject-actions{display:flex;justify-content:flex-end;gap:10px}
        .op-reject-actions .op-btn{margin-bottom:0}
        .op-gone{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;font-size:.85rem;color:#475569;line-height:1.5;margin-bottom:16px}
        .op-btn:disabled{opacity:.6;cursor:not-allowed}
        .op-error{color:#ef4444;font-size:.82rem;margin-bottom:10px}
        .op-doc-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:.82rem}
        .op-doc-item a{color:#2563EB;text-decoration:none}
        .op-upload-label{display:block;width:100%;text-align:center;padding:13px;border-radius:8px;border:1.5px dashed #CBD5E1;color:#374151;font-size:.85rem;font-weight:600;cursor:pointer;min-height:44px}
        .op-empty{color:#94A3B8;font-size:.82rem;padding:8px 0}
        .op-nota-row{display:flex;align-items:flex-start;gap:14px;padding-top:10px}
        .op-nota-row .op-row-label{font-size:.85rem;padding-top:9px;white-space:nowrap}
        .op-nota{flex:1;border:1px solid #E2E8F0;border-radius:8px;padding:8px 12px;font-size:.85rem;color:#334155;background:#fff;white-space:pre-line;line-height:1.45}
      `}</style>

      <ConnectHeader me={headerMe} />

      <div className="op-wrap">
        <Link href="/opabiz/dashboard" className="oc-back"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> {t.volver}</Link>
        {loading ? (
          <p className="op-empty">{t.cargando}</p>
        ) : !orden ? (
          <p className="op-empty">{t.noEncontrada}</p>
        ) : (
          <>
            <div className="op-card">
              <div className="op-servicio">{orden.tipo_servicio}</div>
              {orden.es_urgente && <div className="op-urgente">{t.urgente}</div>}
              <div className="op-row"><span className="op-row-label">{t.lEstado}</span><span className="op-row-value">{t.estado[orden.estado] ?? orden.estado}</span></div>
              {cliente && (
                <>
                  <div className="op-row"><span className="op-row-label">{t.lCliente}</span><span className="op-row-value">{cliente.nombre}</span></div>
                  <div className="op-row"><span className="op-row-label">{t.lTelefono}</span><span className="op-row-value">{cliente.telefono}</span></div>
                  <div className="op-row"><span className="op-row-label">{t.lEmail}</span><span className="op-row-value">{cliente.email}</span></div>
                </>
              )}
              {orden.fecha_hora_cita && (
                <div className="op-row"><span className="op-row-label">{t.lCita}</span><span className="op-row-value">{new Date(orden.fecha_hora_cita).toLocaleString(locale(lang))}</span></div>
              )}
              <div className="op-row"><span className="op-row-label">{t.lAsignada}</span><span className="op-row-value">{orden.fecha_asignacion ? parseUtc(orden.fecha_asignacion)!.toLocaleString(locale(lang)) : '—'}</span></div>
              {notaVisible(orden.notas) && (
                <div className="op-nota-row"><span className="op-row-label">{t.notaCliente}</span><div className="op-nota">{notaVisible(orden.notas)}</div></div>
              )}
            </div>

            {error && <p className="op-error">{error}</p>}

            {orden.estado === 'asignada' && !showReject && (
              <div className="op-actions">
                <button className="op-btn op-btn-reject" onClick={() => { setShowReject(true); setError('') }} disabled={acting}>
                  {t.rechazar}
                </button>
                <button className="op-btn op-btn-accept" onClick={aceptar} disabled={acting}>
                  {acting ? t.aceptando : t.aceptar}
                </button>
              </div>
            )}

            {orden.estado === 'asignada' && showReject && (
              <div className="op-reject-box">
                <label htmlFor="op-motivo">{t.motivoLabel}</label>
                <textarea id="op-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={500}
                  placeholder={t.motivoPh} />
                <div className="op-reject-actions">
                  <button className="op-btn op-btn-reject" onClick={rechazar} disabled={acting || motivo.trim().length < 3}>
                    {acting ? t.rechazando : t.confirmarRechazo}
                  </button>
                  <button className="op-btn" style={{ background: '#fff', color: '#475569', border: '1.5px solid #E2E8F0' }}
                    onClick={() => { setShowReject(false); setMotivo('') }} disabled={acting}>
                    {t.cancelar}
                  </button>
                </div>
              </div>
            )}

            {orden.estado === 'pendiente' && (
              <div className="op-gone">{t.gone}</div>
            )}

            {orden.estado === 'en_progreso' && (
              <>
                <div className="op-card">
                  <div className="op-row-label" style={{ marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#374151' }}>{t.documentos}</div>
                  {documentos.length === 0 ? (
                    <p className="op-empty">{t.sinDocs}</p>
                  ) : (
                    documentos.map(d => (
                      <div key={d.id} className="op-doc-item">
                        <span>{d.tipo_documento}</span>
                        <a href={d.url_archivo} target="_blank" rel="noopener noreferrer">{t.ver}</a>
                      </div>
                    ))
                  )}
                  <label className="op-upload-label" style={{ marginTop: 12 }}>
                    {uploading ? t.subiendo : t.subir}
                    <input type="file" multiple onChange={subirArchivos} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="op-actions">
                  <button className="op-btn op-btn-complete" onClick={completar} disabled={acting}>
                    {acting ? t.completando : t.completar}
                  </button>
                </div>
              </>
            )}

            {orden.estado === 'completada' && documentos.length > 0 && (
              <div className="op-card">
                <div className="op-row-label" style={{ marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#374151' }}>{t.documentos}</div>
                {documentos.map(d => (
                  <div key={d.id} className="op-doc-item">
                    <span>{d.tipo_documento}</span>
                    <a href={d.url_archivo} target="_blank" rel="noopener noreferrer">{t.ver}</a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
