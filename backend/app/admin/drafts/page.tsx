// /admin/drafts — panel de borradores de órdenes de formación.
// Muestra las filas Order con isDraft=true (creadas por POST /api/orders/draft
// desde el botón Save del form del home). Estas NO son órdenes reales aún:
// no hay pago, el cliente puede seguir editando desde otro dispositivo con
// el número FBFC que recibió por email. Ver LOGICA_DE_NEGOCIO/34_PROCESO_ORDEN_SALVADA.md
//
// Cuando el cliente completa el pago, isDraft pasa a false y la orden aparece
// en /admin (el panel operativo del equipo). Estos drafts sirven para:
// - detectar clientes que abandonaron (podés reactivarlos con un email)
// - ver el pipeline temprano de la demanda
// - eliminar drafts viejos que ya no van a convertir

export const dynamic = 'force-dynamic'

import LogoutButton from '../LogoutButton'
import AdminLangToggle from '../AdminLangToggle'
import { getSupabaseAdmin } from '@/lib/supabase'

const T = {
  en: {
    title: 'Draft Orders', sub: 'Applications saved but not yet paid',
    home: 'Dashboard', logout: 'Log out',
    totalDrafts: 'Total Drafts', last24h: 'Last 24h', last7d: 'Last 7 days',
    fbfc: 'FBFC Number', company: 'Company', client: 'Client', email: 'Email',
    phone: 'Phone', step: 'Step', updated: 'Last Update', empty: 'No drafts yet.',
  },
  es: {
    title: 'Órdenes en Borrador', sub: 'Formularios guardados sin pagar',
    home: 'Dashboard', logout: 'Cerrar sesión',
    totalDrafts: 'Total Borradores', last24h: 'Últimas 24h', last7d: 'Últimos 7 días',
    fbfc: 'Número FBFC', company: 'Empresa', client: 'Cliente', email: 'Email',
    phone: 'Teléfono', step: 'Paso', updated: 'Última Actualización', empty: 'Aún no hay borradores.',
  },
}

interface DraftSnapshot {
  step?: number
  fmData?: unknown
  values?: unknown
}

interface Draft {
  id: string
  createdAt: string
  updatedAt: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  companyName: string | null
  entityType: string | null
  package: string | null
  draftSnapshot: DraftSnapshot | null
}

function fbfcFromId(id: string): string {
  return 'FBFC-' + id.replace(/-/g, '').substring(0, 8).toUpperCase()
}

function formatDate(iso: string, lang: 'en' | 'es'): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

async function getDrafts(): Promise<Draft[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('Order')
    .select('id, createdAt, updatedAt, firstName, lastName, email, phone, companyName, entityType, package, draftSnapshot')
    .eq('isDraft', true)
    .order('updatedAt', { ascending: false })
  if (error) {
    console.error('[admin/drafts/getDrafts] Supabase error:', error.message)
    return []
  }
  return (data ?? []) as Draft[]
}

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const lang = (params.lang === 'en' ? 'en' : 'es') as 'en' | 'es'
  const t = T[lang]
  const drafts = await getDrafts()

  const now = Date.now()
  const last24h = drafts.filter(d => now - new Date(d.updatedAt).getTime() <= 24 * 60 * 60 * 1000).length
  const last7d  = drafts.filter(d => now - new Date(d.updatedAt).getTime() <= 7  * 24 * 60 * 60 * 1000).length

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f6f9; font-family: var(--font-sans); }
        .admin-wrapper { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .admin-header h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
        .admin-header p  { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
        .stat-card .label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-card .value { font-size: 30px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
        .drafts-table-wrap { background: #fff; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); overflow: hidden; }
        .drafts-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .drafts-table th { background: #f8fafc; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; font-weight: 600; padding: 14px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .drafts-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
        .drafts-table tr:last-child td { border-bottom: none; }
        .drafts-table .fbfc-cell { font-family: var(--font-mono, monospace); font-weight: 700; color: #2563eb; letter-spacing: 0.5px; font-size: 12px; }
        .drafts-table .step-badge { display: inline-block; padding: 3px 9px; border-radius: 12px; background: #eff6ff; color: #1e40af; font-size: 11px; font-weight: 700; }
        .empty-row { text-align: center; padding: 40px 16px; color: #9ca3af; font-size: 14px; font-style: italic; }
        @media (max-width: 640px) {
          .admin-wrapper { padding: 16px 12px; }
          .admin-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .admin-header h1 { font-size: 18px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-card { padding: 14px 16px; }
          .stat-card .value { font-size: 24px; }
          .drafts-table-wrap { overflow-x: auto; }
          .drafts-table { min-width: 640px; }
        }
      `}</style>

      <div className="admin-wrapper">
        <div className="admin-header">
          <div>
            <h1>{t.title}</h1>
            <p>{t.sub}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminLangToggle />
            <a href={`/admin?lang=${lang}`} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontWeight: 600 }}>
              {t.home}
            </a>
            <LogoutButton lang={lang} />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">{t.totalDrafts}</div>
            <div className="value">{drafts.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">{t.last24h}</div>
            <div className="value">{last24h}</div>
          </div>
          <div className="stat-card">
            <div className="label">{t.last7d}</div>
            <div className="value">{last7d}</div>
          </div>
        </div>

        <div className="drafts-table-wrap">
          <table className="drafts-table">
            <thead>
              <tr>
                <th>{t.fbfc}</th>
                <th>{t.company}</th>
                <th>{t.client}</th>
                <th>{t.email}</th>
                <th>{t.phone}</th>
                <th>{t.step}</th>
                <th>{t.updated}</th>
              </tr>
            </thead>
            <tbody>
              {drafts.length === 0 ? (
                <tr><td colSpan={7} className="empty-row">{t.empty}</td></tr>
              ) : drafts.map((d) => {
                const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || '—'
                const step = d.draftSnapshot?.step ?? '—'
                return (
                  <tr key={d.id}>
                    <td className="fbfc-cell">{fbfcFromId(d.id)}</td>
                    <td>{d.companyName || '—'}</td>
                    <td>{name}</td>
                    <td>{d.email || '—'}</td>
                    <td>{d.phone || '—'}</td>
                    <td><span className="step-badge">{step}</span></td>
                    <td>{formatDate(d.updatedAt, lang)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
