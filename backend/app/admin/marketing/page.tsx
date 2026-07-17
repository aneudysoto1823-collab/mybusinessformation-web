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
  const [error, setError]         = useState<string | null>(null)

  // Bloque 3 state
  const [enrichN, setEnrichN]       = useState<number>(50)
  const [enrichScore, setEnrichScore] = useState<'A' | 'B' | 'C'>('A')
  const [enrichRunning, setEnrichRunning] = useState(false)
  const [enrichResult, setEnrichResult]   = useState<EnrichRunResult | null>(null)
  const [enrichError, setEnrichError]     = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch('/api/marketing/classify'),
        fetch('/api/marketing/enrich'),
        fetch('/api/marketing/verticals'),
        fetch('/api/marketing/scores'),
      ])
      const [t1, t2, t3, t4] = await Promise.all([r1.text(), r2.text(), r3.text(), r4.text()])
      let d1: unknown = null, d2: unknown = null, d3: unknown = null, d4: unknown = null
      try { d1 = t1 ? JSON.parse(t1) : null } catch {}
      try { d2 = t2 ? JSON.parse(t2) : null } catch {}
      try { d3 = t3 ? JSON.parse(t3) : null } catch {}
      try { d4 = t4 ? JSON.parse(t4) : null } catch {}
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

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

  const costEstimate = (n * HAIKU_COST_PER_LEAD_USD).toFixed(4)
  const enrichCostEst = (enrichN * (enrichStats?.cost_per_lead_usd ?? 0.017)).toFixed(2)
  const maxN = stats?.max_n ?? 500
  const enrichMaxN = enrichStats?.max_n ?? 500
  const enrichPending = enrichStats?.pending_by_score[enrichScore] ?? 0

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
                  return (
                    <label key={sc} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
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
                        style={{width: 20, height: 20, cursor: 'pointer'}}
                      />
                      <div style={{flex: 1}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                          <span style={{fontSize: 22, fontWeight: 700, color: pillColor}}>{sc}</span>
                          <span style={{fontSize: 12, color: '#6b7280'}}>
                            {sc === 'A' ? 'Alta necesidad' : sc === 'B' ? 'Normal' : 'Bajo valor'}
                          </span>
                        </div>
                        <div style={{fontSize: 12, color: '#6b7280'}}>
                          {s.lead_count} clasificadas · {s.descartadas > 0 && <span style={{color: '#dc2626'}}>{s.descartadas} descartadas</span>}
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
                    Sobre las clasificadas del score elegido, valida y normaliza la dirección con Google Address Validation.
                    Marca las que califican para carta física (dirección completa, granularidad calle o más fina, sin componentes no confirmados).
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
