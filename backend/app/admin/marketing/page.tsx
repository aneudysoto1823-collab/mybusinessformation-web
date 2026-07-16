'use client'

// Panel del sistema de marketing saliente (doc 31).
// 3 bloques operativos: Clasificacion (Bloque 2) — Enriquecimiento (Bloque 3) — Campanas (Bloque 4).
// Hoy solo Bloque 2 esta funcional; los otros dos muestran boton deshabilitado con nota "proximamente".

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type ClassifyStats = {
  pending: number
  totals: { total: number; classified: number; score_a: number; score_b: number; score_c: number }
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

const HAIKU_COST_PER_LEAD_USD = 0.0008 // observado en smoke test 2026-07-16 (~$0.80/1000)

export default function MarketingPage() {
  const [stats, setStats]     = useState<ClassifyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [n, setN]             = useState<number>(50)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<null | { processed: number; sync_inserted: number; distribution: Record<string, number>; vertical_distribution: Record<string, number>; elapsed_ms: number }>(null)
  const [error, setError]     = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/marketing/classify')
      if (!res.ok) throw new Error(`GET stats: HTTP ${res.status}`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setRunResult(data)
      await loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  const costEstimate = (n * HAIKU_COST_PER_LEAD_USD).toFixed(4)
  const maxN = stats?.max_n ?? 500

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
                <div style={S.statLabel}>Pendientes de clasificar</div>
                <div style={S.statValue}>{stats?.pending?.toLocaleString() ?? 0}</div>
                <div style={S.statSub}>procesada = 0</div>
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

            {/* ── Bloque 3: Enriquecimiento (proximamente) ────────── */}
            <div style={{...S.block, opacity: 0.6}}>
              <div style={S.blockHeader}>
                <div>
                  <div style={S.blockTitle}>Bloque 3 — Enriquecimiento</div>
                  <div style={S.blockDesc}>
                    Sobre las clasificadas score A, corre Google (direccion) → Enformion (email) → ZeroBounce (validacion) en cadena.
                    Costo estimado: ~$0.12/lead. Se dispara con confirmacion del gasto.
                  </div>
                </div>
                <div style={{...S.blockStatus, color:'#6b7280', background:'#f3f4f6'}}>
                  <span style={{...S.blockStatusDot, background:'#9ca3af'}}></span>
                  Proximamente
                </div>
              </div>
              <div style={S.controlRow}>
                <div style={S.controlGroup}>
                  <label style={S.inputLabel}>Enriquecer</label>
                  <input type="number" defaultValue={300} disabled style={S.numInput} />
                  <span style={S.inputHint}>score</span>
                  <select disabled style={S.select}><option>A</option></select>
                </div>
                <button disabled style={S.btnDisabled}>Enriquecer ahora</button>
              </div>
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
