'use client'

import { useEffect, useState } from 'react'
import { SERVICE_FIELDS, SHARED_FIELDS, sharedKeysForServices, type RepeaterCol } from '@/lib/service-fields'

// Formulario dinámico autollenado para órdenes de servicios à la carte.
// - Lee los servicios + datos capturados de Order.addons (intake).
// - Autollena el bloque de empresa desde Turso (3.5M Sunbiz) con el número de
//   registro que puso el cliente.
// - Muestra solo las secciones de los servicios que el cliente pidió.
// - Editable por el equipo + imprimible.
// - Las ediciones se PERSISTEN: el snapshot completo del form (vals) se guarda en
//   addons.intake.worksheet vía PATCH /api/proxy/orders/[id]. Al recargar se
//   seedea desde ahí (round-trip), de modo que el equipo no pierde su trabajo.

interface Props {
  orderId: string
  addons: unknown
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  entityType: string
}

type Vals = Record<string, string>

function parseAddons(addons: unknown): { services: string[]; intake: Record<string, unknown> } {
  let obj: Record<string, unknown> = {}
  if (typeof addons === 'string') {
    try { obj = JSON.parse(addons) } catch { obj = {} }
  } else if (addons && typeof addons === 'object') {
    obj = addons as Record<string, unknown>
  }
  const services = Array.isArray(obj.services) ? (obj.services as string[]) : []
  const intake = (obj.intake && typeof obj.intake === 'object') ? (obj.intake as Record<string, unknown>) : {}
  return { services, intake }
}

const COMPANY_FIELDS: { k: string; label: string }[] = [
  { k: 'c_name', label: 'Nombre legal' },
  { k: 'c_type', label: 'Tipo de entidad' },
  { k: 'c_status', label: 'Estado (Sunbiz)' },
  { k: 'c_filing', label: 'Fecha de registro' },
  { k: 'c_principal', label: 'Dirección principal' },
  { k: 'c_city', label: 'Ciudad' },
  { k: 'c_state', label: 'Estado' },
  { k: 'c_zip', label: 'ZIP' },
  { k: 'c_mailing', label: 'Dirección postal' },
  { k: 'c_agentName', label: 'Agente registrado' },
  { k: 'c_agentAddr', label: 'Dirección del agente' },
]

