'use client'

// Panel del sistema de marketing saliente (doc 31).
// 3 bloques operativos: Clasificacion (Bloque 2) — Enriquecimiento (Bloque 3) — Campanas (Bloque 4).
// Bloques 2 y 3 activos; Bloque 4 pendiente.

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type ClassifyStats = {
  pending: number
  totals: { total: number; classified: number; discarded: number; score_a: number; score_b: number; score_c: number }
  last_run: {
    id: number
    block: string
    n_requested: number
    n_processed: number | null
    result_summary: string | null
    started_at: string
    finished_at: string | null
    status: string
    error_message: string | null
  } | null
  max_n: number
}

type VerticalSetting = {
  vertical: string
  label: string
  priority: number
  active: boolean
  lead_count: number
  descartadas: number
  validated: number
}

type ScoreSetting = {
  score: 'A' | 'B' | 'C'
  active: boolean
  lead_count: number
  descartadas: number
}

type PrepareStats = {
  ready: number
  target_max: number
  max_iterations: number
  last_run: ClassifyStats['last_run']
}

type PrepareResult = {
  target: number
  ready_start: number
  ready_end: number
  gained: number
  iterations_used: number
  elapsed_ms: number
  completed: boolean
  iterations: Array<{
    iteration: number
    expired: number
    synced: number
    classified: number
    score_dist: Record<string, number>
    discarded_by_settings: number
    enriched_by_score: Record<string, { enriched: number; validated: number; invalid: number; api_errors: number }>
    ready_after: number
    gained: number
  }>
  run_id: number
}

type EnrichStats = {
  pending_by_score: { A: number; B: number; C: number }
  totals: {
    enriched: number
    valid_addresses: number
    invalid_addresses: number
    residential: number
    commercial: number
    pobox: number
    virtual: number
  }
  last_run: ClassifyStats['last_run']
  max_n: number
  cost_per_lead_usd: number
}

type EnrichRunResult = {
  enriched: number
  validated_count: number
  invalid_count: number
  address_type_distribution: Record<string, number>
  api_error_count: number
  last_api_error: string | null
  elapsed_ms: number
  note?: string
}

// Bloque 3.5 — email (Enformion). Mismo shape que EnrichStats/EnrichRunResult
// (dirección), solo cambian los totales que reporta.
type EmailEnrichStats = {
  pending_by_score: { A: number; B: number; C: number }
  totals: { with_email: number; tried_not_found: number; total_searches: number }
  last_run: ClassifyStats['last_run']
  max_n: number
  cost_per_lead_usd: number
}

// Explorador general de leads (view=new/classified/validated/sent/all,
// filtros de score y fecha) — GET /api/marketing/leads.
type LeadRow = {
  document_number: string
  entity_name: string
  entity_type: string | null
  filing_date: string | null
  score: string | null
  vertical: string | null
  procesada: boolean
  address_validated: boolean | null
  descartada: boolean
  email: string | null
  phone: string | null
  identity_score: number | null
  fecha_contactada: string | null
}

type EmailEnrichRunResult = {
  enriched: number
  found_count: number
  not_found_count: number
  skipped_no_officer: number
  api_error_count: number
  last_api_error: string | null
  elapsed_ms: number
  note?: string
}

const HAIKU_COST_PER_LEAD_USD = 0.0008 // observado en smoke test 2026-07-16 (~$0.80/1000)

