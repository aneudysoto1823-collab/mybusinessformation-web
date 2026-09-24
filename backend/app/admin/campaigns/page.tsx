'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import HowItWorksModal from '../HowItWorksModal'

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
  note: string | null
  created_at: string
  letter_sent_at: string | null
  // Tracking separado por campaña (auditoría 2026-09-13/14) — antes ambas
  // dependían del mismo `status`, sin forma de saber a quién le faltaba
  // cuál de las dos.
  carta_sent_at: string | null
  vip_reminder_sent_at: string | null
  // % Precisión de Enformion para este email, si vino de ahí — null para
  // emails cargados a mano o de otra fuente (se tratan siempre como
  // confiables, ver filtro de precisión más abajo). Pedido founder
  // 2026-09-14: un match débil ya no se descarta al buscarlo en Marketing
  // Saliente, se guarda igual — este filtro decide acá, en Campaigns &
  // Letters, a quién de verdad emailear vs a quién imprimirle la carta.
  identity_score: number | null
  // ZeroBounce (auditoría 2026-09-13/14, punto 2): true/false solo cuando
  // hubo una prueba real de bandeja (MX+SMTP) — null cuando no se validó
  // todavía (ZeroBounce estaba dormido cuando se buscó el email, o el email
  // se cargó a mano). null se trata como "ok" — mismo criterio permisivo que
  // identity_score sin valor.
  email_deliverable: boolean | null
}

// Registro de templates disponibles (pedido founder 2026-09-14): antes había
// un botón fijo por cada campaña (Carta Nuevas Empresas, Oferta VIP),
// duplicando toda la lógica de envío/preview/reenvío dos veces. Agregar un
// template NUEVO en el futuro es: construir su ruta de envío + preview (como
// ya existen para estas 2) y sumar UNA entrada acá — el selector y todos los
// botones de la UI lo levantan solos, sin tocar el resto del panel. NO es un
// editor de contenido sin código (eso sería un proyecto aparte) — el
// contenido de cada template lo sigue programando un developer.
type CampaignTemplate = {
  id: string
  label: string
  sendEndpoint: string
  previewEndpoint: string
  sentAtField: 'carta_sent_at' | 'vip_reminder_sent_at'
  color: string
}

