'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type GuideLead = {
  id: string
  name: string | null
  email: string
  guide: 'guide1' | 'guide2'
  source: 'campaign' | 'landing' | 'order'
  note: string | null
  sent_at: string
}

export default function GuiasAdminPage() {
  const [leads, setLeads] = useState<GuideLead[]>([])
  const [loading, setLoading] = useState(true)
  const [noteEdit, setNoteEdit] = useState<{ id: string; name: string; text: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/guide-leads')
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const saveNote = async () => {
    if (!noteEdit) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/admin/guide-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteEdit.id, note: noteEdit.text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const cleaned = noteEdit.text.trim() || null
      setLeads(prev => prev.map(l => (l.id === noteEdit.id ? { ...l, note: cleaned } : l)))
      setNoteEdit(null)
    } catch (e) {
      alert('Error saving note: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:var(--font-sans)}
        .wrap{max-width:1100px;margin:0 auto;padding:28px 24px}
        .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 4px rgba(28,46,68,.05);overflow:hidden}
        .card-head{padding:16px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .card-title{font-size:.95rem;font-weight:700;color:#1C2E44}
        .btn{padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-primary{background:#2563EB;color:#fff}
        .btn-primary:hover:not(:disabled){background:#1d4ed8}
        .btn-ghost{background:#F1F5F9;color:#475569;border:1px solid #E2E8F0}
        .btn-ghost:hover:not(:disabled){background:#E2E8F0}
        .btn-sm{padding:5px 11px;font-size:.72rem}
        table{width:100%;border-collapse:collapse}
        th{padding:10px 14px;font-size:.72rem;font-weight:700;color:#94A3B8;text-align:left;text-transform:uppercase;letter-spacing:.5px;background:#F8FAFC;border-bottom:1px solid #E2E8F0}
        td{padding:12px 14px;font-size:.82rem;color:#374151;border-bottom:1px solid #F1F5F9;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#FAFBFC}
        @media(max-width:768px){.wrap{padding:18px 14px}.card-head{padding:14px 16px}th,td{padding:8px 10px}}
        @media(max-width:480px){.btn{min-height:44px;padding:10px 16px}.btn-sm{min-height:36px;padding:6px 12px}h1{font-size:1.15rem !important}}
      `}</style>

      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Guías</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>Leads de la Guía Gratis</h1>
            <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>Personas que pidieron la Guía I desde /guia-gratis (redes sociales)</p>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">Leads ({leads.length})</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Cargando...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Todavía no hay leads.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600, color: '#1C2E44' }}>
                        {l.name || '—'}
                        {l.note && (
                          <div title={l.note} style={{ fontSize: '.72rem', color: '#b45309', fontWeight: 400, marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📝 {l.note}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#374151' }}>{l.email}</td>
                      <td style={{ color: '#64748b', fontSize: '.78rem' }}>
                        {new Date(l.sent_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setNoteEdit({ id: l.id, name: l.name || l.email, text: l.note || '' })}
                          title={l.note ? 'Editar nota' : 'Agregar nota'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={l.note ? '#f59e0b' : 'none'} stroke={l.note ? '#f59e0b' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {noteEdit && (
        <div onClick={() => !savingNote && setNoteEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.95rem', marginBottom: 4 }}>📝 Nota de seguimiento</div>
            <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 12 }}>{noteEdit.name}</div>
            <textarea
              value={noteEdit.text}
              onChange={e => setNoteEdit({ ...noteEdit, text: e.target.value })}
              placeholder="Ej: Llamé el 18/06, interesado en formar su LLC..."
              autoFocus
              style={{ width: '100%', minHeight: 130, padding: 12, border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: '.85rem', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setNoteEdit(null)} disabled={savingNote}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={savingNote}>{savingNote ? 'Guardando...' : 'Guardar nota'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