export default function MarketingPage() {
  const [stats, setStats]         = useState<ClassifyStats | null>(null)
  const [enrichStats, setEnrichStats] = useState<EnrichStats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [n, setN]                 = useState<number>(50)
  const [running, setRunning]     = useState(false)
  const [runResult, setRunResult] = useState<null | { processed: number; sync_inserted: number; expired?: number; discarded?: number; distribution: Record<string, number>; vertical_distribution: Record<string, number>; elapsed_ms: number }>(null)
  const [verticals, setVerticals] = useState<VerticalSetting[]>([])
  const [verticalsOpen, setVerticalsOpen] = useState(false)
  const [togglingVertical, setTogglingVertical] = useState<string | null>(null)

  // Scores activos (mismo patron que verticals)
  const [scores, setScores] = useState<ScoreSetting[]>([])
  const [togglingScore, setTogglingScore] = useState<string | null>(null)

  // Preparacion loop-until-N
  const [prepareStats, setPrepareStats] = useState<PrepareStats | null>(null)
  const [prepareTarget, setPrepareTarget] = useState<number>(60)
  const [prepareRunning, setPrepareRunning] = useState(false)
  const [prepareResult, setPrepareResult] = useState<PrepareResult | null>(null)
  const [prepareError, setPrepareError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Puente a Campaigns & Letters (envío de cartas — Bloque 4 real todavía no existe acá)
  const [sendToLettersRunning, setSendToLettersRunning] = useState(false)
  const [sendToLettersResult, setSendToLettersResult] = useState<{ attempted: number; inserted: number; duplicates: number } | null>(null)
  const [sendToLettersError, setSendToLettersError] = useState<string | null>(null)

  // Bloque 3 state
  const [enrichN, setEnrichN]       = useState<number>(50)
  const [enrichScore, setEnrichScore] = useState<'A' | 'B' | 'C'>('A')
  const [enrichRunning, setEnrichRunning] = useState(false)
  const [enrichResult, setEnrichResult]   = useState<EnrichRunResult | null>(null)
  const [enrichError, setEnrichError]     = useState<string | null>(null)

  // Bloque 3.5 state — email (Enformion)
  const [emailEnrichStats, setEmailEnrichStats] = useState<EmailEnrichStats | null>(null)
  const [emailEnrichN, setEmailEnrichN]       = useState<number>(50)
  const [emailEnrichScore, setEmailEnrichScore] = useState<'A' | 'B' | 'C'>('A')
  const [emailEnrichRunning, setEmailEnrichRunning] = useState(false)
  const [emailEnrichResult, setEmailEnrichResult]   = useState<EmailEnrichRunResult | null>(null)
  const [emailEnrichError, setEmailEnrichError]     = useState<string | null>(null)
  // Filtro de fecha opcional (filing_date) — para poder decir "buscá solo
  // entre las clasificadas de hoy" en vez de siempre las más nuevas por
  // default. Pedido founder 2026-09-12.
  const [emailEnrichFrom, setEmailEnrichFrom] = useState('')
  const [emailEnrichTo, setEmailEnrichTo]     = useState('')

  const fetchEmailEnrichStats = useCallback(async () => {
    const params = new URLSearchParams()
    if (emailEnrichFrom) params.set('date_from', emailEnrichFrom)
    if (emailEnrichTo)   params.set('date_to', emailEnrichTo)
    const res = await fetch(`/api/marketing/enrich-email?${params}`)
    if (res.ok) setEmailEnrichStats(await res.json())
  }, [emailEnrichFrom, emailEnrichTo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEmailEnrichStats() }, [fetchEmailEnrichStats])

  // Explorador de Leads — ver la lista real (no solo contadores), filtrable
  // por estado (nuevas / clasificadas / validadas / ya enviadas a Campaigns
  // & Letters), score y rango de fecha. Pedido founder 2026-09-12.
  const [leadsView, setLeadsView]     = useState<'all' | 'new' | 'classified' | 'validated' | 'sent'>('all')
  const [leadsScore, setLeadsScore]   = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [leadsFrom, setLeadsFrom]     = useState('')
  const [leadsTo, setLeadsTo]         = useState('')
  const [leadsRows, setLeadsRows]     = useState<LeadRow[]>([])
  const [leadsTotal, setLeadsTotal]   = useState(0)
  const [leadsOffset, setLeadsOffset] = useState(0)
  const [leadsLoading, setLeadsLoading] = useState(false)
  const LEADS_PAGE_SIZE = 50

  const fetchLeads = useCallback(async (offset: number) => {
    setLeadsLoading(true)
    const params = new URLSearchParams()
    if (leadsView !== 'all') params.set('view', leadsView)
    if (leadsScore !== 'all') params.set('score', leadsScore)
    if (leadsFrom) params.set('date_from', leadsFrom)
    if (leadsTo) params.set('date_to', leadsTo)
    params.set('limit', String(LEADS_PAGE_SIZE))
    params.set('offset', String(offset))
    try {
      const res = await fetch(`/api/marketing/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeadsRows(data.leads ?? [])
        setLeadsTotal(data.total ?? 0)
        setLeadsOffset(offset)
      }
    } finally {
      setLeadsLoading(false)
    }
  }, [leadsView, leadsScore, leadsFrom, leadsTo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLeads(0) }, [fetchLeads])

  const loadStats = useCallback(async () => {
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch('/api/marketing/classify'),
        fetch('/api/marketing/enrich'),
        fetch('/api/marketing/verticals'),
        fetch('/api/marketing/scores'),
        fetch('/api/marketing/prepare'),
      ])
      const [t1, t2, t3, t4, t5] = await Promise.all([r1.text(), r2.text(), r3.text(), r4.text(), r5.text()])
      let d1: unknown = null, d2: unknown = null, d3: unknown = null, d4: unknown = null, d5: unknown = null
      try { d1 = t1 ? JSON.parse(t1) : null } catch {}
      try { d2 = t2 ? JSON.parse(t2) : null } catch {}
      try { d3 = t3 ? JSON.parse(t3) : null } catch {}
      try { d4 = t4 ? JSON.parse(t4) : null } catch {}
      try { d5 = t5 ? JSON.parse(t5) : null } catch {}
      if (!r1.ok) {
        const msg = (d1 && typeof d1 === 'object' && 'error' in d1)
          ? String((d1 as { error: unknown }).error)
          : (t1.slice(0, 200) || `HTTP ${r1.status}`)
        throw new Error(`GET classify stats: ${msg}`)
      }
      setStats(d1 as ClassifyStats)
      if (r2.ok) setEnrichStats(d2 as EnrichStats)
      if (r3.ok && d3 && typeof d3 === 'object' && 'verticals' in d3) {
        setVerticals((d3 as { verticals: VerticalSetting[] }).verticals)
      }
      if (r4.ok && d4 && typeof d4 === 'object' && 'scores' in d4) {
        setScores((d4 as { scores: ScoreSetting[] }).scores)
      }
      if (r5.ok) setPrepareStats(d5 as PrepareStats)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const runPrepare = async () => {
    if (prepareRunning) return
    if (!Number.isInteger(prepareTarget) || prepareTarget < 1) { setPrepareError('Target debe ser entero >= 1'); return }
    if (!confirm(`Preparar ${prepareTarget} leads listos para carta?\n\nEl sistema hará sync + clasificar + enriquecer en loop hasta llegar (o hasta 6 iteraciones). Puede tardar 3-5 min.\n\nConfirmar?`)) return
    setPrepareRunning(true); setPrepareError(null); setPrepareResult(null)
    try {
      const res = await fetch('/api/marketing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: prepareTarget }),
      })
      const text = await res.text()
      let data: PrepareResult & { error?: string } = {} as PrepareResult & { error?: string }
      try { data = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) {
        throw new Error(data.error || text.slice(0, 200) || `HTTP ${res.status}`)
      }
      setPrepareResult(data as PrepareResult)
      await loadStats()
    } catch (e) {
      setPrepareError(e instanceof Error ? e.message : String(e))
    } finally {
      setPrepareRunning(false)
    }
  }

  const runSendToLetters = async () => {
    if (sendToLettersRunning) return
    const ready = prepareStats?.ready ?? 0
    if (ready === 0) { setSendToLettersError('No hay leads listos todavía — usá "Preparar N leads listos" primero.'); return }
    if (!confirm(`Enviar ${ready} leads listos a Campaigns & Letters?\n\nSe van a poder ver y descargar sus cartas desde ese panel. No se envía nada todavía — eso lo hacés manualmente ahí, igual que hoy.\n\nConfirmar?`)) return
    setSendToLettersRunning(true); setSendToLettersError(null); setSendToLettersResult(null)
    try {
      const res = await fetch('/api/marketing/send-to-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: ready }),
      })
      const text = await res.text()
      let data: { error?: string; attempted?: number; inserted?: number; duplicates?: number } = {}
      try { data = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) throw new Error(data.error || text.slice(0, 200) || `HTTP ${res.status}`)
      setSendToLettersResult(data as { attempted: number; inserted: number; duplicates: number })
      await loadStats()
    } catch (e) {
      setSendToLettersError(e instanceof Error ? e.message : String(e))
    } finally {
      setSendToLettersRunning(false)
    }
  }

  const toggleScore = async (score: 'A' | 'B' | 'C', active: boolean) => {
    setTogglingScore(score)
    setScores(prev => prev.map(s => s.score === score ? { ...s, active } : s))
    try {
      const res = await fetch('/api/marketing/scores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, active }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      setScores(prev => prev.map(s => s.score === score ? { ...s, active: !active } : s))
      alert('Error al cambiar el score: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setTogglingScore(null)
    }
  }

  const toggleVertical = async (vertical: string, active: boolean) => {
    setTogglingVertical(vertical)
    // Optimistic
    setVerticals(prev => prev.map(v => v.vertical === vertical ? { ...v, active } : v))
    try {
      const res = await fetch('/api/marketing/verticals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vertical, active }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      // Rollback
      setVerticals(prev => prev.map(v => v.vertical === vertical ? { ...v, active: !active } : v))
      alert('Error al cambiar el vertical: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setTogglingVertical(null)
    }
  }

  useEffect(() => { loadStats() }, [loadStats])

  const runClassify = async () => {
    if (running) return
    if (!Number.isInteger(n) || n < 1) { setError('N debe ser entero >= 1'); return }
    setRunning(true); setError(null); setRunResult(null)
    try {
      const res = await fetch('/api/marketing/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n }),
      })
      const text = await res.text()
      let data: { error?: string; processed?: number; sync_inserted?: number; expired?: number; discarded?: number; distribution?: Record<string, number>; vertical_distribution?: Record<string, number>; elapsed_ms?: number } = {}
      try { data = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) {
        throw new Error(data.error || text.slice(0, 200) || `HTTP ${res.status}`)
      }
      setRunResult(data as { processed: number; sync_inserted: number; expired?: number; discarded?: number; distribution: Record<string, number>; vertical_distribution: Record<string, number>; elapsed_ms: number })
      await loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  const runEnrich = async () => {
    if (enrichRunning) return
    if (!Number.isInteger(enrichN) || enrichN < 1) { setEnrichError('N debe ser entero >= 1'); return }
    // Confirmacion explicita del gasto (aunque este dentro del free tier de 10K/mes)
    const estCost = (enrichN * (enrichStats?.cost_per_lead_usd ?? 0.017)).toFixed(2)
    if (!confirm(`Enriquecer ${enrichN} leads score ${enrichScore}?\n\nCosto maximo estimado: $${estCost} USD (gratis dentro del free tier de 10K/mes de Google).\n\nConfirmar?`)) return
    setEnrichRunning(true); setEnrichError(null); setEnrichResult(null)
    try {
      const res = await fetch('/api/marketing/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: enrichN, score: enrichScore }),
      })
      const text = await res.text()
      let data: EnrichRunResult & { error?: string } = {} as EnrichRunResult & { error?: string }
      try { data = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) {
        throw new Error(data.error || text.slice(0, 200) || `HTTP ${res.status}`)
      }
      setEnrichResult(data as EnrichRunResult)
      await loadStats()
    } catch (e) {
      setEnrichError(e instanceof Error ? e.message : String(e))
    } finally {
      setEnrichRunning(false)
    }
  }

  const runEnrichEmail = async () => {
    if (emailEnrichRunning) return
    if (!Number.isInteger(emailEnrichN) || emailEnrichN < 1) { setEmailEnrichError('N debe ser entero >= 1'); return }
    const estCost = (emailEnrichN * (emailEnrichStats?.cost_per_lead_usd ?? 0.10)).toFixed(2)
    const dateNote = (emailEnrichFrom || emailEnrichTo) ? `\n\nFiling date: ${emailEnrichFrom || '(sin límite)'} → ${emailEnrichTo || '(sin límite)'}` : ''
    if (!confirm(`Buscar email de ${emailEnrichN} leads score ${emailEnrichScore}?${dateNote}\n\nCosto MÁXIMO estimado: $${estCost} USD (Enformion solo cobra los que sí encuentran match — placeholder hasta confirmar precio real del plan pago).\n\nConfirmar?`)) return
    setEmailEnrichRunning(true); setEmailEnrichError(null); setEmailEnrichResult(null)
    try {
      const res = await fetch('/api/marketing/enrich-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n: emailEnrichN, score: emailEnrichScore,
          date_from: emailEnrichFrom || undefined, date_to: emailEnrichTo || undefined,
        }),
      })
      const text = await res.text()
      let data: EmailEnrichRunResult & { error?: string } = {} as EmailEnrichRunResult & { error?: string }
      try { data = text ? JSON.parse(text) : {} } catch {}
      if (!res.ok) {
        throw new Error(data.error || text.slice(0, 200) || `HTTP ${res.status}`)
      }
      setEmailEnrichResult(data as EmailEnrichRunResult)
      await Promise.all([loadStats(), fetchEmailEnrichStats()])
    } catch (e) {
      setEmailEnrichError(e instanceof Error ? e.message : String(e))
    } finally {
      setEmailEnrichRunning(false)
    }
  }

  const costEstimate = (n * HAIKU_COST_PER_LEAD_USD).toFixed(4)
  const enrichCostEst = (enrichN * (enrichStats?.cost_per_lead_usd ?? 0.017)).toFixed(2)
  const maxN = stats?.max_n ?? 500
  const enrichMaxN = enrichStats?.max_n ?? 500
  const enrichPending = enrichStats?.pending_by_score[enrichScore] ?? 0
  const emailEnrichCostEst = (emailEnrichN * (emailEnrichStats?.cost_per_lead_usd ?? 0.10)).toFixed(2)
  const emailEnrichMaxN = emailEnrichStats?.max_n ?? 500
  const emailEnrichPending = emailEnrichStats?.pending_by_score[emailEnrichScore] ?? 0

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.breadcrumb}>
          <Link href="/admin" style={S.crumbLink}>← Admin</Link>
          <span style={S.crumbSep}>/</span>
          <span>Marketing saliente</span>
        </div>

        <h1 style={S.h1}>Marketing saliente</h1>
        <p style={S.subtitle}>
          Sistema del <a href="https://github.com/aneudysoto1823-collab/mybusinessformation-web/blob/main/LOGICA_DE_NEGOCIO/31_sistema_marketing_saliente.md" target="_blank" rel="noreferrer" style={S.link}>doc 31</a>.
          Toma las LLC nuevas de Florida, las clasifica gratis con Haiku, y despues las enriqueces y contactas.
          Todo es pull: vos apretas el boton, el sistema hace el trabajo.
        </p>

        {loading ? (
          <div style={S.loading}>Cargando estado...</div>
        ) : (
          <>
            {/* ── Stats cards ─────────────────────────────────────── */}
            <div style={S.statsRow}>
              <div style={S.statCard}>
                <div style={S.statLabel}>Total en Base B</div>
                <div style={S.statValue}>{stats?.totals.total?.toLocaleString() ?? 0}</div>
                <div style={S.statSub}>{stats?.totals.classified?.toLocaleString() ?? 0} ya clasificadas</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Pendientes / Descartadas</div>
                <div style={S.statValue}>
                  <span>{stats?.pending?.toLocaleString() ?? 0}</span>
                  {' / '}
                  <span style={{color:'#dc2626', fontSize: 20}}>{stats?.totals.discarded?.toLocaleString() ?? 0}</span>
                </div>
                <div style={S.statSub}>pendiente / descartadas</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Score A (mejores)</div>
                <div style={{...S.statValue, color: '#059669'}}>{stats?.totals.score_a?.toLocaleString() ?? 0}</div>
                <div style={S.statSub}>listas para enriquecer</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Score B / C</div>
                <div style={S.statValue}>
                  <span style={{color:'#d97706'}}>{stats?.totals.score_b?.toLocaleString() ?? 0}</span>
                  {' / '}
                  <span style={{color:'#6b7280'}}>{stats?.totals.score_c?.toLocaleString() ?? 0}</span>
                </div>
                <div style={S.statSub}>B normales / C bajo valor</div>
              </div>
            </div>

            {/* ── Configuracion de Scores activos ────────────────── */}
            <div style={{...S.block, background: '#fefce8', border: '1px solid #fde047'}}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>
                    🎯 Scores activos ({scores.filter(s => s.active).length}/3)
                  </div>
                  <div style={S.blockDesc}>
                    Elegí qué scores procesar en Bloque 3 (enriquecimiento) y Bloque 4 (campañas).
                    Los desactivados quedan como <b>descartada=1</b> al clasificar y no salen en las corridas siguientes.
                  </div>
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 4}}>
                {(['A', 'B', 'C'] as const).map(sc => {
                  const s = scores.find(x => x.score === sc) ?? { score: sc, active: true, lead_count: 0, descartadas: 0 }
                  const pillColor = sc === 'A' ? '#059669' : sc === 'B' ? '#d97706' : '#6b7280'
                  const activeColor = sc === 'A' ? '#86efac' : sc === 'B' ? '#fcd34d' : '#d1d5db'
                  const scoreDesc = sc === 'A'
                    ? 'Alta necesidad de múltiples servicios. LLC con dueños que probablemente necesitan EIN, ITIN, agente registrado, licencias. Ej: extranjero recién llegado formando negocio.'
                    : sc === 'B'
                      ? 'LLC con perfil normal. Probablemente ya tiene algunos servicios pero puede necesitar otros.'
                      : 'LLC con perfil que probablemente NO necesita nuestros servicios. Ej: ya representada por abogado, holding solo de propiedades, sin dueño identificable.'
                  const scoreShort = sc === 'A' ? 'Alta necesidad' : sc === 'B' ? 'Normal' : 'Bajo valor'
                  return (
                    <label key={sc} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 18px', background: '#fff',
                      border: `2px solid ${s.active ? activeColor : '#fecaca'}`,
                      borderRadius: 8, cursor: 'pointer',
                      opacity: togglingScore === sc ? 0.5 : 1,
                    }}>
                      <input
                        type="checkbox"
                        checked={s.active}
                        onChange={e => toggleScore(sc, e.target.checked)}
                        disabled={togglingScore === sc}
                        style={{width: 20, height: 20, cursor: 'pointer', marginTop: 3}}
                      />
                      <div style={{flex: 1}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                          <span style={{fontSize: 22, fontWeight: 700, color: pillColor}}>{sc}</span>
                          <span style={{fontSize: 12, color: '#6b7280', fontWeight: 600}}>{scoreShort}</span>
                        </div>
                        <div style={{fontSize: 11, color: '#4b5563', lineHeight: 1.45, marginBottom: 6}}>
                          {scoreDesc}
                        </div>
                        <div style={{fontSize: 11, color: '#6b7280', fontWeight: 500}}>
                          {s.lead_count} clasificadas{s.descartadas > 0 && <> · <span style={{color: '#dc2626'}}>{s.descartadas} descartadas</span></>}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ── Configuracion de verticales activos ────────────── */}
            <div style={{...S.block, background: '#fefce8', border: '1px solid #fde047'}}>
              <div style={{...S.blockHeader, marginBottom: verticalsOpen ? 16 : 0}}>
                <div style={{cursor: 'pointer'}} onClick={() => setVerticalsOpen(v => !v)}>
                  <div style={S.blockTitle}>
                    ⚙️ Verticales activos ({verticals.filter(v => v.active).length}/{verticals.length})
                  </div>
                  <div style={S.blockDesc}>
                    Los desactivados NO se procesarán: al clasificar quedan marcados <b>descartada=1</b> (fuera del Bloque 3 en adelante).
                    <b> Click para {verticalsOpen ? 'ocultar' : 'ver y configurar'}.</b>
                  </div>
                </div>
                <button onClick={() => setVerticalsOpen(v => !v)} style={S.btnGhost}>
                  {verticalsOpen ? 'Ocultar' : 'Configurar'}
                </button>
              </div>

              {verticalsOpen && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8}}>
                  {verticals.map(v => (
                    <label key={v.vertical} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: '#fff',
                      border: `1px solid ${v.active ? '#86efac' : '#fecaca'}`,
                      borderRadius: 6, cursor: 'pointer',
                      opacity: togglingVertical === v.vertical ? 0.5 : 1,
                    }}>
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={e => toggleVertical(v.vertical, e.target.checked)}
                        disabled={togglingVertical === v.vertical}
                        style={{width: 18, height: 18, cursor: 'pointer'}}
                      />
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 600, fontSize: 14, color: '#111827'}}>
                          <span style={{color: '#9ca3af', marginRight: 6}}>#{v.priority}</span>
                          {v.label}
                        </div>
                        <div style={{fontSize: 11, color: '#6b7280', marginTop: 2, fontFamily: 'monospace'}}>
                          {v.vertical}
                        </div>
                      </div>
                      <div style={{fontSize: 11, color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap'}}>
                        <div>{v.lead_count} clasif.</div>
                        {v.descartadas > 0 && <div style={{color: '#dc2626'}}>{v.descartadas} desc.</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── Preparacion loop-until-N (nuevo, flujo recomendado) ── */}
            <div style={{...S.block, background: '#eff6ff', border: '2px solid #2563EB'}}>
              <div style={S.blockHeader}>
                <div style={{flex: 1}}>
                  <div style={{...S.blockTitle, color: '#1d4ed8'}}>
                    🚀 Preparar N leads listos (recomendado)
                  </div>
                  <div style={S.blockDesc}>
                    Un solo botón. Escribís cuántas cartas querés mandar y el sistema hace loop de sync → clasificar → enriquecer hasta llegar (o hasta {prepareStats?.max_iterations ?? 6} iteraciones).
                    <b> Cuando ves el resultado, tenés <span style={{color: '#1d4ed8'}}>N leads listos</span> con dirección validada, dueño identificado y NO contactados todavía.</b>
                  </div>
                </div>
                <div style={{textAlign: 'center', padding: '8px 16px', background: '#dbeafe', borderRadius: 8, minWidth: 130}}>
                  <div style={{fontSize: 11, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700}}>Listos ahora</div>
                  <div style={{fontSize: 28, fontWeight: 700, color: '#1d4ed8'}}>{prepareStats?.ready ?? 0}</div>
                </div>
              </div>

              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Preparar</label>
                  <input
                    type="number"
                    min={1}
                    max={prepareStats?.target_max ?? 500}
                    value={prepareTarget}
                    onChange={e => setPrepareTarget(Number(e.target.value))}
                    disabled={prepareRunning}
                    style={S.numInput}
                  />
                  <span style={S.inputHint}>leads</span>
                </div>
                <button onClick={runPrepare} disabled={prepareRunning} style={prepareRunning ? S.btnDisabled : {...S.btnPrimary, background: '#1d4ed8'}}>
                  {prepareRunning ? 'Preparando… (puede tardar 3-5 min)' : 'Preparar ahora'}
                </button>
              </div>

              {prepareError && <div style={S.errBox}>Error: {prepareError}</div>}

              {prepareResult && (
                <div style={{...S.resultBox, background: prepareResult.completed ? '#f0fdf4' : '#fefce8', border: '1px solid ' + (prepareResult.completed ? '#bbf7d0' : '#fde047')}}>
                  <div style={S.resultTitle}>
                    {prepareResult.completed
                      ? `✅ Objetivo alcanzado: ${prepareResult.ready_end} listos`
                      : `⚠️ ${prepareResult.ready_end}/${prepareResult.target} listos (agotó ${prepareResult.iterations_used} iteraciones)`}
                  </div>
                  <div style={S.resultGrid}>
                    <div><b>{prepareResult.ready_start}</b> ya listos antes</div>
                    <div><b>{prepareResult.gained}</b> nuevos agregados</div>
                    <div><b>{prepareResult.iterations_used}</b> iteraciones</div>
                    <div><b>{(prepareResult.elapsed_ms / 1000).toFixed(1)}s</b> total</div>
                  </div>
                  {!prepareResult.completed && (
                    <div style={{fontSize: 12, color: '#92400e', marginTop: 8}}>
                      Podés apretar de nuevo para seguir preparando, o revisar los settings (scores/verticales activos) por si estás filtrando demasiado.
                    </div>
                  )}
                  {prepareResult.iterations.length > 0 && (
                    <details style={{marginTop: 10, fontSize: 12, color: '#4b5563'}}>
                      <summary style={{cursor: 'pointer', fontWeight: 600}}>Ver detalle por iteración</summary>
                      <div style={{marginTop: 8, fontFamily: 'monospace', fontSize: 11}}>
                        {prepareResult.iterations.map(it => (
                          <div key={it.iteration} style={{padding: '4px 0', borderTop: '1px dashed #e5e7eb'}}>
                            <b>Iter {it.iteration}:</b> expiró {it.expired}, sync {it.synced}, clasificó {it.classified} ({Object.entries(it.score_dist).map(([k,v])=>`${k}:${v}`).join(' ')}), descartó {it.discarded_by_settings}.
                            Enriqueció: {Object.entries(it.enriched_by_score).map(([sc, e]) => `${sc}:${e.enriched}(✓${e.validated}/✗${e.invalid})`).join(', ')}.
                            <span style={{color: it.gained > 0 ? '#059669' : '#dc2626'}}> Ganó +{it.gained} listos (total: {it.ready_after})</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>

            {/* ── Puente a Campaigns & Letters (mientras Bloque 4 no existe) ── */}
            <div style={{...S.block, background: '#f0fdf4', border: '2px solid #16a34a'}}>
              <div style={S.blockHeader}>
                <div style={{flex: 1}}>
                  <div style={{...S.blockTitle, color: '#15803d'}}>
                    📬 Enviar a Campaigns &amp; Letters
                  </div>
                  <div style={S.blockDesc}>
                    Copia los <b>{prepareStats?.ready ?? 0} leads listos</b> de arriba al panel{' '}
                    <Link href="/admin/campaigns" style={S.link}>Campaigns &amp; Letters</Link>, donde ya se puede
                    generar y descargar la carta física de cada uno. No manda nada por sí solo — el envío real
                    lo hacés desde ese panel, como hoy. Un lead copiado no se vuelve a ofrecer acá (queda marcado
                    como contactado).
                  </div>
                </div>
              </div>
              <div style={S.controlRow}>
                <button
                  onClick={runSendToLetters}
                  disabled={sendToLettersRunning || (prepareStats?.ready ?? 0) === 0}
                  style={sendToLettersRunning || (prepareStats?.ready ?? 0) === 0 ? S.btnDisabled : {...S.btnPrimary, background: '#16a34a'}}
                >
                  {sendToLettersRunning ? 'Enviando…' : `Enviar ${prepareStats?.ready ?? 0} a Campaigns & Letters →`}
                </button>
              </div>
              {sendToLettersError && <div style={S.errBox}>Error: {sendToLettersError}</div>}
              {sendToLettersResult && (
                <div style={{...S.resultBox, background: '#f0fdf4', border: '1px solid #bbf7d0'}}>
                  <div style={S.resultTitle}>✅ {sendToLettersResult.inserted} copiados a Campaigns &amp; Letters</div>
                  <div style={S.resultGrid}>
                    <div><b>{sendToLettersResult.attempted}</b> intentados</div>
                    <div><b>{sendToLettersResult.inserted}</b> nuevos</div>
                    <div><b>{sendToLettersResult.duplicates}</b> ya existían</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Modo avanzado: Bloques 2 y 3 individuales ─────── */}
            <div style={{marginTop: 8, marginBottom: 12}}>
              <button onClick={() => setShowAdvanced(v => !v)} style={S.btnGhost}>
                {showAdvanced ? '▼ Ocultar modo avanzado' : '▶ Modo avanzado (Bloques 2 y 3 por separado)'}
              </button>
            </div>

            {showAdvanced && <>

            {/* ── Bloque 2: Clasificacion ────────────────────────── */}
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>Bloque 2 — Clasificacion</div>
                  <div style={S.blockDesc}>
                    Trae las mas nuevas de Sunbiz que no esten en Base B (sync), y clasifica N con Haiku (score + vertical + perfil dueño + tipo direccion).
                    Costo: ~${HAIKU_COST_PER_LEAD_USD.toFixed(4)}/lead. Techo por corrida: {maxN}.
                  </div>
                </div>
                <div style={S.blockStatus}>
                  <span style={S.blockStatusDot}></span>
                  Activo
                </div>
              </div>

              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Clasificar</label>
                  <input
                    type="number"
                    min={1}
                    max={maxN}
                    value={n}
                    onChange={e => setN(Number(e.target.value))}
                    disabled={running}
                    style={S.numInput}
                  />
                  <span style={S.inputHint}>leads</span>
                </div>
                <div style={S.controlGroup}>
                  <span style={S.cost}>Costo estimado: <b>${costEstimate}</b></span>
                </div>
                <button onClick={runClassify} disabled={running} style={running ? S.btnDisabled : S.btnPrimary}>
                  {running ? 'Clasificando...' : 'Clasificar ahora'}
                </button>
              </div>

              {error && <div style={S.errBox}>Error: {error}</div>}

              {runResult && (
                <div style={S.resultBox}>
                  <div style={S.resultTitle}>Ultima corrida</div>
                  <div style={S.resultGrid}>
                    <div><b>{runResult.processed}</b> clasificadas</div>
                    <div><b>{runResult.sync_inserted}</b> nuevas sincronizadas de Sunbiz</div>
                    {runResult.expired !== undefined && runResult.expired > 0 && (
                      <div style={{color: '#6b7280'}}><b>{runResult.expired}</b> expiradas (&gt;3 días)</div>
                    )}
                    {runResult.discarded !== undefined && runResult.discarded > 0 && (
                      <div style={{color: '#dc2626'}}><b>{runResult.discarded}</b> descartadas (vertical/score inactivo)</div>
                    )}
                    <div><b>{(runResult.elapsed_ms / 1000).toFixed(1)}s</b> tiempo total</div>
                  </div>
                  <div style={S.dist}>
                    <div><span style={S.pillA}>A: {runResult.distribution.A || 0}</span></div>
                    <div><span style={S.pillB}>B: {runResult.distribution.B || 0}</span></div>
                    <div><span style={S.pillC}>C: {runResult.distribution.C || 0}</span></div>
                  </div>
                  <div style={S.verticalDist}>
                    <div style={S.verticalDistLabel}>Verticales:</div>
                    {Object.entries(runResult.vertical_distribution).sort((a,b) => b[1] - a[1]).map(([k, v]) => (
                      <span key={k} style={S.verticalPill}>{k}: {v}</span>
                    ))}
                  </div>
                </div>
              )}

              {stats?.last_run && !runResult && (
                <div style={S.lastRun}>
                  Ultima corrida:{' '}
                  {stats.last_run.status === 'ok' ? (
                    <span style={{color:'#059669'}}>
                      OK — {stats.last_run.n_processed} clasificadas ({new Date(stats.last_run.finished_at || stats.last_run.started_at).toLocaleString()})
                    </span>
                  ) : stats.last_run.status === 'error' ? (
                    <span style={{color:'#dc2626'}}>ERROR — {stats.last_run.error_message}</span>
                  ) : (
                    <span style={{color:'#6b7280'}}>{stats.last_run.status}</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Bloque 3: Enriquecimiento (Google Address Validation) ────────── */}
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>Bloque 3 — Enriquecimiento (dirección)</div>
                  <div style={S.blockDesc}>
                    Sobre las clasificadas del score elegido, valida la <b>target address</b> con Google Address Validation.
                    La target address se elige automáticamente al clasificar con esta prioridad (respeta privacidad del dueño):
                    <b> 1) mail address</b> de la LLC si difiere de la del Registered Agent (<i>es la que el dueño designó explícitamente para correspondencia</i>) →
                    <b> 2) principal address</b> como fallback (<i>dirección declarada del negocio</i>).
                    <b>NUNCA</b> se usa la dirección personal del owner (respeta privacidad — si el dueño puso otra mail address, es porque NO quiere correo comercial en su casa).
                    Nunca se usa la dirección del Registered Agent (es un abogado/contador que filtra la carta).
                    Marca las direcciones que califican para carta física (`possibleNextAction=ACCEPT` según Google).
                    Costo: <b>primeras 1,000/mes gratis</b> (Free Tier permanente); después $25 por cada 1,000 adicionales = ~$0.025/lead. Techo por corrida: {enrichMaxN}.
                  </div>
                </div>
                <div style={S.blockStatus}>
                  <span style={S.blockStatusDot}></span>
                  Activo
                </div>
              </div>

              {/* Stats de enriquecimiento */}
              {enrichStats && (
                <div style={{...S.statsRow, gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16, marginTop: 4}}>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Enriquecidas</div>
                    <div style={S.miniStatValue}>{enrichStats.totals.enriched.toLocaleString()}</div>
                  </div>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Válidas</div>
                    <div style={{...S.miniStatValue, color: '#059669'}}>{enrichStats.totals.valid_addresses.toLocaleString()}</div>
                  </div>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Inválidas</div>
                    <div style={{...S.miniStatValue, color: '#dc2626'}}>{enrichStats.totals.invalid_addresses.toLocaleString()}</div>
                  </div>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Res / Com / PoBox</div>
                    <div style={{...S.miniStatValue, fontSize: 15}}>
                      <span style={{color:'#059669'}}>{enrichStats.totals.residential}</span>{' / '}
                      <span style={{color:'#d97706'}}>{enrichStats.totals.commercial}</span>{' / '}
                      <span style={{color:'#6b7280'}}>{enrichStats.totals.pobox}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Enriquecer</label>
                  <input
                    type="number"
                    min={1}
                    max={enrichMaxN}
                    value={enrichN}
                    onChange={e => setEnrichN(Number(e.target.value))}
                    disabled={enrichRunning}
                    style={S.numInput}
                  />
                  <span style={S.inputHint}>score</span>
                  <select
                    value={enrichScore}
                    onChange={e => setEnrichScore(e.target.value as 'A' | 'B' | 'C')}
                    disabled={enrichRunning}
                    style={S.select}
                  >
                    <option value="A">A ({enrichStats?.pending_by_score.A ?? 0} pendientes)</option>
                    <option value="B">B ({enrichStats?.pending_by_score.B ?? 0} pendientes)</option>
                    <option value="C">C ({enrichStats?.pending_by_score.C ?? 0} pendientes)</option>
                  </select>
                </div>
                <button onClick={runEnrich} disabled={enrichRunning || enrichPending === 0} style={enrichRunning || enrichPending === 0 ? S.btnDisabled : S.btnPrimary}>
                  {enrichRunning ? 'Enriqueciendo...' : `Enriquecer ${enrichPending === 0 ? '(no hay pendientes)' : 'ahora'}`}
                </button>
              </div>

              {enrichError && <div style={S.errBox}>Error: {enrichError}</div>}

              {enrichResult && (
                <div style={S.resultBox}>
                  <div style={S.resultTitle}>Última corrida</div>
                  <div style={S.resultGrid}>
                    <div><b>{enrichResult.enriched}</b> enriquecidas</div>
                    <div style={{color:'#059669'}}><b>{enrichResult.validated_count}</b> válidas</div>
                    <div style={{color:'#dc2626'}}><b>{enrichResult.invalid_count}</b> inválidas</div>
                    <div><b>{(enrichResult.elapsed_ms / 1000).toFixed(1)}s</b> total</div>
                  </div>
                  {enrichResult.address_type_distribution && Object.keys(enrichResult.address_type_distribution).length > 0 && (
                    <div style={S.verticalDist}>
                      <div style={S.verticalDistLabel}>Tipos:</div>
                      {Object.entries(enrichResult.address_type_distribution).sort((a,b) => b[1] - a[1]).map(([k, v]) => (
                        <span key={k} style={S.verticalPill}>{k}: {v}</span>
                      ))}
                    </div>
                  )}
                  {enrichResult.api_error_count > 0 && (
                    <div style={{...S.errBox, marginTop: 10}}>
                      {enrichResult.api_error_count} errores de API. Último: {enrichResult.last_api_error}
                    </div>
                  )}
                  {enrichResult.note && <div style={{...S.lastRun, marginTop: 8}}>{enrichResult.note}</div>}
                </div>
              )}

              {enrichStats?.last_run && !enrichResult && (
                <div style={S.lastRun}>
                  Última corrida:{' '}
                  {enrichStats.last_run.status === 'ok' ? (
                    <span style={{color:'#059669'}}>
                      OK — {enrichStats.last_run.n_processed} enriquecidas ({new Date(enrichStats.last_run.finished_at || enrichStats.last_run.started_at).toLocaleString()})
                    </span>
                  ) : enrichStats.last_run.status === 'error' ? (
                    <span style={{color:'#dc2626'}}>ERROR — {enrichStats.last_run.error_message}</span>
                  ) : (
                    <span style={{color:'#6b7280'}}>{enrichStats.last_run.status}</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Bloque 3.5: Enriquecimiento (email, Enformion) ────────── */}
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>Bloque 3.5 — Enriquecimiento (email)</div>
                  <div style={S.blockDesc}>
                    Sobre las leads con <b>dirección ya validada</b> (Bloque 3), busca email/teléfono con Enformion (EnformionGO —
                    Contact Enrichment API) a partir del nombre del primer officer tipo persona + la target address.
                    Nunca se busca email de una dirección ya descartada (mismo principio: barato antes que caro).
                    Prioriza un email personal sobre uno de empresa; <code>identity_score</code> mide la confianza del match.
                    Costo: placeholder ${emailEnrichStats?.cost_per_lead_usd ?? 0.10}/lead hasta confirmar el precio real del plan pago (hoy en free trial). Techo por corrida: {emailEnrichMaxN}.
                  </div>
                </div>
                <div style={S.blockStatus}>
                  <span style={S.blockStatusDot}></span>
                  Activo
                </div>
              </div>

              {emailEnrichStats && (
                <div style={{...S.statsRow, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16, marginTop: 4}}>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Con email</div>
                    <div style={{...S.miniStatValue, color: '#059669'}}>{emailEnrichStats.totals.with_email.toLocaleString()}</div>
                  </div>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Intentadas sin resultado</div>
                    <div style={{...S.miniStatValue, color: '#6b7280'}}>{emailEnrichStats.totals.tried_not_found.toLocaleString()}</div>
                  </div>
                  <div style={S.miniStat}>
                    <div style={S.miniStatLabel}>Búsquedas reales (Enformion cobra)</div>
                    <div style={{...S.miniStatValue, color: '#1C2E44'}}>{emailEnrichStats.totals.total_searches.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Buscar email de</label>
                  <input
                    type="number"
                    min={1}
                    max={emailEnrichMaxN}
                    value={emailEnrichN}
                    onChange={e => setEmailEnrichN(Number(e.target.value))}
                    disabled={emailEnrichRunning}
                    style={S.numInput}
                  />
                  <span style={S.inputHint}>score</span>
                  <select
                    value={emailEnrichScore}
                    onChange={e => setEmailEnrichScore(e.target.value as 'A' | 'B' | 'C')}
                    disabled={emailEnrichRunning}
                    style={S.select}
                  >
                    <option value="A">A ({emailEnrichStats?.pending_by_score.A ?? 0} pendientes)</option>
                    <option value="B">B ({emailEnrichStats?.pending_by_score.B ?? 0} pendientes)</option>
                    <option value="C">C ({emailEnrichStats?.pending_by_score.C ?? 0} pendientes)</option>
                  </select>
                </div>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Filing date desde</label>
                  <input type="date" value={emailEnrichFrom} onChange={e => setEmailEnrichFrom(e.target.value)} disabled={emailEnrichRunning} style={S.select} />
                  <label style={S.inputLabel}>hasta</label>
                  <input type="date" value={emailEnrichTo} onChange={e => setEmailEnrichTo(e.target.value)} disabled={emailEnrichRunning} style={S.select} />
                  {(emailEnrichFrom || emailEnrichTo) && (
                    <button style={S.btnGhost} onClick={() => { setEmailEnrichFrom(''); setEmailEnrichTo('') }} disabled={emailEnrichRunning}>✕</button>
                  )}
                </div>
                <button onClick={runEnrichEmail} disabled={emailEnrichRunning || emailEnrichPending === 0} style={emailEnrichRunning || emailEnrichPending === 0 ? S.btnDisabled : S.btnPrimary}>
                  {emailEnrichRunning ? 'Buscando...' : `Buscar emails ${emailEnrichPending === 0 ? '(no hay pendientes)' : 'ahora'}`}
                </button>
              </div>

              {emailEnrichError && <div style={S.errBox}>Error: {emailEnrichError}</div>}

              {emailEnrichResult && (
                <div style={S.resultBox}>
                  <div style={S.resultTitle}>Última corrida</div>
                  <div style={S.resultGrid}>
                    <div><b>{emailEnrichResult.enriched}</b> procesadas</div>
                    <div style={{color:'#059669'}}><b>{emailEnrichResult.found_count}</b> con email</div>
                    <div style={{color:'#6b7280'}}><b>{emailEnrichResult.not_found_count}</b> sin match</div>
                    <div><b>{(emailEnrichResult.elapsed_ms / 1000).toFixed(1)}s</b> total</div>
                  </div>
                  {emailEnrichResult.skipped_no_officer > 0 && (
                    <div style={{...S.lastRun, marginTop: 8}}>
                      {emailEnrichResult.skipped_no_officer} leads sin officer tipo persona (se saltearon, no se les cobró).
                    </div>
                  )}
                  {emailEnrichResult.api_error_count > 0 && (
                    <div style={{...S.errBox, marginTop: 10}}>
                      {emailEnrichResult.api_error_count} errores de API. Último: {emailEnrichResult.last_api_error}
                    </div>
                  )}
                  {emailEnrichResult.note && <div style={{...S.lastRun, marginTop: 8}}>{emailEnrichResult.note}</div>}
                </div>
              )}

              {emailEnrichStats?.last_run && !emailEnrichResult && (
                <div style={S.lastRun}>
                  Última corrida:{' '}
                  {emailEnrichStats.last_run.status === 'ok' ? (
                    <span style={{color:'#059669'}}>
                      OK — {emailEnrichStats.last_run.n_processed} procesadas ({new Date(emailEnrichStats.last_run.finished_at || emailEnrichStats.last_run.started_at).toLocaleString()})
                    </span>
                  ) : emailEnrichStats.last_run.status === 'error' ? (
                    <span style={{color:'#dc2626'}}>ERROR — {emailEnrichStats.last_run.error_message}</span>
                  ) : (
                    <span style={{color:'#6b7280'}}>{emailEnrichStats.last_run.status}</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Leads: explorador filtrable (ver la lista real, no solo contadores) ── */}
            <div style={S.block}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>📋 Leads</div>
                  <div style={S.blockDesc}>
                    Explorá las leads reales de la Base B por estado, score y rango de fecha — separá las que ya se
                    clasificaron y enviaron a Campaigns &amp; Letters de las que ya tienen dirección validada, o filtrá
                    las más nuevas por fecha de registro (<code>filing_date</code>).
                  </div>
                </div>
              </div>

              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Estado</label>
                  <select value={leadsView} onChange={e => setLeadsView(e.target.value as typeof leadsView)} style={S.select}>
                    <option value="all">Todas</option>
                    <option value="new">Nuevas (sin clasificar)</option>
                    <option value="classified">Clasificadas</option>
                    <option value="validated">Con dirección validada</option>
                    <option value="sent">Ya enviadas a Campaigns &amp; Letters</option>
                  </select>
                </div>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Score</label>
                  <select value={leadsScore} onChange={e => setLeadsScore(e.target.value as typeof leadsScore)} style={S.select}>
                    <option value="all">Todos</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Desde</label>
                  <input type="date" value={leadsFrom} onChange={e => setLeadsFrom(e.target.value)} style={S.select} />
                </div>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Hasta</label>
                  <input type="date" value={leadsTo} onChange={e => setLeadsTo(e.target.value)} style={S.select} />
                </div>
                {(leadsFrom || leadsTo || leadsView !== 'all' || leadsScore !== 'all') && (
                  <button style={S.btnGhost} onClick={() => { setLeadsView('all'); setLeadsScore('all'); setLeadsFrom(''); setLeadsTo('') }}>
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                {leadsLoading ? 'Cargando...' : `${leadsTotal.toLocaleString()} lead(s) coinciden con el filtro`}
              </div>

              {!leadsLoading && leadsRows.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={S.th}>Empresa</th>
                        <th style={S.th}>Doc #</th>
                        <th style={S.th}>Filing date</th>
                        <th style={S.th}>Score</th>
                        <th style={S.th}>Dirección</th>
                        <th style={S.th}>Email</th>
                        <th style={S.th}>Enviada a cartas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsRows.map(l => (
                        <tr key={l.document_number}>
                          <td style={S.td}>{l.entity_name}</td>
                          <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12 }}>{l.document_number}</td>
                          <td style={S.td}>{l.filing_date ?? '—'}</td>
                          <td style={S.td}>{l.score ?? '—'}</td>
                          <td style={S.td}>
                            {l.address_validated === true ? <span style={{ color: '#059669' }}>✓ válida</span>
                              : l.address_validated === false ? <span style={{ color: '#dc2626' }}>✗ inválida</span>
                              : <span style={{ color: '#9ca3af' }}>sin validar</span>}
                          </td>
                          <td style={S.td}>{l.email ?? <span style={{ color: '#9ca3af' }}>—</span>}</td>
                          <td style={S.td}>{l.fecha_contactada ? new Date(l.fecha_contactada).toLocaleDateString() : <span style={{ color: '#9ca3af' }}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!leadsLoading && leadsRows.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Sin resultados para este filtro.</div>
              )}

              {leadsTotal > LEADS_PAGE_SIZE && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button style={leadsOffset === 0 ? S.btnDisabled : S.btnGhost} disabled={leadsOffset === 0} onClick={() => fetchLeads(Math.max(0, leadsOffset - LEADS_PAGE_SIZE))}>← Anterior</button>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    {leadsOffset + 1}–{Math.min(leadsOffset + LEADS_PAGE_SIZE, leadsTotal)} de {leadsTotal}
                  </span>
                  <button style={leadsOffset + LEADS_PAGE_SIZE >= leadsTotal ? S.btnDisabled : S.btnGhost} disabled={leadsOffset + LEADS_PAGE_SIZE >= leadsTotal} onClick={() => fetchLeads(leadsOffset + LEADS_PAGE_SIZE)}>Siguiente →</button>
                </div>
              )}
            </div>

            </>}

            {/* ── Bloque 4: Campanas (proximamente) ───────────────── */}
            <div style={{...S.block, opacity: 0.6}}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>Bloque 4 — Campanas (cartas + emails)</div>
                  <div style={S.blockDesc}>
                    Filtro por vertical/score/fecha y disparo cartas fisicas o emails con Resend. Requiere dominio de marketing separado.
                  </div>
                </div>
                <div style={{...S.blockStatus, color:'#6b7280', background:'#f3f4f6'}}>
                  <span style={{...S.blockStatusDot, background:'#9ca3af'}}></span>
                  Proximamente
                </div>
              </div>
              <div style={S.controlRow}>
                <button disabled style={S.btnDisabled}>Enviar cartas</button>
                <button disabled style={S.btnDisabled}>Enviar emails</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  page:        { minHeight: '100vh', background: '#f9fafb', padding: '32px 24px' } as const,
  container:   { maxWidth: 1100, margin: '0 auto' } as const,
  breadcrumb:  { fontSize: 13, color: '#6b7280', marginBottom: 12 } as const,
  crumbLink:   { color: '#2563EB', textDecoration: 'none' } as const,
  crumbSep:    { margin: '0 8px', color: '#d1d5db' } as const,
  h1:          { fontSize: 28, fontWeight: 700, color: '#111827', margin: '0 0 6px' } as const,
  subtitle:    { fontSize: 14, color: '#4b5563', margin: '0 0 24px', lineHeight: 1.55 } as const,
  link:        { color: '#2563EB', textDecoration: 'underline' } as const,
  loading:     { padding: '40px 0', textAlign: 'center' as const, color: '#6b7280' } as const,
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 } as const,
  statCard:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px' } as const,
  statLabel:   { fontSize: 12, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 6 } as const,
  statValue:   { fontSize: 26, fontWeight: 700, color: '#111827' } as const,
  statSub:     { fontSize: 12, color: '#9ca3af', marginTop: 4 } as const,
  miniStat:    { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' } as const,
  miniStatLabel:{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 0.3, marginBottom: 3 } as const,
  miniStatValue:{ fontSize: 20, fontWeight: 700, color: '#111827' } as const,
  block:       { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', marginBottom: 18 } as const,
  blockHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 } as const,
  blockTitle:  { fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 } as const,
  blockDesc:   { fontSize: 13, color: '#6b7280', lineHeight: 1.55, maxWidth: 720 } as const,
  blockStatus: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 12, whiteSpace: 'nowrap' as const } as const,
  blockStatusDot: { width: 6, height: 6, borderRadius: '50%', background: '#10b981' } as const,
  controlRow:  { display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const, padding: '12px 0' } as const,
  controlGroup:{ display: 'flex', alignItems: 'center', gap: 8 } as const,
  inputLabel:  { fontSize: 14, color: '#374151', fontWeight: 500 } as const,
  inputHint:   { fontSize: 13, color: '#6b7280' } as const,
  numInput:    { width: 100, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 16, textAlign: 'center' as const } as const,
  select:      { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 } as const,
  cost:        { fontSize: 13, color: '#6b7280' } as const,
  btnPrimary:  { padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const,
  btnDisabled: { padding: '10px 20px', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'not-allowed' } as const,
  btnGhost:    { padding: '8px 14px', background: 'transparent', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const } as const,
  th:          { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' } as const,
  td:          { padding: '10px 12px', fontSize: 13, color: '#374151', verticalAlign: 'top' as const } as const,
  errBox:      { marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#b91c1c', fontSize: 13 } as const,
  resultBox:   { marginTop: 14, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 } as const,
  resultTitle: { fontSize: 12, fontWeight: 700, color: '#065f46', textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 8 } as const,
  resultGrid:  { display: 'flex', gap: 24, fontSize: 14, color: '#374151', marginBottom: 10 } as const,
  dist:        { display: 'flex', gap: 8, marginBottom: 10 } as const,
  pillA:       { display: 'inline-block', padding: '4px 10px', background: '#059669', color: '#fff', borderRadius: 12, fontSize: 12, fontWeight: 700 } as const,
  pillB:       { display: 'inline-block', padding: '4px 10px', background: '#d97706', color: '#fff', borderRadius: 12, fontSize: 12, fontWeight: 700 } as const,
  pillC:       { display: 'inline-block', padding: '4px 10px', background: '#6b7280', color: '#fff', borderRadius: 12, fontSize: 12, fontWeight: 700 } as const,
  verticalDist:{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' } as const,
  verticalDistLabel: { fontSize: 12, color: '#6b7280', marginRight: 4 } as const,
  verticalPill:{ display: 'inline-block', padding: '3px 8px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 11, color: '#374151' } as const,
  lastRun:     { marginTop: 12, fontSize: 13, color: '#6b7280' } as const,
}
