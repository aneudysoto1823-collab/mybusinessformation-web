'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Orden = {
  id: string
  tipo_servicio: string
  estado: string
  es_urgente: boolean
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

function clienteDe(o: Orden) {
  if (!o.usuarios) return null
  return Array.isArray(o.usuarios) ? o.usuarios[0] ?? null : o.usuarios
}

export default function OpabizOrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [orden, setOrden] = useState<Orden | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

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
      setError('No se pudo cargar la orden.')
    }
    setLoading(false)
  }, [id, router])

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
      setError(d.error ?? 'No se pudo aceptar la orden.')
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
      setError(d.error ?? 'No se pudo completar la orden.')
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
      setError(d.error ?? 'No se pudo subir el archivo.')
    }
  }

  const cliente = orden ? clienteDe(orden) : null

  return (
    <>
      <style>{`
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
        .op-btn{width:100%;padding:13px;border-radius:8px;border:none;font-weight:700;font-size:.9rem;cursor:pointer;min-height:44px;margin-bottom:10px}
        .op-btn-accept{background:#2563EB;color:#fff}
        .op-btn-complete{background:#059669;color:#fff}
        .op-btn:disabled{opacity:.6;cursor:not-allowed}
        .op-error{color:#ef4444;font-size:.82rem;margin-bottom:10px}
        .op-doc-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:.82rem}
        .op-doc-item a{color:#2563EB;text-decoration:none}
        .op-upload-label{display:block;width:100%;text-align:center;padding:13px;border-radius:8px;border:1.5px dashed #CBD5E1;color:#374151;font-size:.85rem;font-weight:600;cursor:pointer;min-height:44px}
        .op-empty{color:#94A3B8;font-size:.82rem;padding:8px 0}
      `}</style>

      <div className="op-header">
        <Link href="/opabiz/dashboard" className="op-back">← Mis órdenes</Link>
      </div>

      <div className="op-wrap">
        {loading ? (
          <p className="op-empty">Cargando…</p>
        ) : !orden ? (
          <p className="op-empty">Orden no encontrada.</p>
        ) : (
          <>
            <div className="op-card">
              <div className="op-servicio">{orden.tipo_servicio}</div>
              {orden.es_urgente && <div className="op-urgente">⚡ URGENTE</div>}
              <div className="op-row"><span className="op-row-label">Estado</span><span className="op-row-value">{orden.estado}</span></div>
              {cliente && (
                <>
                  <div className="op-row"><span className="op-row-label">Cliente</span><span className="op-row-value">{cliente.nombre}</span></div>
                  <div className="op-row"><span className="op-row-label">Teléfono</span><span className="op-row-value">{cliente.telefono}</span></div>
                  <div className="op-row"><span className="op-row-label">Email</span><span className="op-row-value">{cliente.email}</span></div>
                </>
              )}
              {orden.fecha_hora_cita && (
                <div className="op-row"><span className="op-row-label">Cita</span><span className="op-row-value">{new Date(orden.fecha_hora_cita).toLocaleString()}</span></div>
              )}
              <div className="op-row"><span className="op-row-label">Asignada</span><span className="op-row-value">{orden.fecha_asignacion ? new Date(orden.fecha_asignacion).toLocaleString() : '—'}</span></div>
            </div>

            {error && <p className="op-error">{error}</p>}

            {orden.estado === 'asignada' && (
              <button className="op-btn op-btn-accept" onClick={aceptar} disabled={acting}>
                {acting ? 'Aceptando…' : 'Aceptar orden'}
              </button>
            )}

            {orden.estado === 'en_progreso' && (
              <>
                <div className="op-card">
                  <div className="op-row-label" style={{ marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#374151' }}>Documentos</div>
                  {documentos.length === 0 ? (
                    <p className="op-empty">Sin documentos subidos todavía.</p>
                  ) : (
                    documentos.map(d => (
                      <div key={d.id} className="op-doc-item">
                        <span>{d.tipo_documento}</span>
                        <a href={d.url_archivo} target="_blank" rel="noopener noreferrer">Ver →</a>
                      </div>
                    ))
                  )}
                  <label className="op-upload-label" style={{ marginTop: 12 }}>
                    {uploading ? 'Subiendo…' : '📎 Subir documento(s)'}
                    <input type="file" multiple onChange={subirArchivos} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                </div>

                <button className="op-btn op-btn-complete" onClick={completar} disabled={acting}>
                  {acting ? 'Completando…' : 'Marcar como completada'}
                </button>
              </>
            )}

            {orden.estado === 'completada' && documentos.length > 0 && (
              <div className="op-card">
                <div className="op-row-label" style={{ marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#374151' }}>Documentos</div>
                {documentos.map(d => (
                  <div key={d.id} className="op-doc-item">
                    <span>{d.tipo_documento}</span>
                    <a href={d.url_archivo} target="_blank" rel="noopener noreferrer">Ver →</a>
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