const TEMPLATES: CampaignTemplate[] = [
  {
    id: 'carta_nuevas_empresas',
    label: 'Carta Nuevas Empresas',
    sendEndpoint: '/api/campaigns/send',
    previewEndpoint: '/api/campaigns/preview-email',
    sentAtField: 'carta_sent_at',
    color: '#2563EB',
  },
  {
    id: 'oferta_vip',
    label: 'Oferta VIP',
    sendEndpoint: '/api/campaigns/send-vip-reminder',
    previewEndpoint: '/api/campaigns/preview-vip-reminder',
    sentAtField: 'vip_reminder_sent_at',
    color: '#059669',
  },
]

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
  const [filterType,   setFilterType]   = useState('all')
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')
  // Filtro único de contacto — reemplaza los 2 dropdowns viejos ("All Status"
  // + "Letter status") que se solapaban de forma confusa. 'new' = ni carta
  // ni email todavía (arranca acá por default — es la cola real desde donde
  // se manda, así nunca se duplica un envío: en cuanto se le manda algo por
  // cualquier canal, deja de aparecer acá). 'email_sent'/'letter_sent' = ese
  // canal ya se usó, sin importar el otro. Se sacaron las variantes
  // exclusivas (email_only/letter_only) — eran solo para auditar, no hacían
  // falta para evitar duplicados (founder 2026-09-12).
  const [filterContact, setFilterContact] = useState<'new' | 'email_sent' | 'letter_sent' | 'all'>('new')

  // Selección con checkboxes — borrado en lote y "marcar como enviada" en lote.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Template actualmente elegido para enviar/previsualizar/contar elegibles
  // — un solo selector maneja los botones por-fila y las acciones masivas,
  // en vez de un botón fijo duplicado por cada campaña.
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id)
  const selectedTemplate = TEMPLATES.find(tpl => tpl.id === selectedTemplateId) ?? TEMPLATES[0]

  // Separación con-email / sin-email dentro de la lista "New" (pedido
  // founder 2026-09-14): antes se mezclaban en la misma tabla sin forma de
  // distinguirlas antes de decidir a quién mandarle email vs a quién
  // imprimirle la carta. Solo aplica visualmente cuando filterContact==='new'.
  const [emailTab, setEmailTab] = useState<'with_email' | 'without_email'>('with_email')
  // Filtro de % Precisión propio de Campaigns & Letters (pedido founder
  // 2026-09-14) — INDEPENDIENTE del que se usa en Marketing Saliente al
  // buscar con Enformion. 0 = sin filtro, muestra todos los que tienen
  // email. Una empresa con email pero identity_score por debajo de esto cae
  // al tab "Sin Email" (imprimible), aunque el dato exista — decisión
  // founder: "no importa que tengan email, si el rating es bajo quiero
  // poder mandarles la carta igual". Emails sin identity_score (cargados a
  // mano, o de otra fuente distinta a Enformion) siempre pasan el filtro —
  // no hay score que juzgar, se asumen confiables.
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0)
  // "Enviar/seleccionar en paquetes" — atajo para preseleccionar las primeras
  // N empresas del tab activo, pensado para el calentamiento gradual del
  // dominio nuevo (mandar de a tandas chicas, no todo el volumen de una vez).
  const [packageSize, setPackageSize] = useState<number>(50)
  const [printing, setPrinting] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkMarking,  setBulkMarking]  = useState(false)
  const [bulkMsg,      setBulkMsg]      = useState('')

  // Sending state
  const [sendingId,   setSendingId]   = useState<string | null>(null)
  const [sendingAll,  setSendingAll]  = useState(false)
  const [sendMsg,     setSendMsg]     = useState('')

  // Notes editor
  const [noteEdit,   setNoteEdit]   = useState<{ id: string; name: string; text: string } | null>(null)
  const [savingNote, setSavingNote] = useState(false)

  const saveNote = async () => {
    if (!noteEdit) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/campaigns/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteEdit.id, note: noteEdit.text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const cleaned = noteEdit.text.trim() || null
      setCompanies(prev => prev.map(c => (c.id === noteEdit.id ? { ...c, note: cleaned } : c)))
      setNoteEdit(null)
    } catch (e) {
      alert('Error saving note: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSavingNote(false)
    }
  }

  // Idioma de la carta PDF (preview/descarga/impresión) Y del email (envío +
  // preview) — antes el toggle "Letter format" solo cambiaba la carta y el
  // envío de email quedaba fijo en inglés sin importar lo que eligieras acá
  // (pedido founder 2026-09-15: unificar, un solo control para todo).
  const [contentLang, setContentLang] = useState<'en' | 'es'>('en')

  // Add company form
  const [showHowItWorks, setShowHowItWorks] = useState(false)
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
    // Traduce el filtro único de contacto a los parámetros reales que ya
    // entiende la API (status + letter_status) — ver comentario en el
    // endpoint sobre status='contacted'.
    if (filterContact === 'new') {
      params.set('status', 'new')
      params.set('letter_status', 'not_sent')
    } else if (filterContact === 'email_sent') {
      params.set('status', 'contacted')
    } else if (filterContact === 'letter_sent') {
      params.set('letter_status', 'sent')
    }
    if (filterType   !== 'all') params.set('type',      filterType)
    if (filterFrom)              params.set('date_from', filterFrom)
    if (filterTo)                params.set('date_to',   filterTo)
    setLoading(true)
    const res = await fetch(`/api/campaigns/companies?${params}`)
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.companies)
    }
    setSelectedIds(new Set())
    setLoading(false)
  }, [filterContact, filterType, filterFrom, filterTo])

  // Carga inicial de datos del panel — patrón estándar de fetch en mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); fetchCompanies() }, [fetchStats, fetchCompanies])

  // "Apto para email" = tiene email Y (sin identity_score, o identity_score
  // >= el filtro de precisión propio de este panel) Y ZeroBounce no lo marcó
  // explícitamente como no entregable. Todo lo que no cumple esto cae al tab
  // "Sin Email" para imprimir, aunque tenga un email guardado — mismo
  // criterio pedido founder 2026-09-14 para identity_score, extendido acá a
  // email_deliverable (auditoría 2026-09-13/14, punto 2). email_deliverable
  // === false es el único valor que excluye — null (sin validar todavía) se
  // trata como ok, igual que identity_score sin valor.
  const emailEligible = (c: Company) =>
    !!c.email && c.email_deliverable !== false && (c.identity_score === null || c.identity_score >= minRatingFilter)

  // Lista realmente mostrada en la tabla — igual a `companies` salvo dentro
  // de "New", donde además se filtra por el tab con/sin email activo. Todo
  // lo que selecciona/cuenta/renderiza usa esto, no `companies` directo.
  const visibleCompanies = filterContact === 'new'
    ? companies.filter(c => (emailTab === 'with_email' ? emailEligible(c) : !emailEligible(c)))
    : companies

  // ─── Selección (checkboxes) ─────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(prev => (prev.size === visibleCompanies.length ? new Set() : new Set(visibleCompanies.map(c => c.id))))
  }

  // Preselecciona las primeras N (orden en que ya vienen — más nuevas
  // primero) del tab "con email" activo, para armar un paquete de envío sin
  // tener que tildar una por una.
  function selectPackage() {
    if (packageSize < 1) return
    const pool = visibleCompanies.filter(emailEligible)
    setSelectedIds(new Set(pool.slice(0, packageSize).map(c => c.id)))
  }

  async function bulkMarkSent() {
    if (bulkMarking || selectedIds.size === 0) return
    if (!confirm(`¿Marcar ${selectedIds.size} empresa(s) como carta ya enviada? Van a salir de esta lista.`)) return
    setBulkMarking(true); setBulkMsg('')
    try {
      const res = await fetch('/api/campaigns/companies/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setBulkMsg(`✓ ${data.marked} marcada(s) como enviada(s)`)
      setSelectedIds(new Set())
      fetchCompanies()
    } catch (e) {
      setBulkMsg('✗ ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBulkMarking(false)
    }
  }

  async function bulkDelete() {
    if (bulkDeleting || selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} empresa(s) para siempre? Esta acción no se puede deshacer.`)) return
    setBulkDeleting(true); setBulkMsg('')
    try {
      const res = await fetch('/api/campaigns/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setBulkMsg(`✓ ${data.deleted} eliminada(s)`)
      setSelectedIds(new Set())
      fetchCompanies(); fetchStats()
    } catch (e) {
      setBulkMsg('✗ ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBulkDeleting(false)
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function generateLetter(company: Company, preview = false) {
    const payUrl = `mybusinessformation.com/?id=${company.document_id}`
    let res: Response
    try {
      res = await fetch('/api/campaigns/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId:       company.document_id,
          companyName:      company.company_name,
          ownerName:        company.owner_name || '',
          address:          company.address    || '',
          city:             company.city       || '',
          zip:              company.zip        || '',
          registrationDate: company.registration_date || '',
          companyType:      company.company_type,
          payUrl,
          lang:             contentLang,
        }),
      })
    } catch {
      setSendMsg('✗ Error generating letter. Check your connection.')
      return
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      setSendMsg(`✗ Letter error: ${err.error || res.status}`)
      return
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    if (preview) {
      window.open(url, '_blank')
    } else {
      const a    = document.createElement('a')
      a.href     = url
      a.download = `notice-${company.document_id}-${contentLang}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Genérica para cualquier template del registro — reemplaza a los antiguos
  // sendEmail()/sendVipReminder() (uno por campaña, duplicados). Agregar un
  // 3er template no requiere una 3ra función acá.
  // Aviso extra SOLO en español (pedido founder 2026-09-15) — inglés es el
  // default esperado, así que no hace falta confirmarlo; español es la
  // elección deliberada que vale la pena que confirmes antes de disparar el
  // envío real, para no mandar en el idioma equivocado por dejar el toggle
  // como había quedado de una corrida anterior.
  function confirmSpanishSend(extra = ''): boolean {
    if (contentLang !== 'es') return true
    return confirm(`El idioma está en ESPAÑOL — se va a enviar en español.${extra}\n\n¿Confirmás?`)
  }

  async function sendTemplate(company: Company, template: CampaignTemplate) {
    if (paused || !company.email) return
    // Guard contra reenvío accidental (auditoría 2026-09-13/14, el botón
    // individual no chequeaba nada) — no bloquea un reenvío intencional, solo
    // pide confirmar cuando ya se ve una fecha de envío previa de ESTE template.
    const alreadySentAt = company[template.sentAtField]
    if (alreadySentAt && !confirm(`${template.label} ya se le mandó a esta empresa el ${new Date(alreadySentAt).toLocaleString()}.\n\n¿Reenviar de todos modos?`)) return
    if (!confirmSpanishSend()) return
    setSendingId(company.id)
    setSendMsg('')
    const res = await fetch(template.sendEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_ids: [company.id], lang: contentLang }),
    })
    const data = await res.json()
    setSendingId(null)
    setSendMsg(data.sent === 1 ? `✓ ${template.label} sent to ${company.email}` : `✗ Error: ${data.results?.[0]?.reason || 'unknown'}`)
    fetchCompanies(); fetchStats()
  }

  // Mismo tope que MAX_BATCH en app/api/campaigns/send(-vip-reminder)/route.ts
  // — el server rechaza un solo request más grande que esto (auditoría
  // 2026-09-13/14), así que acá se manda en tandas secuenciales en vez de un
  // solo POST gigante que se cortaría a mitad de camino.
  const SEND_BATCH_SIZE = 300

  // Compartida entre "Send to All New" y "Send to Selected", para cualquier
  // template — se extrajo para no duplicar el loop de tandas secuenciales.
  async function sendTemplateBatch(targets: Company[], template: CampaignTemplate) {
    setSendingAll(true)
    setSendMsg('')
    let sent = 0, skipped = 0, errors = 0
    for (let i = 0; i < targets.length; i += SEND_BATCH_SIZE) {
      const batch = targets.slice(i, i + SEND_BATCH_SIZE)
      setSendMsg(`Sending batch ${Math.floor(i / SEND_BATCH_SIZE) + 1}/${Math.ceil(targets.length / SEND_BATCH_SIZE)}…`)
      try {
        const res = await fetch(template.sendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company_ids: batch.map(c => c.id), lang: contentLang }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
        sent += data.sent ?? 0
        skipped += data.skipped ?? 0
        errors += data.errors ?? 0
      } catch (e) {
        setSendingAll(false)
        setSendMsg(`✗ Stopped after batch error: ${e instanceof Error ? e.message : String(e)}  ·  So far — Sent: ${sent}  ·  Skipped: ${skipped}  ·  Errors: ${errors}`)
        fetchCompanies(); fetchStats()
        return
      }
    }
    setSendingAll(false)
    setSendMsg(`✓ Sent: ${sent}  ·  Skipped: ${skipped}  ·  Errors: ${errors}`)
    fetchCompanies(); fetchStats()
  }

  // "Eligible" ahora es específico del template elegido (¿ya se le mandó
  // ESTE template? no el `status` genérico compartido) — más preciso que
  // antes, que solo miraba `status==='new'` sin distinguir cuál campaña.
  async function sendToAllNew() {
    if (paused) return
    const eligible = companies.filter(c => emailEligible(c) && !c[selectedTemplate.sentAtField])
    if (eligible.length === 0) { setSendMsg(`No companies eligible for ${selectedTemplate.label}.`); return }
    if (!confirm(`Send ${selectedTemplate.label} to ${eligible.length} companies?`)) return
    if (!confirmSpanishSend(` (${eligible.length} empresas)`)) return
    await sendTemplateBatch(eligible, selectedTemplate)
  }

  // "Send to Selected" — pedido founder 2026-09-14: poder armar un paquete
  // (manual o con "Seleccionar paquete de N") y mandarle solo a esos, en vez
  // de forzosamente todos los elegibles de una.
  async function sendToSelected() {
    if (paused) return
    const targets = companies.filter(c => selectedIds.has(c.id) && c.email)
    if (targets.length === 0) { setSendMsg('Selected companies have no email.'); return }
    if (!confirm(`Send ${selectedTemplate.label} to ${targets.length} selected companies?`)) return
    if (!confirmSpanishSend(` (${targets.length} empresas)`)) return
    await sendTemplateBatch(targets, selectedTemplate)
  }

  async function printSelected() {
    if (printing || selectedIds.size === 0) return
    const ids = [...selectedIds]
    if (ids.length > 100) { setSendMsg('✗ Máximo 100 cartas por combo — seleccioná menos.'); return }
    setPrinting(true)
    setSendMsg('')
    try {
      const res = await fetch('/api/campaigns/print-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, lang: contentLang }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setSendMsg(`✗ Print error: ${err.error || res.status}`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      setSendMsg('✗ Error generating combined PDF. Check your connection.')
    } finally {
      setPrinting(false)
    }
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
        body{background:#f4f6f9;font-family:var(--font-sans)}
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
        @media(max-width:768px){
          .wrap{padding:18px 14px}
          .stats-grid{gap:10px;margin-bottom:18px}
          .stat-card{padding:14px 16px}
          .stat-val{font-size:1.5rem}
          .card-head{padding:14px 16px}
          .form-grid{padding:18px 14px}
          th,td{padding:8px 10px}
        }
        @media(max-width:480px){
          .stats-grid{grid-template-columns:1fr}
          .btn{min-height:44px;padding:10px 16px}
          .btn-sm{min-height:36px;padding:6px 12px}
          h1{font-size:1.15rem !important}
        }
      `}</style>

      <div className="wrap">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Link href="/admin" style={{ color: '#94A3B8', fontSize: '.8rem', textDecoration: 'none' }}>← Admin</Link>
              <span style={{ color: '#CBD5E1' }}>/</span>
              <span style={{ color: '#1C2E44', fontSize: '.8rem', fontWeight: 600 }}>Campaigns & Letters</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1C2E44' }}>Campaigns & Letters</h1>
            <p style={{ fontSize: '.8rem', color: '#94A3B8', marginTop: 2 }}>Physical compliance letters, outreach emails, and QR code tracking</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowHowItWorks(true)} className="btn" style={{ background: '#fff', color: '#1C2E44', border: '1.5px solid #1C2E44' }}>
              ℹ️ Cómo funciona
            </button>
            <button className={`btn ${paused ? 'btn-green' : 'btn-red'}`} onClick={() => setPaused(v => !v)}>
              {paused ? '▶ Resume System' : '⏸ Pause System'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? '✕ Cancel' : '+ Add Company'}
            </button>
          </div>
        </div>

        {showHowItWorks && (
          <HowItWorksModal title="📬 Cómo funciona Campaigns & Letters" onClose={() => setShowHowItWorks(false)}>
            <p>Panel para contactar empresas de Florida recién formadas — por carta física, por email, o ambos — y llevar registro de a quién ya se le mandó qué.</p>

            <h3>1. De dónde salen las empresas</h3>
            <ul>
              <li><strong>+ Add Company:</strong> cargás el Document ID de Sunbiz a mano y el sistema autocompleta el resto.</li>
              <li><strong>Marketing Saliente:</strong> el flujo automático (clasifica LLCs nuevas, valida dirección, busca email con Enformion) las manda para acá con el botón &quot;Enviar a Campañas y Cartas&quot; de ese otro panel — llegan ya listas, con o sin email según lo que haya encontrado.</li>
            </ul>

            <h3>2. Las dos campañas</h3>
            <ul>
              <li><strong>Carta Nuevas Empresas</strong> — tiene versión en carta física (con QR) y en email. Ofrece Labor Law Posters, EIN y Certificate of Status.</li>
              <li><strong>Oferta VIP</strong> — solo por email, sin versión en papel. Ofrece la Declaración Anual sola, y como upsell el combo Agente Registrado + Declaración Anual.</li>
              <li>El selector <strong>&quot;✉️ [Template]&quot;</strong> arriba de la tabla decide cuál de las dos vas a mandar/previsualizar en cada momento — los botones de cada fila y los de envío masivo siempre usan el que esté elegido ahí.</li>
            </ul>

            <h3>3. Organizar antes de enviar</h3>
            <ul>
              <li><strong>Contact status</strong> (New / Email sent / Letter sent / All): filtra por si ya se le mandó algo a esa empresa o no.</li>
              <li>Dentro de <strong>New</strong>, dos pestañas: <strong>Con Email</strong> y <strong>Sin Email</strong> — para separar a quién le mandás correo de a quién le imprimís la carta.</li>
              <li><strong>% Precisión mínima:</strong> cuando Enformion encontró un email pero con poca confianza, esa empresa cae a &quot;Sin Email&quot; aunque el dato exista, así se le imprime la carta en vez de arriesgarse a un email malo. Subiendo o bajando este número decidís vos el corte, en cualquier momento — es independiente del filtro que se usa al buscar en Marketing Saliente.</li>
              <li><strong>Seleccionar paquete de N:</strong> tilda automáticamente las primeras N empresas de la pestaña &quot;Con Email&quot; — útil para mandar de a tandas chicas en vez de todo el volumen de una vez (importante mientras un dominio de envío nuevo está &quot;calentando&quot; su reputación).</li>
            </ul>

            <h3>4. Enviar o imprimir</h3>
            <ul>
              <li><strong>Send to All Eligible / Send to Selected:</strong> manda el template elegido a todas las que corresponden, o solo a las que tildaste — en tandas automáticas si son muchas.</li>
              <li><strong>🖨 Print Selected:</strong> combina las cartas de las empresas tildadas en un solo PDF, listo para Cmd/Ctrl+P — todavía no hay impresora conectada automáticamente, así que este es el paso manual mientras tanto. <em>Imprimir no marca nada como enviado</em> — es solo el PDF.</li>
              <li><strong>✅ Mark as Sent:</strong> paso separado, a propósito — recién acá la empresa pasa a &quot;Letter sent&quot; y sale de la lista. Evita que el sistema asuma que se mandó por correo postal solo porque se generó el PDF.</li>
            </ul>

            <h3>Protecciones automáticas</h3>
            <ul>
              <li>Si alguien se da de baja (link de unsubscribe), nunca más se le vuelve a mandar nada.</li>
              <li>Si un email rebota o alguien lo marca como spam, Resend avisa solo y esa dirección queda excluida de futuros envíos automáticamente.</li>
              <li>Todos los emails incluyen el botón nativo de &quot;Cancelar suscripción&quot; que exigen Gmail/Yahoo (RFC 8058) — no hace falta que el cliente abra el email para darse de baja.</li>
              <li>Cuando ZeroBounce está activo, valida de verdad el buzón que trajo Enformion (no solo si el nombre parece real) — si lo marca como inválido, esa empresa nunca recibe email (cae a &quot;Sin Email&quot; automáticamente) aunque tenga buen % de precisión.</li>
            </ul>

            <h3>Reglas clave</h3>
            <ul>
              <li><strong>⏸ Pause System</strong> frena cualquier envío real (no borra nada, solo bloquea el botón de enviar) — útil si algo se ve raro y querés parar antes de seguir.</li>
              <li>Reenviar algo que ya se mandó antes pide confirmación explícita — nunca duplica sin avisar.</li>
              <li>El idioma de la carta (EN/ES) se elige aparte, arriba de la tabla — afecta tanto el preview como la descarga/impresión.</li>
            </ul>
          </HowItWorksModal>
        )}

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
            <span className="card-title">Companies ({visibleCompanies.length})</span>
            <div className="filters">
              {/* Selector de template — pedido founder 2026-09-14: reemplaza los
                  botones fijos por-campaña. Maneja envío individual, masivo,
                  paquetes y preview para lo que sea que se elija acá. */}
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                title="Email/carta a enviar"
                style={{ fontWeight: 700, color: selectedTemplate.color, borderColor: selectedTemplate.color }}
              >
                {TEMPLATES.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>✉️ {tpl.label}</option>
                ))}
              </select>
              <select value={filterContact} onChange={e => setFilterContact(e.target.value as 'new' | 'email_sent' | 'letter_sent' | 'all')} title="Contact status">
                <option value="new">🆕 New (no letter, no email)</option>
                <option value="email_sent">📧 Email sent</option>
                <option value="letter_sent">📬 Letter sent</option>
                <option value="all">All</option>
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="LLC">LLC</option>
                <option value="CORP">CORP</option>
                <option value="PA">PA</option>
              </select>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} title="From date" />
              <input type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)}   title="To date" />
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterContact('new'); setFilterType('all'); setFilterFrom(''); setFilterTo('') }}>Clear</button>
            </div>
          </div>

          {/* Tabs Con Email / Sin Email — solo dentro de "New" (pedido founder
              2026-09-14): antes se mezclaban sin poder distinguir a quién
              mandarle email vs a quién solo se le puede imprimir la carta. */}
          {filterContact === 'new' && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 22px 0' }}>
              <button
                onClick={() => { setEmailTab('with_email'); setSelectedIds(new Set()) }}
                className="btn btn-sm"
                style={{
                  background: emailTab === 'with_email' ? '#2563EB' : '#fff',
                  color:      emailTab === 'with_email' ? '#fff'    : '#475569',
                  border: '1.5px solid ' + (emailTab === 'with_email' ? '#2563EB' : '#E2E8F0'),
                }}
              >
                📧 Con Email ({companies.filter(emailEligible).length})
              </button>
              <button
                onClick={() => { setEmailTab('without_email'); setSelectedIds(new Set()) }}
                className="btn btn-sm"
                style={{
                  background: emailTab === 'without_email' ? '#2563EB' : '#fff',
                  color:      emailTab === 'without_email' ? '#fff'    : '#475569',
                  border: '1.5px solid ' + (emailTab === 'without_email' ? '#2563EB' : '#E2E8F0'),
                }}
              >
                📄 Sin Email ({companies.filter(c => !emailEligible(c)).length})
              </button>
              {/* Filtro de % Precisión propio de este panel (pedido founder
                  2026-09-14) — independiente del que se usa en Marketing
                  Saliente al buscar con Enformion. Una empresa con email pero
                  identity_score por debajo de esto cae a "Sin Email" para
                  poder imprimirle la carta en su lugar. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{ fontSize: '.78rem', color: '#475569' }}>% Precisión mínima:</span>
                <input
                  type="number" min={0} max={100}
                  value={minRatingFilter}
                  onChange={e => setMinRatingFilter(Number(e.target.value))}
                  title="Empresas con email pero por debajo de este % caen a Sin Email, para imprimirles la carta"
                  style={{ width: 60, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '.8rem', textAlign: 'center' }}
                />
              </div>
            </div>
          )}

          {/* Bulk actions bar */}
          <div style={{ padding: '10px 22px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Paquete + Send to All New: solo tienen sentido en New → Con Email */}
            {filterContact === 'new' && emailTab === 'with_email' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '.78rem', color: '#475569' }}>Seleccionar paquete de</span>
                  <input
                    type="number" min={1}
                    value={packageSize}
                    onChange={e => setPackageSize(Number(e.target.value))}
                    style={{ width: 64, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '.8rem', textAlign: 'center' }}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={selectPackage}>Seleccionar</button>
                </div>
                <span style={{ width: 1, background: '#E2E8F0', margin: '2px 4px', alignSelf: 'stretch' }} />
                <button className="btn btn-green btn-sm" onClick={sendToAllNew} disabled={sendingAll || paused}>
                  {sendingAll ? 'Sending...' : `📨 Send ${selectedTemplate.label} to All Eligible (${companies.filter(c => emailEligible(c) && !c[selectedTemplate.sentAtField]).length})`}
                </button>
              </>
            )}

            {selectedIds.size > 0 && (
              <>
                <span style={{ width: 1, background: '#E2E8F0', margin: '2px 4px', alignSelf: 'stretch' }} />
                <span style={{ fontSize: '.78rem', color: '#475569', fontWeight: 600 }}>{selectedIds.size} selected</span>
                {/* Enviar solo tiene sentido para el tab con email; Print funciona para cualquiera de las dos. */}
                {emailTab === 'with_email' && (
                  <button className="btn btn-sm" style={{ background: selectedTemplate.color, color: '#fff', border: 'none' }} onClick={sendToSelected} disabled={sendingAll || paused}>
                    {sendingAll ? 'Sending...' : `📨 Send ${selectedTemplate.label} to Selected`}
                  </button>
                )}
                <button className="btn btn-sm" style={{ background: '#1C2E44', color: '#fff', border: 'none' }} onClick={printSelected} disabled={printing}>
                  {printing ? 'Preparing...' : '🖨 Print Selected'}
                </button>
                <button className="btn btn-sm" style={{ background: '#059669', color: '#fff', border: 'none' }} onClick={bulkMarkSent} disabled={bulkMarking || bulkDeleting}>
                  {bulkMarking ? 'Marking...' : '✅ Mark as Sent'}
                </button>
                <button className="btn btn-red btn-sm" onClick={bulkDelete} disabled={bulkMarking || bulkDeleting}>
                  {bulkDeleting ? 'Deleting...' : '🗑 Delete'}
                </button>
              </>
            )}
            {sendMsg && <span className={sendMsg.startsWith('✓') ? 'msg-ok' : 'msg-err'} style={{ fontSize: '.78rem' }}>{sendMsg}</span>}
            {bulkMsg && <span className={bulkMsg.startsWith('✓') ? 'msg-ok' : 'msg-err'} style={{ fontSize: '.78rem' }}>{bulkMsg}</span>}

            {/* Selector de idioma — antes solo afectaba la carta PDF (preview/
                descarga/impresión); ahora también decide en qué idioma se
                manda y se previsualiza el email (pedido founder 2026-09-15,
                antes quedaba fijo en inglés sin importar esto). */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
              <span style={{ fontSize: '.72rem', color: '#64748b', fontWeight: 600 }}>Language:</span>
              <div style={{ display: 'flex', border: '1.5px solid #E2E8F0', borderRadius: 7, overflow: 'hidden' }}>
                {(['en', 'es'] as const).map(lng => (
                  <button
                    key={lng}
                    onClick={() => setContentLang(lng)}
                    style={{
                      padding: '5px 13px', fontSize: '.72rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit',
                      background: contentLang === lng ? '#2563EB' : '#fff',
                      color:      contentLang === lng ? '#fff'    : '#475569',
                    }}
                  >
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>Loading companies...</div>
          ) : visibleCompanies.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: '.85rem' }}>No companies found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input
                        type="checkbox"
                        checked={visibleCompanies.length > 0 && selectedIds.size === visibleCompanies.length}
                        onChange={toggleSelectAll}
                        title="Select all"
                      />
                    </th>
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
                  {visibleCompanies.map(c => {
                    const meta = STATUS_META[c.status] ?? STATUS_META.new
                    return (
                      <tr key={c.id}>
                        <td>
                          <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td style={{ fontWeight: 600, color: '#1C2E44', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.company_name}
                          {c.owner_name && <div style={{ fontSize: '.72rem', color: '#94A3B8', fontWeight: 400, marginTop: 2 }}>{c.owner_name}</div>}
                          {c.note && <div title={c.note} style={{ fontSize: '.72rem', color: '#b45309', fontWeight: 400, marginTop: 2, maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {c.note}</div>}
                          {c.letter_sent_at && <div style={{ fontSize: '.7rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>✅ Letter sent {new Date(c.letter_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                          {/* Tracking separado por campaña (auditoría 2026-09-13/14) — antes
                              solo existía el genérico "Status" de la columna de al lado, sin
                              distinguir cuál de las dos campañas ya recibió. */}
                          {c.carta_sent_at && <div style={{ fontSize: '.7rem', color: '#2563EB', fontWeight: 600, marginTop: 2 }}>✅ Carta sent {new Date(c.carta_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                          {c.vip_reminder_sent_at && <div style={{ fontSize: '.7rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>✅ VIP sent {new Date(c.vip_reminder_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                        </td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#475569', background: '#F8FAFC', padding: '2px 7px', borderRadius: 5 }}>{c.document_id}</span></td>
                        <td style={{ color: c.email ? '#374151' : '#CBD5E1', fontSize: '.8rem' }}>
                          {c.email || '—'}
                          {/* % Precisión visible cuando viene de Enformion — así se ve
                              a simple vista por qué una empresa con email cayó en "Sin
                              Email" (pedido founder 2026-09-14). */}
                          {c.email && c.identity_score !== null && (
                            <div style={{ fontSize: '.68rem', fontWeight: 600, marginTop: 2, color: c.identity_score >= minRatingFilter ? '#059669' : '#dc2626' }}>
                              {c.identity_score}% precisión
                            </div>
                          )}
                          {/* ZeroBounce (auditoría 2026-09-13/14, punto 2) — solo se
                              muestra cuando SÍ hubo una prueba real y falló, para
                              que se vea por qué cayó a "Sin Email" aunque tenga
                              buen % de precisión de Enformion. */}
                          {c.email && c.email_deliverable === false && (
                            <div style={{ fontSize: '.68rem', fontWeight: 600, marginTop: 2, color: '#dc2626' }}>
                              ✗ inválido (ZeroBounce)
                            </div>
                          )}
                        </td>
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
                            {/* Botones de envío/preview genéricos — usan el template elegido en
                                el selector de arriba, en vez de un botón fijo por campaña. */}
                            <button
                              className="btn btn-sm"
                              onClick={() => sendTemplate(c, selectedTemplate)}
                              disabled={!!sendingId || paused || !c.email}
                              title={!c.email ? 'No email address' : paused ? 'System paused' : `Send ${selectedTemplate.label}`}
                              style={{ background: selectedTemplate.color, color: '#fff', border: 'none' }}
                            >
                              {sendingId === c.id ? '...' : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              )}
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => window.open(`${selectedTemplate.previewEndpoint}?company_id=${c.id}&lang=${contentLang}`, '_blank')}
                              title={`Preview ${selectedTemplate.label} (does not send)`}
                              style={{ color: selectedTemplate.color }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M6 6h.01"/><path d="M9 6h.01"/></svg>
                            </button>
                            <span style={{ width: 1, background: '#E2E8F0', margin: '2px 2px' }} />
                            <button className="btn btn-ghost btn-sm" onClick={() => generateLetter(c, true)} title="Preview letter">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => generateLetter(c)} title="Download letter">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                            <a href={`https://mybusinessformation.com/?id=${c.document_id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Preview landing page">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                            <button className="btn btn-ghost btn-sm" onClick={() => setNoteEdit({ id: c.id, name: c.company_name, text: c.note || '' })} title={c.note ? 'Edit note' : 'Add note'}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={c.note ? '#f59e0b' : 'none'} stroke={c.note ? '#f59e0b' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
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

      {/* Note editor modal */}
      {noteEdit && (
        <div onClick={() => !savingNote && setNoteEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontWeight: 700, color: '#1C2E44', fontSize: '.95rem', marginBottom: 4 }}>📝 Nota de seguimiento</div>
            <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: 12 }}>{noteEdit.name}</div>
            <textarea
              value={noteEdit.text}
              onChange={e => setNoteEdit({ ...noteEdit, text: e.target.value })}
              placeholder="Ej: Llamé el 18/06, interesado en EIN. Reenviar correo la próxima semana..."
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