export default function ServicesFilingForm({ orderId, addons, firstName, lastName, email, phone, companyName, entityType }: Props) {
  const { services, intake } = parseAddons(addons)
  const extras = (intake.extras && typeof intake.extras === 'object') ? (intake.extras as Record<string, string>) : {}
  const docNumberInitial = String(intake.flDoc || '')
  // Snapshot guardado por el equipo en una sesión anterior (si existe).
  const savedWorksheet = (intake.worksheet && typeof intake.worksheet === 'object') ? (intake.worksheet as Vals) : null

  const [docNumber, setDocNumber] = useState(docNumberInitial)
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'found' | 'notfound' | 'error'>('idle')
  const [lookupMsg, setLookupMsg] = useState('')

  // Valores del form (editable). Inicializa con lo que el cliente aportó.
  const [vals, setVals] = useState<Vals>(() => {
    const v: Vals = {
      c_name: String(intake.legalName || companyName || ''),
      c_type: (entityType || '').toUpperCase(),
      c_status: '',
      c_filing: '',
      c_principal: String(intake.street || ''),
      c_city: String(intake.city || ''),
      c_state: 'FL',
      c_zip: String(intake.zip || ''),
      c_mailing: '',
      c_agentName: '',
      c_agentAddr: '',
      k_firstName: firstName || String(intake.firstName || ''),
      k_lastName: lastName || String(intake.lastName || ''),
      k_email: email || String(intake.email || ''),
      k_phone: phone || String(intake.phone || ''),
      k_signature: String(intake.signature || ''),
    }
    // Pre-cargar extras por servicio
    for (const svcId of (Array.isArray((parseAddons(addons)).services) ? parseAddons(addons).services : [])) {
      const def = SERVICE_FIELDS[svcId]
      if (!def) continue
      for (const f of def.fields) {
        v['x_' + svcId + '_' + f.k] = String(extras[svcId + '.' + f.k] ?? '')
      }
    }
    // Pre-cargar datos compartidos (EIN, SSN/ITIN) — guardados en intake.shared
    const sharedVals = (intake.shared && typeof intake.shared === 'object') ? (intake.shared as Record<string, string>) : {}
    for (const k of sharedKeysForServices(services)) {
      v['s_' + k] = String(sharedVals[k] ?? '')
    }
    // Las ediciones guardadas por el equipo ganan sobre los valores derivados.
    return savedWorksheet ? { ...v, ...savedWorksheet } : v
  })

  const set = (k: string, val: string) => setVals(prev => ({ ...prev, [k]: val }))

  // Guardado de la hoja de trabajo
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  async function handleSave() {
    setSaving(true); setSaveMsg('')
    // Reconstruye addons preservando lo existente; mete el snapshot del form en intake.worksheet.
    const base = parseAddons(addons)
    const prevObj = (typeof addons === 'object' && addons) ? (addons as Record<string, unknown>) : {}
    const newAddons = {
      ...prevObj,
      services: base.services,
      intake: { ...base.intake, worksheet: vals },
    }
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addons: newAddons }),
      })
      setSaveMsg(res.ok ? '✓ Hoja de trabajo guardada.' : 'Error al guardar.')
    } catch {
      setSaveMsg('Error de conexión al guardar.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 4000)
    }
  }

  // Render de un campo 'repeater' (filas estructuradas). El valor se guarda como
  // JSON string en vals[id] (array de objetos {colKey: valor}).
  function renderRepeater(id: string, cols: RepeaterCol[]) {
    let rows: Record<string, string>[] = []
    try { const p = JSON.parse(vals[id] || '[]'); if (Array.isArray(p)) rows = p } catch { rows = [] }
    const update = (next: Record<string, string>[]) => set(id, JSON.stringify(next))
    const setCell = (i: number, ck: string, v: string) => {
      const n = rows.map(r => ({ ...r })); n[i] = { ...n[i], [ck]: v }; update(n)
    }
    const addRow = () => update([...rows, {}])
    const delRow = (i: number) => update(rows.filter((_, idx) => idx !== i))
    const display = rows.length ? rows : [{}]
    return (
      <div className="sff-rep">
        {display.map((row, i) => (
          <div className="sff-rep-row" key={i}>
            {cols.map(col => (
              col.type === 'select' ? (
                <select key={col.k} value={row[col.k] || ''} onChange={e => setCell(i, col.k, e.target.value)}>
                  <option value=""></option>
                  {(col.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input key={col.k} placeholder={col.es} value={row[col.k] || ''} onChange={e => setCell(i, col.k, e.target.value)} />
              )
            ))}
            <button type="button" className="sff-rep-del" onClick={() => delRow(i)}>×</button>
          </div>
        ))}
        <button type="button" className="sff-rep-add" onClick={addRow}>+ Agregar</button>
      </div>
    )
  }

  // Autollenar empresa desde Turso al montar (si hay número de registro)
  async function doLookup(doc: string) {
    const d = doc.trim()
    if (!d) { setLookup('idle'); return }
    setLookup('loading'); setLookupMsg('Buscando en Sunbiz (Turso)...')
    try {
      const res = await fetch(`/api/admin/sunbiz-lookup?document_number=${encodeURIComponent(d)}`)
      if (res.status === 404) { setLookup('notfound'); setLookupMsg('No encontrada en Sunbiz. Llena los datos manualmente.'); return }
      const data = await res.json()
      if (!res.ok || !data.company) { setLookup('error'); setLookupMsg(data.error || 'Error en la búsqueda.'); return }
      const c = data.company
      setVals(prev => ({
        ...prev,
        c_name: c.entity_name || prev.c_name,
        c_type: c.entity_type_normalized || c.entity_type || prev.c_type,
        c_status: c.status || prev.c_status,
        c_filing: c.filing_date || prev.c_filing,
        c_principal: c.principal_address || prev.c_principal,
        c_city: c.principal_city || prev.c_city,
        c_state: c.principal_state || prev.c_state,
        c_zip: c.principal_zip || prev.c_zip,
        c_mailing: c.mailing_address || prev.c_mailing,
        c_agentName: c.registered_agent_name || prev.c_agentName,
        c_agentAddr: c.registered_agent_address || prev.c_agentAddr,
      }))
      setLookup('found'); setLookupMsg('✓ Empresa encontrada y autollenada desde Sunbiz.')
    } catch {
      setLookup('error'); setLookupMsg('Error de conexión con Turso.')
    }
  }

  useEffect(() => {
    // Solo autollenar de Turso si NO hay una hoja guardada (para no pisar las
    // ediciones del equipo). El botón "Buscar en Sunbiz" sigue disponible manual.
    if (docNumberInitial && !savedWorksheet) doLookup(docNumberInitial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function printForm() {
    const win = window.open('', '_blank')
    if (!win) return
    const row = (label: string, val: string) => val ? `<tr><td class="l">${label}</td><td class="v">${(val || '').replace(/</g, '&lt;')}</td></tr>` : ''
    const companyRows = COMPANY_FIELDS.map(f => row(f.label, vals[f.k])).join('')
    const contactRows = row('Cliente', `${vals.k_firstName} ${vals.k_lastName}`) + row('Email', vals.k_email) + row('Teléfono', vals.k_phone) + row('Firma', vals.k_signature)
    const sharedRows = sharedKeysForServices(services).map(k => { const f = SHARED_FIELDS[k]; return f ? row(f.es, vals['s_' + k]) : '' }).join('')
    const svcBlocks = services.map(svcId => {
      const def = SERVICE_FIELDS[svcId]
      const title = def ? def.name_es : svcId
      const rows = def ? def.fields.map(f => {
        const v = vals['x_' + svcId + '_' + f.k]
        if (f.type === 'repeater') {
          let arr: Record<string, string>[] = []
          try { const p = JSON.parse(v || '[]'); if (Array.isArray(p)) arr = p } catch { /* noop */ }
          if (!arr.length) return ''
          const items = arr
            .map(r => (f.cols || []).map(c => r[c.k]).filter(Boolean).join(' · '))
            .filter(Boolean)
            .map(x => `<div>• ${x.replace(/</g, '&lt;')}</div>`)
            .join('')
          return items ? `<tr><td class="l">${f.es}</td><td class="v">${items}</td></tr>` : ''
        }
        return row(f.es, v)
      }).join('') : ''
      return `<h3>${title}</h3><table>${rows || '<tr><td>—</td></tr>'}</table>`
    }).join('')
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Orden de servicios — ${vals.c_name}</title>
      <style>body{font-family:Arial,sans-serif;color:#1e293b;max-width:720px;margin:24px auto;padding:0 16px}h2{color:#1C2E44;border-bottom:2px solid #1C2E44;padding-bottom:6px}h3{color:#2563EB;margin:18px 0 6px}table{width:100%;border-collapse:collapse;margin-bottom:8px}td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top}.l{color:#64748b;width:38%}.v{font-weight:600}</style>
      </head><body><h2>Hoja de trabajo — Orden de servicios</h2>
      <h3>Empresa (Sunbiz)</h3><table>${companyRows}</table>
      <h3>Contacto</h3><table>${contactRows}</table>
      ${sharedRows ? `<h3>Datos requeridos</h3><table>${sharedRows}</table>` : ''}
      ${svcBlocks}
      </body></html>`)
    win.document.close(); win.focus(); win.print()
  }

  if (services.length === 0) {
    return <div className="sff-empty">Esta orden no tiene servicios registrados en sus datos.</div>
  }

  return (
    <div className="sff">
      <style>{`
        .sff{ }
        .sff-lookup{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
        .sff-lookup input{ padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; font-family:inherit; width:220px; }
        .sff-lookup button{ padding:9px 16px; border:none; border-radius:8px; background:#4f46e5; color:#fff; font-weight:600; font-size:13px; cursor:pointer; font-family:inherit; }
        .sff-msg{ font-size:12.5px; }
        .sff-msg.found{ color:#16a34a; } .sff-msg.notfound,.sff-msg.error{ color:#dc2626; } .sff-msg.loading{ color:#6b7280; }
        .sff-block{ background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
        .sff-block h4{ font-size:13px; font-weight:700; color:#1C2E44; margin-bottom:10px; text-transform:uppercase; letter-spacing:.4px; }
        .sff-svc h4{ color:#7c3aed; }
        .sff-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .sff-field{ display:flex; flex-direction:column; gap:3px; }
        .sff-field.full{ grid-column:1/-1; }
        .sff-field label{ font-size:11.5px; font-weight:600; color:#64748b; }
        .sff-field input, .sff-field select, .sff-field textarea{ padding:8px 10px; border:1.5px solid #e5e7eb; border-radius:7px; font-size:13px; font-family:inherit; color:#1e293b; background:#fff; width:100%; }
        .sff-field textarea{ min-height:54px; resize:vertical; }
        .sff-rep{ display:flex; flex-direction:column; gap:7px; }
        .sff-rep-row{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
        .sff-rep-row input, .sff-rep-row select{ min-width:120px; }
        .sff-rep-row input, .sff-rep-row select{ flex:1; min-width:0; padding:7px 9px; border:1.5px solid #e5e7eb; border-radius:7px; font-size:12.5px; font-family:inherit; color:#1e293b; background:#fff; }
        .sff-rep-del{ flex:0 0 auto; width:26px; height:26px; border:1.5px solid #e5e7eb; background:#fff; border-radius:6px; color:#94a3b8; cursor:pointer; font-size:14px; line-height:1; }
        .sff-rep-del:hover{ background:#fee2e2; color:#dc2626; }
        .sff-rep-add{ align-self:flex-start; background:#ede9fe; color:#7c3aed; border:1.5px dashed #c4b5fd; padding:6px 12px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; }
        .sff-actions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .sff-save{ background:#16a34a; color:#fff; border:none; padding:11px 20px; border-radius:9px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
        .sff-save:disabled{ opacity:.6; cursor:default; }
        .sff-print{ background:#1C2E44; color:#fff; border:none; padding:11px 20px; border-radius:9px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
        @media(max-width:640px){ .sff-grid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="sff-lookup">
        <input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Número de registro FL" />
        <button onClick={() => doLookup(docNumber)}>Buscar en Sunbiz</button>
        {lookup !== 'idle' && <span className={`sff-msg ${lookup}`}>{lookupMsg}</span>}
      </div>

      {/* Empresa (autollenado Turso) */}
      <div className="sff-block">
        <h4>Empresa (Sunbiz / Turso)</h4>
        <div className="sff-grid">
          {COMPANY_FIELDS.map(f => (
            <div className={`sff-field${f.k === 'c_principal' || f.k === 'c_mailing' || f.k === 'c_agentAddr' ? ' full' : ''}`} key={f.k}>
              <label>{f.label}</label>
              <input value={vals[f.k] || ''} onChange={e => set(f.k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Contacto del cliente */}
      <div className="sff-block">
        <h4>Contacto del cliente</h4>
        <div className="sff-grid">
          <div className="sff-field"><label>Nombre</label><input value={vals.k_firstName || ''} onChange={e => set('k_firstName', e.target.value)} /></div>
          <div className="sff-field"><label>Apellido</label><input value={vals.k_lastName || ''} onChange={e => set('k_lastName', e.target.value)} /></div>
          <div className="sff-field"><label>Email</label><input value={vals.k_email || ''} onChange={e => set('k_email', e.target.value)} /></div>
          <div className="sff-field"><label>Teléfono</label><input value={vals.k_phone || ''} onChange={e => set('k_phone', e.target.value)} /></div>
          <div className="sff-field full"><label>Firma electrónica</label><input value={vals.k_signature || ''} onChange={e => set('k_signature', e.target.value)} /></div>
        </div>
      </div>

      {/* Datos compartidos (EIN, SSN/ITIN) — pedidos una vez al cliente */}
      {sharedKeysForServices(services).length > 0 && (
        <div className="sff-block">
          <h4>Datos requeridos (compartidos)</h4>
          <div className="sff-grid">
            {sharedKeysForServices(services).map(k => {
              const f = SHARED_FIELDS[k]
              if (!f) return null
              const id = 's_' + k
              return (
                <div className="sff-field" key={id}>
                  <label>{f.es}</label>
                  <input value={vals[id] || ''} onChange={e => set(id, e.target.value)} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Secciones por servicio pedido */}
      {services.map(svcId => {
        const def = SERVICE_FIELDS[svcId]
        const title = def ? def.name_es : svcId
        return (
          <div className="sff-block sff-svc" key={svcId}>
            <h4>{title}</h4>
            {def && def.fields.length ? (
              <div className="sff-grid">
                {def.fields.map(f => {
                  const id = 'x_' + svcId + '_' + f.k
                  const full = f.type === 'textarea' || f.type === 'repeater'
                  return (
                    <div className={`sff-field${full ? ' full' : ''}`} key={id}>
                      <label>{f.es}</label>
                      {f.type === 'repeater' ? (
                        renderRepeater(id, f.cols || [])
                      ) : f.type === 'select' ? (
                        <select value={vals[id] || ''} onChange={e => set(id, e.target.value)}>
                          <option value=""></option>
                          {(f.opts || []).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea value={vals[id] || ''} onChange={e => set(id, e.target.value)} />
                      ) : (
                        <input type={f.type} value={vals[id] || ''} onChange={e => set(id, e.target.value)} />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : <div style={{ fontSize: 13, color: '#64748b' }}>Sin campos adicionales.</div>}
          </div>
        )
      })}

      <div className="sff-actions">
        <button className="sff-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar hoja de trabajo'}
        </button>
        <button className="sff-print" onClick={printForm}>🖨️ Imprimir hoja de trabajo</button>
        {saveMsg && <span className={`sff-msg ${saveMsg.startsWith('✓') ? 'found' : 'error'}`}>{saveMsg}</span>}
      </div>
    </div>
  )
}
