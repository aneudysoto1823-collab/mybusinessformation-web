'use client'
import { useEffect, useState, useRef } from 'react'

interface Expense {
  id: string; expense_date: string; category: string; expense_type: string
  description: string; amount: number; receipt_note: string | null; created_at: string
  is_recurring: boolean; recurrence: string; renewal_date: string | null
  receipt_file_url?: string | null
  auto_renew?: boolean | null
}

const NAV = [
  { href: '/admin/contabilidad', label: 'Dashboard' },
  { href: '/admin/contabilidad/clientes', label: 'Clientes' },
  { href: '/admin/contabilidad/ingresos', label: 'Ingresos' },
  { href: '/admin/contabilidad/gastos', label: 'Gastos' },
  { href: '/admin/contabilidad/reportes', label: 'Reportes' },
]
const CATEGORY_OPTS = ['marketing', 'software', 'office', 'state_fees', 'payroll', 'taxes', 'other']
const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing', software: 'Software', office: 'Oficina',
  state_fees: 'Fees del Estado', payroll: 'Nómina', taxes: 'Impuestos', other: 'Otro',
}
const TYPE_OPTS = ['fixed', 'variable']
const TYPE_LABELS: Record<string, string> = { fixed: 'Fijo', variable: 'Variable' }
const REC_LABELS: Record<string, string> = { monthly: 'Mensual', annual: 'Anual', none: '' }
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  expense_date: today(), category: 'other', expense_type: 'variable',
  description: '', amount: '', receipt_note: '',
  is_recurring: false, recurrence: 'monthly', renewal_date: '', auto_renew: true,
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f6f9; font-family: 'Plus Jakarta Sans', sans-serif; }
.page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.top-bar h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
.breadcrumb { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
.breadcrumb a { color: #2563eb; text-decoration: none; }
.nav-tabs { display: flex; gap: 4px; background: #e5e7eb; border-radius: 10px; padding: 4px; margin-bottom: 28px; overflow-x: auto; }
.nav-tab { flex: 1; white-space: nowrap; text-align: center; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; }
.nav-tab.active { background: #fff; color: #1a1a2e; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.alerts-banner { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; }
.alerts-title { font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
.alert-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #fed7aa; font-size: 13px; }
.alert-row:last-child { border-bottom: none; }
.alert-desc { font-weight: 600; color: #1a1a2e; }
.alert-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; }
.alert-tag { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.alert-expired { background: #fee2e2; color: #991b1b; }
.alert-urgent { background: #fef3c7; color: #92400e; }
.alert-ok { background: #fde8d8; color: #c2410c; }
.layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
.toolbar { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }
.toolbar select, .toolbar input[type=date] { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; outline: none; font-family: inherit; }
.toolbar select:focus, .toolbar input[type=date]:focus { border-color: #2563eb; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.btn { padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; white-space: nowrap; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-purple { background: #7c3aed; color: #fff; }
.btn-purple:hover:not(:disabled) { background: #6d28d9; }
.btn-green { background: #059669; color: #fff; }
.btn-green:hover:not(:disabled) { background: #047857; }
.btn-outline { background: transparent; color: #374151; border: 1.5px solid #e5e7eb; }
.btn-outline:hover { background: #f9fafb; }
.btn-sm { font-size: 12px; padding: 4px 10px; background: #f3f4f6; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 6px; cursor: pointer; margin-right: 4px; font-family: inherit; }
.btn-del { font-size: 12px; padding: 4px 10px; background: transparent; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 6px; cursor: pointer; font-family: inherit; }
.card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); overflow: hidden; }
.sidebar-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.06); padding: 18px; }
.sidebar-card h3 { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; }
.cat-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
.cat-row:last-child { border-bottom: none; }
.total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-top: 10px; padding-top: 10px; border-top: 2px solid #f3f4f6; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; white-space: nowrap; }
td { padding: 10px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-gray { background: #f3f4f6; color: #374151; }
.badge-purple { background: #ede9fe; color: #5b21b6; }
.badge-orange { background: #fff7ed; color: #c2410c; }
.badge-red { background: #fee2e2; color: #991b1b; }
.empty { padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; }
.loading { text-align: center; padding: 40px; color: #9ca3af; font-size: 14px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 16px; font-weight: 700; color: #1a1a2e; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px; justify-content: flex-end; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 5px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #1a1a2e; font-family: inherit; outline: none; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #2563eb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.toggle-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9fafb; border-radius: 8px; border: 1.5px solid #e5e7eb; }
.toggle-row label { font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; flex: 1; }
.toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; background: #d1d5db; border-radius: 22px; transition: .2s; cursor: pointer; }
.toggle-slider:before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider:before { transform: translateX(18px); }
.recurring-fields { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.upload-zone { border: 2px dashed #d1d5db; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: border-color .15s; background: #fafafa; }
.upload-zone:hover { border-color: #7c3aed; background: #f5f3ff; }
.upload-zone.drag { border-color: #7c3aed; background: #f5f3ff; }
.upload-zone p { font-size: 13px; color: #6b7280; margin-top: 6px; }
.upload-icon { font-size: 32px; }
.upload-zone-sm { border: 2px dashed #e5e7eb; border-radius: 8px; padding: 9px 12px; cursor: pointer; transition: border-color .15s, background .15s; background: #fafafa; display: flex; align-items: center; gap: 8px; min-height: 42px; }
.upload-zone-sm:hover, .upload-zone-sm.drag { border-color: #2563eb; background: #eff6ff; }
.upload-zone-sm.has-file { border-color: #059669; background: #f0fdf4; border-style: solid; }
.upload-zone-sm span.uz-text { font-size: 13px; color: #6b7280; }
.upload-zone-sm.has-file span.uz-text { color: #065f46; font-weight: 600; }
.receipt-clear { background: none; border: none; cursor: pointer; font-size: 16px; color: #6b7280; line-height: 1; padding: 0 2px; margin-left: auto; }
.receipt-current { font-size: 12px; color: #374151; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.receipt-current a { color: #2563eb; text-decoration: none; font-weight: 600; }
.receipt-current a:hover { text-decoration: underline; }
.ai-result { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #065f46; }
.err { color: #dc2626; font-size: 12px; }
.hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
@media (max-width: 768px) {
  .page { padding: 16px 12px; }
  .layout { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .toolbar-right { margin-left: 0; width: 100%; }
}
@media print {
  .nav-tabs, .toolbar, .alerts-banner, .sidebar-card, .btn, .btn-sm, .btn-del, .top-bar a { display: none !important; }
  .layout { grid-template-columns: 1fr; }
  .page { padding: 0; }
  body { background: #fff; }
}
`

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [editItem, setEditItem] = useState<Expense | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [renewedMsg, setRenewedMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const receiptFileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCategory) params.set('category', filterCategory)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    fetch(`/api/contabilidad/gastos?${params}`)
      .then(r => r.json())
      .then(d => { setExpenses(d.expenses ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterCategory, fromDate, toDate])

  // Procesa renovaciones automáticas al cargar la página
  useEffect(() => {
    fetch('/api/contabilidad/gastos/process-renewals', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.count > 0) {
          setRenewedMsg(`Se renovaron automáticamente ${d.count} gasto(s) recurrente(s).`)
          load()
        }
      })
      .catch(() => {})
  }, [])

  const toggleAutoRenew = async (id: string, value: boolean) => {
    await fetch(`/api/contabilidad/gastos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_renew: value }),
    })
    load()
  }

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErr(''); setReceiptFile(null); setShowModal(true) }
  const openEdit = (item: Expense) => {
    setEditItem(item)
    setForm({
      expense_date: item.expense_date, category: item.category,
      expense_type: item.expense_type, description: item.description,
      amount: String(item.amount), receipt_note: item.receipt_note ?? '',
      is_recurring: item.is_recurring, recurrence: item.recurrence || 'monthly',
      renewal_date: item.renewal_date ?? '', auto_renew: item.auto_renew ?? true,
    })
    setErr(''); setReceiptFile(null); setShowModal(true)
  }

  const handleSave = async () => {
    setErr('')
    if (!form.description.trim() || !form.amount || !form.category) {
      setErr('Categoría, descripción y monto son requeridos'); return
    }
    setSaving(true)
    const url = editItem ? `/api/contabilidad/gastos/${editItem.id}` : '/api/contabilidad/gastos'
    const method = editItem ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setSaving(false); setErr(data.error ?? 'Error al guardar'); return }

    const expenseId = editItem ? editItem.id : data.expense?.id
    if (receiptFile && expenseId) {
      const fd = new FormData()
      fd.append('file', receiptFile)
      const uploadRes = await fetch(`/api/contabilidad/gastos/${expenseId}/upload`, { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        setSaving(false)
        setErr('Gasto guardado, pero falló la subida del archivo')
        load()
        return
      }
    }

    setSaving(false)
    setReceiptFile(null)
    setShowModal(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/contabilidad/gastos/${id}`, { method: 'DELETE' })
    load()
  }

  // AI invoice analysis
  async function analyzeFile(file: File) {
    setAnalyzing(true); setAiMsg('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/contabilidad/analyze-invoice', { method: 'POST', body: fd })
    const json = await res.json()
    setAnalyzing(false)
    if (!res.ok) { setAiMsg(json.error ?? 'Error al analizar'); return }
    setForm({
      expense_date: json.date || today(),
      category: json.category || 'other',
      expense_type: json.is_recurring ? 'fixed' : 'variable',
      description: json.description || json.vendor || '',
      amount: String(json.amount || ''),
      receipt_note: json.vendor ? `Vendor: ${json.vendor}` : '',
      is_recurring: Boolean(json.is_recurring),
      recurrence: json.recurrence || 'monthly',
      renewal_date: '', auto_renew: true,
    })
    setAiMsg(`✓ Datos extraídos de "${file.name}". Revisa y confirma.`)
    setShowAiModal(false)
    setErr('')
    setEditItem(null)
    setShowModal(true)
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) analyzeFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) analyzeFile(file)
  }

  // Export Excel
  async function handleExportExcel() {
    const XLSX = await import('xlsx')
    const rows = expenses.map(e => ({
      Fecha: e.expense_date,
      Descripción: e.description,
      Categoría: CATEGORY_LABELS[e.category] ?? e.category,
      Tipo: TYPE_LABELS[e.expense_type] ?? e.expense_type,
      Recurrente: e.is_recurring ? REC_LABELS[e.recurrence] || e.recurrence : 'No',
      'Próx. Vencimiento': e.renewal_date ?? '',
      Monto: e.amount,
      Comprobante: e.receipt_note ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 36 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
    XLSX.writeFile(wb, `gastos_${today()}.xlsx`)
  }

  // Renewal alerts (within 30 days or expired up to 7 days ago)
  const renewalAlerts = expenses.filter(e => {
    if (!e.is_recurring || !e.renewal_date) return false
    const d = daysUntil(e.renewal_date)
    return d <= 30 && d >= -7
  })

  const total = expenses.reduce((s, r) => s + r.amount, 0)
  const byCategory = CATEGORY_OPTS.reduce((acc, cat) => {
    const sum = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
    if (sum > 0) acc[cat] = sum
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="top-bar">
          <h1>Contabilidad</h1>
          <a href="/admin" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>← Admin</a>
        </div>
        <div className="breadcrumb">
          <a href="/admin">Admin</a> / <a href="/admin/contabilidad">Contabilidad</a> / Gastos
        </div>

        <div className="nav-tabs">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className={`nav-tab${n.href === '/admin/contabilidad/gastos' ? ' active' : ''}`}>{n.label}</a>
          ))}
        </div>

        {/* Auto-renewal notification */}
        {renewedMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#065f46' }}>
            <span>✓ {renewedMsg}</span>
            <button onClick={() => setRenewedMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '16px' }}>×</button>
          </div>
        )}

        {/* Renewal alerts */}
        {renewalAlerts.length > 0 && (
          <div className="alerts-banner">
            <div className="alerts-title">⚠ Vencimientos próximos ({renewalAlerts.length})</div>
            {renewalAlerts.map(e => {
              const d = daysUntil(e.renewal_date!)
              const cls = d < 0 ? 'alert-expired' : d <= 7 ? 'alert-urgent' : 'alert-ok'
              const label = d < 0 ? `Venció hace ${Math.abs(d)}d` : d === 0 ? 'Vence HOY' : `Vence en ${d}d`
              return (
                <div key={e.id} className="alert-row">
                  <div>
                    <div className="alert-desc">{e.description}</div>
                    <div className="alert-meta">{REC_LABELS[e.recurrence] || e.recurrence} · {fmt(e.amount)}</div>
                  </div>
                  <span className={`alert-tag ${cls}`}>{label}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="toolbar">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORY_OPTS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Desde" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title="Hasta" />
          <div className="toolbar-right">
            <button className="btn btn-purple" onClick={() => { setAiMsg(''); setShowAiModal(true) }}>
              ✦ Analizar Factura IA
            </button>
            <button className="btn btn-green" onClick={handleExportExcel}>↓ Excel</button>
            <button className="btn btn-outline" onClick={() => window.print()}>⎙ PDF</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Registrar Gasto</button>
          </div>
        </div>

        <div className="layout">
          <div className="card">
            {loading ? <div className="loading">Cargando...</div> : expenses.length === 0 ? (
              <div className="empty">No hay gastos registrados.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Tipo</th>
                    <th>Recurrencia</th>
                    <th>Monto</th>
                    <th>Factura</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(r => {
                    const d = r.renewal_date ? daysUntil(r.renewal_date) : null
                    const renewClass = d !== null ? (d < 0 ? 'badge-red' : d <= 7 ? 'badge-orange' : 'badge-purple') : 'badge-purple'
                    return (
                      <tr key={r.id}>
                        <td>{r.expense_date}</td>
                        <td style={{ fontWeight: 600 }}>{r.description}</td>
                        <td>{CATEGORY_LABELS[r.category] ?? r.category}</td>
                        <td><span className={`badge ${r.expense_type === 'fixed' ? 'badge-blue' : 'badge-gray'}`}>{TYPE_LABELS[r.expense_type]}</span></td>
                        <td>
                          {r.is_recurring ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span className={`badge ${renewClass}`}>{REC_LABELS[r.recurrence] || r.recurrence}</span>
                              {r.renewal_date && <span style={{ fontSize: '11px', color: '#9ca3af' }}>Vence {r.renewal_date}</span>}
                              {r.auto_renew !== false
                                ? <button className="btn-sm" style={{ fontSize: '10px', color: '#059669', borderColor: '#bbf7d0', padding: '2px 7px' }} onClick={() => toggleAutoRenew(r.id, false)}>● Auto</button>
                                : <button className="btn-sm" style={{ fontSize: '10px', color: '#9ca3af', padding: '2px 7px' }} onClick={() => toggleAutoRenew(r.id, true)}>○ Pausado</button>
                              }
                            </div>
                          ) : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>{fmt(r.amount)}</td>
                        <td>
                          {r.receipt_file_url
                            ? <a href={r.receipt_file_url} target="_blank" rel="noopener noreferrer" title="Ver factura adjunta" style={{ fontSize: '18px', textDecoration: 'none' }}>📄</a>
                            : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        <td>
                          <button className="btn-sm" onClick={() => openEdit(r)}>Editar</button>
                          <button className="btn-del" onClick={() => handleDelete(r.id)}>Eliminar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Resumen por Categoría</h3>
            {Object.entries(byCategory).map(([cat, amt]) => (
              <div key={cat} className="cat-row">
                <span style={{ color: '#374151', fontSize: '13px' }}>{CATEGORY_LABELS[cat]}</span>
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '13px' }}>{fmt(amt)}</span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px' }}>Sin datos</div>}
            <div className="total-row">
              <span>Total</span>
              <span style={{ color: '#dc2626' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Upload Modal */}
      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✦ Analizar Factura con IA</h3>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body">
              <div
                className={`upload-zone${dragOver ? ' drag' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📄</div>
                <strong style={{ fontSize: '14px', color: '#374151' }}>
                  {analyzing ? 'Analizando...' : 'Arrastra tu factura aquí'}
                </strong>
                <p>o haz click para seleccionar · PDF, JPG, PNG</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleFileInput} />
              </div>
              {aiMsg && <div className="err">{aiMsg}</div>}
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Claude (Haiku) extrae automáticamente: proveedor, fecha, monto, categoría y si es recurrente.
                Siempre podrás revisar y editar antes de guardar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <div className="modal-body">
              {aiMsg && <div className="ai-result">{aiMsg}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Monto ($) *</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORY_OPTS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.expense_type} onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))}>
                    {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Suscripción Vercel, Fee de registro FL..." />
              </div>

              {/* Recurring toggle */}
              <div className="toggle-row">
                <label htmlFor="toggle-rec">¿Es un pago recurrente? (bill mensual/anual)</label>
                <label className="toggle">
                  <input id="toggle-rec" type="checkbox" checked={form.is_recurring}
                    onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
                  <span className="toggle-slider" />
                </label>
              </div>

              {form.is_recurring && (
                <div className="recurring-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Frecuencia</label>
                      <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                        <option value="monthly">Mensual</option>
                        <option value="annual">Anual</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Próxima fecha de vencimiento</label>
                      <input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} />
                      <div className="hint">Se usará para la alerta de vencimiento</div>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <label htmlFor="toggle-autorenew">Auto-renovar al vencer (replica el gasto automáticamente)</label>
                    <label className="toggle">
                      <input id="toggle-autorenew" type="checkbox" checked={form.auto_renew}
                        onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Factura / Archivo adjunto (opcional)</label>
                {editItem?.receipt_file_url && !receiptFile && (
                  <div className="receipt-current">
                    <span>📄</span>
                    <a href={editItem.receipt_file_url} target="_blank" rel="noopener noreferrer">Ver archivo adjunto</a>
                    <span style={{ color: '#9ca3af' }}>· Selecciona uno nuevo para reemplazar</span>
                  </div>
                )}
                <div
                  className={`upload-zone-sm${receiptFile ? ' has-file' : ''}`}
                  onClick={() => receiptFileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag') }}
                  onDragLeave={e => e.currentTarget.classList.remove('drag')}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('drag')
                    const file = e.dataTransfer.files[0]
                    if (file) setReceiptFile(file)
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{receiptFile ? '📄' : '📎'}</span>
                  <span className="uz-text">
                    {receiptFile ? receiptFile.name : 'Haz clic o arrastra un archivo aquí'}
                  </span>
                  {receiptFile && (
                    <button className="receipt-clear" onClick={e => { e.stopPropagation(); setReceiptFile(null) }}>×</button>
                  )}
                  <input ref={receiptFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setReceiptFile(f) }} />
                </div>
                <div className="hint">PDF, JPG, PNG, WEBP · máx. 10 MB</div>
              </div>

              <div className="form-group">
                <label>Comprobante / Nota</label>
                <textarea rows={2} value={form.receipt_note} onChange={e => setForm(f => ({ ...f, receipt_note: e.target.value }))}
                  placeholder="Número de recibo, referencia..." style={{ resize: 'vertical' }} />
              </div>
              {err && <div className="err">{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn" style={{ background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb' }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editItem ? 'Actualizar' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
