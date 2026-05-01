'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Company = {
  id: string
  document_id: string
  company_name: string
  company_type: string
  owner_name: string | null
  address: string | null
  city: string | null
  state: string
  zip: string | null
  email: string | null
  registration_date: string | null
  status: 'new' | 'email_sent' | 'qr_scanned' | 'purchased'
  created_at: string
}

type Stats = {
  totalCompanies: number
  emailsToday: number
  emailsMonth: number
  totalScans: number
  totalEmailsSent: number
  scanRate: number
  conversions: number
  revenue: number
}

const STATUS_META = {
  new:        { label: 'New',        color: '#2563EB', bg: '#EFF6FF', dot: '#3b82f6' },
  email_sent: { label: 'Email Sent', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  qr_scanned: { label: 'QR Scanned', color: '#ea580c', bg: '#fff7ed', dot: '#f97316' },
  purchased:  { label: 'Purchased',  color: '#059669', bg: '#ECFDF5', dot: '#10b981' },
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [stats, setStats]             = useState<Stats | null>(null)
  const [companies, setCompanies]     = useState<Company[]>([])
  const [loading, setLoading]         = useState(true)
  const [paused, setPaused]           = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')

  // Sending state
  const [sendingId,   setSendingId]   = useState<string | null>(null)
  const [sendingAll,  setSendingAll]  = useState(false)
  const [sendMsg,     setSendMsg]     = useState('')

  // Add company form
  const [showForm,      setShowForm]      = useState(false)
  const [lookingUp,     setLookingUp]     = useState(false)
  const [formData,      setFormData]      = useState({ document_id: '', company_name: '', owner_name: '', address: '', city: '', zip: '', email: '', company_type: 'LLC', registration_date: '' })
  const [formMsg,       setFormMsg]       = useState('')
  const [formSaving,    setFormSaving]    = useState(false)

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/campaigns/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const fetchCompanies = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status',    filterStatus)
    if (filterType   !== 'all') params.set('type',      filterType)
    if (filterFrom)              params.set('date_from', filterFrom)
    if (filterTo)                params.set('date_to',   filterTo)
    setLoading(true)
    const res = await fetch(`/api/campaigns/companies?${params}`)
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.companies)
    }
    setLoading(false)
  }, [filterStatus, filterType, filterFrom, filterTo])

  useEffect(() => { fetchStats(); fetchCompanies() }, [fetchStats, fetchCompanies])

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function sendEmail(company: Company) {
    if (paused || !company.email) return
    setSendingId(company.id)
    setSendMsg('')
    const res = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_ids: [company.id], lang: 'en' }),
    })
    const data = await res.json()
    setSendingId(null)
    setSendMsg(data.sent === 1 ? `✓ Email sent to ${company.email}` : `✗ Error: ${data.results?.[0]?.reason || 'unknown'}`)
    fetchCompanies(); fetchStats()
  }

  async function sendToAllNew() {
    if (paused) return
    const newOnes = companies.filter(c => c.status === 'new' && c.email)
    if (newOnes.length === 0) { setSendMsg('No new companies with email to send to.'); return }
    if (!confirm(`Send emails to ${newOnes.length} new companies?`)) return
    setSendingAll(true)
    setSendMsg('')
    const res = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_ids: newOnes.map(c => c.id), lang: 'en' }),
    })
    const data = await res.json()
    setSendingAll(false)
    setSendMsg(`✓ Sent: ${data.sent}  ·  Skipped: ${data.skipped}  ·  Errors: ${data.errors}`)
    fetchCompanies(); fetchStats()
  }

  // ─── Sunbiz lookup for manual add ──────────────────────────────────────────

  async function lookupSunbiz() {
    if (!formData.document_id.trim()) return
    setLookingUp(true)
    setFormMsg('')
    const res = await fetch(`/api/sunbiz?document_id=${encodeURIComponent(formData.document_id.trim())}`)
    const data = await res.json()
    setLookingUp(false)
    if (!res.ok) { setFormMsg(`✗ ${data.error}`); return }
    const c = data.company
    setFormData(prev => ({
      ...prev,
      company_name:  c.company_name  || prev.company_name,
      company_type:  c.company_type  || prev.company_type,
      owner_name:    c.owner_name    || prev.owner_name,
      address:       c.address       || prev.address,
      city:          c.city          || prev.city,
      zip:           c.zip           || prev.zip,
      email:         c.email         || prev.email,
    }))
    setFormMsg(data.source === 'database' ? '✓ Found in our database' : '✓ Found in Florida state records')
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault()
    setFormSaving(true)
    setFormMsg('')
    const res = await fetch('/api/campaigns/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    setFormSaving(false)
    if (!res.ok) { setFormMsg(`✗ ${data.error}`); return }
    setFormMsg('✓ Company added successfully')
    setFormData({ document_id: '', company_name: '', owner_name: '', address: '', city: '', zip: '', email: '', company_type: 'LLC', registration_date: '' })
    fetchCompanies(); fetchStats()
    setTimeout(() => setShowForm(false), 1200)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f4f6f9;font-family:'Plus Jakarta Sans',sans-serif}
        .wrap{max-width:1280px;margin:0 auto;padding:28px 24px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
        @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
        .stat-card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px 22px;box-shadow:0 1px 4px rgba(28,46,68,.05)}
        .stat-val{font-size:2rem;font-weight:800;color:#1C2E44;line-height:1;margin-bottom:4px}
        .stat-lbl{font-size:.78rem;color:#94A3B8;font-weight:500}
        .stat-sub{font-size:.75rem;color:#64748b;margin-top:6px}
        .card{background:#fff;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 4px rgba(28,46,68,.05);overflow:hidden;margin-bottom:24px}
        .card-head{padding:16px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .card-title{font-size:.95rem;font-weight:700;color:#1C2E44}
        .filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        select,input[type=date]{padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:7px;font-size:.78rem;font-family:inherit;color:#374151;outline:none;background:#fff}
        select:focus,input:focus{border-color:#2563EB}
        .btn{padding:8px 16px;border-radius:8px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn-primary{background:#2563EB;color:#fff}
        .btn-primary:hover:not(:disabled){background:#1d4ed8}
        .btn-green{background:#059669;color:#fff}
        .btn-green:hover:not(:disabled){background:#047857}
        .btn-red{background:#ef4444;color:#fff}
        .btn-red:hover:not(:disabled){background:#dc2626}
        .btn-ghost{background:#F1F5F9;color:#475569;border:1px solid #E2E8F0}
        .btn-ghost:hover:not(:disabled){background:#E2E8F0}
        .btn-sm{padding:5px 11px;font-size:.72rem}
        table{width:100%;border-collapse:collapse}
        th{padding:10px 14px;font-size:.72rem;font-weight:700;color:#94A3B8;text-align:left;text-transform:uppercase;letter-spacing:.5px;background:#F8FAFC;border-bottom:1px solid #E2E8F0}
        td{padding:12px 14px;font-size:.82rem;color:#374151;border-bottom:1px solid #F1F5F9;vertical-align:middle}
        tr:last-child td{border-bottom:none}
        tr:hover td{background:#FAFBFC}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:.7rem;font-weight:700}
        .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:22px}
        @media(max-width:640px){.form-grid{grid-template-columns:1fr}}
        .form-field label{display:block;font-size:.78rem;font-weight:600;color:#374151;margin-bottom:5px}
        .form-field input,.form-field select{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.85rem;font-family:inherit;color:#1E293B;outline:none}
        .form-field input:focus,.form-field select:focus{border-color:#2563EB}
        .msg-ok{color:#059669;font-size:.78rem;font-weight:600}
        .msg-err{color:#ef4444;font-size:.78rem;font-weight:600}
        .pause-bar{background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:10px 18px;display:flex;align-items:center;gap:10px;font-size:.82rem;color:#92400e;font-weight:600;margin-bottom:20px}
      `}</style>

      <div className="wrap">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Campaigns</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>📣 Marketing Campaigns</h1>
            <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>Manage outreach emails and QR code campaigns</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn ${paused ? 'btn-green' : 'btn-red'}`} onClick={() => setPaused(v => !v)}>
              {paused ? '▶ Resume System' : '⏸ Pause System'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? '✕ Cancel' : '+ Add Company'}
            </button>
          </div>
        </div>

        {/* Pause banner */}
        {paused && (
          <div className="pause-bar">
            ⚠ Campaign system is paused — no emails will be sent until you resume.
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{stats?.totalCompanies ?? '—'}</div>
            <div className="stat-lbl">Total Companies</div>
            <div className="stat-sub">in database</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats?.emailsToday ?? '—'}</div>
            <div className="stat-lbl">Emails Sent Today</div>
            <div className="stat-sub">{stats?.emailsMonth ?? 0} this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{stats?.scanRate ?? '—'}%</div>
            <div className="stat-lbl">QR Scan Rate</div>
            <div className="stat-sub">{stats?.totalScans ?? 0} total scans</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">${stats?.revenue.toFixed(2) ?? '—'}</div>
            <div className="stat-lbl">Revenue</div>
            <div className="stat-sub">{stats?.conversions ?? 0} conversions</div>
          </div>
        </div>

        {/* Add company form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-head">
              <span className="card-title">Add Company Manually</span>
              {formMsg && <span className={formMsg.startsWith('✓') ? 'msg-ok' : 'msg-err'}>{formMsg}</span>}
            </div>
            <form onSubmit={saveCompany}>
              <div className="form-grid">
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Document ID (Florida)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={formData.document_id}
                      onChange={e => setFormData(p => ({ ...p, document_id: e.target.value.toUpperCase() }))}
                      placeholder="e.g. L26000075446"
                      style={{ flex: 1, letterSpacing: '.5px' }}
                    />
                    <button type="button" className="btn btn-ghost" onClick={lookupSunbiz} disabled={lookingUp || !formData.document_id.trim()}>
                      {lookingUp ? 'Searching...' : '🔍 Lookup Sunbiz'}
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label>Company Name</label>
                  <input value={formData.company_name} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} placeholder="SUNSHINE VENTURES LLC" required />
                </div>
                <div className="form-field">
                  <label>Company Type</label>
                  <select value={formData.company_type} onChange={e => setFormData(p => ({ ...p, company_type: e.target.value }))}>
                    <option value="LLC">LLC</option>
                    <option value="CORP">CORP</option>
                    <option value="PA">PA</option>
                    <option value="LTD">LTD</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Owner Name</label>
                  <input value={formData.owner_name} onChange={e => setFormData(p => ({ ...p, owner_name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="owner@company.com" />
                </div>
                <div className="form-field">
                  <label>Address</label>
                  <input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="1234 Main St" />
                </div>
                <div className="form-field">
                  <label>City</label>
                  <input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} placeholder="Miami" />
                </div>
                <div className="form-field">
                  <label>ZIP</label>
                  <input value={formData.zip} onChange={e => setFormData(p => ({ ...p, zip: e.target.value }))} placeholder="33135" />
                </div>
                <div className="form-field">
                  <label>Registration Date</label>
                  <input type="date" value={formData.registration_date} onChange={e => setFormData(p => ({ ...p, registration_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? 'Saving...' : '+ Save Company'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setFormMsg('') }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Companies table */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Companies ({companies.length})</span>
            <div className="filters">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="email_sent">Email Sent</option>
                <option value="qr_scanned">QR Scanned</option>
                <option value="purchased">Purchased</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="LLC">LLC</option>
                <option value="CORP">CORP</option>
                <option value="PA">PA</option>
              </select>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} title="From date" />
              <input type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)}   title="To date" />
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterFrom(''); setFilterTo('') }}>Clear</button>
            </div>
          </div>

          {/* Bulk actions bar */}
          <div style={{ padding: '10px 22px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-green btn-sm" onClick={sendToAllNew} disabled={sendingAll || paused}>
              {sendingAll ? 'Sending...' : `📨 Send to All New (${companies.filter(c => c.status === 'new' && c.email).length})`}
            </button>
            {sendMsg && <span className={sendMsg.startsWith('✓') ? 'msg-ok' : 'msg-err'} style={{ fontSize: '.78rem' }}>{sendMsg}</span>}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Loading companies...</div>
          ) : companies.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>No companies found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Document ID</th>
                    <th>Email</th>
                    <th>Reg. Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => {
                    const meta = STATUS_META[c.status] ?? STATUS_META.new
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: '#1C2E44', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.company_name}
                          {c.owner_name && <div style={{ fontSize: '.72rem', color: '#94A3B8', fontWeight: 400, marginTop: 2 }}>{c.owner_name}</div>}
                        </td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#475569', background: '#F8FAFC', padding: '2px 7px', borderRadius: 5 }}>{c.document_id}</span></td>
                        <td style={{ color: c.email ? '#374151' : '#CBD5E1', fontSize: '.8rem' }}>{c.email || '—'}</td>
                        <td style={{ color: '#64748b', fontSize: '.78rem' }}>{c.registration_date ? new Date(c.registration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                        <td><span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 5, fontSize: '.72rem', fontWeight: 700 }}>{c.company_type}</span></td>
                        <td>
                          <span className="badge" style={{ background: meta.bg, color: meta.color }}>
                            <span className="dot" style={{ background: meta.dot }} />
                            {meta.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => sendEmail(c)}
                              disabled={!!sendingId || paused || !c.email}
                              title={!c.email ? 'No email address' : paused ? 'System paused' : 'Send campaign email'}
                            >
                              {sendingId === c.id ? '...' : '📨'}
                            </button>
                            <a href={`/new-business?id=${c.document_id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Preview landing page">🔗</a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
